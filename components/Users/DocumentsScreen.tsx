import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  Image, 
  Dimensions, 
  Linking,
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

const detailOrder = [
  { key: "Date Time", label: "Date" },
];

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

const renderClickableValue = (
  value: any, 
  fieldType: string, 
  theme: any, 
  isInline: boolean = true
) => {
  const stringValue = String(value);
  
  switch (fieldType) {
    case 'email':
      return (
        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${stringValue}`)}
          className={`flex-row items-center gap-1 ${isInline ? 'justify-end' : ''}`}
        >
          <Text className="text-base">✉️</Text>
          <Text className={`text-${theme.name}-600 underline font-semibold break-all`}>
            {stringValue}
          </Text>
        </TouchableOpacity>
      );
    
    case 'phone':
    case 'landline':
      const phoneData = formatPhoneNumber(stringValue);
      return (
        <TouchableOpacity
          onPress={() => Linking.openURL(`tel:${phoneData.tel}`)}
          className={`flex-row items-center gap-1 ${isInline ? 'justify-end' : ''}`}
        >
          <Text className="text-base">📞</Text>
          <Text className="text-green-600 underline font-semibold break-all">
            {phoneData.display}
          </Text>
        </TouchableOpacity>
      );
    
    default:
      return (
        <Text className={`font-semibold text-gray-800 break-words ${isInline ? 'text-right' : 'text-left'}`}>
          {stringValue}
        </Text>
      );
  }
};

const getDetailRows = (metadata: Record<string, any>, schema?: MetadataSchema | null) => {
  const excludedKeys = ['amount', 'amount paid', 'user name'];
  const rows: { label: string; value: any; highlight?: boolean; fieldType: string; key: string }[] = [];

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
          displayValue = date.toLocaleDateString();
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

  return rows;
};

const getImages = (metadata: Record<string, any>) => {
  const imageField = Object.values(metadata).find(value => 
    Array.isArray(value) && value.every(item => typeof item === 'string' && item.startsWith('http'))
  );
  return (imageField as string[] | undefined) || [];
};

const DocumentDetailsScreen: React.FC<DocumentDetailsScreenProps> = ({ 
  document: doc, 
  onBack, 
  schema 
}) => {
  const { theme } = useTheme();
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const metadata = doc.metadata || {};
  const detailRows = getDetailRows(metadata, schema);
  const images = getImages(metadata);

  const handleNextImage = () => {
    if (enlargedImageIndex !== null) {
      setEnlargedImageIndex((enlargedImageIndex + 1) % images.length);
    }
  };

  const handlePrevImage = () => {
    if (enlargedImageIndex !== null) {
      setEnlargedImageIndex((enlargedImageIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <ThemedView variant="background" style={{ flex: 1 }}>
      <ThemedView style={[
        // styles.desktopNav,
        { 
          backgroundColor: theme.colors.primary,
          borderRightColor: theme.colors.border,
        }
      ]} className={`min-h-screen py-4 px-3 pb-24`}>
        <ThemedView className="bg-white rounded-2xl shadow-2xl flex-1 overflow-hidden max-w-full w-full min-h-[500px]">
          <ThemedView className="bg-white flex-1" style={{ minHeight: 400 }}>
            
            {/* Header Section */}
            <ThemedView className="bg-red-500 relative">
              <ThemedView className="py-4 sm:py-6 text-left border-b-2 border-gray-300 pb-3">
                <ThemedText 
                  size="xl" 
                  weight="bold" 
                  className="text-gray-800 mb-1 pl-3"
                  style={{ flexWrap: 'wrap' }}
                >
                  {doc.documentType?.name || "Document Details"}
                </ThemedText>
                
                {/* Image Button */}
                {images.length > 0 && (
                  <ThemedView className="absolute right-2 top-3">
                    <TouchableOpacity
                      onPress={() => {
                        setCurrentImageIndex(0);
                        setShowImageModal(true);
                      }}
                      className={`flex-row items-center gap-2 bg-${theme.name}-500 px-4 py-2 rounded-lg`}
                    >
                      <Text className="text-white">👁️</Text>
                      <Text className="text-white font-medium">
                        Image ({images.length})
                      </Text>
                    </TouchableOpacity>
                  </ThemedView>
                )}
              </ThemedView>
            </ThemedView>

            {/* Detail Rows Section */}
            <ScrollView className="flex-1 px-4 pt-2 border-t border-gray-200 bg-gray-50">
              <ThemedView className="space-y-2 pb-4">
                {detailRows.map((row, idx) => {
                  if (!row) return null;
                  
                  const isInline = shouldUseInlineLayout(row.key, row.value, row.fieldType);
                  
                  return (
                    <ThemedView 
                      key={idx}
                      className={`py-2 border-b border-gray-200 ${
                        isInline ? 'flex-row justify-between items-start gap-3' : 'flex-col gap-1'
                      }`}
                    >
                      <Text className={`text-gray-600 font-medium text-sm ${isInline ? 'min-w-[100px] max-w-[120px]' : ''}`}>
                        {row.label}
                      </Text>
                      <ThemedView className={`flex-1 ${isInline ? 'min-w-0' : ''}`}>
                        {renderClickableValue(row.value, row.fieldType, theme, isInline)}
                      </ThemedView>
                    </ThemedView>
                  );
                })}
              </ThemedView>
            </ScrollView>

            {/* Back Button */}
            <ThemedView className="flex justify-center p-4 bg-white">
              <TouchableOpacity 
                onPress={onBack}
                className={`flex-row items-center justify-center gap-2 border border-${theme.name}-300 px-6 py-2 rounded-lg`}
              >
                <Text className={`text-${theme.name}-700`}>←</Text>
                <Text className={`text-${theme.name}-700 font-medium`}>Back</Text>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Image Modal */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <ThemedView className="flex-1 bg-black/95 items-center justify-center p-4">
          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <TouchableOpacity
                className="absolute left-4 top-1/2 -mt-6 p-3 bg-white/20 rounded-full"
                onPress={() => {
                  setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                }}
              >
                <Text className="text-white text-2xl">‹</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="absolute right-4 top-1/2 -mt-6 p-3 bg-white/20 rounded-full"
                onPress={() => {
                  setCurrentImageIndex((prev) => (prev + 1) % images.length);
                }}
              >
                <Text className="text-white text-2xl">›</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Main Image */}
          <ThemedView className="relative max-w-[90vw] max-h-[90vh] items-center justify-center">
            <Image
              source={{ uri: images[currentImageIndex] }}
              style={{ 
                width: width * 0.9, 
                height: height * 0.7,
                borderRadius: 8
              }}
              resizeMode="contain"
            />
          </ThemedView>

          {/* Close Button */}
          <TouchableOpacity
            className="absolute top-12 right-4 p-3 bg-white/20 rounded-full"
            onPress={() => setShowImageModal(false)}
          >
            <Text className="text-white text-2xl">×</Text>
          </TouchableOpacity>

          {/* Image Counter */}
          <ThemedView className="absolute bottom-4 bg-black/70 px-4 py-2 rounded-lg">
            <Text className="text-white text-sm text-center">
              {currentImageIndex + 1} of {images.length}
            </Text>
            <Text className="text-gray-300 text-xs mt-1 text-center max-w-[250px]">
              {doc.documentType?.name || 'Document'}
            </Text>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
};

export default DocumentDetailsScreen;
