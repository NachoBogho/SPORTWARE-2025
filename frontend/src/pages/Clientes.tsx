import React from 'react'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../api'
import { PlusIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

interface Cliente {
  _id: string
  nombre: string
  apellido: string
  email?: string        // ahora opcional
  telefono?: string     // ahora opcional
  direccion?: string
  observaciones?: string
  createdAt: string
  updatedAt: string
}

const Clientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])

  useEffect(() => {
    fetchClientes()
  }, [])

  useEffect(() => {
    const lower = searchTerm.toLowerCase()
    if (lower) {
      const filtered = clientes.filter(cliente => {
        const nombreApellido = `${cliente.nombre || ''} ${cliente.apellido || ''}`.toLowerCase()
        const email = (cliente.email || '').toLowerCase()
        const telefono = cliente.telefono || ''
        return (
          nombreApellido.includes(lower) ||
          email.includes(lower) ||
          telefono.includes(searchTerm)
        )
      })
      setFilteredClientes(filtered)
    } else {
      setFilteredClientes(clientes)
    }
  }, [searchTerm, clientes])

  const fetchClientes = async () => {
    setLoading(true)
    setError('')
    try {
  const response = await axios.get(`${API_BASE}/api/clientes`)
      setClientes(response.data)
      setFilteredClientes(response.data)
    } catch (err) {
      console.error('Error al cargar clientes:', err)
      setError('Error al cargar los clientes. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleEliminarCliente = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.')) return
    
    try {
  await axios.delete(`${API_BASE}/api/clientes/${id}`)
      fetchClientes()
    } catch (err: any) {
      console.error('Error al eliminar el cliente:', err)
      if (err.response?.status === 409) {
        alert('No se puede eliminar el cliente porque tiene reservas asociadas.')
      } else {
        setError('Error al eliminar el cliente. Por favor, intenta de nuevo.')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-background-900">Clientes</h1>
        <Link to="/clientes/nuevo" className="btn btn-primary flex items-center justify-between">
          <PlusIcon className="h-5 w-5 mr-1" />
          Nuevo Cliente
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Buscador */}
      <div className="card">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-background-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
            placeholder="Buscar por nombre, email o teléfono"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Nombre</th>
                <th className="table-header-cell">Contacto</th>
                <th className="table-header-cell">Dirección</th>
                <th className="table-header-cell">Acciones</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredClientes.length > 0 ? (
                filteredClientes.map((cliente) => (
                  <tr key={cliente._id} className="table-row">
                    <td className="table-cell">
                      <Link to={`/clientes/${cliente._id}`} className="font-medium text-primary hover:underline">
                        {cliente.nombre} {cliente.apellido}
                      </Link>
                    </td>
                    <td className="table-cell">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 text-background-500 mr-1" />
                          {cliente.email ? (
                            <a href={`mailto:${cliente.email}`} className="text-background-700 hover:text-primary">
                              {cliente.email}
                            </a>
                          ) : (
                            <span className="text-background-400">Sin email</span>
                          )}
                        </div>
                        {cliente.telefono ? (
                          <div className="flex items-center mt-1">
                            <PhoneIcon className="h-4 w-4 text-background-500 mr-1" />
                            <a href={`tel:${cliente.telefono}`} className="text-background-700 hover:text-primary">
                              {cliente.telefono}
                            </a>
                          </div>
                        ) : (
                          <div className="flex items-center mt-1 text-background-400">
                            <PhoneIcon className="h-4 w-4 text-background-500 mr-1" />
                            Sin teléfono
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      {cliente.direccion || <span className="text-background-400">No disponible</span>}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <Link to={`/clientes/editar/${cliente._id}`} className="btn-icon btn-icon-primary">
                          <PencilIcon className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => handleEliminarCliente(cliente._id)}
                          className="btn-icon btn-icon-danger"
                          title="Eliminar cliente"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-background-500">
                    {searchTerm ? 'No se encontraron clientes que coincidan con la búsqueda' : 'No hay clientes registrados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Clientes