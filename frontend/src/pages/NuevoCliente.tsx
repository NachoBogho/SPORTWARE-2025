import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useNotificationsStore } from '../stores/notificationsStore'

interface FormData {
  nombre: string
  apellido: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  codigoPostal: string
  notas: string
}

const NuevoCliente = () => {
  const navigate = useNavigate()
  const addNotification = useNotificationsStore(state => state.addNotification)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigoPostal: '',
    notas: ''
  })
  const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación requerida actualizada
    if (!formData.nombre || !formData.apellido || !formData.telefono) {
      toast.error('Nombre, apellido y teléfono son obligatorios')
      return
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error('El formato del email no es válido')
      return
    }

    setLoading(true)

    try {
      await axios.post('/api/clientes', formData)
      toast.success('Cliente creado exitosamente')
      addNotification('Se creó un nuevo cliente', 'success')
      navigate('/clientes')
    } catch (error: any) {
      console.error('Error al crear cliente:', error)
      const msg = error?.response?.data?.mensaje || 'Error al crear el cliente. Por favor, intenta de nuevo.'
      if (/email/i.test(msg)) {
        setErrorModal({ open: true, message: msg })
      } else {
        toast.error(msg)
      }
      addNotification('Error al crear el cliente', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-background-900">Nuevo Cliente</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Información personal */}
            <div className="space-y-2">
              <label htmlFor="nombre" className="label">Nombre <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="apellido" className="label">Apellido <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="telefono" className="label">Teléfono <span className="text-red-500">*</span></label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <label htmlFor="direccion" className="label">Dirección</label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="ciudad" className="label">Ciudad</label>
              <input
                type="text"
                id="ciudad"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="codigoPostal" className="label">Código Postal</label>
              <input
                type="text"
                id="codigoPostal"
                name="codigoPostal"
                value={formData.codigoPostal}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <label htmlFor="notas" className="label">Notas</label>
            <textarea
              id="notas"
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              className="input min-h-[100px]"
              placeholder="Información adicional sobre el cliente..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/clientes')}
              className="btn btn-outline-background"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span> Guardando...
                </>
              ) : (
                'Guardar Cliente'
              )}
            </button>
          </div>
        </form>
      </div>

      {errorModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setErrorModal({ open: false, message: '' })}
          />
          <div className="relative z-50 w-full max-w-sm mx-4 rounded-lg shadow-lg bg-white border border-red-200">
            <div className="px-5 py-5">
              <h3 className="text-lg font-semibold text-red-600 mb-2">
                No se pudo guardar
              </h3>
              <p className="text-sm text-background-600 mb-4">{errorModal.message}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setErrorModal({ open: false, message: '' })}
                  className="btn btn-outline-danger"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NuevoCliente