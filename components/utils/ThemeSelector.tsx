import React from 'react';
import { View, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView, ThemedText, ThemedButton } from './ThemeComponents';

export const ThemeSelector: React.FC = () => {
  const { theme, themeId, setTheme, availableThemes } = useTheme();

  return (
    <ThemedView variant="surface" padding="lg" borderRadius="lg" shadow>
      <ThemedText size="lg" weight="bold" style={{ marginBottom: 16 }}>
        Choose Theme
      </ThemedText>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {availableThemes.map((themeOption) => (
            <ThemedButton
              key={themeOption.id}
              variant={themeId === themeOption.id ? 'primary' : 'outline'}
              size="sm"
              onPress={() => setTheme(themeOption.id)}
              style={{
                backgroundColor: themeId === themeOption.id 
                  ? themeOption.colors.primary 
                  : 'transparent',
                borderColor: themeOption.colors.primary,
                minWidth: 80,
              }}
            >
              <ThemedText 
                style={{ 
                  color: themeId === themeOption.id 
                    ? '#FFFFFF' 
                    : themeOption.colors.primary 
                }}
                weight="medium"
              >
                {themeOption.name}
              </ThemedText>
            </ThemedButton>
          ))}
        </View>
      </ScrollView>

      <View style={{ marginTop: 16, padding: 12, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md }}>
        <ThemedText style={{ color: '#FFFFFF' }} weight="medium">
          Current: {theme.name} Theme
        </ThemedText>
      </View>
    </ThemedView>
  );
};
