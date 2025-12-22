# Media to QR

Sistema minimalista para compartir archivos multimedia mediante códigos QR.

**Stack:** FastAPI + React + PostgreSQL

---

## 🎯 Características

- ⚡ **Súper rápido**: FastAPI + asyncpg para máximo rendimiento
- 📦 **Sin dependencias externas**: Archivos almacenados en PostgreSQL (BYTEA)
- 📱 **Reproducción nativa**: El navegador reproduce directamente (sin conversión)
- 🎨 **UI minimalista**: Solo lo esencial, cero distracciones
- 🔒 **Seguro**: Validación de tipos y tamaños, sin código malicioso
- 🆓 **Gratis para siempre**: Deploy gratuito en Render + Vercel + Neon

## 🏗️ Arquitectura

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Cliente   │ ──────> │   Frontend   │ ──────> │   Backend   │
│  (Móvil/PC) │         │  React+Vite  │         │   FastAPI   │
└─────────────┘         └──────────────┘         └──────┬──────┘
                                                          │
     ┌────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────┐
│  PostgreSQL  │
│  (Neon Tech) │
└──────────────┘
```

### Stack Tecnológico

**Backend:**
- **FastAPI**: Framework web asíncrono de alto rendimiento
- **asyncpg**: Driver PostgreSQL asíncrono (3x más rápido que psycopg2)
- **PostgreSQL**: Base de datos con columnas BYTEA para almacenar binarios

**Frontend:**
- **React 18**: Biblioteca de UI con hooks
- **Vite**: Build tool ultra rápido
- **react-qr-code**: Generación de QR en SVG (cliente-side)
- **react-icons**: Iconos minimalistas

**Infraestructura:**
- **Render**: Hosting del backend (auto-scaling)
- **Vercel**: CDN global para el frontend (edge network)
- **Neon Tech**: PostgreSQL serverless con auto-sleep

## 📁 Estructura del Proyecto

```
media-to-qr/
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── main.py            # Aplicación principal + CORS
│   │   ├── database.py        # Pool de conexiones asyncpg
│   │   ├── models.py          # Modelos de datos
│   │   └── routers/
│   │       └── media.py       # Endpoints de upload/download
│   ├── requirements.txt       # Dependencias Python
│   ├── Dockerfile            # Contenedor para Render
│   ├── test_api.py           # Script de testing
│   └── .env.example          # Plantilla de variables de entorno
│
├── frontend/                  # Aplicación React
│   ├── src/
│   │   ├── App.jsx           # Componente principal
│   │   ├── App.css           # Estilos con gradientes
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Estilos globales
│   ├── package.json          # Dependencias Node.js
│   ├── vite.config.js        # Configuración de Vite
│   ├── vercel.json           # Config de deployment
│   └── .env.example          # Plantilla de variables
│
├── README.md                  # Este archivo
├── QUICKSTART.md             # Guía de inicio rápido
├── DEPLOYMENT.md             # Guía completa de deployment
└── LICENSE                   # Licencia MIT
```

## 🚀 Quick Start

### Prerequisitos

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL** (Neon Tech gratis)

### 1️⃣ Clonar y Configurar

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/media-to-qr.git
cd media-to-qr

# Configurar backend
cd backend
copy .env.example .env
# Editar .env con tu DATABASE_URL de Neon

# Configurar frontend
cd ../frontend
copy .env.example .env
# Editar .env con VITE_API_URL=http://localhost:8000
```

### 2️⃣ Backend (Terminal 1)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux

pip install -r requirements.txt
uvicorn app.main:app --reload
```

✅ **Backend:** http://localhost:8000

### 3️⃣ Frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

✅ **Frontend:** http://localhost:5173

### 4️⃣ Probar

1. Abre http://localhost:5173
2. Sube un archivo (audio/video/imagen)
3. ¡Escanea el QR y reproduce!

## 📖 Documentación

- **[QUICKSTART.md](QUICKSTART.md)** - Inicio rápido (5 minutos)
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deploy completo en Render + Vercel
- **[backend/README.md](backend/README.md)** - Documentación del API
- **[frontend/README.md](frontend/README.md)** - Documentación del frontend

## 🎮 Uso

### Subir Archivo

```bash
curl -X POST "http://localhost:8000/api/v1/upload" \
  -F "file=@audio.mp3"
```

**Respuesta:**
```json
{
  "id": "123e4567-e89b-...",
  "url": "http://localhost:8000/api/v1/media/123e4567-...",
  "filename": "audio.mp3",
  "content_type": "audio/mpeg",
  "size": 3145728
}
```

### Reproducir Archivo

Abre la URL en cualquier navegador:
```
http://localhost:8000/api/v1/media/123e4567-...
```

El navegador detectará el tipo de archivo y lo reproducirá automáticamente.

## 🧪 Testing

```bash
cd backend
pip install -r requirements-test.txt
python test_api.py http://localhost:8000
```

## 🌐 Deployment

### Backend en Render (Gratis)

1. Sube código a GitHub
2. Conecta repo en [Render](https://render.com)
3. Configura:
   - Root: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Agrega variable `DATABASE_URL`

### Frontend en Vercel (Gratis)

1. Conecta repo en [Vercel](https://vercel.com)
2. Configura:
   - Root: `frontend`
   - Framework: Vite
3. Agrega variable `VITE_API_URL`

📘 **Guía completa:** [DEPLOYMENT.md](DEPLOYMENT.md)

## 📊 Características Técnicas

### Backend

- ✅ Upload streaming (no carga todo en memoria)
- ✅ Connection pooling para PostgreSQL
- ✅ Headers optimizados (`Content-Disposition: inline`)
- ✅ Cache control para mejor performance
- ✅ Validación de tipos y tamaños
- ✅ CORS configurable
- ✅ Health checks

### Frontend

- ✅ QR generado en cliente (ahorra CPU del servidor)
- ✅ Validación antes de subir
- ✅ Estados de carga claros
- ✅ Responsive design (mobile-first)
- ✅ Copiar URL con un click
- ✅ Error handling robusto

## 🔒 Seguridad

- Validación de tipos MIME
- Límite de tamaño (50MB)
- UUIDs no secuenciales
- CORS configurado correctamente
- SSL/TLS en producción
- No ejecuta código de archivos

## 📈 Performance

- **Backend**: <50ms respuesta (upload)
- **Frontend**: <1s primera carga (Vite optimizado)
- **Database**: Consultas indexadas
- **CDN**: Vercel Edge Network global

## 🤝 Contribuir

Las contribuciones son bienvenidas:

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Tipos de Archivo Soportados

| Tipo | Formatos |
|------|----------|
| 🎵 **Audio** | mp3, wav, ogg, aac, m4a, flac, webm |
| 🎬 **Video** | mp4, mpeg, mov, avi, webm, ogg |
| 🖼️ **Imagen** | jpeg, png, gif, webp, svg |

## 💰 Costos

Todo gratis en tier gratuito:

- **Neon Tech**: 0.5GB almacenamiento + 100 horas/mes
- **Render**: 750 horas/mes (con auto-sleep)
- **Vercel**: 100GB bandwidth/mes

**Total:** $0/mes 🎉

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver [LICENSE](LICENSE) para detalles.

## 🙏 Agradecimientos

- [FastAPI](https://fastapi.tiangolo.com/) por el framework increíble
- [Neon Tech](https://neon.tech/) por PostgreSQL serverless gratis
- [Render](https://render.com/) y [Vercel](https://vercel.com/) por el hosting

---

<div align="center">

**Hecho con ❤️ y ☕**

[⬆ Volver arriba](#-media-to-qr)

</div>
