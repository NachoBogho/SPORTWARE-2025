import React from 'react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useConfigStore } from '../stores/configStore'

interface Cancha {
  _id: string
  nombre: string
  tipo: string
  precioHora: number
  precioPorHora?: number // Para compatibilidad con código existente
  descripcion?: string
  estado: 'disponible' | 'mantenimiento' | 'inactiva'
  horarioApertura: string
  horarioCierre: string
  // Puede venir como objeto de booleans o como array desde el backend
  diasDisponibles: Record<string, boolean> | Array<string | number>
  createdAt: string
  updatedAt: string
}

const Canchas = () => {
  const { config } = useConfigStore()
  const [canchas, setCanchas] = useState<Cancha[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  useEffect(() => {
    fetchCanchas()
  }, [])

  const fetchCanchas = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get('/api/canchas')
      setCanchas(response.data)
    } catch (err) {
      console.error('Error al cargar canchas:', err)
      setError('Error al cargar las canchas. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCambiarEstado = async (id: string, nuevoEstado: 'disponible' | 'mantenimiento' | 'inactiva') => {
    try {
      await axios.put(`/api/canchas/${id}/estado`, { estado: nuevoEstado })
      fetchCanchas()
    } catch (err) {
      console.error('Error al cambiar el estado de la cancha:', err)
      setError('Error al cambiar el estado de la cancha. Por favor, intenta de nuevo.')
    }
  }

  const handleEliminarCancha = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta cancha? Esta acción no se puede deshacer.')) return
    
    try {
      await axios.delete(`/api/canchas/${id}`)
      fetchCanchas()
    } catch (err: any) {
      console.error('Error al eliminar la cancha:', err)
      if (err.response?.status === 409) {
        alert('No se puede eliminar la cancha porque tiene reservas asociadas.')
      } else {
        setError('Error al eliminar la cancha. Por favor, intenta de nuevo.')
      }
    }
  }

  const getEstadoClass = (estado: string) => {
    switch (estado) {
      case 'disponible': return 'badge-success'
      case 'mantenimiento': return 'badge-warning'
      case 'inactiva': return 'badge-danger'
      default: return 'badge-info'
    }
  }

  const filtrarCanchas = () => {
    return canchas.filter(cancha => {
      const cumpleTipo = filtroTipo === 'todos' || cancha.tipo === filtroTipo
      const cumpleEstado = filtroEstado === 'todos' || cancha.estado === filtroEstado
      return cumpleTipo && cumpleEstado
    })
  }

  // Obtener tipos únicos de canchas para el filtro
  const tiposCanchas = ['todos', ...new Set(canchas.map(cancha => cancha.tipo))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-background-900">Canchas</h1>
        <Link to="/canchas/nueva" className="btn btn-primary flex items-center justify-between">
          <PlusIcon className="h-5 w-5 mr-1" />
          Nueva Cancha
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="filtroTipo" className="label block mb-1">Tipo de cancha</label>
            <select
              id="filtroTipo"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="select"
            >
              {tiposCanchas.map(tipo => (
                <option key={tipo} value={tipo}>
                  {tipo === 'todos' ? 'Todos los tipos' : tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filtroEstado" className="label block mb-1">Estado</label>
            <select
              id="filtroEstado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="select"
            >
              <option value="todos">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="mantenimiento">En mantenimiento</option>
              <option value="inactiva">Inactiva</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de canchas */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filtrarCanchas().length > 0 ? (
          filtrarCanchas().map((cancha) => (
            <div key={cancha._id} className="card overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-medium text-background-900">{cancha.nombre}</h2>
                  <p className="text-sm text-background-500">{cancha.tipo}</p>
                </div>
                <span className={`badge ${getEstadoClass(cancha.estado)}`}>
                  {cancha.estado}
                </span>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-background-500">Precio por hora:</span>
                  <span className="font-medium">{config.moneda} {(cancha.precioHora || cancha.precioPorHora || 0).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-background-500">Horario:</span>
                  <span>{cancha.horarioApertura} - {cancha.horarioCierre}</span>
                </div>
                
                <div>
                  <span className="text-background-500 block mb-1">Días disponibles:</span>
                  {(() => {
                    const idxOrder = [1, 2, 3, 4, 5, 6, 0] 
                    const idxToLabel: Record<number, string> = { 0: 'D', 1: 'L', 2: 'M', 3: 'M', 4: 'J', 5: 'V', 6: 'S' }
                    const dayToIdx: Record<string, number> = {
                      domingo: 0,
                      lunes: 1,
                      martes: 2,
                      miercoles: 3,
                      miércoles: 3,
                      jueves: 4,
                      viernes: 5,
                      sabado: 6,
                      sábado: 6,
                    }

                    const active = new Set<number>()

                    if (Array.isArray(cancha.diasDisponibles)) {
                      for (const v of cancha.diasDisponibles as Array<string | number>) {
                        if (typeof v === 'number') {
                          if (v >= 0 && v <= 6) active.add(v)
                        } else if (typeof v === 'string') {
                          const lower = v.toLowerCase()
                          // Si llega como "0-6" o nombre del día
                          const asNum = Number(lower)
                          if (!Number.isNaN(asNum)) {
                            if (asNum >= 0 && asNum <= 6) active.add(asNum)
                          } else if (dayToIdx[lower] !== undefined) {
                            active.add(dayToIdx[lower])
                          }
                        }
                      }
                    } else if (cancha.diasDisponibles && typeof cancha.diasDisponibles === 'object') {
                      const obj = cancha.diasDisponibles as Record<string, boolean>
                      Object.entries(obj).forEach(([k, val]) => {
                        if (val) {
                          const idx = dayToIdx[k.toLowerCase()]
                          if (idx !== undefined) active.add(idx)
                        }
                      })
                    }

                    return (
                      <div className="flex flex-wrap gap-1">
                        {idxOrder.map((i) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-1 rounded-full ${active.has(i) ? 'bg-green-100 text-green-800' : 'bg-background-100 text-background-400'}`}
                          >
                            {idxToLabel[i]}
                          </span>
                        ))}
                      </div>
                    )
                  })()}
                </div>
                
                {cancha.descripcion && (
                  <p className="text-sm text-background-600 mt-2">{cancha.descripcion}</p>
                )}
              </div>
              
              <div className="mt-6 flex justify-between items-center">
                <div className="flex space-x-2">
                  {cancha.estado !== 'disponible' && (
                    <button 
                      onClick={() => handleCambiarEstado(cancha._id, 'disponible')}
                      className="btn-icon btn-icon-success"
                      title="Marcar como disponible"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                  
                  {cancha.estado !== 'mantenimiento' && (
                    <button 
                      onClick={() => handleCambiarEstado(cancha._id, 'mantenimiento')}
                      className="btn-icon btn-icon-warning"
                      title="Marcar en mantenimiento"
                    >
                      <span className="text-xs font-bold">M</span>
                    </button>
                  )}
                  
                  {cancha.estado !== 'inactiva' && (
                    <button 
                      onClick={() => handleCambiarEstado(cancha._id, 'inactiva')}
                      className="btn-icon btn-icon-danger"
                      title="Marcar como inactiva"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Link to={`/canchas/editar/${cancha._id}`} className="btn-icon btn-icon-primary">
                    <PencilIcon className="h-5 w-5" />
                  </Link>
                  <button 
                    onClick={() => handleEliminarCancha(cancha._id)}
                    className="btn-icon btn-icon-danger"
                    title="Eliminar cancha"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-background-500">
            No se encontraron canchas que coincidan con los filtros seleccionados
          </div>
        )}
      </div>
    </div>
  )
}

export default Canchas