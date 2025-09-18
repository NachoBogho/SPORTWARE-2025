import React from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, addMonths, isSameMonth, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface DatePickerProps {
  value: string // ISO yyyy-MM-dd o ''
  onChange: (iso: string) => void
  onClear?: () => void
  placeholder?: string
  inputClassName?: string
}

// Convierte ISO -> dd/mm/aaaa
function isoToDisplay(iso: string) {
  if (!iso) return ''
  const [y,m,d] = iso.split('-')
  return `${d}/${m}/${y}`
}
// Convierte display dd/mm/aaaa -> ISO
function displayToISO(display: string): string | null {
  const cleaned = display.replace(/[^0-9/]/g,'')
  const parts = cleaned.split('/')
  if (parts.length !== 3) return null
  const [dd,mm,yyyy] = parts
  if (dd.length!==2||mm.length!==2||yyyy.length!==4) return null
  const day = +dd, month = +mm, year = +yyyy
  if (year<1900||month<1||month>12||day<1||day>31) return null
  const dt = new Date(year, month-1, day)
  if (dt.getFullYear()!==year||dt.getMonth()!==month-1||dt.getDate()!==day) return null
  return dt.toISOString().slice(0,10)
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, onClear, placeholder='dd/mm/aaaa', inputClassName='' }) => {
  const [open, setOpen] = React.useState(false)
  const anchorRef = React.useRef<HTMLDivElement | null>(null)
  const popupRef = React.useRef<HTMLDivElement | null>(null)
  const today = new Date()
  const initialMonth = value ? parseISO(value) : today
  const [currentMonth, setCurrentMonth] = React.useState<Date>(initialMonth)
  const [displayValue, setDisplayValue] = React.useState<string>(isoToDisplay(value))
  const [error, setError] = React.useState('')
  const [alignRight, setAlignRight] = React.useState(false)

  React.useEffect(() => {
    setDisplayValue(isoToDisplay(value))
    if (value) setCurrentMonth(parseISO(value))
  }, [value])

  // Detectar overflow horizontal y alinear el popup a la derecha si no hay espacio suficiente
  React.useEffect(() => {
    if (open) {
      const anchor = anchorRef.current
      if (anchor) {
        const rect = anchor.getBoundingClientRect()
        const calendarWidth = 288 // w-72 (18rem)
        const margen = 8
        const espacioDerecha = window.innerWidth - rect.left
        if (espacioDerecha < calendarWidth + margen) {
          setAlignRight(true)
        } else {
          setAlignRight(false)
        }
      }
    }
  }, [open])

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function handlePrevMonth() { setCurrentMonth(m => addMonths(m, -1)) }
  function handleNextMonth() { setCurrentMonth(m => addMonths(m, 1)) }

  const monthStart = startOfMonth(currentMonth)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const days: Date[] = []
  for (let d = gridStart; days.length < 42; d = addDays(d, 1)) {
    days.push(d)
  }

  function selectDate(day: Date) {
    const iso = day.toISOString().slice(0,10)
    onChange(iso)
    setOpen(false)
    setError('')
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/[^0-9/]/g,'')
    setDisplayValue(val)
    const iso = displayToISO(val)
    if (!iso) {
      setError(val ? 'Fecha inválida' : '')
      return
    }
    setError('')
    onChange(iso)
  }

  return (
    <div className="relative" ref={anchorRef}>
      <div className="flex items-center gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-background-500 text-sm">📅</span>
          <input
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            maxLength={10}
            className={`input pl-9 w-40 ${error ? 'border-red-400 focus:border-red-500' : ''} ${inputClassName}`}
          />
          {displayValue && (
            <button
              type="button"
              onClick={() => { setDisplayValue(''); onChange(''); setError(''); onClear && onClear(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-background-500 hover:text-background-700 text-xs"
              aria-label="Limpiar fecha"
            >✕</button>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {open && (
        <div
          ref={popupRef}
          className={`absolute z-30 mt-2 w-72 p-3 rounded-lg shadow-lg border border-background-200 bg-background-50 text-background-900 ${alignRight ? 'right-0' : ''}`}
          style={alignRight ? { left: 'auto' } : {}}
        >
          <div className="flex items-center justify-between mb-2">
            <button onClick={handlePrevMonth} className="px-2 py-1 rounded hover:bg-background-100 text-sm" aria-label="Mes anterior">◀</button>
            <div className="text-sm font-medium select-none">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </div>
            <button onClick={handleNextMonth} className="px-2 py-1 rounded hover:bg-background-100 text-sm" aria-label="Mes siguiente">▶</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-[11px] font-medium text-background-500 mb-1 select-none">
            {['L','M','X','J','V','S','D'].map(d => <div key={d} className="text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
            {days.map((day, idx) => {
              const iso = day.toISOString().slice(0,10)
              const selected = value && isSameDay(day, parseISO(value))
              const outside = !isSameMonth(day, monthStart)
              const isTodayFlag = isSameDay(day, today)
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDate(day)}
                  className={[
                    'h-9 rounded flex items-center justify-center transition-colors',
                    outside ? 'text-background-400' : 'text-background-900',
                    selected ? 'bg-primary text-white hover:bg-primary-600' : 'hover:bg-background-100',
                    isTodayFlag && !selected ? 'border border-primary/50' : '',
                  ].join(' ')}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
          <div className="mt-3 flex justify-between text-xs">
            <button
              type="button"
              onClick={() => { setCurrentMonth(today); }}
              className="px-2 py-1 rounded hover:bg-background-100"
            >Hoy</button>
            <button
              type="button"
              onClick={() => { const iso = today.toISOString().slice(0,10); onChange(iso); setOpen(false); }}
              className="px-2 py-1 rounded bg-primary text-white hover:bg-primary-600"
            >Seleccionar hoy</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker
