"use client"

import type React from "react"

import { createContext, useContext, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuthStore } from "@/hooks/use-auth"
import { useCartStore } from "@/hooks/use-cart"
import { ThemeProvider } from "@/components/theme-provider"

const SupabaseContext = createContext<any>(null)

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error("useSupabase must be used within SupabaseProvider")
  }
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient()
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase, setUser, setLoading])

  return (
    <SupabaseContext.Provider value={supabase}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </SupabaseContext.Provider>
  )
}
