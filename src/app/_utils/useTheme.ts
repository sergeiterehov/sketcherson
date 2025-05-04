import useThemeStore from "../themeStore";

function useTheme() {
  return useThemeStore((s) => s.theme);
}

export default useTheme;
