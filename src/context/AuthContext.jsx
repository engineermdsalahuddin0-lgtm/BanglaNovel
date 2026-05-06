import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signUp(email, password, username, role = 'reader') {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { data, error }

    if (data?.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username: username || email.split('@')[0],
        full_name: '',
        avatar_url: '',
        role: role, // 'reader' or 'writer'
      })
    }

    return { data, error }
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  // Writer request — reader থেকে writer হওয়ার request
  async function requestWriterRole() {
    if (!user) return { error: 'Login করো' }
    const { error } = await supabase.from('profiles')
      .update({ role: 'writer' })
      .eq('id', user.id)
    if (!error) await fetchProfile(user.id)
    return { error }
  }

  const isAdmin = profile?.role === 'admin'
  const isWriter = profile?.role === 'writer' || profile?.role === 'admin'
  const isSubscribed = profile?.is_subscribed && new Date(profile?.subscription_expires_at) > new Date()

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signUp, signIn, signOut,
      isAdmin, isWriter, isSubscribed,
      fetchProfile, requestWriterRole
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
