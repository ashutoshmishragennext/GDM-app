import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Dashboard from '@/components/Dashboard';
import { apiService } from '@/api';

const SuperAdminContent = () => {
  const [call , setCall] = React.useState(false);
  useEffect(() => {
    const loadUsers = async () => {
      const users = await apiService.getUsers();
      console.log("hello");
      
      console.log("user data" , users);
    };
    loadUsers();
  }, [call]);
  return (
    <View className='' style={styles.adminContent}>
      <Text style={styles.sectionTitle}>Admin Management</Text>
      <TouchableOpacity style={[styles.menuItem, styles.superAdminItem]}>
        <Text onPress={() => {setCall(!call)}} style={styles.menuText}>Manage Admins</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.menuItem, styles.adminItem]}>
        <Text style={styles.menuText}>View All Users</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.menuItem, styles.userItem]}>
        <Text style={styles.menuText}>System Settings</Text>
      </TouchableOpacity>
    </View>
  )
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