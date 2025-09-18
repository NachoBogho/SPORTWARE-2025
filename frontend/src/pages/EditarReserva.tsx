import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../api'
import { format, addHours, parseISO, isAfter, isBefore } from 'date-fns'
import { ArrowLeftIcon, CalendarIcon, ClockIcon, UserIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useConfigStore } from '../stores/configStore'
import toast from 'react-hot-toast'

interface Cliente {
  _id: string
  nombre: string
  apellido: string
  email: string
}

interface Cancha {
  _id: string
  nombre: string
  tipo: string
  precioHora: number
  precioPorHora?: number // Para compatibilidad
  estado: string
}

interface FormData {
  cancha: string
  cliente: string
  fecha: string
  horaInicio: string
  horaFin: string
  observaciones: string
  precio: number
  estado: 'confirmada' | 'pendiente' | 'cancelada'
  pagado: boolean
}

interface Reserva {
  _id: string
  cancha: {
    _id: string
    nombre: string
    precioHora: number
    precioPorHora?: number // Para compatibilidad
  }
  cliente: {
    _id: string
    nombre: string
    apellido: string
    email: string
  }
  fechaInicio: string
  fechaFin: string
  estado: 'confirmada' | 'pendiente' | 'cancelada'
  precio: number
  pagado: boolean
  observaciones: string
}

