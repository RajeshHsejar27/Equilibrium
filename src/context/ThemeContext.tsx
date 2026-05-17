import { createContext, useContext, useEffect, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"

type Theme = "dark" | "light" | "system"

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  accentColor: string
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  accentColor: "#3b82f6",
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  const settings = useLiveQuery(() => db.settings.get(1))
  const accentColor = settings?.accentColor || "#3b82f6"

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme, accentColor])

  useEffect(() => {
    const root = window.document.documentElement
    if (accentColor) {
      root.style.setProperty('--primary', accentColor)
      // Also update sidebar-primary if needed, or other accent variables
      root.style.setProperty('--sidebar-primary', accentColor)
    }
  }, [accentColor])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
      // Also sync to DB for settings
      db.settings.update(1, { theme })
    },
    accentColor,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
