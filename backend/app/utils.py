import secrets
import string

# Alfabeto Base62: 0-9, a-z, A-Z (62 caracteres)
BASE62_ALPHABET = string.digits + string.ascii_lowercase + string.ascii_uppercase

def generate_short_id(length: int = 6) -> str:
    """
    Genera un ID corto aleatorio usando Base62 con alta entropía.
    
    Usa secrets (CSPRNG) para garantizar seguridad criptográfica
    y prevenir ataques de enumeración.
    
    Args:
        length: Longitud del ID (default: 6 = 62^6 = ~56.8 mil millones combinaciones)
    
    Returns:
        str: ID aleatorio tipo 'Ab3d9Z'
    """
    return ''.join(secrets.choice(BASE62_ALPHABET) for _ in range(length))


def is_valid_uuid(value: str) -> bool:
    """
    Verifica si una cadena tiene formato de UUID válido.
    
    Args:
        value: Cadena a verificar
    
    Returns:
        bool: True si es UUID válido, False en caso contrario
    """
    if len(value) != 36:
        return False
    
    parts = value.split('-')
    if len(parts) != 5:
        return False
    
    # Longitudes esperadas: 8-4-4-4-12
    expected_lengths = [8, 4, 4, 4, 12]
    for part, expected_len in zip(parts, expected_lengths):
        if len(part) != expected_len:
            return False
        # Verificar que solo contiene caracteres hexadecimales
        try:
            int(part, 16)
        except ValueError:
            return False
    
    return True
