import React,{
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = "cardapio-nota10-theme";

function getInitialTheme() {
  try {
    const storedTheme = localStorage.getItem(
      THEME_STORAGE_KEY,
    );

    if (
      storedTheme === "light" ||
      storedTheme === "dark"
    ) {
      return storedTheme;
    }

    const prefersDarkMode =
      window.matchMedia?.(
        "(prefers-color-scheme: dark)",
      ).matches;

    return prefersDarkMode ? "dark" : "light";
  } catch (error) {
    console.error(
      "Erro ao carregar o tema:",
      error,
    );

    return "light";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    getInitialTheme,
  );

  useEffect(() => {
    const rootElement =
      document.documentElement;

    rootElement.setAttribute(
      "data-theme",
      theme,
    );

    rootElement.classList.toggle(
      "dark-theme",
      theme === "dark",
    );

    try {
      localStorage.setItem(
        THEME_STORAGE_KEY,
        theme,
      );
    } catch (error) {
      console.error(
        "Erro ao salvar o tema:",
        error,
      );
    }
  }, [theme]);

  const setLightTheme = useCallback(() => {
    setTheme("light");
  }, []);

  const setDarkTheme = useCallback(() => {
    setTheme("dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) =>
      currentTheme === "dark"
        ? "light"
        : "dark",
    );
  }, []);

  const value = useMemo(
    () => ({
      theme,

      isDarkMode: theme === "dark",
      isLightMode: theme === "light",

      setTheme,
      setLightTheme,
      setDarkTheme,
      toggleTheme,
    }),
    [
      theme,
      setLightTheme,
      setDarkTheme,
      toggleTheme,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme deve ser utilizado dentro de um ThemeProvider.",
    );
  }

  return context;
}