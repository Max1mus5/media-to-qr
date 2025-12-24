import os
import psycopg
from contextlib import contextmanager
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

@contextmanager
def get_db_connection():
    """Context manager para conexiones a la base de datos"""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL no está configurada. Verifica el archivo .env")
    
    conn = psycopg.connect(DATABASE_URL)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Inicializa la base de datos y crea la tabla si no existe"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS media_store (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    file_data BYTEA NOT NULL,
                    content_type VARCHAR(100) NOT NULL,
                    filename VARCHAR(255),
                    file_size BIGINT,
                    access_count INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_media_created_at ON media_store(created_at);
                
                -- Agregar columna access_count si no existe (para bases de datos existentes)
                DO $$ 
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name='media_store' AND column_name='access_count'
                    ) THEN
                        ALTER TABLE media_store ADD COLUMN access_count INTEGER DEFAULT 0;
                    END IF;
                END $$;
            """)

def close_db():
    """Placeholder para compatibilidad"""
    pass
