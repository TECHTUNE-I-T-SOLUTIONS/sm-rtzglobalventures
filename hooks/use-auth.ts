import { create } from "zustand"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/auth-helpers-nextjs"

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  signOut: async () => {
    try {
      await supabase.auth.signOut()
      set({ user: null })
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  },
}))

// Export the hook for easier usage
export const useAuth = () => {
  const { user, loading, setUser, setLoading, signOut } = useAuthStore()
  return { user, loading, setUser, setLoading, signOut }
}
