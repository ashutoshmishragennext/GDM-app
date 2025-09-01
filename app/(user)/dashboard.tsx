import Logout from '@/components/Logout';
import DocumentManagementDashboard from '@/components/Users/EntryPage';
import React, { useEffect } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SuperAdminDashboard() {
  
  useEffect(() => {
    const setupEdgeToEdge = async () => {
      if (Platform.OS === 'android') {
        try {
          // Only use methods that work with edge-to-edge
          await NavigationBar.setVisibilityAsync('hidden');
          
          // These methods work with edge-to-edge:
          await NavigationBar.setButtonStyleAsync('dark'); // or 'light'
          
          // Make navigation bar transparent (this works)
          await NavigationBar.setBackgroundColorAsync('transparent');
        } catch (error) {
          console.error('Navigation bar setup error:', error);
        }
      }
    };
    
    setupEdgeToEdge();
  }, []);

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

// import Logout from '@/components/Logout';
// import DocumentManagementDashboard from '@/components/Users/EntryPage';
// import React, { useEffect } from 'react';
// import { Platform, StatusBar, StyleSheet, View } from 'react-native';
// import * as NavigationBar from 'expo-navigation-bar';

// export default function SuperAdminDashboard() {
  
//   useEffect(() => {
//     const setImmersiveMode = async () => {
//       if (Platform.OS === 'android') {
//         try {
//           // Hide navigation bar with swipe-up gesture
//           await NavigationBar.setVisibilityAsync('hidden');
//           await NavigationBar.setBehaviorAsync('overlay-swipe');
          
//           // Optional: Set position to absolute for full immersion
//           await NavigationBar.setPositionAsync('absolute');
          
//           // Optional: Set background color
//           await NavigationBar.setBackgroundColorAsync('#f5f5f5');
//         } catch (error) {
//           console.error('Navigation bar configuration error:', error);
//         }
//       }
//     };
    
//     setImmersiveMode();
//   }, []);

//   return (
//     <>
//       <StatusBar 
//         barStyle="dark-content"
//         backgroundColor="transparent"
//         translucent={true}
//       />
      
//       <View style={styles.container}>
//         <Logout />
//         <DocumentManagementDashboard />
//       </View>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//     paddingTop: StatusBar.currentHeight || 0, // Handle status bar manually
//   },
//   menuItem: {
//     padding: 16,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderLeftWidth: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
// });
