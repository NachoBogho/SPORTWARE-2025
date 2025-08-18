import React from 'react'
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

const EditarCliente = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
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
  const addNotification = useNotificationsStore(s => s.addNotification)

  useEffect(() => {
    const fetchCliente = async () => {
      try {
        const response = await axios.get(`/api/clientes/${id}`)
        setFormData({
          nombre: response.data.nombre || '',
          apellido: response.data.apellido || '',
          email: response.data.email || '',
          telefono: response.data.telefono || '',
          direccion: response.data.direccion || '',
          ciudad: response.data.ciudad || '',
          codigoPostal: response.data.codigoPostal || '',
          notas: response.data.notas || ''
        })
      } catch (err) {
        console.error('Error al cargar cliente:', err)
        setError('No se pudo cargar la información del cliente. Por favor, intenta de nuevo.')
      } finally {
        setFetchLoading(false)
      }
    }

    if (id) {
      fetchCliente()
    }
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    
    // Validación básica
    if (!formData.nombre || !formData.apellido) {
      toast.error('Nombre y apellido son obligatorios')
      return
    }

    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error('El formato del email no es válido')
      return
    }

    setLoading(true)

    try {
      await axios.put(`/api/clientes/${id}`, formData)
      addNotification('Cliente actualizado correctamente', 'success', { clienteId: id })
      toast.success('Cliente actualizado exitosamente')
      navigate('/clientes')
    } catch (error: any) {
      console.error('Error al actualizar cliente:', error)
      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        const data: any = error.response?.data
        const rawMsg = data?.message || data?.mensaje || ''
        const duplicateHeuristic = /duplicate key|E11000|ya existe/i.test(rawMsg)
        if (
          data?.code === 'VALIDATION_DUPLICATE' ||
          (status === 409 && data?.fields) ||
          duplicateHeuristic
        ) {
          const fields: string[] =
            data?.fields ||
            (data?.keyPattern ? Object.keys(data.keyPattern) : [])
          const msg =
            data?.message ||
            data?.mensaje ||
            (fields.length
              ? `Ya existe un cliente con ${fields.join(', ')}.`
              : 'Datos duplicados')
          setValidationError(msg)
          addNotification('Actualización de cliente con email duplicado', 'warning', { clienteId: id, campos: fields })
          toast.error(msg)
          setLoading(false)
          return
        }
      }
      addNotification('Error al actualizar cliente', 'error', { clienteId: id })
      toast.error('Error al actualizar el cliente. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-200 rounded-md text-red-700">
        {error}
        <div className="mt-4">
          <button 
            onClick={() => navigate('/clientes')} 
            className="btn btn-outline-background"
          >
            Volver a Clientes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-background-900">Editar Cliente</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {validationError && (
            <div className="p-3 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
              {validationError}
            </div>
          )}
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
              <label htmlFor="telefono" className="label">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="input"
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
                'Actualizar Cliente'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditarCliente