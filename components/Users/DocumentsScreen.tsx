import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Linking,
  Dimensions,
  Alert
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView, ThemedText } from '@/components/utils/ThemeComponents';

const { width, height } = Dimensions.get('window');

export interface Document {
  id: string;
  filename: string;
  createdAt: string;
  mimeType: string;
  documentType: {
    id: string;
    name: string;
  };
  documentTypeId: string;
  updatedAt: string;
  uploadThingUrl?: string;
  metadata?: Record<string, any>;
  verificationStatus: string;
}

interface MetadataField {
  type: string;
  description: string;
  priority?: number;
}

interface MetadataSchema {
  type: string;
  required: string[];
  properties: Record<string, MetadataField>;
}

interface DocumentDetailsScreenProps {
  document: Document;
  onBack: () => void;
  schema?: MetadataSchema | null;
}

const DocumentDetailsScreen: React.FC<DocumentDetailsScreenProps> = ({ 
  document: doc, 
  onBack, 
  schema 
}) => {
  const { theme } = useTheme();
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);

  const metadata = doc.metadata || {};

  const detailOrder = [
    { key: "Mode Of Payment", label: "Payment Mode" },
    { key: "Account No", label: "Account Number" },
    { key: "Card No", label: "Card Number" },
    { key: "Bank Name", label: "Bank Name" },
    { key: "Bill No", label: "Bill Number" },
    { key: "Paid to", label: "Paid To" },
    { key: "Purpose of Payment", label: "Purpose" },
    { key: "Date Time", label: "Date & Time" },
    { key: "User Name", label: "User Name" },
  ];

  // Helper function to get field type from schema
  const getFieldType = (key: string, schema?: MetadataSchema | null): string => {
    if (!schema?.properties) return 'string';
    
    if (schema.properties[key]) {
      return schema.properties[key].type;
    }
    
    const matchingKey = Object.keys(schema.properties).find(
      schemaKey => schemaKey.toLowerCase() === key.toLowerCase()
    );
    
    if (matchingKey) {
      return schema.properties[matchingKey].type;
    }
    
    return 'string';
  };

  // Helper function to determine if field should use inline layout
  const shouldUseInlineLayout = (key: string, value: any, fieldType: string): boolean => {
    const stringValue = String(value);
    
    if (fieldType === 'description' || fieldType === 'textarea' || fieldType === 'longtext') {
      return false;
    }
    
    if (stringValue.length > 50) {
      return false;
    }
    
    if (key.toLowerCase().includes('address')) {
      return false;
    }
    
    return true;
  };

  // Helper function to format phone numbers
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return { display: '', tel: '' };
    
    const sanitized = phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    
    let telNumber = sanitized;
    if (sanitized.startsWith('0')) {
      telNumber = sanitized.substring(1);
    }
    if (!telNumber.startsWith('+') && telNumber.length >= 10) {
      telNumber = `+91${telNumber}`;
    }
    
    return {
      display: sanitized,
      tel: telNumber
    };
  };

  // Helper function to render clickable value based on field type
  const renderClickableValue = (value: any, fieldType: string, isInline: boolean = true) => {
    const stringValue = String(value);
    
    const baseStyle = {
      color: theme.colors.text,
      textAlign: isInline ? 'right' : 'left' as const,
      flex: 1,
    };
    
    switch (fieldType) {
      case 'email':
        return (
          <TouchableOpacity 
            onPress={() => Linking.openURL(`mailto:${stringValue}`)}
            style={{ flex: 1, alignItems: isInline ? 'flex-end' : 'flex-start' }}
          >
            <View style={styles.clickableValueContainer}>
              <ThemedText style={styles.clickableIcon}>✉️</ThemedText>
              <ThemedText 
                size="base" 
                style={{ 
                  color: theme.colors.primary, 
                  textDecorationLine: 'underline',
                  marginLeft: theme.spacing.xs 
                }}
              >
                {stringValue}
              </ThemedText>
            </View>
          </TouchableOpacity>
        );
      
      case 'phone':
      case 'landline':
        const phoneData = formatPhoneNumber(stringValue);
        return (
          <TouchableOpacity 
            onPress={() => Linking.openURL(`tel:${phoneData.tel}`)}
            style={{ flex: 1, alignItems: isInline ? 'flex-end' : 'flex-start' }}
          >
            <View style={styles.clickableValueContainer}>
              <ThemedText style={styles.clickableIcon}>📞</ThemedText>
              <ThemedText 
                size="base" 
                style={{ 
                  color: theme.colors.success, 
                  textDecorationLine: 'underline',
                  marginLeft: theme.spacing.xs 
                }}
              >
                {phoneData.display}
              </ThemedText>
            </View>
          </TouchableOpacity>
        );
      
      default:
        return (
          <ThemedText 
            size="base" 
            weight="medium"
          >
            {stringValue}
          </ThemedText>
        );
    }
  };

  const getDetailRows = (metadata: Record<string, any>, schema?: MetadataSchema | null) => {
    const excludedKeys = ['amount', 'amount paid'];
    const rows: { label: string; value: any; highlight?: boolean; fieldType: string; key: string }[] = [];

    // Add fields in the defined order
    detailOrder.forEach(({ key, label }) => {
      if (
        metadata[key] !== undefined &&
        metadata[key] !== null &&
        metadata[key] !== '' &&
        !Array.isArray(metadata[key]) &&
        !excludedKeys.includes(key.toLowerCase())
      ) {
        let displayValue = metadata[key];
        if (
          typeof displayValue === 'string' &&
          key.toLowerCase().includes('date')
        ) {
          const date = new Date(displayValue);
          if (!isNaN(date.getTime())) {
            displayValue = date.toLocaleString();
          }
        }
        rows.push({
          label,
          value: displayValue,
          highlight: key === 'Mode Of Payment',
          fieldType: getFieldType(key, schema),
          key,
        });
      }
    });

    // Add any extra fields not in the order array
    Object.entries(metadata).forEach(([key, value]) => {
      if (
        !detailOrder.some(item => item.key === key) &&
        value !== undefined &&
        value !== null &&
        value !== '' &&
        !Array.isArray(value) &&
        !excludedKeys.includes(key.toLowerCase())
      ) {
        rows.push({
          label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          value,
          highlight: false,
          fieldType: getFieldType(key, schema),
          key,
        });
      }
    });

    return rows;
  };

  const getImages = (metadata: Record<string, any>) => {
    const imageField = Object.values(metadata).find(value => 
      Array.isArray(value) && value.every(item => typeof item === 'string' && item.startsWith('http'))
    );
    return (imageField as string[] | undefined) || [];
  };

  const detailRows = getDetailRows(metadata, schema);
  const images = getImages(metadata);

  const handleNextImage = () => {
    if (enlargedImageIndex !== null) {
      setEnlargedImageIndex((prev) => (prev! + 1) % images.length);
    }
  };

  const handlePrevImage = () => {
    if (enlargedImageIndex !== null) {
      setEnlargedImageIndex((prev) => (prev! - 1 + images.length) % images.length);
    }
  };

  // Payment method badge component
  const PaymentMethodBadge = ({ method }: { method: string }) => {
    const getMethodColor = (method: string) => {
      const normalizedMethod = method?.toLowerCase();
      switch (normalizedMethod) {
        case 'cash':
          return theme.colors.success;
        case 'credit':
          return theme.colors.warning;
        case 'bank':
          return theme.colors.primary;
        case 'credit card':
          return theme.colors.info;
        default:
          return theme.colors.textSecondary;
      }
    };

    if (!method || method === '-') {
      return (
        <ThemedText size="base" style={{ color: theme.colors.textSecondary }}>
          -
        </ThemedText>
      );
    }

    return (
      <View 
        style={[
          styles.paymentBadge,
          { 
            backgroundColor: `${getMethodColor(method)}20`,
            borderColor: getMethodColor(method),
            borderRadius: theme.borderRadius.full,
          }
        ]}
      >
        <ThemedText 
          size="xs" 
          weight="semibold" 
          style={{ 
            color: getMethodColor(method),
            textTransform: 'uppercase',
          }}
        >
          {method}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView variant="background" style={{ flex: 1 }}>
      {/* Header */}
      <ThemedView 
        variant="transparent"
        style={[
          styles.header,
          { 
            backgroundColor: theme.colors.primary,
            paddingTop: theme.spacing.lg,
            paddingBottom: theme.spacing.md,
          }
        ]}
      >
        <TouchableOpacity 
          onPress={onBack} 
          style={[styles.backButton, { marginBottom: theme.spacing.sm }]}
        >
          <ThemedText style={[styles.backIcon, { color: theme.colors.background }]}>←</ThemedText>
          <ThemedText 
            size="lg" 
            weight="medium"
            style={{ 
              color: theme.colors.background, 
              marginLeft: theme.spacing.sm 
            }}
          >
            Back
          </ThemedText>
        </TouchableOpacity>
        
        <ThemedText 
          size="xl" 
          weight="bold" 
          style={{ 
            color: theme.colors.background,
            textAlign: 'center',
            marginBottom: theme.spacing.sm,
          }}
        >
          {doc.documentType?.name || "Document Details"}
        </ThemedText>
      </ThemedView>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { 
            padding: theme.spacing.md,
            paddingBottom: theme.spacing['3xl'], // Extra padding for navigation
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Details Section */}
        <ThemedView 
          variant="surface"
          style={[
            styles.detailsContainer,
            {
              borderRadius: theme.borderRadius.xl,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg,
              borderColor: theme.colors.border,
            }
          ]}
        >
          {detailRows.map((row, idx) => {
            if (!row) return null;
            
            const isInline = shouldUseInlineLayout(row.key, row.value, row.fieldType);
            
            return (
              <View 
                key={idx}
                style={[
                  isInline ? styles.fieldInline : styles.fieldBlock,
                  { 
                    borderBottomColor: theme.colors.border,
                    paddingVertical: theme.spacing.sm,
                  }
                ]}
              >
                <ThemedText
                  size="sm"
                  weight="medium"
                  style={{ 
                    color: theme.colors.textSecondary,
                    minWidth: isInline ? 120 : undefined,
                    maxWidth: isInline ? 150 : undefined,
                  }}
                >
                  {row.label}
                </ThemedText>
                
                <View style={{ flex: 1 }}>
                  {row.highlight && row.label === 'Payment Mode' ? (
                    <View style={{ alignItems: isInline ? 'flex-end' : 'flex-start' }}>
                      <PaymentMethodBadge method={String(row.value)} />
                    </View>
                  ) : (
                    renderClickableValue(row.value, row.fieldType, isInline)
                  )}
                </View>
              </View>
            );
          })}
        </ThemedView>

        {/* Attached Images Section */}
        {images.length > 0 && (
          <ThemedView 
            variant="surface"
            style={[
              styles.imagesContainer,
              {
                borderRadius: theme.borderRadius.xl,
                padding: theme.spacing.md,
                borderColor: theme.colors.border,
              }
            ]}
          >
            <ThemedText 
              size="lg" 
              weight="semibold" 
              style={{ 
                color: theme.colors.text,
                marginBottom: theme.spacing.md 
              }}
            >
              Attached Images
            </ThemedText>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: theme.spacing.sm }}
            >
              {images.map((url: string, idx: number) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.imageContainer}
                  onPress={() => setEnlargedImageIndex(idx)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: url }}
                    style={[
                      styles.thumbnailImage,
                      {
                        borderRadius: theme.borderRadius.lg,
                        borderColor: theme.colors.border,
                      }
                    ]}
                    resizeMode="cover"
                  />
                  <View 
                    style={[
                      styles.imageIndexBadge,
                      {
                        backgroundColor: theme.colors.primary,
                        borderRadius: theme.borderRadius.full,
                      }
                    ]}
                  >
                    <ThemedText 
                      size="xs" 
                      weight="bold" 
                      style={{ color: theme.colors.background }}
                    >
                      {idx + 1}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ThemedView>
        )}
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={enlargedImageIndex !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setEnlargedImageIndex(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setEnlargedImageIndex(null)}
          >
            {/* Navigation Buttons */}
            {images.length > 1 && enlargedImageIndex !== null && (
              <>
                <TouchableOpacity
                  style={[
                    styles.modalNavButton,
                    styles.modalNavButtonLeft,
                    { backgroundColor: `${theme.colors.shadow}80` }
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                >
                  <ThemedText style={[styles.navArrow, { color: theme.colors.background }]}>←</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.modalNavButton,
                    styles.modalNavButtonRight,
                    { backgroundColor: `${theme.colors.shadow}80` }
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                >
                  <ThemedText style={[styles.navArrow, { color: theme.colors.background }]}>→</ThemedText>
                </TouchableOpacity>
              </>
            )}

            {/* Enlarged Image */}
            {enlargedImageIndex !== null && (
              <Image
                source={{ uri: images[enlargedImageIndex] }}
                style={[
                  styles.enlargedImage,
                  { borderRadius: theme.borderRadius.lg }
                ]}
                resizeMode="contain"
                onError={() => {
                  Alert.alert('Error', 'Failed to load image');
                  setEnlargedImageIndex(null);
                }}
              />
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.modalCloseButton,
                { backgroundColor: `${theme.colors.shadow}80` }
              ]}
              onPress={(e) => {
                e.stopPropagation();
                setEnlargedImageIndex(null);
              }}
            >
              <ThemedText style={[styles.closeIcon, { color: theme.colors.background }]}>×</ThemedText>
            </TouchableOpacity>

            {/* Image Info */}
            {enlargedImageIndex !== null && (
              <View 
                style={[
                  styles.modalImageInfo,
                  { backgroundColor: `${theme.colors.shadow}70` }
                ]}
              >
                <ThemedText 
                  size="sm" 
                  style={{ color: theme.colors.background }}
                >
                  {enlargedImageIndex + 1} of {images.length}
                </ThemedText>
                <ThemedText 
                  size="xs" 
                  style={{ 
                    color: theme.colors.background, 
                    opacity: 0.8,
                    marginTop: theme.spacing.xs / 2,
                  }}
                >
                  {doc.documentType?.name || 'Document'}
                </ThemedText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scrollContent: {
    flexGrow: 1,
  },
  detailsContainer: {
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  fieldInline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    gap: 12,
  },
  fieldBlock: {
    flexDirection: 'column',
    borderBottomWidth: 1,
    gap: 4,
  },
  clickableValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clickableIcon: {
    fontSize: 14,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  imagesContainer: {
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageContainer: {
    position: 'relative',
  },
  thumbnailImage: {
    width: 100,
    height: 100,
    borderWidth: 2,
  },
  imageIndexBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  enlargedImage: {
    width: width * 0.9,
    height: height * 0.7,
    maxWidth: width - 32,
    maxHeight: height - 32,
  },
  modalNavButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalNavButtonLeft: {
    left: 16,
  },
  modalNavButtonRight: {
    right: 16,
  },
  navArrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  closeIcon: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  modalImageInfo: {
    position: 'absolute',
    bottom: 50,
    left: '50%',
    transform: [{ translateX: -75 }],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 150,
  },
});

export default DocumentDetailsScreen;
