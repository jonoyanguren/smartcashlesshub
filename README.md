# Smart Cashless Hub

Plataforma de marketing, analítica y fidelización para el ecosistema Smart Cashless.

## Descripción

Smart Cashless Hub es la capa de valor añadido sobre el sistema de pagos cashless existente (Django + Dojo). Proporciona herramientas de marketing, campañas, promociones, notificaciones multicanal y programas de lealtad con soporte multi-tenant.

## Estructura del Proyecto

```
smart-cashless/
├── backend/      # API Node.js + Express + TypeScript
├── frontend/     # Dashboard React + Vite + TypeScript
└── app/          # App móvil Expo + React Native + TypeScript
```

## Requisitos

- Node.js >= 20.19.4
- npm >= 11.x
- Expo CLI (para desarrollo móvil)
- Backend Django de Smart Cashless (Proyectos 1 y 2) ejecutándose

## Instalación

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Configurar variables de entorno en .env
npm run dev
```

El backend estará disponible en `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### App Móvil

```bash
cd app
npm install
npm start
```

Escanea el QR con Expo Go para ver la app en tu dispositivo.

## Scripts Disponibles

### Backend
- `npm run dev` - Servidor de desarrollo con hot reload
- `npm run build` - Compilar TypeScript a JavaScript
- `npm start` - Ejecutar servidor en producción
- `npm run lint` - Verificar código con ESLint
- `npm run type-check` - Verificar tipos TypeScript

### Frontend
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm run preview` - Preview del build de producción
- `npm run lint` - Verificar código con ESLint

### App
- `npm start` - Iniciar Expo
- `npm run android` - Ejecutar en Android
- `npm run ios` - Ejecutar en iOS
- `npm run web` - Ejecutar en navegador

## Tecnologías

### Backend
- Node.js + Express
- TypeScript
- Zod (validación)
- Helmet (seguridad)
- Morgan (logging)

### Frontend
- React 18
- Vite
- TypeScript
- ESLint

### App
- React Native
- Expo
- TypeScript

## Integración con Django

El backend de Node.js se conecta al backend Django existente mediante su API REST. Configurar la URL en `backend/.env`:

```
DJANGO_API_URL=http://localhost:8000/api
```

## Funcionalidades Principales

- **Campañas de Marketing**: Creación y gestión de campañas promocionales
- **Programas de Lealtad**: Sistema de puntos y recompensas
- **Notificaciones**: Push, email y SMS multicanal
- **Analítica**: Dashboards y reportes de comportamiento
- **Multi-tenant**: Soporte para múltiples clientes/eventos

## Licencia

Propietario - Smart Cashless
