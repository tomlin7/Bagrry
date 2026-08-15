import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderContext = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
};

const ThemeProviderContext = createContext<ThemeProviderContext | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
};

export function ThemeProvider({ children, defaultTheme = "dark" }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("theme") as Theme) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const root = window.document.documentElement;
    
    const updateTheme = (newTheme: "dark" | "light") => {
      root.classList.remove("light", "dark");
      root.classList.add(newTheme);
      setResolvedTheme(newTheme);
    };

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      updateTheme(systemTheme);

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const systemTheme = mediaQuery.matches ? "dark" : "light";
        updateTheme(systemTheme);
      };

      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    } else {
      updateTheme(theme);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      try {
        localStorage.setItem("theme", theme);
      } catch {
        // Ignore storage errors
      }
      setTheme(theme);
    },
    resolvedTheme,
  };

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}