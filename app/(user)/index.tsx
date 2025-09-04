import Logout from '@/components/Logout';
import DocumentManagementDashboard from '@/components/Users/EntryPage';
import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SuperAdminDashboard() {
  
  return (
    <>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      
      <SafeAreaView style={styles.container} edges={['top']}>
        <Logout />
        <DocumentManagementDashboard />
        
        {/* Add bottom safe area manually */}
        <View style={styles.bottomSafeArea} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  bottomSafeArea: {
    backgroundColor: '#f5f5f5',
    height: 0, // SafeAreaView will handle this
  },
});
