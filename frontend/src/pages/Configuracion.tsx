import React from 'react'
import { useState, useEffect } from 'react'
import { useConfigStore } from '../stores/configStore'
import { HexColorPicker } from 'react-colorful'
import { CheckIcon } from '@heroicons/react/24/outline'

// Tipado opcional (simplificado)
interface DiasOperacion {
  lunes: boolean; martes: boolean; miércoles: boolean; jueves: boolean;
  viernes: boolean; sábado: boolean; domingo: boolean;
}
interface Colores {
  [k: string]: string;
}
interface ConfigShape {
  nombreNegocio: string;
  moneda: string;
  impuestos: number;
  logo?: string;
  horarioApertura: string;
  horarioCierre: string;
  diasOperacion: DiasOperacion;
  colores: Colores;
}

// Defaults seguros
const DEFAULT_DIAS: DiasOperacion = {
  lunes: false, martes: false, miércoles: false, jueves: false,
  viernes: false, sábado: false, domingo: false
}
const DEFAULT_COLORES: Colores = {
  primary: '#0D9F6F',
  secondary: '#3B82F6',
  accent: '#F59E0B',
  danger: '#EF4444',
  background: '#FFFFFF',
  surface: '#F3F4F6',
  text: '#111827'
}

function normalizeConfig(cfg: any): ConfigShape {
  return {
    nombreNegocio: cfg?.nombreNegocio || '',
    moneda: cfg?.moneda || '$',
    impuestos: Number(cfg?.impuestos || 0),
    logo: cfg?.logo || '',
    horarioApertura: cfg?.horarioApertura || '08:00',
    horarioCierre: cfg?.horarioCierre || '22:00',
    diasOperacion: { ...DEFAULT_DIAS, ...(cfg?.diasOperacion || {}) },
    colores: { ...DEFAULT_COLORES, ...(cfg?.colores || {}) }
  }
}

const Configuracion = () => {
  const { config, updateConfig, resetConfig, loading, error } = useConfigStore()
  const [formData, setFormData] = useState<ConfigShape>(() => normalizeConfig(config))
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [logoPreview, setLogoPreview] = useState('')

  // Actualizar el formulario cuando se carga la configuración
  useEffect(() => {
    const normalized = normalizeConfig(config)
    setFormData(normalized)
    if (normalized.logo) {
      setLogoPreview(normalized.logo)
    }
  }, [config])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => {
      if (name.startsWith('diasOperacion.')) {
        const dia = name.split('.')[1]
        return {
          ...prev,
          diasOperacion: {
            ...prev.diasOperacion,
            [dia]: (e.target as HTMLInputElement).checked
          }
        }
      }
      return {
        ...prev,
        [name]: type === 'number' ? Number(value) : value
      }
    })
  }

  const handleColorChange = (color: string) => {
    if (!showColorPicker) return
    
    setFormData(prev => ({
      ...prev,
      colores: {
        ...prev.colores,
        [showColorPicker]: color
      }
    }))
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setLogoPreview(base64String)
      setFormData(prev => ({
        ...prev,
        logo: base64String
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateConfig(formData)
      setSuccessMessage('Configuración guardada correctamente')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Error al guardar la configuración:', err)
    }
  }

  const handleReset = async () => {
    if (window.confirm('¿Estás seguro de que deseas restablecer la configuración a los valores predeterminados?')) {
      try {
        await resetConfig()
        setSuccessMessage('Configuración restablecida correctamente')
        setTimeout(() => setSuccessMessage(''), 3000)
      } catch (err) {
        console.error('Error al restablecer la configuración:', err)
      }
    }
  }

  if (loading && !config) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-background-900">Configuración</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-100 border border-green-200 rounded-md text-green-700 flex items-center">
          <CheckIcon className="h-5 w-5 mr-2" />
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información del Negocio */}
        <div className="card">
          <h2 className="text-lg font-medium text-background-900 mb-4">Información del Negocio</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="nombreNegocio" className="label">Nombre del Negocio</label>
              <input
                type="text"
                id="nombreNegocio"
                name="nombreNegocio"
                value={formData.nombreNegocio}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="moneda" className="label">Moneda</label>
              <input
                type="text"
                id="moneda"
                name="moneda"
                value={formData.moneda}
                onChange={handleInputChange}
                className="input"
                placeholder="$"
                maxLength={3}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="impuestos" className="label">Impuestos (%)</label>
              <input
                type="number"
                id="impuestos"
                name="impuestos"
                value={formData.impuestos}
                onChange={handleInputChange}
                className="input"
                min="0"
                max="100"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="logo" className="label">Logo</label>
              <div className="flex items-center space-x-4">
                {logoPreview && (
                  <div className="w-16 h-16 rounded-md overflow-hidden bg-background-100 flex items-center justify-center">
                    <img src={logoPreview} alt="Logo" className="max-w-full max-h-full" />
                  </div>
                )}
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  onChange={handleLogoChange}
                  className="input"
                  accept="image/*"
                />
              </div>
              <p className="text-xs text-background-500">Recomendado: imagen cuadrada de 512x512px</p>
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div className="card">
          <h2 className="text-lg font-medium text-background-900 mb-4">Horarios de Operación</h2>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="horarioApertura" className="label">Horario de Apertura</label>
              <input
                type="time"
                id="horarioApertura"
                name="horarioApertura"
                value={formData.horarioApertura}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="horarioCierre" className="label">Horario de Cierre</label>
              <input
                type="time"
                id="horarioCierre"
                name="horarioCierre"
                value={formData.horarioCierre}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="label block mb-2">Días de Operación</label>
            <div className="flex flex-wrap gap-2">
              {['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map((dia) => (
                <label key={dia} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name={`diasOperacion.${dia}`}
                    checked={formData.diasOperacion[dia as keyof typeof formData.diasOperacion]}
                    onChange={handleInputChange}
                    className="form-checkbox h-5 w-5 text-primary rounded"
                  />
                  <span className="ml-2 text-background-700 capitalize">{dia}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Colores */}
        <div className="card">
          <h2 className="text-lg font-medium text-background-900 mb-4">Personalización de Colores</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(formData.colores || {}).map(([colorKey, colorValue]) => (
              <div key={colorKey} className="space-y-2">
                <label className="label capitalize">{colorKey.replace(/([A-Z])/g, ' $1').trim()}</label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(showColorPicker === colorKey ? null : colorKey)}
                    className="w-10 h-10 rounded-md border border-background-300 flex-shrink-0"
                    style={{ backgroundColor: colorValue }}
                    aria-label={`Seleccionar color para ${colorKey}`}
                  />
                  <input
                    type="text"
                    value={colorValue}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        colores: {
                          ...prev.colores,
                          [colorKey]: e.target.value
                        }
                      }))
                    }}
                    className="input"
                  />
                </div>
                {showColorPicker === colorKey && (
                  <div className="relative z-10 mt-2">
                    <div className="absolute">
                      <HexColorPicker color={colorValue} onChange={handleColorChange} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-outline-danger"
            disabled={loading}
          >
            Restablecer valores predeterminados
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Configuracion