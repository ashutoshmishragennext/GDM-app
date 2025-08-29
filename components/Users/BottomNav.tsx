import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView, ThemedText } from '@/components/utils/ThemeComponents';

interface BottomNavProps {
  onHome: () => void;
  onForm: () => void;
  onSummary: () => void;
  active: 'home' | 'form' | 'summary';
}

const BottomNav: React.FC<BottomNavProps> = ({ 
  onHome, 
  onForm, 
  onSummary, 
  active 
}) => {
  const { theme } = useTheme();

  const NavButton = ({ 
    onPress, 
    icon, 
    label, 
    isActive 
  }: { 
    onPress: () => void; 
    icon: string; 
    label: string; 
    isActive: boolean; 
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.navButton,
        {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.xs,
        }
      ]}
      activeOpacity={0.7}
    >
      <ThemedText 
        size="2xl" 
        style={styles.navIcon}
      >
        {icon}
      </ThemedText>
      <ThemedText 
        size="xs" 
        weight="semibold"
        style={{ 
          color: isActive ? theme.colors.primary : theme.colors.textSecondary,
          marginTop: theme.spacing.xs / 2
        }}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <ThemedView
      variant="background"
      style={[
        styles.bottomNav,
        {
          borderTopColor: theme.colors.border,
          paddingVertical: theme.spacing.sm,
          shadowColor: theme.colors.shadow,
          elevation: 8,
        }
      ]}
    >
      <NavButton
        onPress={onHome}
        icon="🏠"
        label="Home"
        isActive={active === 'home'}
      />
      
      <NavButton
        onPress={onForm}
        icon="📝"
        label="Form"
        isActive={active === 'form'}
      />
      
      <NavButton
        onPress={onSummary}
        icon="📄"
        label="Summary"
        isActive={active === 'summary'}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    zIndex: 50,
    // Hide on larger screens (tablet/desktop equivalent)
    display: Platform.select({
      web: 'none', // Hide on web for desktop experience
      default: 'flex', // Show on mobile
    }),
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  navIcon: {
    fontSize: 24,
  },
});

export default BottomNav;
