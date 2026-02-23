import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  seasonalTheme: any | null;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  seasonalTheme: null,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("infocom-theme");
    return (stored as Theme) || "dark";
  });

  const { data: seasonalTheme } = useQuery({
    queryKey: ["active_theme"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("theme_settings")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    staleTime: 60000,
  });

  useEffect(() => {
    localStorage.setItem("infocom-theme", theme);
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Apply seasonal color overrides
  useEffect(() => {
    const root = document.documentElement;
    if (seasonalTheme && seasonalTheme.key !== "default") {
      const val = seasonalTheme.value as any;
      if (val.primary_hue !== undefined) {
        root.style.setProperty("--primary", `${val.primary_hue} 72% 45%`);
        root.style.setProperty("--accent", `${val.accent_hue} 90% 50%`);
        root.style.setProperty("--ring", `${val.primary_hue} 72% 45%`);
        root.style.setProperty("--glow", `${val.accent_hue} 90% 50%`);
      }
    } else {
      // Reset to defaults
      root.style.removeProperty("--primary");
      root.style.removeProperty("--accent");
      root.style.removeProperty("--ring");
      root.style.removeProperty("--glow");
    }
  }, [seasonalTheme]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, seasonalTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
