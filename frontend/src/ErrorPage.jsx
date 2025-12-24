import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AiOutlineWarning } from 'react-icons/ai'
import './ErrorPage.css'

const ErrorPage = () => {
  const { fileId } = useParams()
  const [error, setError] = useState('')

  useEffect(() => {
    // Intentar verificar si el archivo existe
    const checkFile = async () => {
      try {
        const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`${API_URL}/api/v1/media/${fileId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('eliminado')
          } else {
            setError('problema')
          }
        }
      } catch (err) {
        setError('problema')
      }
    }

    if (fileId) {
      checkFile()
    } else {
      setError('invalido')
    }
  }, [fileId])

  return (
    <div className="error-page">
      <div className="error-container">
        <AiOutlineWarning className="error-icon" />
        <h1 className="error-title">QR No Disponible</h1>
        
        {error === 'eliminado' && (
          <>
            <p className="error-message">
              Este código QR ha sido eliminado por el propietario.
            </p>
            <p className="error-submessage">
              El archivo ya no está disponible en nuestros servidores.
            </p>
          </>
        )}
        
        {error === 'problema' && (
          <>
            <p className="error-message">
              Ha surgido un problema al cargar este contenido.
            </p>
            <p className="error-submessage">
              Consulta con el administrador o intenta más tarde.
            </p>
          </>
        )}
        
        {error === 'invalido' && (
          <>
            <p className="error-message">
              Código QR inválido o mal formado.
            </p>
            <p className="error-submessage">
              Verifica el enlace e intenta nuevamente.
            </p>
          </>
        )}

        <div className="error-footer">
          <p>Si crees que esto es un error, contacta al administrador.</p>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage
