import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <h2 className="text-3xl font-semibold mt-4 mb-6">Página no encontrada</h2>
      <p className="text-lg text-gray-600 mb-8 max-w-md">
        Lo sentimos, la página que estás buscando no existe o ha sido movida.
      </p>
      <Link 
        to="/"
        className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}

export default NotFound