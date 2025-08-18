import { create } from 'zustand'
import axios from 'axios'

interface Configuracion {
  _id?: string
  nombreNegocio: string
  logo: string
  colorPrimario: string
  colorFondo: string
  colorTexto: string
  moneda: string
  impuestos: number
  horaAperturaGlobal: string
  horaCierreGlobal: string
  diasOperativosGlobal: string[]
  updatedAt?: Date
}

interface ConfigState {
  config: Configuracion
  loading: boolean
  error: string | null
  fetchConfig: () => Promise<void>
  updateConfig: (config: Partial<Configuracion>) => Promise<void>
  resetConfig: () => Promise<void>
}

const defaultConfig: Configuracion = {
  nombreNegocio: 'SportWare',
  logo: '',
  colorPrimario: '#0D9F6F', // Verde oscuro medio brillante
  colorFondo: '#000000', // Negro
  colorTexto: '#FFFFFF', // Blanco
  moneda: '$',
  impuestos: 21,
  horaAperturaGlobal: '08:00',
  horaCierreGlobal: '22:00',
  diasOperativosGlobal: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: defaultConfig,
  loading: false,
  error: null,
  
  fetchConfig: async () => {
    // Evitar múltiples solicitudes simultáneas
    if (get().loading) return;
    
    set({ loading: true, error: null })
    
    try {
      const response = await axios.get('/api/configuracion')
      set({ config: response.data, loading: false })
    } catch (error) {
      console.error('Error al obtener la configuración:', error)
      set({ 
        error: 'Error al cargar la configuración', 
        loading: false,
        config: defaultConfig // Usar configuración por defecto en caso de error
      })
    }
  },
  
  updateConfig: async (newConfig) => {
    set({ loading: true, error: null })
    
    try {
      const response = await axios.put('/api/configuracion', newConfig)
      set({ config: response.data, loading: false })
      
      // Actualizar los colores CSS en tiempo real
      if (newConfig.colorPrimario) {
        document.documentElement.style.setProperty('--color-primary', newConfig.colorPrimario)
      }
      if (newConfig.colorFondo) {
        document.documentElement.style.setProperty('--color-background', newConfig.colorFondo)
      }
      if (newConfig.colorTexto) {
        document.documentElement.style.setProperty('--color-text', newConfig.colorTexto)
      }
    } catch (error) {
      console.error('Error al actualizar la configuración:', error)
      set({ error: 'Error al guardar la configuración', loading: false })
    }
  },
  
  resetConfig: async () => {
    set({ loading: true, error: null })
    
    try {
      const response = await axios.post('/api/configuracion/reset')
      set({ config: response.data.configuracion, loading: false })
      
      // Restablecer los colores CSS a los valores predeterminados
      document.documentElement.style.setProperty('--color-primary', defaultConfig.colorPrimario)
      document.documentElement.style.setProperty('--color-background', defaultConfig.colorFondo)
      document.documentElement.style.setProperty('--color-text', defaultConfig.colorTexto)
    } catch (error) {
      console.error('Error al restablecer la configuración:', error)
      set({ error: 'Error al restablecer la configuración', loading: false })
    }
  }
}))