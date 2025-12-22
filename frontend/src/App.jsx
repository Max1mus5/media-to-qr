import { useState } from 'react'
import { AiOutlineCloudUpload } from 'react-icons/ai'
import QRCode from 'react-qr-code'
import './App.css'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function App() {
  const [status, setStatus] = useState('idle') // idle, uploading, success, error
  const [mediaUrl, setMediaUrl] = useState('')
  const [error, setError] = useState('')
  const [fileInfo, setFileInfo] = useState(null)

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    const validTypes = ['audio/', 'video/', 'image/']
    const isValid = validTypes.some(type => file.type.startsWith(type))
    
    if (!isValid) {
      setError('Solo se permiten archivos de audio, video o imágenes')
      setStatus('error')
      return
    }

    // Validar tamaño (50MB)
    if (file.size > 52428800) {
      setError('El archivo es demasiado grande (máximo 50MB)')
      setStatus('error')
      return
    }

    setStatus('uploading')
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_URL}/api/v1/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Error al subir el archivo')
      }

      const data = await response.json()
      setMediaUrl(data.url)
      setFileInfo({
        filename: data.filename,
        size: (data.size / 1024 / 1024).toFixed(2),
        type: data.content_type
      })
      setStatus('success')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  const handleReset = () => {
    setStatus('idle')
    setMediaUrl('')
    setError('')
    setFileInfo(null)
  }

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">Media to QR</h1>
        <p className="subtitle">Sube tu archivo y compártelo con un código QR</p>

        {status === 'idle' && (
          <div className="upload-zone">
            <label htmlFor="file-input" className="upload-label">
              <AiOutlineCloudUpload className="upload-icon" />
              <span className="upload-text">Seleccionar archivo</span>
              <span className="upload-hint">Audio, video o imagen (máx. 50MB)</span>
            </label>
            <input
              id="file-input"
              type="file"
              accept="audio/*,video/*,image/*"
              onChange={handleFileSelect}
              className="file-input"
            />
          </div>
        )}

        {status === 'uploading' && (
          <div className="loading-zone">
            <div className="spinner"></div>
            <p className="loading-text">Subiendo archivo...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="success-zone">
            <div className="qr-container">
              <QRCode 
                value={mediaUrl} 
                size={256}
                level="H"
                className="qr-code"
              />
            </div>
            
            {fileInfo && (
              <div className="file-info">
                <p className="file-name">{fileInfo.filename}</p>
                <p className="file-details">
                  {fileInfo.size} MB • {fileInfo.type.split('/')[0]}
                </p>
              </div>
            )}

            <div className="url-container">
              <input
                type="text"
                value={mediaUrl}
                readOnly
                className="url-input"
                onClick={(e) => e.target.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(mediaUrl)
                  alert('URL copiada al portapapeles')
                }}
                className="copy-button"
              >
                Copiar URL
              </button>
            </div>

            <button onClick={handleReset} className="reset-button">
              Subir otro archivo
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="error-zone">
            <p className="error-text">{error}</p>
            <button onClick={handleReset} className="reset-button">
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>

      <footer className="footer">
        <p>Escanea el QR para reproducir el archivo en cualquier dispositivo</p>
      </footer>
    </div>
  )
}

export default App
