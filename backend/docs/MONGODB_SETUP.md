# Configuración de MongoDB para SportWare

Este documento explica cómo configurar y usar MongoDB en el proyecto SportWare.

## 📋 Requisitos Previos

1. **MongoDB Community Edition** instalado y ejecutándose
2. **Node.js** (versión 14 o superior)
3. **npm** o **yarn** para gestionar dependencias

## 🚀 Instalación de MongoDB

### Windows
1. Descargar MongoDB Community Server desde [mongodb.com](https://www.mongodb.com/try/download/community)
2. Instalar siguiendo el asistente de instalación
3. MongoDB se ejecutará como servicio automáticamente

### Verificar instalación
```bash
mongod --version
mongo --version
```

## ⚙️ Configuración del Proyecto

### 1. Variables de Entorno
El archivo `.env` contiene la configuración de la base de datos:

```env
# Configuración de MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/sportware
MONGODB_DB_NAME=sportware

# Configuración del servidor
PORT=3001
NODE_ENV=development
```

### 2. Estructura de la Base de Datos

#### Colecciones principales:
- **clientes**: Información de clientes del club
- **canchas**: Datos de las canchas disponibles
- **reservas**: Reservas realizadas por clientes
- **configuraciones**: Configuración global del sistema

#### Modelos definidos:
- `Cliente.js`: Gestión de clientes
- `Cancha.js`: Gestión de canchas deportivas
- `Reserva.js`: Sistema de reservas
- `Configuracion.js`: Configuración del sistema

## 🛠️ Comandos Disponibles

### Gestión de la Base de Datos

```bash
# Inicializar base de datos con datos de ejemplo
npm run seed

# Limpiar e inicializar base de datos
npm run seed:clean

# Verificar estado de la base de datos
npm run db:check

# Limpiar toda la base de datos
npm run db:clean
```

### Desarrollo

```bash
# Iniciar servidor en modo desarrollo
npm run dev

# Iniciar servidor en modo producción
npm start
```

## 📊 Scripts de Inicialización

### Seed Database
El script `scripts/seedDatabase.js` permite:

1. **Crear datos de ejemplo**: Clientes, canchas, configuración inicial
2. **Verificar datos existentes**: Ver el estado actual de la BD
3. **Limpiar base de datos**: Eliminar todos los datos

### Datos de Ejemplo Incluidos

#### Clientes:
- Juan Pérez (con email y teléfono)
- María González (cliente frecuente)
- Carlos López (datos básicos)

#### Canchas:
- Cancha Principal (Fútbol 5, $3000/hora)
- Cancha Secundaria (Fútbol 5, $2500/hora)
- Cancha de Tenis ($2000/hora)
- Cancha de Pádel ($2200/hora)

#### Configuración:
- Nombre del negocio: "SportWare Club"
- Colores: Verde oscuro, fondo negro, texto blanco
- Horarios operativos: 8:00 - 23:00
- Moneda: Peso argentino ($)

## 🔧 Configuración Avanzada

### Conexión a MongoDB
El archivo `config/database.js` maneja:

- Reconexión automática
- Pool de conexiones
- Manejo de errores
- Logs detallados
- Limpieza de índices problemáticos

### Características de Conexión:
- **Pool máximo**: 10 conexiones simultáneas
- **Timeout**: 45 segundos de inactividad
- **Reintentos**: Hasta 5 intentos de reconexión
- **IPv4**: Prioridad sobre IPv6

## 🏥 Monitoreo y Salud

### Endpoint de Estado
```
GET /api/status
```
Retorna:
- Estado del servidor
- Información de conexión a MongoDB
- Entorno de ejecución
- Timestamp actual

### Endpoint de Base de Datos
```
GET /api/db-info
```
Retorna información detallada de la conexión a MongoDB.

## 🚨 Solución de Problemas

### Problemas Comunes

1. **MongoDB no conecta**
   - Verificar que MongoDB esté ejecutándose
   - Revisar la URI en el archivo `.env`
   - Comprobar puertos disponibles

2. **Errores de índices duplicados**
   - El sistema limpia automáticamente índices problemáticos
   - Si persiste, usar `npm run db:clean`

3. **Datos no aparecen**
   - Ejecutar `npm run db:check` para verificar
   - Usar `npm run seed` para crear datos de ejemplo

### Logs Útiles
El sistema proporciona logs detallados:
- ✅ Conexión exitosa
- ❌ Errores de conexión
- 🔄 Intentos de reconexión
- 🧹 Limpieza de índices

## 📱 Integración con Frontend

El backend expone una API REST que el frontend consume:
- **Base URL**: `http://localhost:3001/api`
- **CORS**: Configurado para `http://localhost:5173` (Vite)
- **Formato**: JSON en todas las respuestas

### Endpoints principales:
- `/api/clientes` - Gestión de clientes
- `/api/canchas` - Gestión de canchas
- `/api/reservas` - Sistema de reservas
- `/api/configuracion` - Configuración del sistema
- `/api/reportes` - Reportes y estadísticas

## 🔒 Seguridad

- Variables de entorno para credenciales
- Validación de datos en modelos Mongoose
- Middleware de manejo de errores
- Índices únicos para evitar duplicados
- CORS configurado específicamente

## 📈 Escalabilidad

La configuración actual soporta:
- Pool de conexiones configurable
- Reconexión automática
- Manejo de múltiples usuarios simultáneos
- Logs para monitoreo
- Estructura modular para fácil mantenimiento
