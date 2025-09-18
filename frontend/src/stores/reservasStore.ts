import { create } from 'zustand'
import axios from 'axios'
import { API_BASE } from '../api'
import { format } from 'date-fns'

export interface Reserva {
  _id?: string
  cancha: string | { _id: string; nombre: string; tipo: string }
  cliente: string | { _id: string; nombre: string; apellido: string; email: string }
  fechaInicio: Date | string
  fechaFin: Date | string
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada'
  precio: number
  pagado: boolean
  observaciones?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

interface ReservasState {
  reservas: Reserva[]
  reservaActual: Reserva | null
  loading: boolean
  error: string | null
  fetchReservas: () => Promise<void>
  fetchReservasPorFecha: (fecha: Date) => Promise<void>
  fetchReserva: (id: string) => Promise<void>
  crearReserva: (reserva: Reserva) => Promise<{ success: boolean; data?: Reserva; error?: string }>
  actualizarReserva: (id: string, reserva: Partial<Reserva>) => Promise<{ success: boolean; data?: Reserva; error?: string }>
  cancelarReserva: (id: string) => Promise<{ success: boolean; data?: Reserva; error?: string }>
  marcarComoPagada: (id: string) => Promise<{ success: boolean; data?: Reserva; error?: string }>
  eliminarReserva: (id: string) => Promise<{ success: boolean; error?: string }>
}

export const useReservasStore = create<ReservasState>((set, get) => ({
  reservas: [],
  reservaActual: null,
  loading: false,
  error: null,
  
  fetchReservas: async () => {
    set({ loading: true, error: null })
    
    try {
  const response = await axios.get(`${API_BASE}/reservas`)
      set({ reservas: response.data, loading: false })
    } catch (error) {
      console.error('Error al obtener reservas:', error)
      set({ error: 'Error al cargar las reservas', loading: false })
    }
  },
  
  fetchReservasPorFecha: async (fecha) => {
    set({ loading: true, error: null })
    
    try {
      const fechaFormateada = format(fecha, 'yyyy-MM-dd')
  const response = await axios.get(`${API_BASE}/reservas/fecha/${fechaFormateada}`)
      set({ reservas: response.data, loading: false })
    } catch (error) {
      console.error('Error al obtener reservas por fecha:', error)
      set({ error: 'Error al cargar las reservas', loading: false })
    }
  },
  
  fetchReserva: async (id) => {
    set({ loading: true, error: null })
    
    try {
  const response = await axios.get(`${API_BASE}/reservas/${id}`)
      set({ reservaActual: response.data, loading: false })
    } catch (error) {
      console.error('Error al obtener la reserva:', error)
      set({ error: 'Error al cargar la reserva', loading: false })
    }
  },
  
  crearReserva: async (reserva) => {
    set({ loading: true, error: null })
    
    try {
  const response = await axios.post(`${API_BASE}/reservas`, reserva)
      
      // Actualizar la lista de reservas
      const reservasActualizadas = [...get().reservas, response.data]
      set({ reservas: reservasActualizadas, loading: false })
      
      return { success: true, data: response.data }
    } catch (error: any) {
      console.error('Error al crear la reserva:', error)
      
      const errorMessage = error.response?.data?.mensaje || 'Error al crear la reserva'
      set({ error: errorMessage, loading: false })
      
      return { success: false, error: errorMessage }
    }
  },
  
  actualizarReserva: async (id, reserva) => {
    set({ loading: true, error: null })
    
    try {
  const response = await axios.put(`${API_BASE}/reservas/${id}`, reserva)
      
      // Actualizar la lista de reservas
      const reservasActualizadas = get().reservas.map(r => 
        r._id === id ? response.data : r
      )
      
      set({ 
        reservas: reservasActualizadas, 
        reservaActual: response.data,
        loading: false 
      })
      
      return { success: true, data: response.data }
    } catch (error: any) {
      console.error('Error al actualizar la reserva:', error)
      
      const errorMessage = error.response?.data?.mensaje || 'Error al actualizar la reserva'
      set({ error: errorMessage, loading: false })
      
      return { success: false, error: errorMessage }
    }
  },
  
  cancelarReserva: async (id) => {
    set({ loading: true, error: null })
    
    try {
  const response = await axios.patch(`${API_BASE}/reservas/${id}/cancelar`)
      
      // Actualizar la lista de reservas
      const reservasActualizadas = get().reservas.map(r => 
        r._id === id ? response.data : r
      )
      
      set({ 
        reservas: reservasActualizadas, 
        reservaActual: response.data,
        loading: false 
      })
      
      return { success: true, data: response.data }
    } catch (error: any) {
      console.error('Error al cancelar la reserva:', error)
      
      const errorMessage = error.response?.data?.mensaje || 'Error al cancelar la reserva'
      set({ error: errorMessage, loading: false })
      
      return { success: false, error: errorMessage }
    }
  },
  
  marcarComoPagada: async (id) => {
    set({ loading: true, error: null })
    
    try {
  const response = await axios.patch(`${API_BASE}/reservas/${id}/pagar`)
      
      // Actualizar la lista de reservas
      const reservasActualizadas = get().reservas.map(r => 
        r._id === id ? response.data : r
      )
      
      set({ 
        reservas: reservasActualizadas, 
        reservaActual: response.data,
        loading: false 
      })
      
      return { success: true, data: response.data }
    } catch (error: any) {
      console.error('Error al marcar la reserva como pagada:', error)
      
      const errorMessage = error.response?.data?.mensaje || 'Error al marcar la reserva como pagada'
      set({ error: errorMessage, loading: false })
      
      return { success: false, error: errorMessage }
    }
  },
  
  eliminarReserva: async (id) => {
    set({ loading: true, error: null })
    
    try {
  await axios.delete(`${API_BASE}/reservas/${id}`)
      
      // Actualizar la lista de reservas
      const reservasActualizadas = get().reservas.filter(r => r._id !== id)
      set({ reservas: reservasActualizadas, loading: false })
      
      return { success: true }
    } catch (error: any) {
      console.error('Error al eliminar la reserva:', error)
      
      const errorMessage = error.response?.data?.mensaje || 'Error al eliminar la reserva'
      set({ error: errorMessage, loading: false })
      
      return { success: false, error: errorMessage }
    }
  }
}))