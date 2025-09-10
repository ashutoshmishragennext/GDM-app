// components/Dashboard.tsx
import { useAuth } from '@/context/AuthContext';
import React, { useEffect, useState } from 'react';
import {
  Alert, // Add Modal import
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedView } from './utils/ThemeComponents';
import { useTheme  } from '@/context/ThemeContext';
import { apiService } from '@/api';
export default function Dashboard() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [orgLogo, setOrgLogo] = useState<string | null | undefined>(null);
  const {theme,setTheme} = useTheme();

  
  const fetchOrganizationLogo = async () => {
    const data = await apiService.getOrganizationById(user?.organizationId ? user.organizationId : '',);
    setOrgLogo(data.logo)
    //  red , blue ,green , purple , pink , indigo , yellow
    if(data.themecolor === "red") {
      setTheme(0);
    } else if (data.themecolor === "blue")
      setTheme(1);
      else if(data.themecolor === "green")
        setTheme(2)
      else if(data.themecolor === "purple")
        setTheme(3)
      else if(data.themecolor === "pink")
        setTheme(4)
      else if(data.themecolor === "indigo")
        setTheme(5)
      else if(data.themecolor === "yellow")
        setTheme(6)
      else 
        setTheme(1)
  }

  useEffect(() => {
    fetchOrganizationLogo();
  }, [])
  const handleLogout = () => {
    setShowDropdown(false);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const closeDropdown = () => {
    setShowDropdown(false);
  };

  return (
    <SafeAreaView>
      {/* Header */}
      <View style={styles.header}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Image
              source={{ uri: orgLogo ? orgLogo : 'https://www.gennextit.com/assets/Frontend/logo/Gennextlogoxdarkblue.png' }}
              height={32}
              width={130}
            />
          </View>

        </View>

        {/* User Menu Section */}
        <View style={styles.userMenuContainer}>
          <TouchableOpacity
            style={styles.userButton}
            onPress={toggleDropdown}
            activeOpacity={0.7}
          >
            <ThemedView
              variant="transparent"
              style={[styles.avatar, {
                backgroundColor: theme.colors.primary,
              }]}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase()}
              </Text>
            </ThemedView>

            {/* <Text style={styles.userName}>{user?.name}</Text> */}

            {/* <Text style={[styles.dropdownArrow, showDropdown && styles.dropdownArrowUp]}>
              ▼
            </Text> */}
          </TouchableOpacity>

          {/* Use Modal instead of absolute positioning */}
          <Modal
            visible={showDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={closeDropdown}
          >
            <TouchableOpacity
              className=''
              style={styles.modalOverlay}
              onPress={closeDropdown}
              activeOpacity={1}
            >
              <View style={styles.dropdownContainer}>
                {/* <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    closeDropdown();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemText}>Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    closeDropdown();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownItemText}>Settings</Text>
                </TouchableOpacity> */}

                <View style={styles.dropdownSeparator} />

                <TouchableOpacity
                  style={[styles.dropdownItem, styles.logoutItem]}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dropdownItemText, styles.logoutText]}>
                    Logout
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderBottomColor: '#eee',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // Logo Styles
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoPlaceholder: {
    height: 40,
    width: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // User Menu Styles
  userMenuContainer: {
    position: 'relative',
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
    transform: [{ rotate: '0deg' }],
  },
  dropdownArrowUp: {
    transform: [{ rotate: '180deg' }],
  },

  // Modal and Dropdown Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 30, // Adjust based on your header height
    paddingRight: 20,
  },
  dropdownContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    minWidth: 150,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownSeparator: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 8,
  },
  logoutItem: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  logoutText: {
    color: '#ff4444',
    fontWeight: '600',
  },

  // Content Styles
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  userCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});
