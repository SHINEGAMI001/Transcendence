/**
 * App.jsx — Root Route Definitions
 *
 * PURPOSE:
 * Defines all the pages/routes in the app using React Router.
 * Protected routes (like /profile) are wrapped in ProtectedRoute
 * which checks auth state before rendering.
 *
 * ROUTE STRUCTURE:
 * /          → Welcome page (public — redirects to /lobby if logged in)
 * /register  → Register page (public — create account)
 * /login     → Login page (public — sign in)
 * /lobby     → Lobby page (protected — main hub)
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
import Search from './pages/Search'
import PublicProfile from './pages/PublicProfile'
import Lobby from './pages/Lobby'
import Chat from './pages/Chat'
import PublicRoom from './pages/PublicRoom'
import PrivateRoom from './pages/PrivateRoom'
import CreatePublicRoom from './pages/CreatePublicRoom'
import GameRoom from './pages/GameRoom'
import NotFound from './pages/NotFound'
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
        <Route path="/search" element={<Search />} />
        <Route path="/user/:username" element={<PublicProfile />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/chat/:username" element={<Chat />} />
        <Route path="/room/public" element={<PublicRoom />} />
        <Route path="/room/private" element={<PrivateRoom />} />
        <Route path="/room/create" element={<CreatePublicRoom />} />
        <Route path="/game/:roomId" element={<GameRoom />} />
      </Route>
      {/* Catch-all: show NotFound page for unknown routes */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App