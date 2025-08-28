import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Dashboard from '@/components/Dashboard';
import { apiService } from '@/api';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView, ThemedText, ThemedButton } from '@/components/utils/ThemeComponents';

const SuperAdminContent = () => {
const { setTheme, theme } = useTheme();
  
  const [call, setCall] = React.useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      const users = await apiService.getUsers();
      console.log("hello");
      console.log("user data", users);
    };
    loadUsers();
  }, [call]);
  
  // Set theme to 3 (Purple) on component mount
  useEffect(() => {
    setTheme(3);
  }, [call]);

  return (
    <ThemedView variant="transparent" style={{ flex: 1 }}>
      <ThemedText size="lg" weight="bold" style={{ marginBottom: theme.spacing.md ,color: theme.colors.primary}}>
        Admin Management
      </ThemedText>
      
      {/* Manage Admins Button */}
      <TouchableOpacity 
        style={[
          styles.menuItem, 
          { 
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.border,
            borderLeftColor: theme.colors.error,
            marginBottom: theme.spacing.md,
          }
        ]}
        onPress={() => setCall(!call)}
      >
        <ThemedText size="base" weight="medium">
          Manage Admins
        </ThemedText>
      </TouchableOpacity>

      {/* View All Users Button */}
      <TouchableOpacity 
        style={[
          styles.menuItem, 
          { 
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.border,
            borderLeftColor: theme.colors.success,
            marginBottom: theme.spacing.md,
          }
        ]}
      >
        <ThemedText size="base" weight="medium">
          View All Users
        </ThemedText>
      </TouchableOpacity>

      {/* System Settings Button */}
      <TouchableOpacity 
        style={[
          styles.menuItem, 
          { 
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.border,
            borderLeftColor: theme.colors.info,
            marginBottom: theme.spacing.md,
          }
        ]}
      >
        <ThemedText size="base" weight="medium">
          System Settings
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

export default function SuperAdminDashboard() {
  return (
    <Dashboard 
      title="Super Admin Dashboard" 
      roleSpecificContent={<SuperAdminContent />} 
    />
  );
}

const styles = StyleSheet.create({
  menuItem: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
