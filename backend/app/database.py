import os
import psycopg
from contextlib import contextmanager

DATABASE_URL = os.getenv("DATABASE_URL")

@contextmanager
def get_db_connection():
    """Context manager para conexiones a la base de datos"""
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE INDEX IF NOT EXISTS idx_media_created_at ON media_store(created_at);
            """)

def close_db():
    """Placeholder para compatibilidad"""
    pass
