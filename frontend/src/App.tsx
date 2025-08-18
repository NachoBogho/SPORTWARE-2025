
import React from 'react'
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useConfigStore } from './stores/configStore'
import { useAuthStore } from './stores/authStore'

// Componentes de layout
import Layout from './components/layout/Layout'
import ActivationScreen from './components/auth/ActivationScreen'

// Páginas
import Dashboard from './pages/Dashboard'
import Reservas from './pages/Reservas'
import NuevaReserva from './pages/NuevaReserva'
import EditarReserva from './pages/EditarReserva'
import DetalleReserva from './pages/DetalleReserva'
import Canchas from './pages/Canchas'
import NuevaCancha from './pages/NuevaCancha'
import EditarCancha from './pages/EditarCancha'
import DetalleCancha from './pages/DetalleCancha'
import Clientes from './pages/Clientes'
import NuevoCliente from './pages/NuevoCliente'
import EditarCliente from './pages/EditarCliente'
import DetalleCliente from './pages/DetalleCliente'
import Reportes from './pages/Reportes'
import Configuracion from './pages/Configuracion'
import NotFound from './pages/NotFound'

// Declaración para acceder a la API de Electron
declare global {
  interface Window {
    electron: {
      activateSoftware: (licenseKey: string) => Promise<{ success: boolean; message: string }>
      checkActivation: () => Promise<{ activated: boolean }>
      receive: (channel: string, func: (...args: any[]) => void) => void
    }
  }
}

function App() {
  const { fetchConfig } = useConfigStore()
  const { isActivated, setActivated } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true;
    
    // Cargar la configuración inicial
    fetchConfig()

    // Verificar si el software está activado
    const checkActivation = async () => {
      try {
        // Si estamos en Electron, usar la API de Electron
        if (window.electron) {
          const result = await window.electron.checkActivation()
          if (isMounted) {
            setActivated(result.activated)
          }
          
          // Escuchar cambios en el estado de activación
          window.electron.receive('activation-status', (activated: boolean) => {
            if (isMounted) {
              setActivated(activated)
            }
          })
        } else {
          // En desarrollo web, considerar como activado
          if (isMounted) {
            setActivated(true)
          }
        }
      } catch (error) {
        console.error('Error al verificar la activación:', error)
        // En caso de error, asumir que no está activado
        if (isMounted) {
          setActivated(false)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkActivation()
    
    return () => {
      isMounted = false;
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Si el software no está activado, mostrar la pantalla de activación
  if (!isActivated) {
    return <ActivationScreen />
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="reservas" element={<Reservas />} />
        <Route path="reservas/nueva" element={<NuevaReserva />} />
        <Route path="reservas/editar/:id" element={<EditarReserva />} />
        <Route path="reservas/:id" element={<DetalleReserva />} />
        <Route path="canchas" element={<Canchas />} />
        <Route path="canchas/nueva" element={<NuevaCancha />} />
        <Route path="canchas/editar/:id" element={<EditarCancha />} />
        <Route path="canchas/:id" element={<DetalleCancha />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/nuevo" element={<NuevoCliente />} />
        <Route path="clientes/editar/:id" element={<EditarCliente />} />
        <Route path="clientes/:id" element={<DetalleCliente />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  )
}

export default App