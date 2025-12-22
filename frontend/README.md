# Media to QR - Frontend

Interfaz web minimalista construida con React para subir archivos multimedia y generar códigos QR.

## Características

- ⚛️ React 18 con Vite
- 📱 Diseño responsivo y moderno
- 📷 Generación de QR en cliente (react-qr-code)
- 🎨 Gradientes y animaciones suaves
- ⚡ Validación de archivos en cliente
- 📋 Copiar URL al portapapeles

## Requisitos

- Node.js 18+
- npm o yarn

## Instalación Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL del backend

# Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Scripts

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build para producción
- `npm run preview` - Preview del build

## Deployment en Vercel

### Opción 1: Desde la interfaz web

1. Importar repositorio en Vercel
2. Configurar:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Agregar variable de entorno:
   - `VITE_API_URL`: URL de tu backend en Render

### Opción 2: Desde CLI

```bash
npm i -g vercel
vercel
# Seguir instrucciones
```

## Estructura

```
frontend/
├── src/
│   ├── App.jsx          # Componente principal
│   ├── App.css          # Estilos
│   ├── main.jsx         # Entry point
│   └── index.css        # Estilos globales
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

## Estados de la Aplicación

1. **Idle**: Pantalla de inicio con botón de subida
2. **Uploading**: Spinner de carga
3. **Success**: QR code + información del archivo + URL
4. **Error**: Mensaje de error con botón de reintentar

## Variables de Entorno

```env
VITE_API_URL=https://tu-backend.onrender.com
```

## Validaciones

- Tamaño máximo: 50MB
- Tipos permitidos: audio/*, video/*, image/*
- Validación antes de enviar al servidor

## Características de UX

- Drag & drop visual (simulado con label)
- Feedback inmediato en errores
- Copiado de URL con un click
- Animaciones suaves de transición
- QR de alta resolución (256x256)
- Diseño mobile-first
