import React from 'react';
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { format, parseISO, isToday, isSameWeek, isSameMonth, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FunnelIcon as FilterIcon } from '@heroicons/react/24/outline'
import { useConfigStore } from '../stores/configStore'
import DatePicker from '../components/DatePicker'

// Helpers fecha dd/mm/aaaa
function isoToDDMMYYYY(iso: string) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [y,m,d] = iso.split('-')
  return `${d}/${m}/${y}`
}
function ddmmyyyyToISO(raw: string): string | null {
  const cleaned = raw.replace(/[^0-9/]/g,'')
  const parts = cleaned.split('/')
  if (parts.length !== 3) return null
  const [dd,mm,yyyy] = parts
  if (dd.length!==2||mm.length!==2||yyyy.length!==4) return null
  const day = +dd, month = +mm, year = +yyyy
  if (year<1900||month<1||month>12||day<1||day>31) return null
  const date = new Date(year, month-1, day)
  if (date.getFullYear()!==year||date.getMonth()!==month-1||date.getDate()!==day) return null
  return date.toISOString().slice(0,10)
}

interface Reserva {
  _id: string
  cancha: { _id: string; nombre: string; tipo: string }
  cliente: { _id: string; nombre: string; apellido: string; email: string }
  fechaInicio: string
  fechaFin: string
  estado: 'confirmada' | 'pendiente' | 'cancelada'
  precio: number
  pagado: boolean
  observaciones?: string
  createdAt: string
  updatedAt: string
}

