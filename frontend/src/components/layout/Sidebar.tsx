import React from 'react'
import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'
import { useConfigStore } from '../../stores/configStore'

// Iconos
import {
  HomeIcon,
  CalendarIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Reservas', href: '/reservas', icon: CalendarIcon },
  { name: 'Canchas', href: '/canchas', icon: ClipboardDocumentListIcon },
  { name: 'Clientes', href: '/clientes', icon: UsersIcon },
  { name: 'Reportes', href: '/reportes', icon: ChartBarIcon },
  { name: 'Configuración', href: '/configuracion', icon: Cog6ToothIcon },
]

const primaryNav = navigation.slice(0, 4)
const secondaryNav = navigation.slice(4)

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const { config } = useConfigStore()

  return (
    <>
      {/* Sidebar para móvil */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-background-900/70 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-200 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-200 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex flex-col w-full max-w-xs bg-background-50 border-r border-background-200 shadow-xl focus:outline-none">
                {/* Header móvil */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-background-200">
                  <div className="flex items-center">
                    {config.logo ? (
                      <img
                        className="h-8 w-auto"
                        src={config.logo}
                        alt={config.nombreNegocio}
                      />
                    ) : null}
                    <span className="ml-2 text-lg font-semibold text-background-900 truncate max-w-[9rem]">
                      {config.nombreNegocio}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="inline-flex items-center justify-center rounded-md p-2 text-background-500 hover:text-background-900 hover:bg-background-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background-50"
                  >
                    <span className="sr-only">Cerrar panel</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Navegación móvil */}
                <div className="flex-1 overflow-y-auto py-4 px-2 flex flex-col">
                  <nav className="space-y-1">
                    {primaryNav.map(item => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          [
                            'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
                            isActive
                              ? 'bg-primary text-white shadow'
                              : 'text-background-600 hover:text-background-900 hover:bg-background-100'
                          ].join(' ')
                        }
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0 opacity-80 group-hover:opacity-100" />
                        {item.name}
                      </NavLink>
                    ))}
                  </nav>
                  <nav className="space-y-1 mt-auto pt-4 border-t border-background-200">
                    {secondaryNav.map(item => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          [
                            'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
                            isActive
                              ? 'bg-primary text-white shadow'
                              : 'text-background-600 hover:text-background-900 hover:bg-background-100'
                          ].join(' ')
                        }
                      >
                        <item.icon className="mr-3 h-5 w-5 flex-shrink-0 opacity-80 group-hover:opacity-100" />
                        {item.name}
                      </NavLink>
                    ))}
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Sidebar estático para escritorio */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-1 min-h-0 bg-background-50 border-r border-background-200">
          <div className="flex items-center flex-shrink-0 h-16 px-4 border-b border-background-200">
            {config.logo ? (
              <img
                className="w-auto h-8"
                src={config.logo}
                alt={config.nombreNegocio}
              />
            ) : null}
            <span className="ml-2 text-xl font-semibold text-background-900">
              {config.nombreNegocio}
            </span>
          </div>
          <div className="flex flex-col flex-1 overflow-y-auto">
            <nav className="px-2 py-4 space-y-1">
              {primaryNav.map(item => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-background-700 hover:bg-background-100'
                    }`
                  }
                >
                  <item.icon className="flex-shrink-0 w-6 h-6 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
            <nav className="px-2 py-4 space-y-1 mt-auto border-t border-background-200">
              {secondaryNav.map(item => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-background-700 hover:bg-background-100'
                    }`
                  }
                >
                  <item.icon className="flex-shrink-0 w-6 h-6 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar