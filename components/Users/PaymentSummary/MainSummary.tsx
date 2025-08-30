import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView, ThemedText } from '@/components/utils/ThemeComponents';
import MobilePaymentSummary from './MobilePaymentSummary';
import DesktopPaymentSummary from './DesktopPaymentSummary';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

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

interface PaymentSummaryProps {
  payments: Payment[];
  onRowClick?: (id: string | number) => void;
  startDate: string;
  endDate: string;
  onDateChange: (dates: { startDate: string; endDate: string }) => void;
  onEdit?: (payment: Payment) => void;
  folder: { name: string };
  metadata?: MetadataSchema | null;
}

const Summary: React.FC<PaymentSummaryProps> = ({ 
  payments, 
  onRowClick, 
  startDate, 
  endDate, 
  onDateChange,
  onEdit,
  folder,
  metadata
}) => {
  const { theme } = useTheme();
  const [searchText, setSearchText] = useState('');

  // Field detection and sorting - EXCLUDE description type fields
  const availableFields = useMemo(() => {
    const fieldsSet = new Set<string>();
    
    if (metadata?.properties) {
      Object.entries(metadata.properties).forEach(([key, field]) => {
        // Skip description type fields
        if (field.type !== 'description') {
          fieldsSet.add(key);
        }
      });
    }
    
    payments.forEach(payment => {
      if (payment.metadata && typeof payment.metadata === 'object') {
        Object.entries(payment.metadata).forEach(([key, value]) => {
          // Only add if it's not a description field based on metadata schema
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

  // Utility functions
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

  // Search filtering function
  const searchPayment = (payment: Payment, searchTerm: string): boolean => {
    if (!searchTerm) return true;
    
    const lowercaseSearchTerm = searchTerm.toLowerCase().trim();
    
    // Search through all available fields
    for (const fieldKey of sortedFields) {
      const value = getFieldValue(payment, fieldKey);
      if (value) {
        const formattedValue = formatFieldValue(value, fieldKey);
        
        // Don't search in image fields by their URLs, but search by their formatted display text
        if (isImageField(value, fieldKey)) {
          if (formattedValue.toLowerCase().includes(lowercaseSearchTerm)) {
            return true;
          }
        } else {
          // For regular fields, search both raw value and formatted value
          const rawValueStr = String(value).toLowerCase();
          const formattedValueStr = formattedValue.toLowerCase();
          
          if (rawValueStr.includes(lowercaseSearchTerm) || formattedValueStr.includes(lowercaseSearchTerm)) {
            return true;
          }
        }
      }
    }
    
    // Also search in document type name and ID if available
    if (payment.documentType?.name?.toLowerCase().includes(lowercaseSearchTerm)) {
      return true;
    }
    
    if (String(payment.id).toLowerCase().includes(lowercaseSearchTerm)) {
      return true;
    }
    
    return false;
  };

  // Filter payments based on search text
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => searchPayment(payment, searchText));
  }, [payments, searchText, sortedFields]);

  const commonProps = {
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
    availableFields,
    sortedFields,
    getFieldValue,
    formatFieldValue,
    isImageField,
  };

  return (
    <ThemedView variant="background" style={{ flex: 1 }}>
      {/* Responsive rendering based on device size */}
      {isTablet ? (
        <DesktopPaymentSummary {...commonProps} />
      ) : (
        <MobilePaymentSummary {...commonProps} />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Summary;
