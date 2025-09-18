import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
// Inicializa el sistema de notificaciones (interceptores axios)
import './notifications/registerInterceptors'

ReactDOM.createRoot(document.getElementById('root')!).render(
  // Desactivando StrictMode para evitar doble renderizado en desarrollo
  <BrowserRouter>
    <App />
  </BrowserRouter>
)