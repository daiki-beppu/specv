import { useTheme } from "@/hooks/useTheme.js";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-1.5 rounded-lg hover:bg-accent"
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? "\uD83C\uDF19" : "\u2600\uFE0F"}
    </button>
  );
}
