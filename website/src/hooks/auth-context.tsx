import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { auth } from '@/utils/auth'
import type { User } from '@/types/user'
import { updateProfile } from '@/api/user'
import { getCurrentUser } from '@/api/auth'

interface AuthContextType {
  isAuthenticated: boolean
  user: Partial<User> | null
  login: (token: string, userData: User) => void
  logout: () => void
  loading: boolean
  updateUser: (userData: Partial<User>, options?: UpdateUserOptions) => Promise<void>
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

interface UpdateUserOptions {
  skipApi?: boolean;  // 是否跳过 API 调用,默认为 false
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => auth.isAuthenticated())
  const [user, setUser] = useState<User | null>(() => auth.getUser())
  const [loading, setLoading] = useState(true)

  const fetchCurrentUser = useCallback(async () => {
    try {
      if (auth.isAuthenticated()) {
        const response = await getCurrentUser()
        console.log('fetchCurrentUser', response)
        if (response.data) {
          auth.updateUser(response.data.data)
          setUser(response.data.data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
      auth.clearAuth()
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])


  useEffect(() => {
    const initAuth = async () => {
      try {
        if (auth.isAuthenticated() && !auth.isTokenExpired()) {
          await fetchCurrentUser()
        } else {
          auth.clearAuth()
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        auth.clearAuth()
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [fetchCurrentUser])


  const login = useCallback(async (token: string, userData: User) => {
    auth.setAuth(token, userData)
    setIsAuthenticated(true)
    await fetchCurrentUser()
  }, [fetchCurrentUser])

  const logout = useCallback(() => {
    auth.clearAuth()
    setIsAuthenticated(false)
    setUser(null)
  }, [])

  const updateUser = useCallback(async (
    userData: Partial<User>,
    options: UpdateUserOptions = {}
  ) => {
    if (!user) {
      throw new Error('No user logged in')
    }

    try {
      if (!options.skipApi) {
        await updateProfile(user._id, userData)
      }

      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      auth.updateUser(updatedUser)
    } catch (error) {
      console.error('Error updating user:', error)
      throw new Error('Failed to update profile')
    }
  }, [user])

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      loading,
      updateUser,
      refreshUser: fetchCurrentUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
