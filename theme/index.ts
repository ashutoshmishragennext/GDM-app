// Theme Types (existing code remains the same)
export interface ColorPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  border: string;
  disabled: string;
  shadow: string;
}

export interface FontSizes {
  xs: number;
  sm: number;
  base: number;
  lg: number;
  xl: number;
  '2xl': number;
  '3xl': number;
  '4xl': number;
}

export interface FontWeights {
  light: 'light' | '300';
  regular: 'normal' | '400';
  medium: 'medium' | '500';
  semibold: '600';
  bold: 'bold' | '700';
  heavy: '800' | '900';
}

export interface Theme {
  id: number;
  name: string;
  colors: ColorPalette;
  fonts: {
    sizes: FontSizes;
    weights: FontWeights;
    families: {
      regular: string;
      medium: string;
      bold: string;
      light: string;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
}

// Theme 0 - Red Theme (existing)
const redTheme: Theme = {
  id: 0,
  name: 'Red',
  colors: {
    primary: '#DC2626',
    primaryLight: '#FCA5A5',
    primaryDark: '#991B1B',
    secondary: '#F59E0B',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827',
    textSecondary: '#6B7280',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
    border: '#E5E7EB',
    disabled: '#9CA3AF',
    shadow: '#00000020',
  },
  fonts: {
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
    families: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      light: 'System',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,  
    '2xl': 48,
    '3xl': 64,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

// Theme 1 - Blue Theme (existing)
const blueTheme: Theme = {
  id: 1,
  name: 'Blue',
  colors: {
    primary: '#3B82F6',
    primaryLight: '#93C5FD',
    primaryDark: '#1D4ED8',
    secondary: '#8B5CF6',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#0F172A',
    textSecondary: '#64748B',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#22C55E',
    info: '#06B6D4',
    border: '#E2E8F0',
    disabled: '#94A3B8',
    shadow: '#0F172A20',
  },
  fonts: {
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
    families: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      bold: 'Inter-Bold',
      light: 'Inter-Light',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    full: 9999,
  },
};

// Theme 2 - Green Theme (existing)
const greenTheme: Theme = {
  id: 2,
  name: 'Green',
  colors: {
    primary: '#059669',
    primaryLight: '#6EE7B7',
    primaryDark: '#047857',
    secondary: '#7C3AED',
    background: '#FFFFFF',
    surface: '#F0FDF4',
    text: '#064E3B',
    textSecondary: '#6B7280',
    error: '#DC2626',
    warning: '#D97706',
    success: '#10B981',
    info: '#0EA5E9',
    border: '#D1FAE5',
    disabled: '#9CA3AF',
    shadow: '#064E3B20',
  },
  fonts: {
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 17,
      xl: 19,
      '2xl': 23,
      '3xl': 29,
      '4xl': 35,
    },
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
    families: {
      regular: 'Roboto-Regular',
      medium: 'Roboto-Medium',
      bold: 'Roboto-Bold',
      light: 'Roboto-Light',
    },
  },
  spacing: {
    xs: 3,
    sm: 6,
    md: 12,
    lg: 20,
    xl: 28,
    '2xl': 40,
    '3xl': 56,
  },
  borderRadius: {
    sm: 3,
    md: 6,
    lg: 9,
    xl: 12,
    full: 9999,
  },
};

// Theme 3 - Purple Theme (existing)
const purpleTheme: Theme = {
  id: 3,
  name: 'Purple',
  colors: {
    primary: '#7C3AED',
    primaryLight: '#C4B5FD',
    primaryDark: '#5B21B6',
    secondary: '#EC4899',
    background: '#FEFEFE',
    surface: '#FAF5FF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    error: '#F87171',
    warning: '#FBBF24',
    success: '#34D399',
    info: '#60A5FA',
    border: '#E0E7FF',
    disabled: '#A1A1AA',
    shadow: '#7C3AED20',
  },
  fonts: {
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
    families: {
      regular: 'Poppins-Regular',
      medium: 'Poppins-Medium',
      bold: 'Poppins-Bold',
      light: 'Poppins-Light',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
};

// NEW THEMES:

// Theme 4 - Pink Theme
const pinkTheme: Theme = {
  id: 4,
  name: 'Pink',
  colors: {
    primary: '#EC4899',
    primaryLight: '#FBCFE8',
    primaryDark: '#BE185D',
    secondary: '#8B5CF6',
    background: '#FDF2F8',
    surface: '#FCE7F3',
    text: '#831843',
    textSecondary: '#9D174D',
    error: '#F43F5E',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
    border: '#FBCFE8',
    disabled: '#FDA4AF',
    shadow: '#EC489920',
  },
  fonts: {
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
    families: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      light: 'System',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  borderRadius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    full: 9999,
  },
};

// Theme 5 - Indigo Theme
const indigoTheme: Theme = {
  id: 5,
  name: 'Indigo',
  colors: {
    primary: '#4F46E5',
    primaryLight: '#818CF8',
    primaryDark: '#3730A3',
    secondary: '#7C3AED',
    background: '#EEF2FF',
    surface: '#E0E7FF',  
    text: '#312E81',
    textSecondary: '#4B5563',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#06B6D4',
    border: '#C7D2FE',
    disabled: '#9CA3AF',
    shadow: '#4F46E520',
  },
  fonts: {
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
    families: {
      regular: 'Inter-Regular',
      medium: 'Inter-Medium',
      bold: 'Inter-Bold',
      light: 'Inter-Light',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

// Theme 6 - Yellow Theme
const yellowTheme: Theme = {
  id: 6,
  name: 'Yellow',
  colors: {
    primary: '#F59E0B',
    primaryLight: '#FDE68A',
    primaryDark: '#D97706',
    secondary: '#F97316',
    background: '#FFFBEB',
    surface: '#FEF3C7',
    text: '#78350F',
    textSecondary: '#92400E',
    error: '#DC2626',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
    border: '#FDE68A',
    disabled: '#FBBF24',
    shadow: '#F59E0B20',
  },
  fonts: {
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 17,
      xl: 19,
      '2xl': 23,
      '3xl': 29,
      '4xl': 35,
    },
    weights: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      heavy: '800',
    },
    families: {
      regular: 'Roboto-Regular',
      medium: 'Roboto-Medium',
      bold: 'Roboto-Bold',
      light: 'Roboto-Light',
    },
  },
  spacing: {
    xs: 3,
    sm: 6,
    md: 12,
    lg: 20,
    xl: 28,
    '2xl': 40,
    '3xl': 56,
  },
  borderRadius: {
    sm: 5,
    md: 9,
    lg: 13,
    xl: 17,
    full: 9999,
  },
};

// Export all themes (updated to include new themes)
export const themes: Theme[] = [
  redTheme, 
  blueTheme, 
  greenTheme, 
  purpleTheme,
  pinkTheme,
  indigoTheme,
  yellowTheme
];

// Helper function to get theme by ID (existing)
export const getThemeById = (id: number): Theme => {
  return themes.find(theme => theme.id === id) || themes[0];
};

// Default theme (existing)
export const defaultTheme = themes[0];