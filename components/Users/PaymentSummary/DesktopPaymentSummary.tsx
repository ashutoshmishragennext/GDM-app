import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  FlatList, 
  Modal, 
  Image,
  Dimensions 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView, ThemedText } from '@/components/utils/ThemeComponents';

const { width } = Dimensions.get('window');

interface Payment {
  id: string | number;
  filename?: string;
  fileSize?: string;
  mimeType?: string;
  uploadThingFileId?: string | null;
  uploadThingUrl?: string;
  documentTypeId?: string;
  metadata?: Record<string, any>;
  uploadedBy?: string;
  verificationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  documentType?: {
    id: string;
    name: string;
  };
  [key: string]: any;
}

interface MetadataSchema {
  type: string;
  required: string[];
  properties: Record<string, MetadataField>;
}

interface MetadataField {
  type: string;
  description: string;
  priority?: number;
  options?: string[];
  currency?: string;
  dependencies?: Record<string, any>;
}

interface DesktopPaymentSummaryProps {
  payments: Payment[];
  onRowClick?: (id: string | number) => void;
  startDate: string;
  endDate: string;
  onDateChange: (dates: { startDate: string; endDate: string }) => void;
  onEdit?: (payment: Payment) => void;
  folder: { name: string };
  metadata?: MetadataSchema | null;
  searchText: string;
  setSearchText: (text: string) => void;
  filteredPayments: Payment[];
}

