import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useConfigStore } from '../../stores/configStore'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { config } = useConfigStore()

  return (
    <div className="flex h-screen overflow-hidden bg-background text-background-900">
      {/* Sidebar para dispositivos móviles */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-64">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 bg-background-50 border-t border-background-200">
          <div className="text-center text-sm text-background-500">
            &copy; {new Date().getFullYear()} {config.nombreNegocio} - Todos los derechos reservados
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Layout