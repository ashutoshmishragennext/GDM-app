import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView, ThemedText } from '@/components/utils/ThemeComponents';
import MobilePaymentForm from './MobilePaymentForm';
import {uploadImageFromFile} from '@/components/custom/uploadHelper';

interface MetadataField {
  type: string;
  description: string;
  options?: string[];
  currency?: string;
  priority?: number;
  dependencies?: {
    [key: string]: {
      properties: Record<string, MetadataField>;
      required?: string[];
    };
  };
}

interface MetadataSchema {
  type: string;
  required: string[];
  properties: Record<string, MetadataField>;
}

interface MetaFormProps {
  schema: MetadataSchema;
  values: Record<string, any>;
  setValues: (v: Record<string, any>) => void;
  files: Record<string, any>;
  setFiles: (v: Record<string, any>) => void;
  loading: boolean;
  onSubmit: () => void;
  removeFile: (key: string, index: number) => void;
  handleFileChange: (key: string, files: any) => void;
  submitLabel?: string;
  userName?: string;
  folder?: { name: string };
}

const MetaForm: React.FC<MetaFormProps> = ({
  schema,
  values,
  setValues,
  files,
  setFiles,
  loading,
  onSubmit,
  removeFile,
  handleFileChange: _handleFileChange,
  submitLabel = 'Submit',
  userName,
  folder,
}) => {
  const { theme } = useTheme();
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);
  const [enlargedImageKey, setEnlargedImageKey] = useState<string | null>(null);

  const validateField = (key: string, value: any, field: MetadataField, isRequired: boolean): string => {
    // Check if required field is empty
    if (isRequired && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.description || key} is required`;
    }

    // Skip validation for empty optional fields
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return '';
    }

    switch (field.type) {
      case 'email': {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
        break;
      }

      case 'phone': {
        // Remove all non-digit characters except the leading + sign
        const sanitized = value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
        const phoneRegex = /^\+?[0-9]\d{9,14}$/; // Allow 0 at start
        const digitsOnly = sanitized.replace(/\D/g, '');

        if (!phoneRegex.test(sanitized) || digitsOnly.length < 10 || digitsOnly.length > 15) {
          return 'Please enter a valid phone number (10-15 digits)';
        }
        break;
      }

      case 'landline': {
        // Remove all non-digit characters except the leading + sign
        const sanitized = value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
        // Allow landlines with country code and area code, allowing 0 at start
        const landlineRegex = /^(\+?\d{1,4})?\d{6,12}$/;
        const digitsOnly = sanitized.replace(/\D/g, '');

        if (!landlineRegex.test(sanitized) || digitsOnly.length < 6 || digitsOnly.length > 15) {
          return 'Please enter a valid landline number';
        }
        break;
      }

      case 'number':
      case 'amount': {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          return 'Please enter a valid positive number';
        }
        break;
      }
    }

    return '';
  };

  const handleFileChange = async (key: string, fileList: any) => {
    if (!fileList || fileList.length === 0) return;
    
    setUploadingKey(key);
    const uploadedData: Array<{ url: string; size: number }> = [];

    const fieldConfig = fileFields.find(f => f.key === key);
    const isSingleFile = fieldConfig?.field.type === 'singlefile';

    try {
      for (const file of Array.from(fileList)) {
        const result = await uploadImageFromFile(file);
        if (result?.url) {
          uploadedData.push({
            url: result.url,
            size: result.size || 0,
          });
        }
      }

      setValues((prevValues: any) => {
        if (isSingleFile) {
          // For single file, replace any previous value
          return {
            ...prevValues,
            [key]: uploadedData[0] || null,
          };
        } else {
          // For multiple files, append to existing array
          return {
            ...prevValues,
            [key]: [...(prevValues[key] || []), ...uploadedData],
          };
        }
      });

      if (uploadedData.length > 0) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[key];
          return newErrors;
        });
      }
    } catch (error) {
      Alert.alert('Upload Error', 'Failed to upload file. Please try again.');
    } finally {
      setUploadingKey(null);
    }
  };

  const removeUrl = (key: string, index: number) => {
    setValues({
      ...values,
      [key]: values[key].filter((_: any, i: number) => i !== index),
    });
  };

  const handleNextImage = () => {
    if (enlargedImageIndex !== null && enlargedImageKey) {
      const images = values[enlargedImageKey] || [];
      setEnlargedImageIndex((prev) => (prev! + 1) % images.length);
    }
  };

  const handlePrevImage = () => {
    if (enlargedImageIndex !== null && enlargedImageKey) {
      const images = values[enlargedImageKey] || [];
      setEnlargedImageIndex((prev) => (prev! - 1 + images.length) % images.length);
    }
  };

  const closeFullScreen = () => {
    setEnlargedImageIndex(null);
    setEnlargedImageKey(null);
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};
    let hasErrors = false;

    // Validate regular fields
    fieldsToRender.forEach(({ key, field, parentSchema }) => {
      const isRequired = parentSchema.required?.includes(key);
      const error = validateField(key, values[key], field, isRequired);
      if (error) {
        errors[key] = error;
        hasErrors = true;
      }
    });

    // Validate file fields
    fileFields.forEach(({ key, field, parentSchema }) => {
      const isRequired = parentSchema.required?.includes(key);
      const isSingleFile = field.type === 'singlefile';
      if (isRequired) {
        if (isSingleFile) {
          if (!values[key]) {
            errors[key] = `${field.description || key} is required. Please upload an image.`;
            hasErrors = true;
          }
        } else {
          if (!values[key] || !Array.isArray(values[key]) || values[key].length === 0) {
            errors[key] = `${field.description || key} is required. Please upload at least one image.`;
            hasErrors = true;
          }
        }
      }
    });

    setValidationErrors(errors);
    return !hasErrors;
  };

  const handleSubmit = () => {
    if (validateAllFields()) {
      onSubmit();
    } else {
      // Show validation error alert for first error
      const firstErrorKey = Object.keys(validationErrors)[0];
      const firstError = validationErrors[firstErrorKey];
      if (firstError) {
        Alert.alert('Validation Error', firstError);
      }
    }
  };

  // Sort fields by priority and categorize them
  const sortedFields = Object.entries(schema.properties)
    .filter(([key, field]) => {
      const isDateField = (field.description && field.description.toLowerCase().includes('date time')) || 
                         key.toLowerCase().includes('date time');
      const isUserNameField = (field.description && field.description.toLowerCase().includes('user name')) ||
                              key.toLowerCase().includes('user name') || 
                              key.toLowerCase().includes('username');
      return !isDateField && !isUserNameField;
    })
    .sort(([, a], [, b]) => (a.priority || 999) - (b.priority || 999));

  const fieldsToRender: { key: string; field: MetadataField; parentSchema: any }[] = [];
  const fileFields: { key: string; field: MetadataField; parentSchema: any }[] = [];

  sortedFields.forEach(([key, field]) => {
    if (field.type === 'files' || field.type === 'singlefile') {
      fileFields.push({ key, field, parentSchema: schema });
    } else {
      fieldsToRender.push({ key, field, parentSchema: schema });
    }

    // Handle dependencies
    const dependencySchema = field.dependencies?.[values[key]];
    if (dependencySchema?.properties) {
      Object.entries(dependencySchema.properties).forEach(([depKey, depField]) => {
        if (depField.type === 'files' || depField.type === 'singlefile') {
          fileFields.push({ key: depKey, field: depField, parentSchema: dependencySchema });
        } else {
          fieldsToRender.push({ key: depKey, field: depField, parentSchema: dependencySchema });
        }
      });
    }
  });

  return (
    <ThemedView variant="background" style={{ flex: 1 }}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { 
            padding: theme.spacing.md,
            paddingBottom: theme.spacing['3xl'], // Extra padding for bottom nav
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MobilePaymentForm
          folder={folder}
          schema={schema}
          values={values}
          setValues={setValues}
          loading={loading}
          onSubmit={handleSubmit}
          setValidationErrors={setValidationErrors}
          handleFileChange={handleFileChange}
          removeUrl={removeUrl}
          validationErrors={validationErrors}
          uploadingKey={uploadingKey}
          fieldsToRender={fieldsToRender}
          fileFields={fileFields}
          submitLabel={submitLabel}
        />
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
});

export default MetaForm;
