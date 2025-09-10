import { ThemedText, ThemedView } from '@/components/utils/ThemeComponents';
import { useTheme } from '@/context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

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

interface MobilePaymentSummaryProps {
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

const MobilePaymentSummary: React.FC<MobilePaymentSummaryProps> = ({
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
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Field detection and sorting - EXCLUDE description, files, images, and URL fields
  const availableFields = useMemo(() => {
    const fieldsSet = new Set<string>();

    if (metadata?.properties) {
      Object.entries(metadata.properties).forEach(([key, field]) => {
        if (field.type !== 'description' && field.type !== 'files') {
          const keyLower = key.toLowerCase();
          if (!keyLower.includes('image') && !keyLower.includes('photo') && !keyLower.includes('picture')) {
            fieldsSet.add(key);
          }
        }
      });
    }

    payments.forEach(payment => {
      if (payment.metadata && typeof payment.metadata === 'object') {
        Object.entries(payment.metadata).forEach(([key, value]) => {
          const fieldSchema = metadata?.properties?.[key];
          if (!fieldSchema || (fieldSchema.type !== 'description' && fieldSchema.type !== 'files')) {
            const keyLower = key.toLowerCase();
            if (!keyLower.includes('image') && !keyLower.includes('photo') && !keyLower.includes('picture')) {
              fieldsSet.add(key);
            }
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

    const priorityOrder = ['Date Time', 'User Name', 'email', 'phone', 'amount', 'Driving Licence'];
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

  const getFieldIcon = (fieldKey: string) => {
    const key = fieldKey.toLowerCase();
    if (key.includes('email') || key.includes('mail')) {
      return '📧';
    }
    if (key.includes('phone') || key.includes('mobile') || key.includes('contact')) {
      return '📱';
    }
    if (key.includes('amount') || key.includes('price') || key.includes('cost')) {
      return '💰';
    }
    if (key.includes('date') || key.includes('time')) {
      return '📅';
    }
    if (key.includes('user') || key.includes('name')) {
      return '👤';
    }
    if (key.includes('location') || key.includes('address')) {
      return '📍';
    }
    return '•';
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

  const formatIndianDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <ThemedView style={[
        { flex: 1 },
        { 
          backgroundColor: theme.colors.surface,
          borderRightColor: theme.colors.border,
        }
      ]} className='pb-14' variant="background">
      <View className="min-h-screen bg-gray-50">
        {/* Header */}
        <ThemedView style={[{backgroundColor : theme.colors.primary}]} className="text-white">
          <View className="px-4 py-4">
            <View className="flex flex-row justify-between items-center mb-4">
              <ThemedText size="xl" weight="bold" className="text-white">
                {folder.name}
              </ThemedText>
              <View className="flex-row items-center bg-white/20 rounded-full px-3 py-1">
                <View className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></View>
                <Text className="font-medium text-white text-sm">{filteredPayments.length} records</Text>
              </View>
            </View>

            <View className="flex flex-row items-center gap-3">
              {/* Search Bar */}
              <View className="flex-1">
                <View className="relative">
                  <Text className="absolute left-3 top-3 text-white/70 text-base">🔍</Text>
                  <TextInput
                    ref={searchInputRef}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search records..."
                    placeholderTextColor="rgba(255,255,255,0.7)"
                    className="w-full pl-10 pr-8 py-2.5 text-sm rounded-lg bg-white/15 border border-white/20 text-white"
                  />
                  {searchText && (
                    <TouchableOpacity
                      onPress={clearSearch}
                      className="absolute right-3 top-3"
                    >
                      <Text className="text-white/70 text-lg">×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Filter Button */}
              <TouchableOpacity
                onPress={() => setShowDateFilter(!showDateFilter)}
                className={`h-10 w-10 items-center justify-center rounded-lg ${
                  showDateFilter || startDate || endDate
                    ? 'bg-white/25'
                    : 'bg-white/15'
                }`}
              >
                <Text className="text-white text-base">⏱</Text>
              </TouchableOpacity>
            </View>

            {/* Date Filter Panel */}
            {showDateFilter && (
              <View className="mt-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <Text className="font-semibold text-white mb-3 text-center text-sm">
                  Filter by Date Range
                </Text>
                <View className="flex-row justify-between gap-3">
                  <View className="flex-1">
                    <Text className="block text-xs font-medium text-white mb-1">
                      From Date
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowStartDatePicker(true)}
                      className="w-full p-3 text-sm border border-white/30 rounded-lg bg-white/10"
                    >
                      <Text className="text-white">
                        {startDate ? new Date(startDate).toLocaleDateString() : 'Select start date'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View className="flex-1">
                    <Text className="block text-xs font-medium text-white mb-1">
                      To Date
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowEndDatePicker(true)}
                      className="w-full p-3 text-sm border border-white/30 rounded-lg bg-white/10"
                    >
                      <Text className="text-white">
                        {endDate ? new Date(endDate).toLocaleDateString() : 'Select end date'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {(startDate || endDate) && (
                  <TouchableOpacity
                    onPress={clearDateFilter}
                    className="flex-row items-center justify-center mt-3 py-2 rounded-lg bg-red-400/20"
                  >
                    <Text className="text-red-100 text-sm font-medium">Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ThemedView>

        {/* Content */}
        <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
          {filteredPayments.length === 0 ? (
            <View className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <Text className="text-5xl text-gray-300 mb-4">📄</Text>
              <ThemedText size="lg" weight="semibold" className="text-gray-600 mb-2">
                {searchText || startDate || endDate ? 'No matching records found' : 'No records found'}
              </ThemedText>
              <Text className="text-gray-500 text-sm">
                {searchText
                  ? `No records match your search for "${searchText}". Try a different search term.`
                  : (startDate || endDate)
                    ? 'No records match your date filter. Try adjusting the date range.'
                    : 'No records available in this folder.'
                }
              </Text>
            </View>
          ) : (
            <View className="space-y-3">
              {filteredPayments.map((payment) => (
                <TouchableOpacity
                  key={payment.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:opacity-90"
                  onPress={() => {
                    if (onRowClick) onRowClick(payment.id);
                  }}
                >
                  {payment.createdAt && (
                    <View className="mb-3">
                      <Text className="text-xs text-gray-500 font-medium">
                        {formatIndianDate(payment.createdAt)}
                      </Text>
                    </View>
                  )}
                  
                  <View className="space-y-3">
                    {/* Primary Information Row */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 min-w-0">
                        {sortedFields.filter(fieldKey => getFieldValue(payment, fieldKey)).slice(0, 2).map((fieldKey, index, filteredFields) => {
                          const value = getFieldValue(payment, fieldKey);
                          if (!value) return null;

                          const formattedValue = formatFieldValue(value, fieldKey);
                          const icon = getFieldIcon(fieldKey);

                          return (
                            <View key={fieldKey} className="flex-row items-center flex-1 min-w-0 mr-3">
                              <Text className="text-gray-400 mr-1 text-base">
                                {icon}
                              </Text>
                              <Text className="text-sm font-semibold text-gray-800 flex-1" numberOfLines={1}>
                                {formattedValue}
                              </Text>
                              {index < filteredFields.length - 1 && (
                                <View className="w-px h-4 bg-gray-200 mx-2" />
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Secondary Information Row */}
                    <View className="flex-row gap-3 items-center flex-1 min-w-0">
                      {sortedFields.filter(fieldKey => getFieldValue(payment, fieldKey)).slice(2, 4).map((fieldKey) => {
                        const value = getFieldValue(payment, fieldKey);
                        if (!value) return null;

                        const formattedValue = formatFieldValue(value, fieldKey);
                        const icon = getFieldIcon(fieldKey);

                        return (
                          <View key={fieldKey} className="flex-row items-center flex-1 min-w-0">
                            <Text className="text-gray-400 mr-1 text-sm">
                              {icon}
                            </Text>
                            <Text className="text-xs text-gray-600 flex-1" numberOfLines={1}>
                              {formattedValue}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

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
          minimumDate={startDate ? new Date(startDate) : undefined}
        />
      )}
    </ThemedView>
  );
};

export default MobilePaymentSummary;