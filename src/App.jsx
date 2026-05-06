import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import Home from './pages/Home'
import NovelList from './pages/NovelList'
import NovelDetail from './pages/NovelDetail'
import ChapterReader from './pages/ChapterReader'
import WriterDash from './pages/WriterDash'
import Admin from './pages/Admin'
import Subscribe from './pages/Subscribe'
import Profile from './pages/Profile'
import ChapterEditorPage from './pages/ChapterEditorPage'
import LandingPage from './pages/LandingPage'

function ProtectedRoute({ children, requireAdmin }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>লোড হচ্ছে...</div>
  if (!user) return <Navigate to="/landing" />
  if (requireAdmin && profile?.role !== 'admin') return <Navigate to="/" />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/landing" element={user ? <Navigate to="/" /> : <LandingPage />} />
      <Route path="/auth" element={user ? <Navigate to="/" /> : <AuthPage />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/novels" element={<ProtectedRoute><NovelList /></ProtectedRoute>} />
      <Route path="/novel/:slug" element={<ProtectedRoute><NovelDetail /></ProtectedRoute>} />
      <Route path="/novel/:slug/chapter/:chapterNum" element={<ProtectedRoute><ChapterReader /></ProtectedRoute>} />
      <Route path="/writer" element={<ProtectedRoute><WriterDash /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
      <Route path="/subscribe" element={<ProtectedRoute><Subscribe /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/writer/editor" element={<ProtectedRoute><ChapterEditorPage /></ProtectedRoute>} />
      <Route path="/writer/editor/:chapterId" element={<ProtectedRoute><ChapterEditorPage /></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to={user ? "/" : "/landing"} />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
