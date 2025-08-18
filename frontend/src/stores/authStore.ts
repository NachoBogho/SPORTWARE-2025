import { create } from 'zustand'

interface AuthState {
  isActivated: boolean
  activationError: string | null
  activating: boolean
  setActivated: (activated: boolean) => void
  activateSoftware: (licenseKey: string) => Promise<{ success: boolean; message: string }>
}

export const useAuthStore = create<AuthState>((set) => ({
  isActivated: false,
  activationError: null,
  activating: false,
  
  setActivated: (activated) => set({ isActivated: activated }),
  
  activateSoftware: async (licenseKey) => {
    set({ activating: true, activationError: null })
    
    try {
      // Si estamos en Electron, usar la API de Electron
      if (window.electron) {
        const result = await window.electron.activateSoftware(licenseKey)
        
        if (result.success) {
          set({ isActivated: true, activating: false })
        } else {
          set({ activationError: result.message, activating: false })
        }
        
        return result
      } else {
        // En desarrollo web, simular activación exitosa
        set({ isActivated: true, activating: false })
        return { success: true, message: 'Software activado correctamente (modo desarrollo)' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ activationError: errorMessage, activating: false })
      return { success: false, message: errorMessage }
    }
  },
}))