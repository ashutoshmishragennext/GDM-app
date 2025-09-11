import { ThemedText, ThemedView } from '@/components/utils/ThemeComponents';
import { useTheme } from '@/context/ThemeContext';
import React, { useState } from 'react';
import {
    Dimensions,
    Image,
    Linking,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

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
          <Text className="text-blue-600 underline font-semibold break-all">
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const metadata = doc.metadata || {};
  const detailRows = getDetailRows(metadata, schema);
  const images = getImages(metadata);

  return (
    <ThemedView variant="background" style={{ flex: 1 }}>
      <ThemedView style={[
        { 
          backgroundColor: theme.colors.background,
          borderRightColor: theme.colors.border,
        }
      ]} className={`min-h-screen py-6 px-4 pb-24`}>
        <ThemedView className="bg-white rounded-xl shadow-lg flex-1 overflow-hidden max-w-full w-full min-h-[500px]">
          <ThemedView className="bg-white flex-1" style={{ minHeight: 400 }}>
            
            {/* Header Section */}
           <ThemedView className="relative">
  <ThemedView className="py-3 px-1 flex-row justify-between items-center">
    {/* Title with proper spacing */}
    <ThemedText 
      size="xl" 
      weight="bold" 
      className="text-gray-800 flex-1 mx-2"
      style={{ flexWrap: 'wrap', maxWidth: '60%' }}
    >
      {doc.documentType?.name || "Document Details"}
    </ThemedText>
    
    {/* Image Button with proper spacing */}
    {images.length > 0 && (
      <TouchableOpacity
  onPress={() => {
    setCurrentImageIndex(0);
    setShowImageModal(true);
  }}
  className="flex-row items-center justify-center gap-1 bg-blue-100 px-3 py-2 rounded-lg border border-blue-200 mx-2"
>
  <Text className="text-blue-700 text-sm leading-none">🖼️</Text>
  <Text className="text-blue-700 font-medium text-xs leading-tight">
    View({images.length})
  </Text>
</TouchableOpacity>
    )}
    
    {/* Close button with proper spacing */}
    <TouchableOpacity
      onPress={onBack}
      className="w-10 h-10 items-center justify-center rounded-full bg-gray-100 mx-2"
    >
      <Text className="text-gray-800 text-xl font-bold">×</Text>
    </TouchableOpacity>
  </ThemedView>
</ThemedView>

            {/* Detail Rows Section */}
            <ScrollView className="flex-1 px-5 pt-4 bg-gray-100" showsVerticalScrollIndicator={false}>
              <ThemedView className="pb-6">
                {detailRows.map((row, idx) => {
                  if (!row) return null;
                  
                  const isInline = shouldUseInlineLayout(row.key, row.value, row.fieldType);
                  
                  return (
                    <ThemedView key={idx}>
                      <ThemedView 
                        className={`py-3 ${isInline ? 'flex-row justify-between items-start gap-3' : 'flex-col gap-2'}`}
                      >
                        <Text className={`text-gray-500 font-medium text-sm ${isInline ? 'min-w-[100px] max-w-[120px]' : ''}`}>
                          {row.label}
                        </Text>
                        <ThemedView className={`flex-1 ${isInline ? 'min-w-0' : ''}`}>
                          {renderClickableValue(row.value, row.fieldType, theme, isInline)}
                        </ThemedView>
                      </ThemedView>
                      {idx < detailRows.length - 1 && (
                        <View className="border-b border-gray-200 my-2" />
                      )}
                    </ThemedView>
                  );
                })}
              </ThemedView>
            </ScrollView>
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
        <View className="flex-1 bg-black/95 items-center justify-center p-4">
          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <TouchableOpacity
                className="absolute left-6 top-1/2 -mt-6 p-4 bg-black/50 rounded-full"
                onPress={() => {
                  setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
                }}
              >
                <Text className="text-white text-2xl font-bold">‹</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="absolute right-6 top-1/2 -mt-6 p-4 bg-black/50 rounded-full"
                onPress={() => {
                  setCurrentImageIndex((prev) => (prev + 1) % images.length);
                }}
              >
                <Text className="text-white text-2xl font-bold">›</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Main Image */}
          <View className="relative max-w-[90vw] max-h-[90vh] items-center justify-center">
            <Image
              source={{ uri: images[currentImageIndex] }}
              style={{ 
                width: width * 0.85, 
                height: height * 0.75,
                borderRadius: 12
              }}
              resizeMode="contain"
            />
          </View>

          {/* Close Button */}
          <TouchableOpacity
            className="absolute top-16 right-6 p-3 bg-black/50 rounded-full"
            onPress={() => setShowImageModal(false)}
          >
            <Text className="text-white text-2xl font-bold">×</Text>
          </TouchableOpacity>

          {/* Image Counter */}
          <View className="absolute bottom-8 bg-black/70 px-5 py-3 rounded-full">
            <Text className="text-white text-sm text-center font-medium">
              {currentImageIndex + 1} of {images.length}
            </Text>
          </View>
          
          {/* Document Name */}
          <View className="absolute top-20 items-center justify-center w-full px-4">
            <Text className="text-white text-center font-medium text-sm bg-black/30 px-4 py-2 rounded-full max-w-[80%]"
                  numberOfLines={1} ellipsizeMode="tail">
              {doc.documentType?.name || 'Document'}
            </Text>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default DocumentDetailsScreen;