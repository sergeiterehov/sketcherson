import useThemeStore from "../themeStore";

function useShortcuts() {
  return useThemeStore((s) => s.shortcuts);
}

export default useShortcuts;
