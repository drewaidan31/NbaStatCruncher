import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Force light mode and clear any saved dark theme
    localStorage.setItem('theme', 'light');
    setIsDark(false);
    document.documentElement.classList.remove('dark');
  }, []);

  useEffect(() => {
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`
        flex items-center justify-center w-10 h-10 rounded-lg transition-colors
        ${isDark 
          ? 'bg-slate-700 hover:bg-slate-600 text-yellow-400' 
          : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
        }
      `}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}