const EditarReserva = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { config } = useConfigStore()
  
  const [formData, setFormData] = useState<FormData>({
    cancha: '',
    cliente: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    horaInicio: '',
    horaFin: '',
    observaciones: '',
    precio: 0,
    estado: 'pendiente',
    pagado: false
  })
  
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [canchas, setCanchas] = useState<Cancha[]>([])
  const [disponibilidad, setDisponibilidad] = useState<{disponible: boolean, mensaje: string}>({disponible: true, mensaje: ''})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [clienteSearch, setClienteSearch] = useState('')
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const [reservaOriginal, setReservaOriginal] = useState<Reserva | null>(null)
  
  // Cargar datos de la reserva, clientes y canchas al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reservaRes, clientesRes, canchasRes] = await Promise.all([
          axios.get(`${API_BASE}/api/reservas/${id}`),
          axios.get(`${API_BASE}/api/clientes`),
          axios.get(`${API_BASE}/api/canchas`)
        ])
        
        const reserva: Reserva = reservaRes.data
        setReservaOriginal(reserva)
        
        // Extraer fecha y horas de fechaInicio y fechaFin
        const fechaInicio = new Date(reserva.fechaInicio)
        const fechaFin = new Date(reserva.fechaFin)
        
        setFormData({
          cancha: reserva.cancha._id,
          cliente: reserva.cliente._id,
          fecha: format(fechaInicio, 'yyyy-MM-dd'),
          horaInicio: format(fechaInicio, 'HH:mm'),
          horaFin: format(fechaFin, 'HH:mm'),
          observaciones: reserva.observaciones || '',
          precio: reserva.precio,
          estado: reserva.estado,
          pagado: reserva.pagado
        })
        
        setClienteSearch(`${reserva.cliente.nombre} ${reserva.cliente.apellido}`)
        setClientes(clientesRes.data)
        setCanchas(canchasRes.data)
      } catch (err) {
        console.error('Error al cargar datos:', err)
        setError('Error al cargar los datos de la reserva. Por favor, intenta de nuevo.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])
  
  // Filtrar clientes basado en la búsqueda
  useEffect(() => {
    if (clienteSearch.length > 0) {
      const filtered = clientes.filter(cliente => 
        `${cliente.nombre} ${cliente.apellido}`.toLowerCase().includes(clienteSearch.toLowerCase()) ||
        cliente.email.toLowerCase().includes(clienteSearch.toLowerCase())
      )
      setClientesFiltrados(filtered)
      setShowClienteDropdown(true)
    } else {
      setClientesFiltrados([])
      setShowClienteDropdown(false)
    }
  }, [clienteSearch, clientes])
  
  // Actualizar precio cuando cambia la cancha o las horas
  useEffect(() => {
    if (formData.cancha && formData.horaInicio && formData.horaFin) {
      const cancha = canchas.find(c => c._id === formData.cancha)
      if (cancha) {
        const horaInicio = new Date(`2000-01-01T${formData.horaInicio}`)
        const horaFin = new Date(`2000-01-01T${formData.horaFin}`)
        
        // Si horaFin es anterior a horaInicio, asumimos que es del día siguiente
        let horas = (horaFin.getTime() - horaInicio.getTime()) / (1000 * 60 * 60)
        if (horas <= 0) {
          horas += 24
        }
        
        const precio = (cancha.precioHora || cancha.precioPorHora || 0) * horas
        setFormData(prev => ({ ...prev, precio }))
      }
    }
  }, [formData.cancha, formData.horaInicio, formData.horaFin, canchas])
  
  // Verificar disponibilidad cuando cambian los datos relevantes
  useEffect(() => {
    const verificarDisponibilidad = async () => {
      if (formData.cancha && formData.fecha && formData.horaInicio && formData.horaFin && reservaOriginal) {
        try {
          const fechaInicio = `${formData.fecha}T${formData.horaInicio}`
          const fechaFin = `${formData.fecha}T${formData.horaFin}`
          
          // Si la hora de fin es anterior a la hora de inicio, asumimos que es del día siguiente
          let fechaFinAjustada = fechaFin
          if (formData.horaFin < formData.horaInicio) {
            const fechaFinDate = addHours(parseISO(fechaFin), 24)
            fechaFinAjustada = format(fechaFinDate, "yyyy-MM-dd'T'HH:mm")
          }
          
          const response = await axios.get(`/api/reservas/disponibilidad`, {
            params: {
              cancha: formData.cancha,
              fechaInicio,
              fechaFin: fechaFinAjustada,
              reservaId: id // Excluir la reserva actual de la verificación
            }
          })
          
          setDisponibilidad(response.data)
        } catch (err) {
          console.error('Error al verificar disponibilidad:', err)
          setDisponibilidad({disponible: false, mensaje: 'Error al verificar disponibilidad'})
        }
      } else {
        setDisponibilidad({disponible: true, mensaje: ''})
      }
    }
    
    verificarDisponibilidad()
  }, [formData.cancha, formData.fecha, formData.horaInicio, formData.horaFin, id, reservaOriginal])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }
  
  const handleClienteSelect = (cliente: Cliente) => {
    setFormData(prev => ({ ...prev, cliente: cliente._id }))
    setClienteSearch(`${cliente.nombre} ${cliente.apellido}`)
    setShowClienteDropdown(false)
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!disponibilidad.disponible) {
      toast.error('La cancha no está disponible en el horario seleccionado. Por favor, elige otro horario.')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // Preparar datos para enviar
      let fechaInicio = `${formData.fecha}T${formData.horaInicio}`
      let fechaFin = `${formData.fecha}T${formData.horaFin}`
      
      // Si la hora de fin es anterior a la hora de inicio, asumimos que es del día siguiente
      if (formData.horaFin < formData.horaInicio) {
        const fechaFinDate = addHours(parseISO(fechaFin), 24)
        fechaFin = format(fechaFinDate, "yyyy-MM-dd'T'HH:mm")
      }
      
      await axios.put(`/api/reservas/${id}`, {
        cancha: formData.cancha,
        cliente: formData.cliente,
        fechaInicio,
        fechaFin,
        estado: formData.estado,
        precio: formData.precio,
        pagado: formData.pagado,
        observaciones: formData.observaciones
      })
      
      toast.success('Reserva actualizada correctamente')
      navigate(`/reservas/${id}`)
    } catch (err) {
      console.error('Error al actualizar la reserva:', err)
      setError('Error al actualizar la reserva. Por favor, intenta de nuevo.')
      toast.error('Error al actualizar la reserva')
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => navigate(`/reservas/${id}`)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Editar Reserva</h1>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Selección de cancha */}
          <div className="space-y-2">
            <label htmlFor="cancha" className="block text-sm font-medium text-gray-700">Cancha</label>
            <select
              id="cancha"
              name="cancha"
              value={formData.cancha}
              onChange={handleInputChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
              required
            >
              <option value="">Selecciona una cancha</option>
              {canchas.map(cancha => (
                <option key={cancha._id} value={cancha._id}>
                  {cancha.nombre} - {cancha.tipo} ({config.moneda} {(cancha.precioHora || cancha.precioPorHora || 0)}/hora)
                </option>
              ))}
            </select>
          </div>
          
          {/* Selección de cliente */}
          <div className="space-y-2 relative">
            <label htmlFor="clienteSearch" className="block text-sm font-medium text-gray-700">Cliente</label>
            <div className="relative">
              <input
                type="text"
                id="clienteSearch"
                value={clienteSearch}
                onChange={(e) => setClienteSearch(e.target.value)}
                placeholder="Buscar cliente por nombre o email"
                className="mt-1 block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
                required
              />
              <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              
              {showClienteDropdown && clientesFiltrados.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto">
                  {clientesFiltrados.map(cliente => (
                    <div 
                      key={cliente._id} 
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleClienteSelect(cliente)}
                    >
                      <div className="font-medium">{cliente.nombre} {cliente.apellido}</div>
                      <div className="text-sm text-gray-500">{cliente.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Fecha */}
          <div className="space-y-2">
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700">Fecha</label>
            <div className="relative">
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
                required
              />
              <CalendarIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          
          {/* Hora de inicio */}
          <div className="space-y-2">
            <label htmlFor="horaInicio" className="block text-sm font-medium text-gray-700">Hora de inicio</label>
            <div className="relative">
              <input
                type="time"
                id="horaInicio"
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
                required
              />
              <ClockIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          
          {/* Hora de fin */}
          <div className="space-y-2">
            <label htmlFor="horaFin" className="block text-sm font-medium text-gray-700">Hora de fin</label>
            <div className="relative">
              <input
                type="time"
                id="horaFin"
                name="horaFin"
                value={formData.horaFin}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
                required
              />
              <ClockIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>
          
          {/* Precio */}
          <div className="space-y-2">
            <label htmlFor="precio" className="block text-sm font-medium text-gray-700">Precio</label>
            <div className="relative">
              <input
                type="number"
                id="precio"
                name="precio"
                value={formData.precio}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-10 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
                required
                min="0"
                step="0.01"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{config.moneda}</span>
            </div>
          </div>
          
          {/* Estado */}
          <div className="space-y-2">
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
              required
            >
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          
          {/* Pagado */}
          <div className="flex items-center space-x-2 h-full pt-8">
            <input
              type="checkbox"
              id="pagado"
              name="pagado"
              checked={formData.pagado}
              onChange={handleInputChange}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="pagado" className="text-sm font-medium text-gray-700">Pagado</label>
          </div>
        </div>
        
        {/* Observaciones */}
        <div className="space-y-2">
          <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700">Observaciones</label>
          <textarea
            id="observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleInputChange}
            rows={3}
            className="mt-1 block w-full px-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary rounded-md"
          ></textarea>
        </div>
        
        {/* Mensaje de disponibilidad */}
        {!disponibilidad.disponible && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{disponibilidad.mensaje}</span>
          </div>
        )}
        
        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(`/reservas/${id}`)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !disponibilidad.disponible}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <CheckIcon className="h-4 w-4" />
                <span>Guardar cambios</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditarReserva