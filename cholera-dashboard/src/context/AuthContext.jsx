import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadProfile = async (currentUser) => {
    if (!currentUser) {
      setProfile(null)
      return
    }
    const { data, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', currentUser.id)
      .maybeSingle()
    if (profileError) {
      // eslint-disable-next-line no-console
      console.error('Failed to load user profile', profileError)
      setError(profileError.message)
      setProfile(null)
      return
    }
    setProfile(data)
  }

  useEffect(() => {
    let unsubscribe
    const init = async () => {
      setLoading(true)
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        setError(sessionError.message)
      } else {
        setUser(data.session?.user ?? null)
        if (data.session?.user) {
          await loadProfile(data.session.user)
        }
      }
      const { data: listener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setUser(session?.user ?? null)
          await loadProfile(session?.user ?? null)
        },
      )
      unsubscribe = listener.subscription
      setLoading(false)
    }
    init()

    return () => {
      if (unsubscribe) unsubscribe.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    setLoading(true)
    setError(null)
    try {
      // Prefer local sign-out (clears this browser only)
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
      if (signOutError) {
        // eslint-disable-next-line no-console
        console.error('Supabase signOut error', signOutError)
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unexpected signOut error', err)
    } finally {
      // Hard-clear any persisted auth leftovers (defensive)
      try {
        Object.keys(window.localStorage || {}).forEach((k) => {
          if (k.startsWith('sb-') || k.includes('supabase')) {
            window.localStorage.removeItem(k)
          }
        })
        Object.keys(window.sessionStorage || {}).forEach((k) => {
          if (k.startsWith('sb-') || k.includes('supabase')) {
            window.sessionStorage.removeItem(k)
          }
        })
      } catch (e) {
        // ignore
      }
      setUser(null)
      setProfile(null)
      setLoading(false)
    }
  }

  const value = {
    user,
    profile,
    loading,
    error,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

