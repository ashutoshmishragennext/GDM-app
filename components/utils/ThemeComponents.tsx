import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle, TouchableOpacityProps, ViewProps, TextProps } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

// Themed View Component
interface ThemedViewProps extends ViewProps {
  variant?: 'background' | 'surface' | 'primary' | 'transparent';
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  margin?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: boolean;
}

export const ThemedView: React.FC<ThemedViewProps> = ({
  variant = 'transparent',
  padding,
  margin,
  borderRadius,
  shadow = false,
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'background': return theme.colors.background;
      case 'surface': return theme.colors.surface;
      case 'primary': return theme.colors.primary;
      default: return 'transparent';
    }
  };

  const themedStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    ...(padding && { padding: theme.spacing[padding] }),
    ...(margin && { margin: theme.spacing[margin] }),
    ...(borderRadius && { borderRadius: theme.borderRadius[borderRadius] }),
    ...(shadow && {
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  };

  return <View style={[themedStyle, style]} {...props} />;
};

// Themed Text Component
interface ThemedTextProps extends TextProps {
  variant?: 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'info';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy';
  font?: 'regular' | 'medium' | 'bold' | 'light';
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  variant = 'primary',
  size = 'base',
  weight = 'regular',
  font = 'regular',
  style,
  ...props
}) => {
  const { theme } = useTheme();

  const getTextColor = () => {
    switch (variant) {
      case 'primary': return theme.colors.text;
      case 'secondary': return theme.colors.textSecondary;
      case 'error': return theme.colors.error;
      case 'success': return theme.colors.success;
      case 'warning': return theme.colors.warning;
      case 'info': return theme.colors.info;
      default: return theme.colors.text;
    }
  };

  const themedStyle: TextStyle = {
    color: getTextColor(),
    fontSize: theme.fonts.sizes[size],
    fontWeight: theme.fonts.weights[weight],
    fontFamily: theme.fonts.families[font],
  };

  return <Text style={[themedStyle, style]} {...props} />;
};

// Themed Button Component
interface ThemedButtonProps extends TouchableOpacityProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  style,
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    };

    const sizeStyles = {
      sm: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
      md: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
      lg: { paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.lg },
    };

    const variantStyles = {
      primary: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.secondary,
      },
      outline: {
        backgroundColor: 'transparent',
        borderColor: theme.colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
      },
    };

    return { ...baseStyle, ...sizeStyles[size], ...variantStyles[variant] };
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return '#FFFFFF';
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity style={[getButtonStyle(), style]} {...props}>
      <ThemedText style={{ color: getTextColor() }} weight="medium">
        {children}
      </ThemedText>
    </TouchableOpacity>
  );
};
