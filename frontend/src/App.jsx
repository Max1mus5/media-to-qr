import { useState, useRef, useEffect } from 'react'
import { AiOutlineCloudUpload, AiOutlineHistory, AiOutlineDownload } from 'react-icons/ai'
import QRCode from 'react-qr-code'
import StorageBar from './StorageBar'
import FileHistory from './FileHistory'
import './App.css'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function App() {
  const [status, setStatus] = useState('idle') // idle, uploading, success, error
  const [mediaUrl, setMediaUrl] = useState('')
  const [error, setError] = useState('')
  const [fileInfo, setFileInfo] = useState(null)
  const [qrSize, setQrSize] = useState('small') // small, medium, large
  const [showHistory, setShowHistory] = useState(false)
  const storageUpdateTrigger = useRef(0)
  const qrRef = useRef(null)

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
      const info = {
        id: data.short_id || data.id, // Priorizar short_id
        filename: data.filename,
        size: (data.size / 1024 / 1024).toFixed(2),
        type: data.content_type,
        url: data.url,
        uploadedAt: new Date().toISOString()
      }
      setFileInfo(info)
      setStatus('success')
      
      // Guardar en localStorage
      saveToHistory(info)
      
      // Actualizar barra de almacenamiento
      storageUpdateTrigger.current += 1
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

  const saveToHistory = (fileData) => {
    const history = JSON.parse(localStorage.getItem('mediaHistory') || '[]')
    history.unshift(fileData)
    // Mantener solo los últimos 50 archivos
    if (history.length > 50) history.pop()
    localStorage.setItem('mediaHistory', JSON.stringify(history))
  }

  const downloadQR = () => {
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    const sizes = { small: 256, medium: 512, large: 1024 }
    const size = sizes[qrSize]

    // Crear canvas para renderizar el QR
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')

    // Fondo blanco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // Convertir SVG a imagen
    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size)
      URL.revokeObjectURL(url)

      // Descargar
      canvas.toBlob((blob) => {
        const link = document.createElement('a')
        link.download = `qr-${fileInfo.filename}-${qrSize}.png`
        link.href = URL.createObjectURL(blob)
        link.click()
        URL.revokeObjectURL(link.href)
      })
    }

    img.src = url
  }

  const handleDeleteFile = async (fileId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/media/${fileId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Actualizar localStorage
        const history = JSON.parse(localStorage.getItem('mediaHistory') || '[]')
        const updated = history.filter(item => item.id !== fileId)
        localStorage.setItem('mediaHistory', JSON.stringify(updated))
        
        // Actualizar almacenamiento
        storageUpdateTrigger.current += 1
        
        return true
      }
      return false
    } catch (error) {
      console.error('Error al eliminar:', error)
      return false
    }
  }

  return (
    <div className="app">
      <button 
        className="history-button"
        onClick={() => setShowHistory(!showHistory)}
        title="Ver historial"
      >
        <AiOutlineHistory />
      </button>

      {showHistory && (
        <FileHistory 
          apiUrl={API_URL}
          onClose={() => setShowHistory(false)}
          onDelete={handleDeleteFile}
        />
      )}

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
            <div className="qr-container" ref={qrRef}>
              <QRCode 
                value={mediaUrl} 
                size={180}
                level="L"
                fgColor="#1a1a1a"
                bgColor="#ffffff"
                includeMargin={false}
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

            <div className="qr-download-section">
              <label className="qr-size-label">Tamaño de descarga:</label>
              <div className="qr-size-selector">
                <button 
                  className={`size-btn ${qrSize === 'small' ? 'active' : ''}`}
                  onClick={() => setQrSize('small')}
                >
                  Pequeño
                </button>
                <button 
                  className={`size-btn ${qrSize === 'medium' ? 'active' : ''}`}
                  onClick={() => setQrSize('medium')}
                >
                  Mediano
                </button>
                <button 
                  className={`size-btn ${qrSize === 'large' ? 'active' : ''}`}
                  onClick={() => setQrSize('large')}
                >
                  Grande
                </button>
              </div>
              <button onClick={downloadQR} className="download-qr-button">
                <AiOutlineDownload /> Descargar QR ({qrSize === 'small' ? '256px' : qrSize === 'medium' ? '512px' : '1024px'})
              </button>
            </div>

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

      <StorageBar apiUrl={`${API_URL}/api/v1`} key={storageUpdateTrigger.current} />
    </div>
  )
}

export default App
