import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, themes, getThemeById, defaultTheme } from '../theme';

interface ThemeContextType {
  theme: Theme;
  themeId: number;
  setTheme: (themeId: number) => void;
  toggleTheme: () => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeId, setThemeId] = useState<number>(0);
  const [theme, setCurrentTheme] = useState<Theme>(defaultTheme);

  // Load saved theme on app start
  useEffect(() => {
    loadSavedTheme();
  }, []);

  // Update current theme when themeId changes
  useEffect(() => {
    const newTheme = getThemeById(themeId);
    setCurrentTheme(newTheme);
  }, [themeId]);

  const loadSavedTheme = async () => {
    try {
      const savedThemeId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedThemeId !== null) {
        const parsedThemeId = parseInt(savedThemeId, 10);
        if (!isNaN(parsedThemeId) && parsedThemeId >= 0 && parsedThemeId < themes.length) {
          setThemeId(parsedThemeId);
        }
      }
    } catch (error) {
      console.error('Error loading saved theme:', error);
    }
  };

  const setTheme = async (newThemeId: number) => {
    try {
      if (newThemeId >= 0 && newThemeId < themes.length) {
        setThemeId(newThemeId);
        await AsyncStorage.setItem(THEME_STORAGE_KEY, newThemeId.toString());
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const toggleTheme = () => {
    const nextThemeId = (themeId + 1) % themes.length;
    setTheme(nextThemeId);
  };

  const contextValue: ThemeContextType = {
    theme,
    themeId,
    setTheme,
    toggleTheme,
    availableThemes: themes,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
