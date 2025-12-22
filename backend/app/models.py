from datetime import datetime
from typing import Optional
from uuid import UUID

class MediaFile:
    """Modelo para representar un archivo multimedia"""
    
    def __init__(
        self,
        id: UUID,
        file_data: bytes,
        content_type: str,
        filename: Optional[str] = None,
        file_size: Optional[int] = None,
        created_at: Optional[datetime] = None
    ):
        self.id = id
        self.file_data = file_data
        self.content_type = content_type
        self.filename = filename
        self.file_size = file_size
        self.created_at = created_at

    @classmethod
    def from_record(cls, record):
        """Crea una instancia desde un record de asyncpg"""
        return cls(
            id=record['id'],
            file_data=record['file_data'],
            content_type=record['content_type'],
            filename=record.get('filename'),
            file_size=record.get('file_size'),
            created_at=record.get('created_at')
        )
