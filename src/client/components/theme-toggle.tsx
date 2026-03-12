import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/hooks/use-theme.js";

export const ThemeToggle = () => {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
};
