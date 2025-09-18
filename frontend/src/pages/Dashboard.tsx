import React from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { useConfigStore } from '../stores/configStore'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface DashboardData {
  reservasSemana: number
  ingresosSemana: number
  ultimasReservas: any[]
  reservasPorDia: Record<string, number>
  usoCanchasSemana: Record<string, number>
  ingresosPorDia?: Record<string, number> // nuevo: ingresos diarios si backend lo envía
}

const Dashboard = () => {
  const { config } = useConfigStore()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [clientesActivosHoy, setClientesActivosHoy] = useState(0)
  const [canchasDisponibles, setCanchasDisponibles] = useState(0)

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
  const response = await axios.get(`${API_BASE}/api/reportes/dashboard`)
        if (isMounted) {
          setData(response.data)
        }
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDashboardData()
    
    return () => {
      isMounted = false;
    }
  }, [])

  useEffect(() => {
    const fetchClientesActivos = async () => {
      try {
        const hoy = format(new Date(), 'yyyy-MM-dd')
        const { data: dataHoy } = await axios.get(`/api/reservas/fecha/${hoy}`)
        // Soporta formato nuevo { reservas, clientesActivos } o arreglo antiguo
        if (Array.isArray(dataHoy)) {
          const setClientes = new Set(
            (dataHoy || [])
              .filter((r: any) => r?.estado !== 'cancelada' && r?.cliente?._id)
              .map((r: any) => r.cliente._id)
          )
          setClientesActivosHoy(setClientes.size)
        } else {
          if (typeof dataHoy?.clientesActivos === 'number') {
            setClientesActivosHoy(dataHoy.clientesActivos)
          } else if (Array.isArray(dataHoy?.reservas)) {
            const setClientes = new Set(
              dataHoy.reservas
                .filter((r: any) => r?.estado !== 'cancelada' && r?.cliente?._id)
                .map((r: any) => r.cliente._id)
            )
            setClientesActivosHoy(setClientes.size)
          }
        }
      } catch (e) {
        console.error('Error cargando clientes activos hoy:', e)
      }
    }
    fetchClientesActivos()
  }, [])

  useEffect(() => {
    const fetchCanchasDisponibles = async () => {
      try {
        // Intentar endpoint específico
        let disponibles: any[] = []
        try {
          const { data } = await axios.get(`${API_BASE}/api/canchas/disponibles`)
          if (Array.isArray(data)) disponibles = data
        } catch {
          // Fallback: traer todas y filtrar por estado === 'disponible'
          const { data } = await axios.get(`${API_BASE}/api/canchas`)
          if (Array.isArray(data)) {
            disponibles = data.filter(c => c.estado === 'disponible')
          }
        }
        setCanchasDisponibles(disponibles.length)
      } catch (e) {
        console.error('Error cargando canchas disponibles:', e)
      }
    }
    fetchCanchasDisponibles()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Calcular métricas diarias reales
  const today = new Date()
  const todayKey = today.toISOString().split('T')[0]

  const parseDateKey = (k: string): Date | null => {
    // Intentar parse directo (ISO o similar)
    const d1 = new Date(k)
    if (!isNaN(d1.getTime())) return d1
    // Formato dd/MM/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(k)) {
      const [dd, mm, yyyy] = k.split('/').map(Number)
      return new Date(yyyy, mm - 1, dd)
    }
    return null
  }
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  const reservasHoy = (() => {
    if (!data?.reservasPorDia) return 0
    // 1. clave exacta yyyy-MM-dd
    if (data.reservasPorDia[todayKey] != null) return data.reservasPorDia[todayKey]
    // 2. buscar coincidencia por componentes de fecha
    for (const [k, v] of Object.entries(data.reservasPorDia)) {
      const kd = parseDateKey(k)
      if (kd && sameDay(kd, today)) return v
    }
    // 3. fallback: contar reservas del día en ultimasReservas
    return (data.ultimasReservas || []).filter(r => {
      try {
        if (r.estado === 'cancelada') return false
        const d = new Date(r.fechaInicio)
        return sameDay(d, today)
      } catch {
        return false
      }
    }).length
  })()

  const ingresosHoy = (() => {
    if (!data) return 0
    if (data.ingresosPorDia && data.ingresosPorDia[todayKey] != null) {
      return data.ingresosPorDia[todayKey]
    }
    // Fallback: sumar reservas del día dentro de ultimasReservas (puede ser incompleto si el backend limita este arreglo)
    return (data.ultimasReservas || []).reduce((acc, r) => {
      try {
        if (r.estado === 'cancelada') return acc
        const d = new Date(r.fechaInicio)
        if (sameDay(d, today) && typeof r.precio === 'number') return acc + r.precio
      } catch { /* ignore */ }
      return acc
    }, 0)
  })()

  // Preparar datos para los gráficos
  const reservasPorDiaData = (() => {
    if (!data) return { labels: [], datasets: [] }
    const today = new Date()
    const month = today.getMonth()
    const year = today.getFullYear()

    // Generar offsets válidos dentro del mismo mes
    const rawOffsetsPrev = [-3, -2, -1]
    const rawOffsetsNext = [1, 2, 3]

    const validPrevDates: Date[] = []
    for (const o of rawOffsetsPrev) {
      const d = new Date(year, month, today.getDate() + o)
      if (d.getMonth() === month) validPrevDates.push(d)
    }

    const validNextDates: Date[] = []
    for (const o of rawOffsetsNext) {
      const d = new Date(year, month, today.getDate() + o)
      if (d.getMonth() === month) validNextDates.push(d)
    }

    const targetDates = [
      ...validPrevDates,
      new Date(year, month, today.getDate()), // día actual
      ...validNextDates
    ].sort((a, b) => a.getTime() - b.getTime())

    const toKey = (d: Date) => d.toISOString().split('T')[0]

    const labels = targetDates.map(d => format(d, 'EEEE dd/MM', { locale: es }))
    const datasetValues = targetDates.map(d => {
      const keyISO = toKey(d)
      if (data.reservasPorDia[keyISO] != null) return data.reservasPorDia[keyISO]
      const matchKey = Object.keys(data.reservasPorDia).find(k => {
        const kd = new Date(k)
        return kd.getFullYear() === d.getFullYear() &&
               kd.getMonth() === d.getMonth() &&
               kd.getDate() === d.getDate()
      })
      return matchKey ? data.reservasPorDia[matchKey] : 0
    })

    return {
      labels,
      datasets: [
        {
          label: 'Reservas',
          data: datasetValues,
          backgroundColor: '#0D9F6F'
        }
      ]
    }
  })()

  const usoCanchasData = {
    labels: data ? Object.keys(data?.usoCanchasSemana || {}) : [],
    datasets: [
      {
        data: data ? Object.values(data?.usoCanchasSemana || {}) : [],
        backgroundColor: [
          '#0D9F6F', // primary
          '#3B82F6', // blue
          '#F59E0B', // amber
          '#EF4444', // red
          '#8B5CF6', // purple
          '#EC4899', // pink
        ],
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-background-900">Dashboard</h1>
        <div className="text-sm text-background-500">
          {format(new Date(), 'EEEE dd \'de\' MMMM, yyyy', { locale: es })}
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card bg-primary bg-opacity-10 border border-primary border-opacity-20">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-primary bg-opacity-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-background-500">Reservas hoy</h2>
              <p className="mt-1 text-2xl font-semibold text-background-900">{reservasHoy}</p>
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-background-500">Ingresos hoy</h2>
              <p className="mt-1 text-2xl font-semibold text-background-900 text-gray-600">{config.moneda} {ingresosHoy.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-background-500">Clientes activos</h2>
              <p className="mt-1 text-2xl font-semibold text-background-900 text-gray-600">{clientesActivosHoy}</p>
            </div>
          </div>
        </div>

        <div className="card bg-amber-50 border border-amber-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-md bg-amber-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-sm font-medium text-background-500">Canchas disponibles</h2>
              <p className="mt-1 text-2xl font-semibold text-background-900 text-gray-600">{canchasDisponibles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos y tablas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfico de reservas por día */}
        <div className="card">
          <h2 className="text-lg font-medium text-background-900 mb-4">Reservas por día</h2>
          <div className="h-64">
            <Bar 
              data={reservasPorDiaData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0,
                    },
                  },
                },
              }} 
            />
          </div>
        </div>

        {/* Gráfico de uso de canchas */}
        <div className="card">
          <h2 className="text-lg font-medium text-background-900 mb-4">Uso de canchas por tipo</h2>
          <div className="h-64 flex items-center justify-center">
            {data && Object.keys(data.usoCanchasSemana || {}).length > 0 ? (
              <Doughnut 
                data={usoCanchasData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                  },
                }} 
              />
            ) : (
              <p className="text-background-500">No hay datos disponibles</p>
            )}
          </div>
        </div>
      </div>

      {/* Últimas reservas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-background-900">Últimas reservas</h2>
          <Link to="/reservas" className="text-sm text-primary hover:text-primary-600">
            Ver todas
          </Link>
        </div>

        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Cliente</th>
                <th className="table-header-cell">Cancha</th>
                <th className="table-header-cell">Fecha</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell">Precio</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {data?.ultimasReservas && data.ultimasReservas.length > 0 ? (
                data.ultimasReservas.map((reserva) => (
                  <tr key={reserva._id} className="table-row">
                    <td className="table-cell">
                      {typeof reserva.cliente === 'object' 
                        ? `${reserva.cliente.nombre} ${reserva.cliente.apellido}` 
                        : 'Cliente'}
                    </td>
                    <td className="table-cell">
                      {typeof reserva.cancha === 'object' 
                        ? reserva.cancha.nombre 
                        : 'Cancha'}
                    </td>
                    <td className="table-cell">
                      {format(new Date(reserva.fechaInicio), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        reserva.estado === 'confirmada' ? 'badge-success' :
                        reserva.estado === 'pendiente' ? 'badge-warning' :
                        reserva.estado === 'cancelada' ? 'badge-danger' :
                        'badge-info'
                      }`}>
                        {reserva.estado}
                      </span>
                    </td>
                    <td className="table-cell">
                      {config.moneda} {reserva.precio.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-background-500">
                    No hay reservas recientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/reservas/nueva" className="card hover:bg-background-100 transition-colors">
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="p-3 rounded-full bg-primary bg-opacity-10 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-background-900">Nueva Reserva</h3>
            <p className="mt-1 text-sm text-background-500">Crear una nueva reserva</p>
          </div>
        </Link>

        <Link to="/clientes" className="card hover:bg-background-100 transition-colors">
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="p-3 rounded-full bg-blue-100 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-background-900">Clientes</h3>
            <p className="mt-1 text-sm text-background-500">Gestionar clientes</p>
          </div>
        </Link>

        <Link to="/canchas" className="card hover:bg-background-100 transition-colors">
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="p-3 rounded-full bg-amber-100 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-background-900">Canchas</h3>
            <p className="mt-1 text-sm text-background-500">Gestionar canchas</p>
          </div>
        </Link>

        <Link to="/reportes" className="card hover:bg-background-100 transition-colors">
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="p-3 rounded-full bg-green-100 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-background-900">Reportes</h3>
            <p className="mt-1 text-sm text-background-500">Ver estadísticas</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard