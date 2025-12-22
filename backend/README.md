# Media to QR - Backend

Backend API construido con FastAPI para subir y servir archivos multimedia generando códigos QR.

## Características

- ⚡ FastAPI para máximo rendimiento
- 🗄️ PostgreSQL con asyncpg (almacenamiento BYTEA)
- 📦 Subida de archivos multimedia (audio, video, imágenes)
- 🔗 Generación automática de URLs
- 🎯 Streaming optimizado con headers correctos
- 📊 Endpoint de estadísticas

## Requisitos

- Python 3.10+
- PostgreSQL (Neon Tech)

## Instalación Local

```bash
# Crear entorno virtual
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL

# Ejecutar servidor
uvicorn app.main:app --reload
```

El servidor estará disponible en `http://localhost:8000`

## Endpoints

### POST `/api/v1/upload`
Sube un archivo multimedia.

**Request:**
- `multipart/form-data` con campo `file`

**Response:**
```json
{
  "id": "uuid",
  "url": "https://api.../media/uuid",
  "filename": "archivo.mp3",
  "content_type": "audio/mpeg",
  "size": 1024000
}
```

### GET `/api/v1/media/{uuid}`
Recupera y sirve el archivo multimedia.

**Response:**
- Streaming del archivo binario con headers apropiados
- `Content-Type` dinámico según el archivo
- `Content-Disposition: inline` para reproducción en navegador

### GET `/api/v1/stats`
Obtiene estadísticas del sistema.

**Response:**
```json
{
  "total_files": 150,
  "total_size_mb": 1024.5,
  "avg_size_kb": 6830.33,
  "last_upload": "2025-12-22T10:30:00"
}
```

## Deployment en Render

1. Crear nuevo Web Service en Render
2. Conectar repositorio
3. Configurar:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Agregar variable de entorno:
   - `DATABASE_URL`: Tu connection string de Neon
   - `ALLOWED_ORIGINS`: URLs del frontend

## Estructura

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # Aplicación FastAPI
│   ├── database.py      # Pool de conexiones
│   ├── models.py        # Modelos de datos
│   └── routers/
│       └── media.py     # Endpoints
├── requirements.txt
├── Dockerfile
└── .env.example
```

## Variables de Entorno

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
ALLOWED_ORIGINS=http://localhost:5173,https://tu-frontend.vercel.app
MAX_FILE_SIZE=52428800  # 50MB en bytes
```

## Tipos de Archivo Soportados

- **Audio**: mp3, wav, ogg, aac, m4a, flac, webm
- **Video**: mp4, mpeg, mov, avi, webm, ogg
- **Imágenes**: jpeg, png, gif, webp, svg
