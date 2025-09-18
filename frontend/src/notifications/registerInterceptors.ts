import axios, { AxiosInstance } from 'axios'
import { useNotificationsStore } from '../stores/notificationsStore'
import { API_BASE } from '../api'

let registered = false

function attach(instance: AxiosInstance) {
  if ((instance as any).__notifInterceptorAttached) return
  ;(instance as any).__notifInterceptorAttached = true

  const addNotification = useNotificationsStore.getState().addNotification
  // Heurística sin import.meta para evitar error de tipos
  const isDev =
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)

  instance.interceptors.response.use(
    (response) => {
      try {
        const { config, status, data } = response
        const method = (config.method || '').toLowerCase()
        // Normalizar URL (quitar dominio y base)
        let raw = config.url || ''
        if (raw.startsWith('http')) {
          try { raw = new URL(raw).pathname } catch {}
        }
        // Eliminar query
        raw = raw.split('?')[0]
        // Eliminar API_BASE si está presente
        if (raw.startsWith(API_BASE)) {
          raw = raw.slice(API_BASE.length)
        }
        const isReservasBase = raw === '/api/reservas'
        const isReservasItem = raw.startsWith('/api/reservas/')

        if (isDev) {
          // console.debug('[NotifInterceptor][OK]', method, raw, status)
        }

        if (method === 'post' && isReservasBase && status >= 200 && status < 300) {
          addNotification('Se creó una nueva reserva', 'success', { reservaId: data?._id })
        }

        if ((method === 'put' || method === 'patch') && isReservasItem && status >= 200 && status < 300) {
          addNotification('Reserva actualizada correctamente', 'info', { reservaId: data?._id })
        }

        return response
      } catch {
        return response
      }
    },
    (error) => {
      try {
        const config = error.config || {}
        const method = (config.method || '').toLowerCase()
        let raw = config.url || ''
        if (raw?.startsWith('http')) {
          try { raw = new URL(raw).pathname } catch {}
        }
        raw = raw.split('?')[0]
        // Eliminar API_BASE si está presente
        if (raw.startsWith(API_BASE)) {
          raw = raw.slice(API_BASE.length)
        }
        const addNotification = useNotificationsStore.getState().addNotification
        const isReservasBase = raw === '/api/reservas'
        const isReservasItem = raw.startsWith('/api/reservas/')

        if (isDev) {
          // console.debug('[NotifInterceptor][ERR]', method, raw, error?.response?.status)
        }

        if (method === 'post' && isReservasBase) {
          addNotification('Error al crear la reserva', 'error', { status: error.response?.status })
        }
        if ((method === 'put' || method === 'patch') && isReservasItem) {
          addNotification('Error al actualizar la reserva', 'error', { status: error.response?.status })
        }
      } catch {
        /* silent */
      }
      return Promise.reject(error)
    }
  )
}

export function initNotifications(optionalInstance?: AxiosInstance) {
  if (registered) return
  registered = true
  // Adjuntar al axios por defecto
  attach(axios)
  // Adjuntar a instancia custom si se pasa
  if (optionalInstance) attach(optionalInstance)

  // Notificación de verificación (solo primera vez)
  useNotificationsStore.getState().addNotification('Sistema de notificaciones inicializado', 'info')
}

// Inicialización inmediata
initNotifications()
