import { useNavigate } from 'react-router-dom'

function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-dark-surface/80 backdrop-blur-xl border border-dark-border rounded-2xl p-8 shadow-2xl shadow-accent-glow/10 text-center">
          <h1 className="text-3xl font-bold text-text-primary">Page not found</h1>
          <p className="text-text-secondary mt-2">Sorry, we couldn't find the page you're looking for.</p>

          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="py-3 px-4 bg-accent hover:bg-accent-light text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-lg"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
