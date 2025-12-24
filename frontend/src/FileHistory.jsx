import { useState, useEffect } from 'react'
import { AiOutlineClose, AiOutlineDelete, AiOutlineWarning, AiOutlineEye } from 'react-icons/ai'
import QRCode from 'react-qr-code'
import './FileHistory.css'

const FileHistory = ({ apiUrl, onClose, onDelete }) => {
  const [history, setHistory] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [accessCounts, setAccessCounts] = useState({})
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    loadHistory()
    if (isOnline) {
      fetchAccessCounts()
    }

    // Listener para cambios de conectividad
    const handleOnline = () => {
      setIsOnline(true)
      fetchAccessCounts()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadHistory = () => {
    const stored = localStorage.getItem('mediaHistory')
    if (stored) {
      setHistory(JSON.parse(stored))
    }
  }

  const fetchAccessCounts = async () => {
    const stored = localStorage.getItem('mediaHistory')
    if (!stored) return

    const files = JSON.parse(stored)
    const counts = {}

    // Obtener contador de accesos para cada archivo
    await Promise.all(
      files.map(async (file) => {
        try {
          const response = await fetch(`${apiUrl}/api/v1/media/${file.id}/info`)
          if (response.ok) {
            const data = await response.json()
            counts[file.id] = data.access_count || 0
          }
        } catch (error) {
          console.error(`Error obteniendo accesos de ${file.id}:`, error)
          counts[file.id] = 0
        }
      })
    )

    setAccessCounts(counts)
  }

  const handleDelete = async (fileId) => {
    const success = await onDelete(fileId)
    if (success) {
      loadHistory() // Recargar historial
      setShowDeleteConfirm(null)
      if (selectedFile?.id === fileId) {
        setSelectedFile(null)
      }
    } else {
      alert('Error al eliminar el archivo')
    }
  }

  const formatDate = (isoDate) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h2>Mis Archivos</h2>
          {!isOnline && (
            <span className="offline-badge">Sin conexión</span>
          )}
          <button className="close-btn" onClick={onClose}>
            <AiOutlineClose />
          </button>
        </div>

        <div className="history-content">
          {history.length === 0 ? (
            <div className="empty-history">
              <p>No has subido archivos aún</p>
            </div>
          ) : (
            <div className="history-grid">
              {history.map((file) => (
                <div key={file.id} className="history-item">
                  <div 
                    className="history-item-preview"
                    onClick={() => setSelectedFile(file)}
                  >
                    <QRCode 
                      value={file.url} 
                      size={80}
                      level="M"
                    />
                  </div>
                  <div className="history-item-info">
                    <p className="history-filename" title={file.filename}>
                      {file.filename}
                    </p>
                    <p className="history-meta">
                      {file.size} MB • {formatDate(file.uploadedAt)}
                    </p>
                    {accessCounts[file.id] !== undefined && (
                      <p className="history-access-count">
                        <AiOutlineEye /> {accessCounts[file.id]} {accessCounts[file.id] === 1 ? 'vista' : 'vistas'}
                      </p>
                    )}
                  </div>
                  <button 
                    className="delete-item-btn"
                    onClick={() => setShowDeleteConfirm(file.id)}
                    title="Eliminar archivo"
                  >
                    <AiOutlineDelete />
                  </button>

                  {showDeleteConfirm === file.id && (
                    <div className="delete-confirm-popup">
                      <AiOutlineWarning className="warning-icon" />
                      <p>¿Eliminar archivo?</p>
                      <p className="warning-text">
                        El QR compartido quedará inútil
                      </p>
                      <div className="confirm-buttons">
                        <button 
                          className="confirm-btn"
                          onClick={() => handleDelete(file.id)}
                        >
                          Sí, eliminar
                        </button>
                        <button 
                          className="cancel-btn"
                          onClick={() => setShowDeleteConfirm(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="qr-preview-modal" onClick={() => setSelectedFile(null)}>
            <div className="qr-preview-content" onClick={(e) => e.stopPropagation()}>
              <QRCode 
                value={selectedFile.url} 
                size={300}
                level="H"
              />
              <p className="preview-filename">{selectedFile.filename}</p>
              <button 
                className="close-preview-btn"
                onClick={() => setSelectedFile(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FileHistory
