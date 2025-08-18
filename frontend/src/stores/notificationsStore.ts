import { create } from 'zustand'
import { nanoid } from 'nanoid'

export interface AppNotification {
  id: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  timestamp: number
  read: boolean
  meta?: Record<string, any>
}

interface NotificationsState {
  notifications: AppNotification[]
  addNotification: (message: string, type?: AppNotification['type'], meta?: Record<string, any>) => void
  addBatch?: (items: { message: string; type?: AppNotification['type']; meta?: Record<string, any> }[]) => void
  markAllRead: () => void
  clear: () => void
  remove: (id: string) => void
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  addNotification: (message, type = 'info', meta) =>
    set((s) => {
      const safe = (message || '').toString()
      return {
        notifications: [
          {
            id: nanoid(),
            message: safe,
            type,
            timestamp: Date.now(),
            read: false,
            meta
          },
          ...s.notifications
        ].slice(0, 100)
      }
    }),
  addBatch: (items) =>
    set((s) => {
      const now = Date.now()
      const mapped = items.map(it => ({
        id: nanoid(),
        message: (it.message || '').toString(),
        type: it.type || 'info',
        timestamp: now,
        read: false,
        meta: it.meta
      }))
      return {
        notifications: [...mapped, ...s.notifications].slice(0, 100)
      }
    }),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map(n => ({ ...n, read: true }))
    })),
  clear: () => set({ notifications: [] }),
  remove: (id) =>
    set((s) => ({ notifications: s.notifications.filter(n => n.id !== id) }))
}))
