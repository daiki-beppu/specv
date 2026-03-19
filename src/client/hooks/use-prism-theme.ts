import { themes } from "prism-react-renderer";

import { useTheme } from "@/hooks/use-theme";

export const usePrismTheme = () => {
  const { theme } = useTheme();
  return theme === "dark" ? themes.vsDark : themes.github;
};
