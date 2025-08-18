import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useConfigStore } from '../../stores/configStore'

const ActivationScreen = () => {
  const [licenseKey, setLicenseKey] = useState('')
  const { activateSoftware, activating, activationError } = useAuthStore()
  const { config } = useConfigStore()

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!licenseKey.trim()) return
    
    await activateSoftware(licenseKey.trim())
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-background-50 rounded-lg shadow-lg">
        <div className="text-center">
          {config.logo ? (
            <img
              className="w-auto h-16 mx-auto"
              src={config.logo}
              alt={config.nombreNegocio}
            />
          ) : null}
          <h2 className="mt-6 text-3xl font-extrabold text-background-900">
            {config.nombreNegocio}
          </h2>
          <p className="mt-2 text-sm text-background-600">
            Sistema de gestión de canchas deportivas
          </p>
        </div>

        <div className="mt-8">
          <div className="rounded-md shadow-sm">
            <form onSubmit={handleActivation} className="space-y-6">
              <div>
                <label htmlFor="license-key" className="block text-sm font-medium text-background-700">
                  Clave de Licencia
                </label>
                <input
                  id="license-key"
                  name="license-key"
                  type="text"
                  required
                  className="input mt-1"
                  placeholder="Ingrese su clave de licencia"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                />
              </div>

              {activationError && (
                <div className="p-3 text-sm text-red-800 bg-red-100 rounded-md">
                  {activationError}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={activating || !licenseKey.trim()}
                  className="btn-primary w-full flex justify-center"
                >
                  {activating ? (
                    <>
                      <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Activando...
                    </>
                  ) : (
                    'Activar Software'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-center text-sm text-background-600">
            Para obtener una licencia, contacte con el proveedor del software.
          </p>
          <p className="mt-2 text-center text-xs text-background-500">
            &copy; {new Date().getFullYear()} {config.nombreNegocio} - Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  )
}

export default ActivationScreen