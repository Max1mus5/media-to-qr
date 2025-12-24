import { useState, useEffect } from 'react'
import './StorageBar.css'

const StorageBar = ({ apiUrl, onStorageUpdate }) => {
  const [storage, setStorage] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStorage = async () => {
    try {
      const response = await fetch(`${apiUrl}/storage`)
      if (response.ok) {
        const data = await response.json()
        setStorage(data)
        if (onStorageUpdate) {
          onStorageUpdate(data)
        }
      }
    } catch (error) {
      console.error('Error al obtener información de almacenamiento:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStorage()
  }, [apiUrl])

  // Refrescar cuando se llame externamente
  useEffect(() => {
    if (onStorageUpdate) {
      fetchStorage()
    }
  }, [onStorageUpdate])

  if (loading || !storage) return null

  // Determinar color según espacio disponible
  const getColor = () => {
    if (storage.available_mb > 100) return '#00ff88' // Verde
    if (storage.available_mb > 50) return '#ffd700' // Amarillo
    return '#ff4444' // Rojo
  }

  const barColor = getColor()
  const percentage = storage.percentage

  return (
    <div className="storage-bar-container">
      <div className="storage-info">
        <span className="storage-text">
          {storage.used_mb}MB / {storage.total_mb}MB
        </span>
        <span className="storage-available">
          {storage.available_mb}MB disponibles
        </span>
      </div>
      <div className="storage-progress">
        <div 
          className="storage-progress-fill"
          style={{ 
            width: `${percentage}%`,
            backgroundColor: barColor
          }}
        />
      </div>
    </div>
  )
}

export default StorageBar
