// ThemeContext.jsx
import * as React from 'react';
import { useThemeManager } from './ThemeChanger';

const ThemeContext = React.createContext(null);

export function ThemeProvider({ children }) {
  const themeManager = useThemeManager('primary', 'solid');
  
  return (
    <ThemeContext.Provider value={themeManager}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}