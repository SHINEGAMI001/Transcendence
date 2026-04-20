/**
 * App.jsx — Root Route Definitions
 *
 * PURPOSE:
 * Defines all the pages/routes in the app using React Router.
 * Protected routes (like /profile) are wrapped in ProtectedRoute
 * which checks auth state before rendering.
 *
 * ROUTE STRUCTURE:
 * /          → Home page (public — landing page)
 * /register  → Register page (public — create account)
 * /login     → Login page (public — sign in)
 * /profile   → Profile page (protected — requires auth)
 *
 * HOW PROTECTED ROUTES WORK:
 * ProtectedRoute is a layout route (uses <Outlet />). Any routes
 * nested inside it will only render if the user is authenticated.
 * If not authenticated, ProtectedRoute redirects to /login.
 */

import { Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Home from './pages/Home'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Public routes — accessible to everyone */}
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      {/* Protected routes — only accessible when logged in */}
      {/* ProtectedRoute checks auth state and either renders
          the child routes or redirects to /login */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
        {/* Add more protected routes here later, e.g.:
            <Route path="/game" element={<Game />} />
            <Route path="/settings" element={<Settings />} />
        */}
      </Route>
    </Routes>
  )
}

export default App