# SportWare Backend

Backend del sistema de gestión deportiva SportWare, construido con Node.js, Express y MongoDB.

## 🚀 Inicio Rápido

### 1. Verificar Sistema
```bash
npm run system:check
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Asegúrate de que el archivo `.env` esté configurado correctamente.

### 4. Inicializar Base de Datos
```bash
npm run seed
```

### 5. Iniciar Servidor
```bash
npm run dev
```

## 🛠️ Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia el servidor en modo producción |
| `npm run dev` | Inicia el servidor en modo desarrollo (con nodemon) |
| `npm run system:check` | Verifica que todo esté configurado correctamente |
| `npm run seed` | Inicializa la BD con datos de ejemplo |
| `npm run seed:clean` | Limpia e inicializa la BD |
| `npm run db:check` | Verifica el estado actual de la BD |
| `npm run db:clean` | Limpia completamente la BD |

## 📁 Estructura del Proyecto

```
backend/
├── config/
│   └── database.js          # Configuración de MongoDB
├── docs/
│   └── MONGODB_SETUP.md     # Documentación de MongoDB
├── middleware/
│   └── errorHandler.js      # Manejo de errores
├── models/
│   ├── Cancha.js           # Modelo de canchas
│   ├── Cliente.js          # Modelo de clientes
│   ├── Configuracion.js    # Modelo de configuración
│   └── Reserva.js          # Modelo de reservas
├── routes/
│   ├── canchas.js          # Rutas de canchas
│   ├── clientes.js         # Rutas de clientes
│   ├── configuracion.js    # Rutas de configuración
│   ├── reportes.js         # Rutas de reportes
│   └── reservas.js         # Rutas de reservas
├── scripts/
│   ├── checkSystem.js      # Verificación del sistema
│   └── seedDatabase.js     # Inicialización de datos
├── .env                    # Variables de entorno
├── package.json           # Dependencias y scripts
└── server.js              # Servidor principal
```

## 🌐 API Endpoints

### Estado del Sistema
- `GET /api/status` - Estado general del servidor
- `GET /api/db-info` - Información de la base de datos

### Clientes
- `GET /api/clientes` - Listar todos los clientes
- `POST /api/clientes` - Crear nuevo cliente
- `GET /api/clientes/:id` - Obtener cliente específico
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

### Canchas
- `GET /api/canchas` - Listar todas las canchas
- `POST /api/canchas` - Crear nueva cancha
- `GET /api/canchas/:id` - Obtener cancha específica
- `PUT /api/canchas/:id` - Actualizar cancha
- `DELETE /api/canchas/:id` - Eliminar cancha

### Reservas
- `GET /api/reservas` - Listar todas las reservas
- `POST /api/reservas` - Crear nueva reserva
- `GET /api/reservas/:id` - Obtener reserva específica
- `PUT /api/reservas/:id` - Actualizar reserva
- `DELETE /api/reservas/:id` - Eliminar reserva

### Configuración
- `GET /api/configuracion` - Obtener configuración actual
- `PUT /api/configuracion` - Actualizar configuración

### Reportes
- `GET /api/reportes/ingresos` - Reporte de ingresos
- `GET /api/reportes/ocupacion` - Reporte de ocupación
- `GET /api/reportes/clientes` - Reporte de clientes

## 🔧 Configuración

### Variables de Entorno (.env)
```env
# MongoDB
MONGODB_URI=mongodb://127.0.0.1:27017/sportware
MONGODB_DB_NAME=sportware

# Servidor
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Logs
LOG_LEVEL=dev
```

### Configuración de MongoDB
- **Host**: 127.0.0.1 (localhost)
- **Puerto**: 27017 (puerto por defecto de MongoDB)
- **Base de datos**: sportware
- **Pool de conexiones**: 10 conexiones máximo
- **Timeout**: 45 segundos

## 📊 Base de Datos

### Colecciones

#### Clientes
- Información personal de clientes
- Teléfono único (opcional)
- Email opcional
- Datos de contacto y notas

#### Canchas
- Tipos de cancha disponibles
- Precios por hora
- Horarios de disponibilidad
- Estados (disponible, mantenimiento, inactiva)

#### Reservas
- Referencias a cliente y cancha
- Fechas y horarios
- Estados (pendiente, confirmada, cancelada, completada)
- Información de pago

#### Configuración
- Configuración global del sistema
- Colores y branding
- Horarios operativos
- Configuración de precios e impuestos

## 🚨 Solución de Problemas

### MongoDB no conecta
1. Verificar que MongoDB esté instalado y ejecutándose
2. Comprobar la URI en el archivo `.env`
3. Ejecutar `npm run system:check` para diagnóstico

### Puerto ocupado
1. Cambiar el puerto en `.env`: `PORT=3002`
2. O terminar el proceso que usa el puerto 3001

### Errores de dependencias
1. Eliminar `node_modules`: `rm -rf node_modules`
2. Reinstalar: `npm install`

### Base de datos vacía
1. Ejecutar `npm run seed` para datos de ejemplo
2. O usar `npm run seed:clean` para limpiar e inicializar

## 🔍 Monitoreo

### Logs
El servidor proporciona logs detallados:
- Conexiones a MongoDB
- Errores de API
- Actividad de usuarios
- Estado del sistema

### Endpoints de Diagnóstico
- `/api/status` - Estado completo del sistema
- `/api/db-info` - Información específica de MongoDB

## 🔐 Seguridad

- Validación de datos con Mongoose
- Manejo de errores centralizado
- CORS configurado específicamente
- Variables de entorno para credenciales
- Índices únicos para evitar duplicados

## 🚀 Despliegue

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

### Docker (Opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 📱 Integración con Frontend

El backend está diseñado para trabajar con el frontend React/Vite:
- **CORS**: Configurado para `http://localhost:5173`
- **API REST**: Endpoints JSON consistentes
- **Tiempo real**: Preparado para WebSockets (futuro)

## 🤝 Contribución

1. Fork del proyecto
2. Crear branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto es parte del sistema SportWare. Derechos reservados.
