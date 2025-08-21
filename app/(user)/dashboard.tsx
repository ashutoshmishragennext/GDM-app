import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Dashboard from '@/components/Dashboard';

const SuperAdminContent = () => (
  <View style={styles.adminContent}>
    <Text style={styles.sectionTitle}>User Panel</Text>
    
    
  </View>
);

export default function SuperAdminDashboard() {
  return (
    <Dashboard 
      title="Super Admin Dashboard" 
      roleSpecificContent={<SuperAdminContent />} 
    />
  );
}

const styles = StyleSheet.create({
  adminContent: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  menuItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  superAdminItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  adminItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#4ecdc4',
  },
  userItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#45b7d1',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});