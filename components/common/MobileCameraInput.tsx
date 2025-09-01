import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView, ThemedText } from '@/components/utils/ThemeComponents';

const { width } = Dimensions.get('window');

interface CameraGalleryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (files: any) => void;
  accept?: string;
  multiple?: boolean;
}

const CameraGalleryPopup: React.FC<CameraGalleryPopupProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  accept = "image/*",
  multiple = true
}) => {
  const { theme } = useTheme();

  const handleCameraPress = async () => {
    console.log('Camera button pressed!');
    
    try {
      // Request camera permissions
      console.log('Requesting camera permissions...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status);
      
      if (status !== 'granted') {
        alert('Sorry, we need camera permissions to take photos!');
        return;
      }

      console.log('Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Try reverting to original
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets) {
        console.log('Processing camera assets:', result.assets);
        const files = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `camera_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          width: asset.width,
          height: asset.height,
        }));
        
        console.log('Mapped files for camera:', files);
        onFileSelect(files);
        onClose();
      } else {
        console.log('Camera was canceled or no assets');
      }
    } catch (error) {
      console.error('Error in handleCameraPress:', error);
    }
  };

  const handleGalleryPress = async () => {
    console.log('Gallery button pressed!');
    
    try {
      // Request media library permissions
      console.log('Requesting media library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('Media library permission status:', status);
      
      if (status !== 'granted') {
        alert('Sorry, we need gallery permissions to select photos!');
        return;
      }

      console.log('Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Try reverting to original
        allowsEditing: !multiple, // Allow editing only for single selection
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: multiple,
      });

      console.log('Gallery result:', result);

      if (!result.canceled && result.assets) {
        console.log('Processing gallery assets:', result.assets);
        const files = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: asset.fileName || `gallery_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          width: asset.width,
          height: asset.height,
        }));
        
        console.log('Mapped files for gallery:', files);
        onFileSelect(files);
        onClose();
      } else {
        console.log('Gallery was canceled or no assets');
      }
    } catch (error) {
      console.error('Error in handleGalleryPress:', error);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity 
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.popupContainer}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <ThemedView 
                variant="surface"
                style={[
                  styles.popup,
                  { 
                    backgroundColor: theme.colors.surface,
                    borderTopLeftRadius: theme.borderRadius.xl,
                    borderTopRightRadius: theme.borderRadius.xl,
                  }
                ]}
              >
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                  <ThemedText 
                    size="lg" 
                    weight="semibold"
                    style={{ color: theme.colors.text }}
                  >
                    Select Image Source
                  </ThemedText>
                  <TouchableOpacity
                    onPress={onClose}
                    style={[
                      styles.closeButton,
                      { backgroundColor: `${theme.colors.textSecondary}10` }
                    ]}
                  >
                    <Text style={[styles.closeIcon, { color: theme.colors.textSecondary }]}>×</Text>
                  </TouchableOpacity>
                </View>

                {/* Options */}
                <View style={[styles.optionsContainer, { padding: theme.spacing.lg }]}>
                  {/* Camera Option */}
                  <TouchableOpacity
                    onPress={handleCameraPress}
                    style={[
                      styles.option,
                      {
                        backgroundColor: `${theme.colors.primary}10`,
                        borderColor: `${theme.colors.primary}30`,
                        borderRadius: theme.borderRadius.xl,
                        padding: theme.spacing.lg,
                      }
                    ]}
                    activeOpacity={0.8}
                  >
                    <View 
                      style={[
                        styles.optionIcon,
                        { 
                          backgroundColor: theme.colors.primary,
                          marginBottom: theme.spacing.sm,
                        }
                      ]}
                    >
                      <Text style={[styles.iconText, { color: theme.colors.background }]}>📷</Text>
                    </View>
                    <ThemedText 
                      size="base" 
                      weight="medium"
                      style={{ color: theme.colors.text }}
                    >
                      Camera
                    </ThemedText>
                    <ThemedText 
                      size="sm"
                      style={{ 
                        color: theme.colors.textSecondary,
                        textAlign: 'center',
                        marginTop: theme.spacing.xs,
                      }}
                    >
                      Take a photo
                    </ThemedText>
                  </TouchableOpacity>

                  {/* Gallery Option */}
                  <TouchableOpacity
                    onPress={handleGalleryPress}
                    style={[
                      styles.option,
                      {
                        backgroundColor: `${theme.colors.success}10`,
                        borderColor: `${theme.colors.success}30`,
                        borderRadius: theme.borderRadius.xl,
                        padding: theme.spacing.lg,
                      }
                    ]}
                    activeOpacity={0.8}
                  >
                    <View 
                      style={[
                        styles.optionIcon,
                        { 
                          backgroundColor: theme.colors.success,
                          marginBottom: theme.spacing.sm,
                        }
                      ]}
                    >
                      <Text style={[styles.iconText, { color: theme.colors.background }]}>🖼️</Text>
                    </View>
                    <ThemedText 
                      size="base" 
                      weight="medium"
                      style={{ color: theme.colors.text }}
                    >
                      Gallery
                    </ThemedText>
                    <ThemedText 
                      size="sm"
                      style={{ 
                        color: theme.colors.textSecondary,
                        textAlign: 'center',
                        marginTop: theme.spacing.xs,
                      }}
                    >
                      {multiple ? 'Choose photos' : 'Choose a photo'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>

              </ThemedView>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  popupContainer: {
    justifyContent: 'flex-end',
  },
  popup: {
    width: '100%',
    maxWidth: width,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 120,
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 32,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    paddingBottom: 32, // Extra padding for safe area
  },
  cancelButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
});

export default CameraGalleryPopup;