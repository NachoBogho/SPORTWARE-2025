import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { useConfigStore } from '../stores/configStore'

// Normalizadores de días
const toUI = (d: string) => {
  const s = (d || '').toLowerCase()
  if (s === 'miercoles') return 'miércoles'
  if (s === 'sabado') return 'sábado'
  return s
}
const toServer = (d: string) => {
  const s = (d || '').toLowerCase()
  if (s === 'miércoles') return 'miercoles'
  if (s === 'sabado' || s === 'sábado') return 'sábado'
  return s
}

interface FormData {
  nombre: string
  tipo: string
  precioHora: number
  horaApertura: string
  horaCierre: string
  diasDisponibles: string[]
  descripcion: string
  estado: 'disponible' | 'mantenimiento' | 'inactiva'
}

const EditarCancha = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { config } = useConfigStore()
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    tipo: '',
    precioHora: 0,
    horaApertura: config.horaAperturaGlobal || '08:00',
    horaCierre: config.horaCierreGlobal || '22:00',
    diasDisponibles: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
    descripcion: '',
    estado: 'disponible'
  })

  const diasSemana = [
    { id: 'lunes', label: 'Lunes' },
    { id: 'martes', label: 'Martes' },
    { id: 'miércoles', label: 'Miércoles' },
    { id: 'jueves', label: 'Jueves' },
    { id: 'viernes', label: 'Viernes' },
    { id: 'sábado', label: 'Sábado' },
    { id: 'domingo', label: 'Domingo' }
  ]

  const tiposCanchas = [
    'Fútbol 5',
    'Fútbol 7',
    'Fútbol 11',
    'Tenis',
    'Pádel',
    'Básquet',
    'Vóley',
    'Hockey',
    'Otro'
  ]

  useEffect(() => {
    const fetchCancha = async () => {
      try {
        const response = await axios.get(`/api/canchas/${id}`)
        const dias = Array.isArray(response.data.diasDisponibles)
          ? response.data.diasDisponibles.map((d: string) => toUI(d))
          : ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
        setFormData({
          nombre: response.data.nombre || '',
          tipo: response.data.tipo || '',
          precioHora: response.data.precioHora || 0,
          horaApertura: response.data.horaApertura || config.horaAperturaGlobal || '08:00',
          horaCierre: response.data.horaCierre || config.horaCierreGlobal || '22:00',
          diasDisponibles: dias,
          descripcion: response.data.descripcion || '',
          estado: response.data.estado || 'disponible'
        })
      } catch (err) {
        console.error('Error al cargar cancha:', err)
        setError('No se pudo cargar la información de la cancha. Por favor, intenta de nuevo.')
      } finally {
        setFetchLoading(false)
      }
    }

    if (id) {
      fetchCancha()
    }
  }, [id, config.horaAperturaGlobal, config.horaCierreGlobal])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleDiaChange = (dia: string) => {
    setFormData(prev => {
      const diasActualizados = prev.diasDisponibles.includes(dia)
        ? prev.diasDisponibles.filter(d => d !== dia)
        : [...prev.diasDisponibles, dia]
      
      return {
        ...prev,
        diasDisponibles: diasActualizados
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validación básica
    if (!formData.nombre || !formData.tipo) {
      toast.error('Nombre y tipo de cancha son obligatorios')
      return
    }

    if (formData.precioHora <= 0) {
      toast.error('El precio por hora debe ser mayor a 0')
      return
    }

    if (formData.diasDisponibles.length === 0) {
      toast.error('Debe seleccionar al menos un día disponible')
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,
        diasDisponibles: formData.diasDisponibles.map((d) => toServer(d))
      }
      await axios.put(`/api/canchas/${id}`, payload)
      toast.success('Cancha actualizada exitosamente')
      navigate('/canchas')
    } catch (error) {
      console.error('Error al actualizar cancha:', error)
      toast.error('Error al actualizar la cancha. Por favor, intenta de nuevo.')
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
            onClick={() => navigate('/canchas')} 
            className="btn btn-outline-background"
          >
            Volver a Canchas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-background-900">Editar Cancha</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Información básica */}
            <div className="space-y-2">
              <label htmlFor="nombre" className="label">Nombre <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="input"
                placeholder="Ej: Cancha Central"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="tipo" className="label">Tipo <span className="text-red-500">*</span></label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="select"
                required
              >
                <option value="">Seleccionar tipo</option>
                {tiposCanchas.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="precioHora" className="label">Precio por Hora <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-background-500">
                  {config.moneda}
                </span>
                <input
                  type="number"
                  id="precioHora"
                  name="precioHora"
                  value={formData.precioHora}
                  onChange={handleChange}
                  className="input pl-8"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="estado" className="label">Estado</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="select"
              >
                <option value="disponible">Disponible</option>
                <option value="mantenimiento">En Mantenimiento</option>
                <option value="inactiva">Inactiva</option>
              </select>
            </div>

            {/* Horarios */}
            <div className="space-y-2">
              <label htmlFor="horaApertura" className="label">Hora de Apertura</label>
              <input
                type="time"
                id="horaApertura"
                name="horaApertura"
                value={formData.horaApertura}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="horaCierre" className="label">Hora de Cierre</label>
              <input
                type="time"
                id="horaCierre"
                name="horaCierre"
                value={formData.horaCierre}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          {/* Días disponibles */}
          <div className="space-y-2">
            <label className="label">Días Disponibles <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {diasSemana.map(dia => (
                <label key={dia.id} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.diasDisponibles.includes(dia.id)}
                    onChange={() => handleDiaChange(dia.id)}
                    className="form-checkbox h-5 w-5 text-primary rounded border-background-300"
                  />
                  <span className="ml-2 text-background-700">{dia.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label htmlFor="descripcion" className="label">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              className="input min-h-[100px]"
              placeholder="Características de la cancha, superficie, iluminación, etc."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/canchas')}
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
                'Actualizar Cancha'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditarCancha