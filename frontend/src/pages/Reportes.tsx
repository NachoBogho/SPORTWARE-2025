import React from 'react'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_BASE } from '../api'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bar, Line, Pie } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useConfigStore } from '../stores/configStore'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

interface ReporteIngresos {
  total: number
  porTipo: Record<string, number>
  porDia: Record<string, number>
  cantidadReservas?: number
}

interface ReporteUso {
  total: number // total de reservas
  porCancha: Record<string, number> // nombre cancha -> cantidadReservas
  porTipo: Record<string, number> // tipo -> cantidadReservas
}

interface ReporteClientes {
  clientes: Array<{
    _id: string
    nombre: string
    apellido: string
    email: string
    reservas: number
    gastoTotal: number
  }>
}

const Reportes = () => {
  const { config } = useConfigStore()
  const [tipoReporte, setTipoReporte] = useState('ingresos')
  const [periodo, setPeriodo] = useState('mes')
  const [fechaInicio, setFechaInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [fechaFin, setFechaFin] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))
  const [reporteIngresos, setReporteIngresos] = useState<ReporteIngresos | null>(null)
  const [reporteUso, setReporteUso] = useState<ReporteUso | null>(null)
  const [reporteClientes, setReporteClientes] = useState<ReporteClientes | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Establecer fechas predeterminadas según el período seleccionado
    const hoy = new Date()
    
    if (periodo === 'mes') {
      setFechaInicio(format(startOfMonth(hoy), 'yyyy-MM-dd'))
      setFechaFin(format(endOfMonth(hoy), 'yyyy-MM-dd'))
    } else if (periodo === 'trimestre') {
      setFechaInicio(format(startOfMonth(subMonths(hoy, 2)), 'yyyy-MM-dd'))
      setFechaFin(format(endOfMonth(hoy), 'yyyy-MM-dd'))
    } else if (periodo === 'semestre') {
      setFechaInicio(format(startOfMonth(subMonths(hoy, 5)), 'yyyy-MM-dd'))
      setFechaFin(format(endOfMonth(hoy), 'yyyy-MM-dd'))
    } else if (periodo === 'anual') {
      setFechaInicio(format(startOfMonth(subMonths(hoy, 11)), 'yyyy-MM-dd'))
      setFechaFin(format(endOfMonth(hoy), 'yyyy-MM-dd'))
    }
  }, [periodo])

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchReporte()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoReporte, fechaInicio, fechaFin])

  const fetchReporte = async () => {
    setLoading(true)
    setError('')
    try {
      if (tipoReporte === 'ingresos') {
        // Backend devuelve ingresoTotal, ingresosPorTipo, ingresosPorDia
  const { data } = await axios.get(`${API_BASE}/api/reportes/ingresos`, { params: { fechaInicio, fechaFin } })
        setReporteIngresos({
          total: Number(data?.ingresoTotal || 0),
          porTipo: (data?.ingresosPorTipo && typeof data.ingresosPorTipo === 'object') ? data.ingresosPorTipo : {},
          porDia: (data?.ingresosPorDia && typeof data.ingresosPorDia === 'object') ? data.ingresosPorDia : {},
          cantidadReservas: Number(data?.cantidadReservas || 0)
        })
        setReporteUso(null); setReporteClientes(null)
      } else if (tipoReporte === 'uso') {
        // Endpoint real: /uso-canchas
  const { data } = await axios.get(`${API_BASE}/api/reportes/uso-canchas`, { params: { fechaInicio, fechaFin } })
        // data.usoPorCancha: id -> { nombre, tipo, cantidadReservas, horasReservadas, ingresos }
        const porCancha: Record<string, number> = {}
        const porTipo: Record<string, number> = {}
        if (data?.usoPorCancha && typeof data.usoPorCancha === 'object') {
          Object.values<any>(data.usoPorCancha).forEach((c: any) => {
            if (c?.nombre) porCancha[c.nombre] = Number(c.cantidadReservas || 0)
            if (c?.tipo) {
              porTipo[c.tipo] = (porTipo[c.tipo] || 0) + Number(c.cantidadReservas || 0)
            }
          })
        }
        // Alternativamente data.usoPorTipo trae estructura con horas/ingresos, pero para esta vista solo usamos cantidadReservas
        if (Object.keys(porTipo).length === 0 && data?.usoPorTipo && typeof data.usoPorTipo === 'object') {
          Object.entries<any>(data.usoPorTipo).forEach(([tipo, val]: any) => {
            porTipo[tipo] = Number(val?.cantidadReservas || 0)
          })
        }
        setReporteUso({
          total: Number(data?.totalReservas || 0),
          porCancha,
          porTipo
        })
        setReporteIngresos(null); setReporteClientes(null)
      } else if (tipoReporte === 'clientes') {
  const { data } = await axios.get(`${API_BASE}/api/reportes/clientes`, { params: { fechaInicio, fechaFin } })
        // Transformar estructura backend -> frontend esperado
        const clientesTransformados = Array.isArray(data?.clientes)
          ? data.clientes.map((item: any) => ({
              _id: item?.cliente?._id || '',
              nombre: item?.cliente?.nombre || '',
              apellido: item?.cliente?.apellido || '',
              email: item?.cliente?.email || '',
              reservas: Number(item?.cantidadReservas || 0),
              gastoTotal: Number(item?.gastoTotal || 0)
            }))
          : []
        setReporteClientes({ clientes: clientesTransformados })
        setReporteIngresos(null); setReporteUso(null)
      }
    } catch (err: any) {
      console.error('Error al cargar el reporte:', err)
      setError(err.response?.data?.mensaje || 'Error al cargar el reporte. Por favor, intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportar = () => {
    // Implementación básica para exportar a CSV
    let csvContent = ''
    let filename = ''
    
    if (tipoReporte === 'ingresos' && reporteIngresos) {
      filename = `reporte_ingresos_${fechaInicio}_${fechaFin}.csv`
      csvContent = 'Categoría,Valor\n'
      csvContent += `Total,${reporteIngresos.total}\n`
      
      // Ingresos por tipo
      csvContent += '\nIngresos por Tipo\n'
      Object.entries(reporteIngresos.porTipo).forEach(([tipo, valor]) => {
        csvContent += `${tipo},${valor}\n`
      })
      
      // Ingresos por día
      csvContent += '\nIngresos por Día\n'
      Object.entries(reporteIngresos.porDia).forEach(([dia, valor]) => {
        csvContent += `${dia},${valor}\n`
      })
    } else if (tipoReporte === 'uso' && reporteUso) {
      filename = `reporte_uso_${fechaInicio}_${fechaFin}.csv`
      csvContent = 'Categoría,Valor\n'
      csvContent += `Total,${reporteUso.total}\n`
      
      // Uso por cancha
      csvContent += '\nUso por Cancha\n'
      Object.entries(reporteUso.porCancha).forEach(([cancha, valor]) => {
        csvContent += `${cancha},${valor}\n`
      })
      
      // Uso por tipo
      csvContent += '\nUso por Tipo\n'
      Object.entries(reporteUso.porTipo).forEach(([tipo, valor]) => {
        csvContent += `${tipo},${valor}\n`
      })
    } else if (tipoReporte === 'clientes' && reporteClientes) {
      filename = `reporte_clientes_${fechaInicio}_${fechaFin}.csv`
      csvContent = 'Cliente,Email,Reservas,Gasto Total\n'
      
      reporteClientes.clientes.forEach(cliente => {
        csvContent += `${cliente.nombre} ${cliente.apellido},${cliente.email},${cliente.reservas},${cliente.gastoTotal}\n`
      })
    }
    
    // Crear y descargar el archivo CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Preparar datos para los gráficos
  const prepararDatosIngresos = () => {
    if (!reporteIngresos) return null
    try {
      const diasEntries = Object.entries(reporteIngresos.porDia || {})
        .filter(([k]) => !isNaN(new Date(k).getTime()))
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())

      const labelsDias = diasEntries.map(([k]) => format(new Date(k), 'dd/MM/yyyy'))
      const valoresDias = diasEntries.map(([, v]) => Number(v || 0))

      const ingresosPorDia = {
        labels: labelsDias,
        datasets: [{
          label: 'Ingresos',
          data: valoresDias,
          backgroundColor: '#0D9F6F',
          borderColor: '#0D9F6F',
          borderWidth: 1,
          tension: 0.25
        }]
      }

      const tiposEntries = Object.entries(reporteIngresos.porTipo || {})
      const ingresosPorTipo = {
        labels: tiposEntries.map(([t]) => t),
        datasets: [{
          label: 'Ingresos por tipo',
          data: tiposEntries.map(([, v]) => Number(v || 0)),
          backgroundColor: ['#0D9F6F','#3B82F6','#F59E0B','#EF4444','#8B5CF6'],
          borderWidth: 1
        }]
      }
      return { ingresosPorDia, ingresosPorTipo }
    } catch (e) {
      console.error('Error preparando datos ingresos:', e)
      setError('Error procesando datos de ingresos.')
      return null
    }
  }

  const prepararDatosUso = () => {
    if (!reporteUso) return null
    try {
      const canchaEntries = Object.entries(reporteUso.porCancha || {})
      const usoPorCancha = {
        labels: canchaEntries.map(([c]) => c),
        datasets: [{
          label: 'Reservas',
          data: canchaEntries.map(([, v]) => Number(v || 0)),
          backgroundColor: '#3B82F6',
          borderColor: '#3B82F6',
          borderWidth: 1
        }]
      }

      const tipoEntries = Object.entries(reporteUso.porTipo || {})
      const usoPorTipo = {
        labels: tipoEntries.map(([t]) => t),
        datasets: [{
          label: 'Reservas por tipo',
          data: tipoEntries.map(([, v]) => Number(v || 0)),
          backgroundColor: ['#0D9F6F','#3B82F6','#F59E0B','#EF4444','#8B5CF6'],
          borderWidth: 1
        }]
      }
      return { usoPorCancha, usoPorTipo }
    } catch (e) {
      console.error('Error preparando datos uso:', e)
      setError('Error procesando datos de uso.')
      return null
    }
  }

  const datosIngresos = reporteIngresos ? prepararDatosIngresos() : null
  const datosUso = reporteUso ? prepararDatosUso() : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-background-900">Reportes</h1>
        <button 
          onClick={handleExportar} 
          className="btn btn-outline-primary"
          disabled={loading || (!reporteIngresos && !reporteUso && !reporteClientes)}
        >
          Exportar CSV
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Filtros */}
      <div className="card">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label htmlFor="tipoReporte" className="label">Tipo de Reporte</label>
            <select
              id="tipoReporte"
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value)}
              className="select"
            >
              <option value="ingresos">Ingresos</option>
              <option value="uso">Uso de Canchas</option>
              <option value="clientes">Clientes</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="periodo" className="label">Período</label>
            <select
              id="periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="select"
            >
              <option value="mes">Este mes</option>
              <option value="trimestre">Último trimestre</option>
              <option value="semestre">Último semestre</option>
              <option value="anual">Último año</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="fechaInicio" className="label">Fecha Inicio</label>
            <input
              type="date"
              id="fechaInicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="input"
              disabled={periodo !== 'personalizado'}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="fechaFin" className="label">Fecha Fin</label>
            <input
              type="date"
              id="fechaFin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="input"
              disabled={periodo !== 'personalizado'}
            />
          </div>
        </div>
      </div>

      {/* Contenido del reporte */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div>
          {/* Reporte de Ingresos */}
          {tipoReporte === 'ingresos' && reporteIngresos && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-medium text-background-900 mb-2">
                  Ingresos Totales: {config.moneda} {reporteIngresos.total.toFixed(2)}
                </h2>
                <p className="text-background-500 text-sm mb-2">
                  Reservas contabilizadas: {reporteIngresos.cantidadReservas || 0}
                </p>
                <p className="text-background-500 text-sm">
                  Período: {format(new Date(fechaInicio), 'dd/MM/yyyy')} - {format(new Date(fechaFin), 'dd/MM/yyyy')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Gráfico de ingresos por día */}
                <div className="card">
                  <h3 className="text-lg font-medium text-background-900 mb-4">Ingresos por Día</h3>
                  <div className="h-80">
                    {datosIngresos && (
                      <Line 
                        data={datosIngresos.ingresosPorDia} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                callback: function(value) {
                                  return `${config.moneda} ${value}`
                                }
                              }
                            }
                          },
                          plugins: {
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `${config.moneda} ${context.raw}`
                                }
                              }
                            }
                          }
                        }} 
                      />
                    )}
                  </div>
                </div>

                {/* Gráfico de ingresos por tipo de cancha */}
                <div className="card">
                  <h3 className="text-lg font-medium text-background-900 mb-4">Ingresos por Tipo de Cancha</h3>
                  <div className="h-80 flex items-center justify-center">
                    {datosIngresos && Object.keys(reporteIngresos.porTipo).length > 0 ? (
                      <Pie 
                        data={datosIngresos.ingresosPorTipo} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right',
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const label = context.label || ''
                                  const value = context.raw as number
                                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number
                                  const percentage = Math.round((value / total) * 100)
                                  return `${label}: ${config.moneda} ${value} (${percentage}%)`
                                }
                              }
                            }
                          }
                        }} 
                      />
                    ) : (
                      <p className="text-background-500">No hay datos disponibles</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reporte de Uso de Canchas */}
          {tipoReporte === 'uso' && reporteUso && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-xl font-medium text-background-900 mb-2">
                  Total de Reservas: {reporteUso.total}
                </h2>
                <p className="text-background-500 text-sm">
                  Período: {format(new Date(fechaInicio), 'dd/MM/yyyy')} - {format(new Date(fechaFin), 'dd/MM/yyyy')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Gráfico de uso por cancha */}
                <div className="card">
                  <h3 className="text-lg font-medium text-background-900 mb-4">Reservas por Cancha</h3>
                  <div className="h-80">
                    {datosUso && (
                      <Bar 
                        data={datosUso.usoPorCancha} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                precision: 0
                              }
                            }
                          }
                        }} 
                      />
                    )}
                  </div>
                </div>

                {/* Gráfico de uso por tipo */}
                <div className="card">
                  <h3 className="text-lg font-medium text-background-900 mb-4">Reservas por Tipo de Cancha</h3>
                  <div className="h-80 flex items-center justify-center">
                    {datosUso && Object.keys(reporteUso.porTipo).length > 0 ? (
                      <Pie 
                        data={datosUso.usoPorTipo} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right',
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const label = context.label || ''
                                  const value = context.raw as number
                                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0) as number
                                  const percentage = Math.round((value / total) * 100)
                                  return `${label}: ${value} reservas (${percentage}%)`
                                }
                              }
                            }
                          }
                        }} 
                      />
                    ) : (
                      <p className="text-background-500">No hay datos disponibles</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reporte de Clientes */}
          {tipoReporte === 'clientes' && reporteClientes && (
            <div className="card">
              <h2 className="text-xl font-medium text-background-900 mb-4">
                Reporte de Clientes
              </h2>
              <p className="text-background-500 mb-4">
                Período: {format(new Date(fechaInicio), 'dd/MM/yyyy')} - {format(new Date(fechaFin), 'dd/MM/yyyy')}
              </p>

              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Cliente</th>
                      <th className="table-header-cell">Email</th>
                      <th className="table-header-cell">Reservas</th>
                      <th className="table-header-cell">Gasto Total</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {reporteClientes.clientes.length > 0 ? (
                      reporteClientes.clientes.map((cliente) => (
                        <tr key={cliente._id} className="table-row">
                          <td className="table-cell font-medium">
                            {cliente.nombre} {cliente.apellido}
                          </td>
                          <td className="table-cell">
                            {cliente.email}
                          </td>
                          <td className="table-cell text-center">
                            {cliente.reservas}
                          </td>
                          <td className="table-cell">
                            {config.moneda} {cliente.gastoTotal.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-background-500">
                          No hay datos de clientes para el período seleccionado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Reportes