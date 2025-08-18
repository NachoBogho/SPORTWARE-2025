import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { format, addHours, parseISO } from 'date-fns'
import { ArrowLeftIcon, CalendarIcon, ClockIcon, UserIcon, CheckIcon } from '@heroicons/react/24/outline'
import { useConfigStore } from '../stores/configStore'

interface Cliente {
  _id: string
  nombre?: string
  apellido?: string
  email?: string
  telefono?: string
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
  estado: 'confirmada' | 'pendiente'
  pagado: boolean
}

const NuevaReserva = () => {
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [clienteSearch, setClienteSearch] = useState('')
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([])
  const [showClienteDropdown, setShowClienteDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [clienteValido, setClienteValido] = useState(true)

  const safeLower = (v: any) => (v ?? '').toString().toLowerCase()

  // Cargar clientes y canchas al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientesRes, canchasRes] = await Promise.all([
          axios.get('/api/clientes'),
          axios.get('/api/canchas/disponibles')
        ])
        setClientes(clientesRes.data)
        setCanchas(canchasRes.data)
      } catch (err) {
        console.error('Error al cargar datos:', err)
        setError('Error al cargar los datos necesarios. Por favor, intenta de nuevo.')
      }
    }
    
    fetchData()
  }, [])
  
  // Filtrar clientes basado en la búsqueda
  useEffect(() => {
    const termino = safeLower(clienteSearch)
    if (termino === '') {
      setClientesFiltrados(clientes)
    } else {
      setClientesFiltrados(
        clientes.filter(cliente => {
          const nombre = safeLower(cliente.nombre)
          const apellido = safeLower(cliente.apellido)
          const email = safeLower(cliente.email)
          const telefono = (cliente.telefono ?? '')
          return (
            (nombre + ' ' + apellido).includes(termino) ||
            email.includes(termino) ||
            telefono.includes(clienteSearch) // comparar crudo para permitir números
          )
        })
      )
    }
  }, [clienteSearch, clientes])

  const handleClienteFocus = () => {
    if (clientes.length > 0) setShowClienteDropdown(true)
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowClienteDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClienteSelect = (cliente: Cliente) => {
    setFormData(prev => ({ ...prev, cliente: cliente._id }))
    setClienteSearch(`${cliente.nombre} ${cliente.apellido}`)
    setClienteValido(true)
    setShowClienteDropdown(false)
  }

  useEffect(() => {
    if (clienteSearch.trim() === '') {
      setFormData(prev => ({ ...prev, cliente: '' }))
      setClienteValido(false)
    }
  }, [clienteSearch])

  // Actualizar precio cuando cambia la cancha o las horas
  useEffect(() => {
    if (formData.cancha && formData.horaInicio && formData.horaFin) {
      const cancha = canchas.find(c => c._id === formData.cancha)
      if (cancha) {
        const horaInicio = new Date(`2000-01-01T${formData.horaInicio}`)
        const horaFin = new Date(`2000-01-01T${formData.horaFin}`)
        
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
      if (!formData.cancha || !formData.fecha || !formData.horaInicio || !formData.horaFin) {
        setDisponibilidad({ disponible: true, mensaje: '' })
        return
      }

      // Nueva validación: horas iguales => no consultar backend y marcar no disponible
      if (formData.horaInicio === formData.horaFin) {
        setDisponibilidad({
          disponible: false,
          mensaje: 'La hora de fin debe ser mayor a la hora de inicio'
        })
        return
      }

      try {
        const fechaInicio = `${formData.fecha}T${formData.horaInicio}`
        const fechaFinBase = `${formData.fecha}T${formData.horaFin}`

        let fechaFin = fechaFinBase
        if (formData.horaFin < formData.horaInicio) {
          const fechaFinDate = addHours(parseISO(fechaFinBase), 24)
          fechaFin = format(fechaFinDate, "yyyy-MM-dd'T'HH:mm")
        }

        const { data } = await axios.get('/api/reservas/disponibilidad', {
          params: {
            cancha: formData.cancha,
            fechaInicio,
            fechaFin
          }
        })
        setDisponibilidad({
          disponible: data.disponible,
          mensaje: data.disponible ? '' : 'La cancha no está disponible en ese horario'
        })
      } catch (err) {
        console.error('Error al verificar disponibilidad:', err)
        setDisponibilidad({ disponible: false, mensaje: 'Error al verificar disponibilidad' })
      }
    }

    verificarDisponibilidad()
  }, [formData.cancha, formData.fecha, formData.horaInicio, formData.horaFin])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.cliente) {
      setClienteValido(false)
      setShowClienteDropdown(true)
      return
    }

    if (!disponibilidad.disponible) {
      alert('La cancha no está disponible en el horario seleccionado. Por favor, elige otro horario.')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      let fechaInicio = `${formData.fecha}T${formData.horaInicio}`
      let fechaFin = `${formData.fecha}T${formData.horaFin}`
      
      if (formData.horaFin < formData.horaInicio) {
        const fechaFinDate = addHours(parseISO(fechaFin), 24)
        fechaFin = format(fechaFinDate, "yyyy-MM-dd'T'HH:mm")
      }
      
      await axios.post('/api/reservas', {
        cancha: formData.cancha,
        cliente: formData.cliente,
        fechaInicio,
        fechaFin,
        estado: formData.estado,
        precio: formData.precio,
        pagado: formData.pagado,
        observaciones: formData.observaciones
      })
      
      setSuccess(true)
      setTimeout(() => {
        navigate('/reservas')
      }, 2000)
    } catch (err: any) {
      console.error('Error al crear la reserva:', err)
      setError(err.response?.data?.mensaje || err.response?.data?.message || 'Error al crear la reserva. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <button 
          onClick={() => navigate('/reservas')} 
          className="mr-4 text-background-500 hover:text-background-700"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-semibold text-background-900">Nueva Reserva</h1>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-100 border border-green-200 rounded-md text-green-700 flex items-center">
          <CheckIcon className="h-5 w-5 mr-2" />
          Reserva creada correctamente. Redirigiendo...
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="card">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="cancha" className="label flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-background-500" />
              Cancha
            </label>
            <select
              id="cancha"
              name="cancha"
              value={formData.cancha}
              onChange={handleInputChange}
              className="select"
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
          
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label htmlFor="clienteSearch" className="label flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-background-500" />
              Cliente
            </label>
            <input
              type="text"
              id="clienteSearch"
              value={clienteSearch}
              onFocus={handleClienteFocus}
              onChange={(e) => setClienteSearch(e.target.value)}
              className={`input ${!clienteValido ? 'border-red-400 focus:border-red-500' : ''}`}
              placeholder="Escribe para buscar o selecciona"
              autoComplete="off"
              required
            />
            {showClienteDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-background-200 rounded-md shadow-lg max-h-60 overflow-auto">
                {clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map(cliente => (
                    <div
                      key={cliente._id}
                      className="px-4 py-2 hover:bg-background-100 cursor-pointer"
                      onClick={() => handleClienteSelect(cliente)}
                    >
                      <div className="font-medium">{cliente.nombre} {cliente.apellido}</div>
                      <div className="text-sm text-background-500">{cliente.email}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-sm text-background-500">
                    No se encontraron clientes
                  </div>
                )}
              </div>
            )}
            {!clienteValido && (
              <p className="text-xs text-red-500">Debes seleccionar un cliente</p>
            )}
            <input type="hidden" name="cliente" value={formData.cliente} />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="fecha" className="label flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2 text-background-500" />
              Fecha
            </label>
            <input
              type="date"
              id="fecha"
              name="fecha"
              value={formData.fecha}
              onChange={handleInputChange}
              className="input"
              min={format(new Date(), 'yyyy-MM-dd')}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="horaInicio" className="label flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-background-500" />
                Hora inicio
              </label>
              <input
                type="time"
                id="horaInicio"
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="horaFin" className="label flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-background-500" />
                Hora fin
              </label>
              <input
                type="time"
                id="horaFin"
                name="horaFin"
                value={formData.horaFin}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="estado" className="label">Estado</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                className="select"
              >
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
              </select>
            </div>
            
            <div className="space-y-2 flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="pagado"
                  checked={formData.pagado}
                  onChange={handleInputChange}
                  className="form-checkbox h-5 w-5 text-primary rounded"
                />
                <span>Pagado</span>
              </label>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="precio" className="label">Precio</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-background-500">{config.moneda}</span>
              </div>
              <input
                type="number"
                id="precio"
                name="precio"
                value={formData.precio}
                onChange={handleInputChange}
                className="input pl-8"
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="observaciones" className="label">Observaciones</label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleInputChange}
              className="input min-h-[100px]"
              placeholder="Añade cualquier información adicional sobre la reserva"
            ></textarea>
          </div>
        </div>
        
        {!disponibilidad.disponible && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md text-red-700">
            {disponibilidad.mensaje}
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/reservas')}
            className="btn btn-outline-primary mr-2"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !disponibilidad.disponible || !formData.cliente}
          >
            {loading ? 'Guardando...' : 'Crear Reserva'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NuevaReserva