const Reservas = () => {
  const { config } = useConfigStore()
  const [allReservas, setAllReservas] = useState<Reserva[]>([])
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState<'todas'|'hoy'|'semana'|'mes'|'fecha'>('todas')
  const [fechaFiltroInput, setFechaFiltroInput] = useState('')
  const [fechaFiltroISO, setFechaFiltroISO] = useState<string>('')
  const [fechaFiltroError, setFechaFiltroError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [reservaSeleccionada, setReservaSeleccionada] = useState<Reserva | null>(null)

  // Fetch una sola vez
  useEffect(() => { fetchReservas() }, [])

  const fetchReservas = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get('/api/reservas')
      setAllReservas(response.data)
    } catch (err) {
      console.error('Error al cargar reservas:', err)
      setError('Error al cargar las reservas. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // Aplicar filtros cuando cambian dependencias
  useEffect(() => {
    applyFilters()
  }, [allReservas, filtro, fechaFiltroISO])

  function applyFilters() {
    let data = allReservas
    const now = new Date()
    if (filtro === 'hoy') {
      data = data.filter(r => isToday(parseISO(r.fechaInicio)))
    } else if (filtro === 'semana') {
      data = data.filter(r => isSameWeek(parseISO(r.fechaInicio), now, { weekStartsOn: 1 }))
    } else if (filtro === 'mes') {
      data = data.filter(r => isSameMonth(parseISO(r.fechaInicio), now))
    } else if (filtro === 'fecha' && fechaFiltroISO) {
      data = data.filter(r => {
        try {
          return isSameDay(parseISO(r.fechaInicio), parseISO(fechaFiltroISO))
        } catch { return false }
      })
    }
    setReservas(data)
  }

  function handleFechaFiltroChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/[^0-9/]/g,'')
    setFechaFiltroInput(val)
    const iso = ddmmyyyyToISO(val)
    if (!iso) {
      setFechaFiltroError(val ? 'Fecha inválida' : '')
      setFechaFiltroISO('')
      return
    }
    setFechaFiltroError('')
    setFechaFiltroISO(iso)
    setFiltro('fecha')
  }

  const handleCancelarReserva = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return
    try {
      await axios.patch(`/api/reservas/${id}/cancelar`)
      fetchReservas()
    } catch (err: any) {
      console.error('Error al cancelar la reserva:', err)
      setError(err.response?.data?.mensaje || 'Error al cancelar la reserva. Por favor, intenta de nuevo.')
    }
  }

  const handleMarcarPagado = async (id: string) => {
    try {
      await axios.patch(`/api/reservas/${id}/pagar`)
      fetchReservas()
    } catch (err: any) {
      console.error('Error al marcar como pagado:', err)
      setError(err.response?.data?.mensaje || 'Error al marcar como pagado. Por favor, intenta de nuevo.')
    }
  }

  const handleEliminarReserva = (id: string) => {
    const r = reservas.find(r => r._id === id)
    if (!r) return
    setReservaSeleccionada(r)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!reservaSeleccionada) return
    try {
      await axios.delete(`/api/reservas/${reservaSeleccionada._id}`)
      setShowDeleteModal(false)
      setReservaSeleccionada(null)
      fetchReservas()
    } catch (err) {
      console.error('Error al eliminar la reserva:', err)
      setError('Error al eliminar la reserva. Por favor, intenta de nuevo.')
    }
  }

  const closeDeleteModal = () => { setShowDeleteModal(false); setReservaSeleccionada(null) }

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'confirmada': return 'badge-success'
      case 'pendiente': return 'badge-warning'
      case 'cancelada': return 'badge-danger'
      default: return 'badge-info'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-background-900">Reservas</h1>
        <Link to="/reservas/nueva" className="btn btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-1" />
          Nueva Reserva
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-200 rounded-md text-red-700">{error}</div>
      )}

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">

          <div className="flex items-center">
            <FilterIcon className="h-5 w-5 text-background-500 mr-2" />
            <span className="text-background-700 font-medium">Filtrar por:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              { id: 'todas', label: 'Todas' },
              { id: 'hoy', label: 'Hoy' },
              { id: 'semana', label: 'Esta semana' },
              { id: 'mes', label: 'Este mes' }
            ] as const).map(btn => (
              <button
                key={btn.id}
                onClick={() => setFiltro(btn.id)}
                className={`btn ${filtro === btn.id ? 'btn-primary' : 'btn-secondary'}`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Calendario al extremo derecho */}
          <div className="flex items-center gap-2 lg:ml-auto mr-4 flex-shrink-0">
            <DatePicker
              value={fechaFiltroISO}
              onChange={(iso) => {
                setFechaFiltroISO(iso)
                setFechaFiltroInput(isoToDDMMYYYY(iso))
                if (!iso) {
                  setFiltro('todas')
                } else {
                  setFiltro('fecha')
                }
              }}
              onClear={() => { setFechaFiltroInput(''); setFechaFiltroISO(''); setFiltro('todas') }}
            />
          </div>

          {fechaFiltroError && <p className="w-full text-xs text-red-500">{fechaFiltroError}</p>}
        </div>
      </div>

      {/* Tabla de reservas */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Cliente</th>
                <th className="table-header-cell">Cancha</th>
                <th className="table-header-cell">Fecha</th>
                <th className="table-header-cell">Horario</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell">Precio</th>
                <th className="table-header-cell">Pagado</th>
                <th className="table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-4 text-center"><div className="flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div></div></td></tr>
              ) : reservas.length > 0 ? (
                reservas.map(reserva => (
                  <tr key={reserva._id} className="table-row">
                    <td className="table-cell">
                      <Link to={`/clientes/${reserva.cliente._id}`} className="text-primary hover:underline">
                        {reserva.cliente.nombre} {reserva.cliente.apellido}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <Link to={`/canchas/${reserva.cancha._id}`} className="text-primary hover:underline">
                        {reserva.cancha.nombre}
                      </Link>
                      <span className="text-xs text-background-500 block">{reserva.cancha.tipo}</span>
                    </td>
                    <td className="table-cell">
                      {format(parseISO(reserva.fechaInicio), 'EEEE dd/MM/yyyy', { locale: es })}
                    </td>
                    <td className="table-cell">
                      {format(parseISO(reserva.fechaInicio), 'HH:mm')} - {format(parseISO(reserva.fechaFin), 'HH:mm')}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getEstadoClass(reserva.estado)}`}>{reserva.estado}</span>
                    </td>
                    <td className="table-cell">{config.moneda} {reserva.precio.toFixed(2)}</td>
                    <td className="table-cell">
                      {reserva.pagado ? (
                        <span className="text-green-600 flex items-center"><CheckIcon className="h-5 w-5 mr-1" />Sí</span>
                      ) : (
                        <button onClick={() => handleMarcarPagado(reserva._id)} className="text-amber-600 hover:text-amber-800 flex items-center" disabled={reserva.estado === 'cancelada'}>
                          <XMarkIcon className="h-5 w-5 mr-1" />No
                        </button>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <Link to={`/reservas/editar/${reserva._id}`} className="btn-icon btn-icon-primary"><PencilIcon className="h-4 w-4" /></Link>
                        {reserva.estado !== 'cancelada' && (
                          <button onClick={() => handleCancelarReserva(reserva._id)} className="btn-icon btn-icon-warning" title="Cancelar reserva">
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => handleEliminarReserva(reserva._id)} className="btn-icon btn-icon-danger" title="Eliminar reserva">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={8} className="px-6 py-4 text-center text-background-500">No hay reservas que coincidan con los filtros seleccionados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal eliminar reserva */}
      {showDeleteModal && reservaSeleccionada && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeDeleteModal}></div>
          <div className="relative z-50 w-full max-w-md mx-4 rounded-lg shadow-lg bg-white border border-background-200">
            <div className="px-6 py-5">
              <h3 className="text-lg font-semibold text-background-900 mb-2">Eliminar reserva</h3>
              <p className="text-background-600 text-sm leading-relaxed text-gray-900">
                ¿Seguro que deseas eliminar la reserva de <span className="font-medium">{reservaSeleccionada.cliente.nombre} {reservaSeleccionada.cliente.apellido}</span> para la cancha <span className="font-medium">{reservaSeleccionada.cancha.nombre}</span> el {format(parseISO(reservaSeleccionada.fechaInicio), 'dd/MM/yyyy HH:mm', { locale: es })}? Esta acción es permanente.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={closeDeleteModal} className="btn btn-secondary text-gray-900">Cancelar</button>
                <button onClick={confirmDelete} className="btn btn-danger text-white">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reservas