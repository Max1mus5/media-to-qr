import os
from uuid import UUID
from fastapi import APIRouter, UploadFile, File, HTTPException, Request, BackgroundTasks
from fastapi.responses import StreamingResponse, Response
from io import BytesIO
from psycopg.rows import dict_row

from app.database import get_db_connection
from app.models import MediaFile
from app.utils import generate_short_id, is_valid_uuid
import uuid

router = APIRouter()
short_router = APIRouter()  # Router sin prefijo para URLs cortas

# Configuración
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 52428800))  # 50MB default

ALLOWED_CONTENT_TYPES = {
    # Audio
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac",
    "audio/x-m4a", "audio/flac", "audio/webm",
    # Video
    "video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo",
    "video/webm", "video/ogg",
    # Imágenes
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
}


@router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...)):
    """
    Sube un archivo multimedia y retorna la URL para acceder a él.
    
    - **file**: Archivo multimedia (audio, video o imagen)
    - **Returns**: JSON con id y url del archivo
    """
    
    # Validar tipo de contenido
    content_type = file.content_type
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. Tipos válidos: audio/*, video/*, image/*"
        )
    
    # Leer archivo con límite
    file_data = await file.read(MAX_FILE_SIZE + 1)  # Leer un byte extra para detectar si excede
    file_size = len(file_data)
    
    # Validar tamaño ANTES de procesar
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Archivo demasiado grande ({file_size / 1024 / 1024:.1f}MB). Máximo permitido: {MAX_FILE_SIZE / 1024 / 1024:.0f}MB"
        )
    
    if file_size == 0:
        raise HTTPException(
            status_code=400,
            detail="El archivo está vacío"
        )
    
    # Guardar en base de datos
    max_retries = 5
    for attempt in range(max_retries):
        short_id = generate_short_id(6)
        
        try:
            with get_db_connection() as conn:
                with conn.cursor(row_factory=dict_row) as cur:
                    cur.execute(
                        """
                        INSERT INTO media_store (short_id, file_data, content_type, filename, file_size)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id, short_id
                        """,
                        (short_id, file_data, content_type, file.filename, file_size)
                    )
                    record = cur.fetchone()
                    file_id = record['id']
                    short_id = record['short_id']
            break
        except Exception as e:
            if attempt == max_retries - 1:
                raise HTTPException(status_code=500, detail="Error al generar ID único")
            continue
    
    # Retornar solo el short_id, el frontend construye la URL
    return {
        "id": str(file_id),
        "short_id": short_id,
        "filename": file.filename,
        "content_type": content_type,
        "size": file_size
    }


@short_router.get("/q/{resource_id}")
async def get_media_short(resource_id: str, background_tasks: BackgroundTasks):
    """
    Endpoint optimizado para URLs cortas. Soporta short_id (6 chars) y UUID (fallback).
    
    - **resource_id**: short_id (6 caracteres Base62) o UUID legacy
    - **Returns**: Response con el archivo binario o 404
    """
    
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            # Intentar buscar por short_id primero
            cur.execute(
                "SELECT id, file_data, content_type, filename FROM media_store WHERE short_id = %s",
                (resource_id,)
            )
            record = cur.fetchone()
            
            # Fallback: buscar por UUID si el formato es válido
            if not record and is_valid_uuid(resource_id):
                try:
                    file_uuid = uuid.UUID(resource_id)
                    cur.execute(
                        "SELECT id, file_data, content_type, filename FROM media_store WHERE id = %s",
                        (file_uuid,)
                    )
                    record = cur.fetchone()
                except ValueError:
                    pass
            
            if not record:
                raise HTTPException(status_code=404, detail="Archivo no encontrado")
            
            file_id = record['id']
            file_data = record['file_data']
            content_type = record['content_type']
            filename = record['filename']
    
    # Incrementar contador en segundo plano
    background_tasks.add_task(increment_access_count, file_id)
    
    return Response(
        content=bytes(file_data),
        media_type=content_type,
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )


@router.get("/media/{file_id}")
async def get_media(file_id: UUID, background_tasks: BackgroundTasks):
    """
    Recupera y sirve un archivo multimedia por su ID.
    El contador de accesos se incrementa en segundo plano para no bloquear la entrega.
    
    - **file_id**: UUID del archivo
    - **Returns**: StreamingResponse con el archivo binario o mensaje de error
    """
    
    # Buscar archivo en base de datos
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT file_data, content_type, filename
                FROM media_store
                WHERE id = %s
                """,
                (file_id,)
            )
            record = cur.fetchone()
    
    if not record:
        raise HTTPException(
            status_code=404, 
            detail="Este archivo ha sido eliminado o no existe. El QR compartido ya no es válido."
        )
    
    # Incrementar contador en segundo plano (no bloquea la respuesta)
    background_tasks.add_task(increment_access_count, file_id)
    
    # Crear stream del archivo (convertir memoryview a bytes si es necesario)
    file_data_bytes = bytes(record['file_data'])
    file_stream = BytesIO(file_data_bytes)
    
    # Configurar headers para reproducción en navegador
    headers = {
        "Content-Disposition": f'inline; filename="{record["filename"]}"',
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000"  # Cache por 1 año
    }
    
    return StreamingResponse(
        file_stream,
        media_type=record['content_type'],
        headers=headers
    )


def increment_access_count(file_id: UUID):
    """Incrementa el contador de accesos en segundo plano"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE media_store 
                    SET access_count = access_count + 1 
                    WHERE id = %s
                    """,
                    (file_id,)
                )
    except Exception as e:
        # Log error pero no afecta la entrega del contenido
        print(f"Error incrementando contador para {file_id}: {e}")



@router.get("/stats")
async def get_stats():
    """Obtiene estadísticas básicas del sistema"""
    
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("""
                SELECT 
                    COUNT(*) as total_files,
                    SUM(file_size) as total_size,
                    AVG(file_size) as avg_size,
                    MAX(created_at) as last_upload
                FROM media_store
            """)
            stats = cur.fetchone()
    
    return {
        "total_files": stats['total_files'] if stats['total_files'] else 0,
        "total_size_mb": round(stats['total_size'] / 1024 / 1024, 2) if stats['total_size'] else 0,
        "avg_size_kb": round(stats['avg_size'] / 1024, 2) if stats['avg_size'] else 0,
        "last_upload": stats['last_upload'].isoformat() if stats['last_upload'] else None
    }


@router.get("/storage")
async def get_storage_info():
    """
    Obtiene información del almacenamiento usado.
    
    - **Returns**: JSON con espacio usado en MB, total disponible y porcentaje
    """
    TOTAL_STORAGE_MB = 500  # Límite total de almacenamiento en MB
    
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            # Calcular espacio usado total
            cur.execute("SELECT COALESCE(SUM(file_size), 0) as total_bytes FROM media_store")
            result = cur.fetchone()
            total_bytes = result['total_bytes']
    
    used_mb = round(total_bytes / 1024 / 1024, 2)
    available_mb = round(TOTAL_STORAGE_MB - used_mb, 2)
    percentage = round((used_mb / TOTAL_STORAGE_MB) * 100, 2)
    
    return {
        "used_mb": used_mb,
        "available_mb": available_mb,
        "total_mb": TOTAL_STORAGE_MB,
        "percentage": percentage
    }


@router.get("/media/{file_id}/info")
async def get_media_info(file_id: str):
    """
    Obtiene información de un archivo sin descargarlo (soporta short_id y UUID).
    
    - **file_id**: short_id o UUID del archivo
    - **Returns**: JSON con información del archivo
    """
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            # Intentar buscar por short_id primero
            cur.execute(
                """
                SELECT id, short_id, content_type, filename, file_size, access_count, created_at
                FROM media_store WHERE short_id = %s
                """,
                (file_id,)
            )
            record = cur.fetchone()
            
            # Fallback: buscar por UUID si el formato es válido
            if not record and is_valid_uuid(file_id):
                try:
                    file_uuid = uuid.UUID(file_id)
                    cur.execute(
                        """
                        SELECT id, short_id, content_type, filename, file_size, access_count, created_at
                        FROM media_store WHERE id = %s
                        """,
                        (file_uuid,)
                    )
                    record = cur.fetchone()
                except ValueError:
                    pass
    
    if not record:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    return {
        "id": str(record['id']),
        "short_id": record['short_id'],
        "filename": record['filename'],
        "content_type": record['content_type'],
        "size": record['file_size'],
        "access_count": record['access_count'],
        "created_at": record['created_at'].isoformat()
    }


@router.delete("/media/{file_id}")
async def delete_media(file_id: str):
    """
    Elimina un archivo multimedia por su ID (soporta short_id y UUID).
    
    - **file_id**: short_id o UUID del archivo a eliminar
    - **Returns**: Confirmación de eliminación
    """
    
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            # Intentar buscar por short_id primero
            cur.execute(
                "SELECT id FROM media_store WHERE short_id = %s",
                (file_id,)
            )
            record = cur.fetchone()
            
            # Fallback: buscar por UUID si el formato es válido
            if not record and is_valid_uuid(file_id):
                try:
                    file_uuid = uuid.UUID(file_id)
                    cur.execute(
                        "SELECT id FROM media_store WHERE id = %s",
                        (file_uuid,)
                    )
                    record = cur.fetchone()
                except ValueError:
                    pass
            
            if not record:
                raise HTTPException(status_code=404, detail="Archivo no encontrado")
            
            db_file_id = record['id']
            
            # Eliminar
            cur.execute(
                "DELETE FROM media_store WHERE id = %s",
                (db_file_id,)
            )
    
    return {"message": "Archivo eliminado exitosamente", "id": str(file_id)}


@router.delete("/cleanup/all")
async def cleanup_all():
    """
    PELIGRO: Elimina TODOS los archivos de la base de datos.
    Usar solo para limpieza de desarrollo.
    """
    
    with get_db_connection() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT COUNT(*) as count FROM media_store")
            count = cur.fetchone()['count']
            
            cur.execute("TRUNCATE TABLE media_store")
    
    return {"message": f"Se eliminaron {count} archivos", "count": count}
