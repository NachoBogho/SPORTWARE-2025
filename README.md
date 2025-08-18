# SportWare - Sistema de Gestión de Canchas Deportivas

SportWare es un sistema completo para la gestión de canchas deportivas (fútbol, tenis, pádel y otros deportes), diseñado para facilitar la administración de reservas, clientes, canchas y reportes en instalaciones deportivas.

## Características Principales

- **Panel de Control**: Vista general con estadísticas, últimas reservas y accesos rápidos.
- **Gestión de Reservas**: Crear, modificar y eliminar reservas con validación de horarios.
- **Calendario Visual**: Visualización diaria, semanal y mensual de reservas.
- **Gestión de Clientes**: Base de datos completa de clientes con historial.
- **Administración de Canchas**: Configuración de tipos, precios y disponibilidad.
- **Reportes y Estadísticas**: Informes detallados de uso e ingresos con gráficos interactivos.
- **Configuración Personalizable**: Adaptación de colores, logo y nombre del negocio.

## Tecnologías Utilizadas

- **Frontend**: React con TypeScript y TailwindCSS
- **Backend**: Node.js con Express
- **Base de Datos**: MongoDB (local)
- **Aplicación de Escritorio**: Electron

## Requisitos del Sistema

- **Sistema Operativo**: Windows 10/11
- **Espacio en Disco**: Mínimo 500MB
- **Memoria RAM**: Mínimo 4GB
- **Procesador**: Intel Core i3 o equivalente (2.0 GHz o superior)

## Instalación para Desarrollo

### Requisitos Previos

1. Node.js (v16 o superior)
2. npm (v8 o superior)
3. MongoDB (v5 o superior)

### Pasos de Instalación

1. **Clonar el repositorio**

```bash
git clone https://github.com/tu-usuario/sportware.git
cd sportware
```

2. **Instalar dependencias del frontend**

```bash
cd frontend
npm install
```

3. **Instalar dependencias del backend**

```bash
cd ../backend
npm install
```

4. **Configurar variables de entorno**

Crea un archivo `.env` en la carpeta `backend` con el siguiente contenido:

```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/sportware
NODE_ENV=development
```

5. **Iniciar MongoDB**

Asegúrate de que MongoDB esté en ejecución en tu sistema.

6. **Iniciar el backend**

```bash
npm run dev
```

7. **Iniciar el frontend**

En otra terminal:

```bash
cd ../frontend
npm run dev
```

8. **Iniciar la aplicación Electron (opcional durante desarrollo)**

En otra terminal:

```bash
cd ..
npm run electron-dev
```

## Compilación para Producción

### Compilar la Aplicación de Escritorio

1. **Construir el frontend**

```bash
cd frontend
npm run build
```

2. **Empaquetar con Electron Builder**

```bash
cd ..
npm run electron-pack
```

Esto generará un archivo instalable `.exe` en la carpeta `dist`.

## Uso del Sistema

### Activación del Software

1. Al iniciar por primera vez, se solicitará una clave de activación.
2. Ingresa la clave proporcionada por el proveedor.
3. Una vez activado, el software guardará esta información localmente.

### Configuración Inicial

1. Accede a la sección "Configuración" para personalizar el nombre del negocio, logo y colores.
2. Configura los tipos de canchas disponibles, precios y horarios de operación.

### Gestión de Reservas

1. Utiliza el calendario para visualizar la disponibilidad.
2. Crea nuevas reservas seleccionando fecha, hora, cancha y cliente.
3. Gestiona el estado de las reservas (confirmada, pendiente, cancelada).

### Reportes

1. Accede a la sección "Reportes" para visualizar estadísticas.
2. Filtra por fecha, tipo de cancha o cliente.
3. Exporta los informes según sea necesario.

## Estructura del Proyecto

```
sportware/
├── frontend/            # Aplicación React
│   ├── public/          # Archivos estáticos
│   └── src/             # Código fuente React
├── backend/             # Servidor Express
│   ├── src/             # Código fuente del backend
│   ├── routes/          # Rutas API
│   ├── models/          # Modelos de datos
│   └── controllers/     # Controladores
├── assets/              # Recursos compartidos
└── electron/            # Configuración de Electron
```

## Soporte

Para soporte técnico, contacta a [soporte@sportware.com](mailto:soporte@sportware.com)

## Licencia

Este software es propietario y requiere una licencia válida para su uso.

---

© 2025 SportWare. Todos los derechos reservados.# sw
