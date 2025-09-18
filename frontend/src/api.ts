// src/api.ts
const isDesktop = !!(window && window.process && window.process.versions && window.process.versions.electron) || (typeof import.meta.env !== 'undefined' && import.meta.env?.VITE_TARGET === 'desktop');
export const API_BASE = isDesktop
  ? 'http://localhost:3001/api'
  : '/api';
