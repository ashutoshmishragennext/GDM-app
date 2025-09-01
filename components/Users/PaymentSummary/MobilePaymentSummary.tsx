import React, { useState, useMemo, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView, ThemedText } from '@/components/utils/ThemeComponents';

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
      return '✉️';
    }
    if (key.includes('phone') || key.includes('mobile') || key.includes('contact')) {
      return '📞';
    }
    if (key.includes('amount') || key.includes('price') || key.includes('cost')) {
      return '₹';
    }
    if (key.includes('date') || key.includes('time')) {
      return '🕒';
    }
    if (key.includes('user') || key.includes('name')) {
      return '👤';
    }
    if (key.includes('location') || key.includes('address')) {
      return '📍';
    }
    return '#';
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
      ]} className=' pb-14' variant="background">
      <View className={`min-h-screen bg-gradient-to-br from-slate-50 to-red-50`}>
        {/* Header */}
        <ThemedView style={[{backgroundColor : theme.colors.primary}]} className={` text-white shadow-lg sticky top-0`}>
          <View className="px-2 py-4">
            <View className="text-center flex flex-row justify-center gap-4">
              <ThemedText size="xl" weight="bold" className="text-white">
                {folder.name}
              </ThemedText>
              <View className="flex items-center justify-center text-sm">
                <View className={`flex flex-row items-center gap-2 text-red-100`}>
                  <View className="w-2 h-2 bg-emerald-400 rounded-full"></View>
                  <Text className="font-medium text-white">{filteredPayments.length} records</Text>
                </View>
              </View>
            </View>

            <View className="flex flex-row justify-center p-3 items-center gap-3">
              {/* Search Bar */}
              <View className="mt-3">
                <View className="relative">
                  <Text className="absolute left-3 top-2.5 text-white/60 text-base">🔍</Text>
                  <TextInput
                    ref={searchInputRef}
                    value={searchText}
                    onChangeText={setSearchText}
                    placeholder="Search records..."
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    className="w-full pl-10 pr-8 py-2 text-sm rounded-xl bg-white/20 border border-white/30 text-white"
                  />
                  {searchText && (
                    <TouchableOpacity
                      onPress={clearSearch}
                      className="absolute right-3 top-2.5"
                    >
                      <Text className="text-white/60 text-lg">×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Filter Controls */}
              <View className="flex flex-row items-center justify-center gap-2">
                <TouchableOpacity
                  onPress={() => setShowDateFilter(!showDateFilter)}
                  className={`flex items-center gap-1  px-2 py-1 rounded-xl font-medium text-sm transition-all ${
                    showDateFilter || startDate || endDate
                      ? 'bg-white/20 text-white border-2 border-white/30'
                      : `bg-white/10 text-${theme.name}-100 border border-white/20`
                  }`}
                >
                  <Text className="text-white">⚙️</Text>
                </TouchableOpacity>
                
                {(startDate || endDate) && (
                  <TouchableOpacity
                    onPress={clearDateFilter}
                    className="flex flex-row items-center gap-1 px-3 py-1 text-sm text-red-100 bg-red-500/20 border border-red-300/30 rounded-xl"
                  >
                    <Text className="text-red-100">×</Text>
                    <Text className="text-red-100">Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Date Filter Panel */}
            {showDateFilter && (
              <View className="mt-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <Text className="font-semibold text-white mb-2 text-center text-sm">
                  Filter by Date Range
                </Text>
                <View className="grid grid-cols-2 gap-2 mx-8">
                  <View>
                    <Text className={`block text-xs font-medium text-${theme.name}-100 mb-1`}>
                      From Date
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowStartDatePicker(true)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white"
                    >
                      <Text className="text-black">
                        {startDate ? new Date(startDate).toLocaleDateString() : 'Start date'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View>
                    <Text className={`block text-xs font-medium text-${theme.name}-100 mb-1`}>
                      To Date
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowEndDatePicker(true)}
                      className="w-full p-2 text-sm border border-gray-300 rounded-lg bg-white"
                    >
                      <Text className="text-black">
                        {endDate ? new Date(endDate).toLocaleDateString() : 'End date'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ThemedView>

        {/* Content */}
        <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
          {filteredPayments.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-200">
              <Text className="text-6xl text-gray-300 mb-4">📅</Text>
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
            <View className="space-y-4">
              {filteredPayments.map((payment) => (
                <TouchableOpacity
                  key={payment.id}
                  className={`bg-white rounded-lg p-2 shadow-sm border border-gray-100 hover:shadow-md hover:border-${theme.name}-200 transition-all active:scale-95`}
                  onPress={() => {
                    if (onRowClick) onRowClick(payment.id);
                  }}
                >
                  {payment.createdAt && (
                    <View className="rounded-md mb-1">
                      <Text className="text-xs">
                        {formatIndianDate(payment.createdAt)}
                      </Text>
                    </View>
                  )}
                  
                  <View className="space-y-2">
                    {/* First Line - Primary Info */}
                    <View className="flex flex-row items-center justify-between gap-2">
                      <View className="flex flex-row items-center flex-1 min-w-0">
                        {sortedFields.filter(fieldKey => getFieldValue(payment, fieldKey)).slice(0, 2).map((fieldKey, index, filteredFields) => {
                          const value = getFieldValue(payment, fieldKey);
                          if (!value) return null;

                          const formattedValue = formatFieldValue(value, fieldKey);
                          const icon = getFieldIcon(fieldKey);

                          return (
                            <View key={fieldKey} className="flex flex-row items-center gap-1 min-w-0">
                              <Text className={`text-${theme.name}-500 flex-shrink-0`}>
                                {icon}
                              </Text>
                              <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                                {formattedValue}
                              </Text>
                              {index < filteredFields.length - 1 && (
                                <Text className="text-gray-300 mx-1">•</Text>
                              )}
                            </View>
                          );
                        })}
                      </View>

                    </View>

                    {/* Second Line - Secondary Info */}
                    <View className="flex flex-row gap-1 items-center flex-1 min-w-0 ml-1">
                      {sortedFields.filter(fieldKey => getFieldValue(payment, fieldKey)).slice(2, 4).map((fieldKey, index, filteredFields) => {
                        const value = getFieldValue(payment, fieldKey);
                        if (!value) return null;

                        const formattedValue = formatFieldValue(value, fieldKey);
                        const icon = getFieldIcon(fieldKey);

                        return (
                          <View key={fieldKey} className="flex flex-row items-center gap-1 min-w-0">
                            <Text className={`text-${theme.name}-400 flex-shrink-0`}>
                              {icon}
                            </Text>
                            <Text className="text-xs font-medium text-gray-600" numberOfLines={1}>
                              {formattedValue}
                            </Text>
                            {index < filteredFields.length - 1 && (
                              <Text className="text-gray-300 mx-1">•</Text>
                            )}
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
