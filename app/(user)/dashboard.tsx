import DocumentManagementDashboard from '@/components/Users/EntryPage';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';


export default function SuperAdminDashboard() {
  return (
        // <SafeAreaView style={{ flex: 1 }}>
          <DocumentManagementDashboard />
        // </SafeAreaView>
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