const DesktopPaymentSummary: React.FC<DesktopPaymentSummaryProps> = ({ 
  payments, 
  onRowClick, 
  startDate, 
  endDate, 
  onDateChange,
  onEdit,
  folder,
  metadata,
  searchText,
  setSearchText,
  filteredPayments,
}) => {
  const { theme } = useTheme();
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // All your existing utility functions remain the same...
  const availableFields = useMemo(() => {
    const fieldsSet = new Set<string>();
    
    if (metadata?.properties) {
      Object.entries(metadata.properties).forEach(([key, field]) => {
        if (field.type !== 'description') {
          fieldsSet.add(key);
        }
      });
    }
    
    payments.forEach(payment => {
      if (payment.metadata && typeof payment.metadata === 'object') {
        Object.entries(payment.metadata).forEach(([key, value]) => {
          const fieldSchema = metadata?.properties?.[key];
          if (!fieldSchema || fieldSchema.type !== 'description') {
            fieldsSet.add(key);
          }
        });
      }
    });
    
    return Array.from(fieldsSet);
  }, [payments, metadata]);

  const sortedFields = useMemo(() => {
    if (metadata?.properties) {
      return availableFields.sort((a, b) => {
        const aPriority = metadata.properties[a]?.priority || 999;
        const bPriority = metadata.properties[b]?.priority || 999;
        return aPriority - bPriority;
      });
    }
    
    const priorityOrder = ['Image', 'Date Time', 'User Name', 'Driving Licence'];
    const priorityFields = availableFields.filter(field => priorityOrder.includes(field));
    const otherFields = availableFields.filter(field => !priorityOrder.includes(field));
    
    priorityFields.sort((a, b) => priorityOrder.indexOf(a) - priorityOrder.indexOf(b));
    return [...priorityFields, ...otherFields];
  }, [availableFields, metadata]);

  const getFieldValue = (payment: Payment, fieldKey: string) => {
    const value = payment.metadata?.[fieldKey];
    return (value !== undefined && value !== null && value !== '') ? value : null;
  };

  const formatFieldValue = (value: any, fieldKey: string) => {
    if (!value || value === '-' || value === '') return 'N/A';
    
    const fieldSchema = metadata?.properties?.[fieldKey];
    
    if (fieldSchema?.type) {
      switch (fieldSchema.type) {
        case 'files':
          return Array.isArray(value) ? `${value.length} file${value.length > 1 ? 's' : ''}` : '1 file';
        case 'number':
          if (fieldSchema.currency) {
            return `${fieldSchema.currency.toUpperCase()} ${Number(value).toLocaleString()}`;
          }
          return Number(value).toLocaleString();
        case 'amount':
          if (fieldSchema.currency) {
            return `${fieldSchema.currency.toUpperCase()} ${Number(value).toLocaleString()}`;
          }
          return Number(value).toLocaleString();
        case 'string':
        case 'select':
          return String(value);
      }
    }
    
    if (Array.isArray(value)) {
      if (fieldKey.toLowerCase().includes('image')) {
        return `${value.length} image${value.length > 1 ? 's' : ''}`;
      }
      return value.join(', ');
    }
    
    if (fieldKey.toLowerCase().includes('date') || fieldKey.toLowerCase().includes('time')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      } catch (e) {
        // Continue to string conversion
      }
    }
    
    return String(value);
  };

  const isImageField = (value: any, fieldKey: string) => {
    if (!value) return false;
    
    const fieldSchema = metadata?.properties?.[fieldKey];
    if (fieldSchema?.type === 'files') return true;
    
    if (fieldKey.toLowerCase().includes('image')) return true;
    return Array.isArray(value) && value.length > 0 && 
           typeof value[0] === 'string' && value[0].startsWith('http');
  };

  const getPaymentImages = (payment: Payment): string[] => {
    const images: string[] = [];
    
    if (payment.metadata) {
      Object.entries(payment.metadata).forEach(([key, value]) => {
        if (isImageField(value, key)) {
          if (Array.isArray(value)) {
            images.push(...value.filter(v => typeof v === 'string' && v.startsWith('http')));
          } else if (typeof value === 'string' && value.startsWith('http')) {
            images.push(value);
          }
        }
      });
    }
    
    return images;
  };

  const totalFileSizeMB = filteredPayments.reduce((total, p) => total + parseFloat(p.fileSize || '0'), 0) / 1024;

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
  };

  const clearDateFilter = () => {
    onDateChange({ startDate: '', endDate: '' });
    setShowDateFilter(false);
  };

  const clearSearch = useCallback(() => {
    setSearchText('');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }, [setSearchText]);

  const openFullScreen = (imageIndex: number) => {
    setEnlargedImageIndex(imageIndex);
  };

  const closeFullScreen = () => {
    setEnlargedImageIndex(null);
  };

  const closeSidebar = () => {
    setSelectedPayment(null);
  };

  const TableRow = ({ payment, index }: { payment: Payment; index: number }) => (
    <TouchableOpacity
      className={`flex-row border-b border-gray-100 py-3 px-2 ${
        selectedPayment?.id === payment.id 
          ? `bg-${theme.name}-50 border-l-4 border-${theme.name}-500` 
          : index % 2 === 0 
            ? 'bg-white' 
            : 'bg-gray-50'
      }`}
      onPress={() => handlePaymentClick(payment)}
    >
      {sortedFields.map((fieldKey) => {
        const value = getFieldValue(payment, fieldKey);
        const formattedValue = formatFieldValue(value, fieldKey);
        const isImage = isImageField(value, fieldKey);
        
        return (
          <View key={`${payment.id}-${fieldKey}`} className="flex-1 px-2">
            {isImage && value ? (
              <View className="flex-row items-center gap-3">
                <View className="relative">
                  <Image
                    source={{ uri: Array.isArray(value) ? value[0] : value }}
                    className="h-12 w-12 rounded-lg border-2 border-gray-200"
                    resizeMode="cover"
                  />
                  {Array.isArray(value) && value.length > 1 && (
                    <View className={`absolute -top-1 -right-1 bg-${theme.name}-500 rounded-full h-5 w-5 items-center justify-center`}>
                      <Text className="text-white text-xs font-bold">{value.length}</Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-gray-500 font-medium">{formattedValue}</Text>
              </View>
            ) : (
              <Text className="font-medium text-gray-900 text-sm" numberOfLines={2}>
                {formattedValue}
              </Text>
            )}
          </View>
        );
      })}
      
      <View className="flex-row items-center justify-center gap-2 px-2">
        <TouchableOpacity
          onPress={() => onRowClick?.(payment.id)}
          className={`p-2 rounded-lg bg-${theme.name}-50`}
        >
          <Text className={`text-${theme.name}-600`}>👁️</Text>
        </TouchableOpacity>
        {onEdit && (
          <TouchableOpacity
            onPress={() => onEdit(payment)}
            className="p-2 rounded-lg bg-orange-50"
          >
            <Text className="text-orange-600">✏️</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView variant="background" style={{ flex: 1 }}>
      {/* Header */}
      <View className={`bg-${theme.name}-600 shadow-2xl`}>
        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between">
            <ThemedText size="2xl" weight="bold" className="text-white">
              {folder.name}
            </ThemedText>
            <View className="flex-row items-center gap-8">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 bg-emerald-400 rounded-full"></View>
                <Text className="text-white">{filteredPayments.length} records</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className={`w-3 h-3 bg-${theme.name}-400 rounded-full`}></View>
                <Text className="text-white">{totalFileSizeMB.toFixed(2)} MB total</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-1 px-4 py-4">
        <View className="flex-row gap-3 flex-1">
          {/* Main Table Section */}
          <View className={`${selectedPayment ? 'flex-1' : 'w-full'} bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden`}>
            {/* Table Controls */}
            <View className="bg-white px-6 py-5 border-b border-gray-200">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3">
                  <Text className={`text-${theme.name}-600 text-2xl`}>💳</Text>
                  <ThemedText size="xl" weight="bold" className="text-gray-900">
                    Data Records
                  </ThemedText>
                  <View className={`bg-${theme.name}-100 px-3 py-1 rounded-full`}>
                    <Text className={`text-${theme.name}-600 text-sm font-medium`}>
                      {filteredPayments.length}
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={() => setShowDateFilter(!showDateFilter)}
                    className={`flex-row items-center gap-2 px-5 py-2.5 rounded-lg font-medium ${
                      showDateFilter || startDate || endDate
                        ? `bg-${theme.name}-100 border-2 border-${theme.name}-300`
                        : 'bg-white border border-gray-300'
                    }`}
                  >
                    <Text>⚙️</Text>
                    <Text className={showDateFilter || startDate || endDate ? `text-${theme.name}-700` : 'text-gray-600'}>
                      Filter Data
                    </Text>
                  </TouchableOpacity>
                  
                  {(startDate || endDate) && (
                    <TouchableOpacity
                      onPress={clearDateFilter}
                      className="flex-row items-center gap-2 px-4 py-2.5 border border-red-200 rounded-lg"
                    >
                      <Text className="text-red-600">×</Text>
                      <Text className="text-red-600 text-sm">Clear Filter</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Search Bar */}
              <View className="relative max-w-md">
                <Text className="absolute left-3 top-3 text-gray-400">🔍</Text>
                <TextInput
                  ref={searchInputRef}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholder="Search records..."
                  className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white`}
                />
                {searchText && (
                  <TouchableOpacity
                    onPress={clearSearch}
                    className="absolute right-3 top-3"
                  >
                    <Text className="text-gray-400">×</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Date Filter Panel */}
              {showDateFilter && (
                <View className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <View className="flex-row gap-6">
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 mb-2">From Date</Text>
                      <TouchableOpacity
                        onPress={() => setShowStartDatePicker(true)}
                        className="p-3 border border-gray-300 rounded-lg bg-white"
                      >
                        <Text>{startDate ? new Date(startDate).toLocaleDateString() : 'Select start date'}</Text>
                      </TouchableOpacity>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-gray-700 mb-2">To Date</Text>
                      <TouchableOpacity
                        onPress={() => setShowEndDatePicker(true)}
                        className="p-3 border border-gray-300 rounded-lg bg-white"
                      >
                        <Text>{endDate ? new Date(endDate).toLocaleDateString() : 'Select end date'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Table */}
            <View className="flex-1">
              {filteredPayments.length === 0 ? (
                <View className="flex-1 items-center justify-center py-16">
                  <Text className="text-6xl text-gray-300 mb-6">📅</Text>
                  <ThemedText size="xl" weight="semibold" className="text-gray-600 mb-3 text-center">
                    {searchText || startDate || endDate ? 'No matching records found' : 'No records found'}
                  </ThemedText>
                  <Text className="text-gray-500 text-center">
                    {searchText 
                      ? `No records match your search for "${searchText}".`
                      : 'No records available in this folder.'
                    }
                  </Text>
                </View>
              ) : (
                <ScrollView>
                  {/* Table Header */}
                  <View className={`bg-${theme.name}-600 flex-row py-4`}>
                    {sortedFields.map((fieldKey) => {
                      const fieldSchema = metadata?.properties?.[fieldKey];
                      return (
                        <View key={fieldKey} className="flex-1 px-2">
                          <Text className="text-sm font-bold uppercase text-white">
                            {fieldSchema?.description || fieldKey}
                          </Text>
                        </View>
                      );
                    })}
                    <View className="px-2 w-24">
                      <Text className="text-sm font-bold uppercase text-white text-center">
                        Actions
                      </Text>
                    </View>
                  </View>
                  
                  {/* Table Rows */}
                  <FlatList
                    data={filteredPayments}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item, index }) => <TableRow payment={item} index={index} />}
                    scrollEnabled={false}
                  />
                </ScrollView>
              )}
            </View>
          </View>

          {/* Image Sidebar */}
          {selectedPayment && (
            <View className="w-96 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <View className="bg-white px-6 py-4 border-b border-gray-200 flex-row items-center justify-between">
                <View>
                  <View className="flex-row items-center gap-2">
                    <Text className={`text-${theme.name}-600`}>📄</Text>
                    <ThemedText size="lg" weight="bold" className="text-gray-900">
                      Uploaded Images
                    </ThemedText>
                  </View>
                  <Text className="text-sm text-gray-600 mt-1">
                    <Text className={`font-semibold text-${theme.name}-600`}>
                      {getFieldValue(selectedPayment, 'User Name') || selectedPayment.documentType?.name || `Record ${selectedPayment.id}`}
                    </Text>
                    <Text className="text-gray-500 ml-2">
                      • {parseFloat(selectedPayment.fileSize || '0').toFixed(1)} KB
                    </Text>
                  </Text>
                </View>
                <TouchableOpacity onPress={closeSidebar} className="p-2 bg-gray-100 rounded-lg">
                  <Text className="text-gray-400">×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView className="flex-1 p-6">
                {getPaymentImages(selectedPayment).length > 0 ? (
                  <View className="space-y-4">
                    {getPaymentImages(selectedPayment).map((imageUrl, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => openFullScreen(index)}
                        className="relative"
                      >
                        <Image
                          source={{ uri: imageUrl }}
                          className="w-full h-48 rounded-xl border-2 border-gray-200"
                          resizeMode="contain"
                        />
                        <View className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded">
                          <Text className="text-white text-xs">
                            {index + 1} of {getPaymentImages(selectedPayment).length}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View className="items-center justify-center h-64">
                    <Text className="text-6xl text-gray-300 mb-4">📷</Text>
                    <ThemedText size="lg" weight="semibold" className="text-gray-500 mb-2">
                      No images found
                    </ThemedText>
                    <Text className="text-sm text-gray-400">
                      This record has no associated images
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Sidebar Actions */}
              <View className="p-6 border-t bg-gray-50">
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={() => onRowClick?.(selectedPayment.id)}
                    className={`flex-1 flex-row items-center justify-center gap-2 px-4 py-3 bg-${theme.name}-50 border border-${theme.name}-200 rounded-lg`}
                  >
                    <Text>👁️</Text>
                    <Text className={`text-${theme.name}-600 font-medium`}>View Details</Text>
                  </TouchableOpacity>
                  {onEdit && (
                    <TouchableOpacity
                      onPress={() => onEdit(selectedPayment)}
                      className={`flex-1 flex-row items-center justify-center gap-2 px-4 py-3 bg-${theme.name}-600 rounded-lg`}
                    >
                      <Text className="text-white">✏️</Text>
                      <Text className="text-white font-medium">Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Full Screen Image Modal */}
      {enlargedImageIndex !== null && selectedPayment && (
        <Modal visible={true} transparent animationType="fade" onRequestClose={closeFullScreen}>
          <View className="flex-1 bg-black/95 items-center justify-center p-4">
            {(() => {
              const images = getPaymentImages(selectedPayment);
              const currentImage = images[enlargedImageIndex];
              
              return (
                <>
                  {/* Navigation Buttons */}
                  {images.length > 1 && (
                    <>
                      <TouchableOpacity
                        className="absolute left-4 top-1/2 -mt-6 p-3 bg-white/20 rounded-full"
                        onPress={() => {
                          const newIndex = enlargedImageIndex > 0 ? enlargedImageIndex - 1 : images.length - 1;
                          setEnlargedImageIndex(newIndex);
                        }}
                      >
                        <Text className="text-white text-2xl">‹</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        className="absolute right-4 top-1/2 -mt-6 p-3 bg-white/20 rounded-full"
                        onPress={() => {
                          const newIndex = enlargedImageIndex < images.length - 1 ? enlargedImageIndex + 1 : 0;
                          setEnlargedImageIndex(newIndex);
                        }}
                      >
                        <Text className="text-white text-2xl">›</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Main Image */}
                  <Image
                    source={{ uri: currentImage }}
                    style={{ width: width * 0.9, height: width * 0.9 }}
                    className="rounded-lg"
                    resizeMode="contain"
                  />

                  {/* Close Button */}
                  <TouchableOpacity
                    className="absolute top-12 right-4 p-3 bg-white/20 rounded-full"
                    onPress={closeFullScreen}
                  >
                    <Text className="text-white text-2xl">×</Text>
                  </TouchableOpacity>

                  {/* Image Info */}
                  <View className="absolute bottom-4 bg-black/70 px-4 py-2 rounded-lg">
                    <Text className="text-white text-sm text-center">
                      {enlargedImageIndex + 1} of {images.length}
                    </Text>
                    <Text className="text-gray-300 text-xs mt-1 text-center">
                      {getFieldValue(selectedPayment, 'User Name') || selectedPayment.documentType?.name || `Record ${selectedPayment.id}`}
                    </Text>
                  </View>
                </>
              );
            })()}
          </View>
        </Modal>
      )}

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate ? new Date(startDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              onDateChange({
                startDate: selectedDate.toISOString().split('T')[0],
                endDate
              });
            }
          }}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate ? new Date(endDate) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              onDateChange({
                startDate,
                endDate: selectedDate.toISOString().split('T')[0]
              });
            }
          }}
        />
      )}
    </ThemedView>
  );
};

export default DesktopPaymentSummary;
