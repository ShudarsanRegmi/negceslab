import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createTheme } from '@mui/material/styles';

type ThemeMode = 'light' | 'dark' | 'auto';
type MuiTheme = ReturnType<typeof createTheme>;

interface ThemeContextType {
  mode: ThemeMode;
  theme: MuiTheme;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return (saved as ThemeMode) || 'light';
  });

  const [isDark, setIsDark] = useState<boolean>(false);

  // Check system preference for auto mode
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (mode === 'auto') {
        setIsDark(mediaQuery.matches);
      }
    };

    if (mode === 'auto') {
      setIsDark(mediaQuery.matches);
      mediaQuery.addEventListener('change', handleChange);
    } else {
      setIsDark(mode === 'dark');
    }

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  const theme = createTheme({
    typography: {
      fontFamily: '"Plus Jakarta Sans", "Inter", "Roboto", sans-serif',
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 10,
    },
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: isDark ? '#2DD4BF' : '#0D9488', // Teal
        light: isDark ? '#5EEAD4' : '#2DD4BF',
        dark: isDark ? '#0F766E' : '#0F766E',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: isDark ? '#FB923C' : '#F97316', // Orange
        light: isDark ? '#FDBA74' : '#FB923C',
        dark: isDark ? '#C2410C' : '#EA580C',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isDark ? '#111827' : '#FFFFFF',
        paper: isDark ? '#1F2937' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#F9FAFB' : '#111827',
        secondary: isDark ? '#D1D5DB' : '#4B5563',
      },
      error: {
        main: isDark ? '#F87171' : '#EF4444', // Red
        light: isDark ? '#FCA5A5' : '#F87171',
        dark: isDark ? '#B91C1C' : '#DC2626',
      },
      warning: {
        main: isDark ? '#FBBF24' : '#F59E0B', // Amber
        light: isDark ? '#FCD34D' : '#FBBF24',
        dark: isDark ? '#B45309' : '#D97706',
      },
      info: {
        main: isDark ? '#38BDF8' : '#0EA5E9', // Sky blue
        light: isDark ? '#7DD3FC' : '#38BDF8',
        dark: isDark ? '#0369A1' : '#0284C7',
      },
      success: {
        main: isDark ? '#34D399' : '#10B981', // Emerald
        light: isDark ? '#6EE7B7' : '#34D399',
        dark: isDark ? '#047857' : '#059669',
      },
      divider: isDark ? 'rgba(209, 213, 219, 0.12)' : 'rgba(17, 24, 39, 0.08)',
      action: {
        hover: isDark ? 'rgba(209, 213, 219, 0.08)' : 'rgba(17, 24, 39, 0.04)',
        selected: isDark ? 'rgba(209, 213, 219, 0.16)' : 'rgba(17, 24, 39, 0.08)',
        disabled: isDark ? 'rgba(209, 213, 219, 0.3)' : 'rgba(17, 24, 39, 0.26)',
        disabledBackground: isDark ? 'rgba(209, 213, 219, 0.12)' : 'rgba(17, 24, 39, 0.08)',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1F2937' : '#0D9488',
            backgroundImage: 'none',
            boxShadow: 'none',
            borderBottom: isDark 
              ? '1px solid rgba(209, 213, 219, 0.12)'
              : '1px solid rgba(17, 24, 39, 0.08)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRight: isDark 
              ? '1px solid rgba(209, 213, 219, 0.12)'
              : '1px solid rgba(17, 24, 39, 0.08)',
            boxShadow: 'none',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 16,
            border: isDark 
              ? '1px solid rgba(209, 213, 219, 0.12)'
              : '1px solid rgba(17, 24, 39, 0.08)',
            boxShadow: 'none',
            transition: 'transform 0.2s ease-in-out, border-color 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: isDark ? '#2DD4BF' : '#0D9488',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: '0.9375rem',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              '& fieldset': {
                borderWidth: '1.5px',
              },
              '&:hover fieldset': {
                borderWidth: '1.5px',
              },
              '&.Mui-focused fieldset': {
                borderWidth: '1.5px',
              },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 16,
            border: isDark 
              ? '1px solid rgba(209, 213, 219, 0.12)'
              : '1px solid rgba(17, 24, 39, 0.08)',
            boxShadow: 'none',
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 12,
            border: isDark 
              ? '1px solid rgba(209, 213, 219, 0.12)'
              : '1px solid rgba(17, 24, 39, 0.08)',
            boxShadow: isDark
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderRadius: 20,
            border: isDark 
              ? '1px solid rgba(209, 213, 219, 0.12)'
              : '1px solid rgba(17, 24, 39, 0.08)',
            boxShadow: isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
              : '0 25px 50px -12px rgba(17, 24, 39, 0.25)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            height: 32,
            fontSize: '0.875rem',
            fontWeight: 500,
            '&.MuiChip-outlined': {
              borderWidth: '1.5px',
            },
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            marginBottom: 4,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            border: '1.5px solid',
          },
        },
      },
    },
  });

  const toggleTheme = () => {
    setMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'auto';
      return 'light';
    });
  };

  const setThemeMode = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, theme, toggleTheme, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 