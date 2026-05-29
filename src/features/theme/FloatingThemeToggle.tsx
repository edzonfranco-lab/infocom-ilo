import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export const FloatingThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className="fixed bottom-4 right-4 z-[9999] h-11 w-11 rounded-xl bg-primary text-primary-foreground shadow-lg border border-primary/40 flex items-center justify-center transition-all hover:scale-110 hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)] print:hidden"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
};

export default FloatingThemeToggle;
