import React from 'react'
import { useConfigStore } from '../../stores/configStore'
import { useNotificationsStore } from '../../stores/notificationsStore'
import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline'

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const Header = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
  const { config } = useConfigStore()
  const {
    notifications,
    markAllRead,
    clear
  } = useNotificationsStore()
  const [open, setOpen] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement | null>(null)

  const unread = notifications.filter(n => !n.read).length

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function formatTime(ts: number) {
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function badgeColor(type?: string) {
    switch (type) {
      case 'success': return 'bg-primary/20 text-primary'
      case 'warning': return 'bg-yellow-500/20 text-yellow-400'
      case 'error': return 'bg-red-500/20 text-red-400'
      default: return 'bg-background-700 text-background-200'
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-background-50 border-b border-background-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 -mb-px">
          {/* Botón de hamburguesa para móvil */}
          <div className="flex lg:hidden">
            <button
              className="text-background-500 hover:text-background-600"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Abrir menú lateral</span>
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>

          {/* Logo para móvil */}
          <div className="lg:hidden flex items-center">
            {config.logo ? (
              <img 
                src={config.logo} 
                alt={config.nombreNegocio} 
                className="h-8 w-auto"
              />
            ) : null}
            <span className="ml-2 text-lg font-semibold">{config.nombreNegocio}</span>
          </div>

          {/* Controles de la derecha */}
          <div className="flex items-center space-x-3 relative">
            <button
              className="relative p-2 text-background-500 hover:text-background-600 rounded-full hover:bg-background-100"
              onClick={() => {
                setOpen(o => !o)
                if (unread) markAllRead()
              }}
            >
              <span className="sr-only">Ver notificaciones</span>
              <BellIcon className="w-6 h-6" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
              {/* Punto verde indicativo de novedades recientes */}
              {notifications.length > 0 && notifications.some(n => !n.read) && (
                <span className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
            </button>

            {open && (
              <div
                ref={panelRef}
                className="fixed top-[4rem] right-4 lg:right-auto lg:left-[calc(16rem+1rem)] w-80 max-h-[70vh] flex flex-col bg-background-900 bg-black text-white border border-primary/60 rounded-md shadow-2xl overflow-hidden z-[2000]"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-primary/40">
                  <span className="text-sm font-medium text-white">Historial</span>
                  <div className="flex gap-2">
                    <button
                      className="text-xs text-background-300 hover:text-primary transition-colors"
                      onClick={(e) => { e.stopPropagation(); markAllRead() }}
                    >
                      Marcar leídas
                    </button>
                    <button
                      className="text-xs text-background-300 hover:text-primary transition-colors"
                      onClick={(e) => { e.stopPropagation(); clear() }}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-xs text-background-400 text-center">
                      Sin notificaciones
                    </div>
                  ) : (
                    <ul className="divide-y divide-background-800/40">
                      {notifications.map(n => (
                        <li
                          key={n.id}
                          className="p-3 text-xs flex gap-2 hover:bg-background-800/40 cursor-default transition-colors"
                        >
                          <span className={`h-5 px-2 rounded-full whitespace-nowrap self-start font-medium ${badgeColor(n.type)}`}>
                            {n.type === 'success' ? 'OK' :
                             n.type === 'warning' ? 'WARN' :
                             n.type === 'error' ? 'ERR' : 'INFO'}
                          </span>
                          <div className="flex-1">
                            <p className={`leading-snug ${n.read ? 'text-background-300' : 'text-white font-medium'}`}>
                              {n.message}
                            </p>
                            <p className="mt-0.5 text-[10px] text-background-500">
                              {formatTime(n.timestamp)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header