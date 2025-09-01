import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView, ThemedText, ThemedButton } from '@/components/utils/ThemeComponents';
import { apiService } from '@/api';
import CameraGalleryPopup from '@/components/common/MobileCameraInput';

const { width, height } = Dimensions.get('window');

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

interface MobilePaymentFormProps {
  schema: MetadataSchema;
  values: Record<string, any>;
  setValues: (v: Record<string, any>) => void;
  loading: boolean;
  onSubmit: () => void;
  handleFileChange: (key: string, files: any) => void;
  removeUrl: (key: string, index: number) => void;
  validationErrors: Record<string, string>;
  setValidationErrors: (errors: Record<string, string>) => void;
  uploadingKey: string | null;
  fieldsToRender: any[];
  fileFields: any[];
  submitLabel?: string;
  folder?: { name: string };
}

interface ProcessImageResponse {
  success: boolean;
  data?: {
    extractedData: Record<string, any>;
    rawOcrText: string;
    processingTime: string;
  };
  error?: string;
  details?: string;
}

const MobilePaymentForm: React.FC<MobilePaymentFormProps> = ({
  schema,
  values,
  setValues,
  loading,
  onSubmit,
  handleFileChange,
  removeUrl,
  validationErrors,
  setValidationErrors,
  uploadingKey,
  fieldsToRender,
  fileFields,
  submitLabel = 'Submit',
  folder,
}) => {
  const { theme } = useTheme();

  const [aiProcessing, setAiProcessing] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean;
    images: string[];
    currentIndex: number;
    fieldKey?: string;
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
  });

  const getImageUrl = (item: any): string => {
    return typeof item === 'string' ? item : item?.url || '';
  };

  const openImagePopup = (fieldKey: string) => {
    setActivePopup(fieldKey);
  };

  const closeImagePopup = () => {
    setActivePopup(null);
  };

  const handlePopupFileSelect = (fieldKey: string, files: any) => {
    handleFileChange(fieldKey, files);
  };

  const openImageViewer = (images: any[], startIndex: number, fieldKey?: string) => {
    const imageUrls = images.map(item => getImageUrl(item));
    setImageViewer({
      isOpen: true,
      images: imageUrls,
      currentIndex: startIndex,
      fieldKey,
    });
  };

  const closeImageViewer = () => {
    setImageViewer({
      isOpen: false,
      images: [],
      currentIndex: 0,
    });
  };

  const goToPrevious = () => {
    setImageViewer(prev => ({
      ...prev,
      currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : prev.images.length - 1,
    }));
  };

  const goToNext = () => {
    setImageViewer(prev => ({
      ...prev,
      currentIndex: prev.currentIndex < prev.images.length - 1 ? prev.currentIndex + 1 : 0,
    }));
  };

  const processImageWithAI = async (fieldKey: string) => {
    const images = values[fieldKey];
    const fieldConfig = fileFields.find(f => f.key === fieldKey);
    const isSingleFile = fieldConfig?.field.type === 'singlefile';

    if (!images ||
      (isSingleFile && !images) ||
      (!isSingleFile && (!Array.isArray(images) || images.length === 0))) {
      setAiError("No images found to process. Please upload an image first.");
      return;
    }

    setAiProcessing(fieldKey);
    setAiError(null);
    setAiSuccess(null);

    try {
      const firstImage = isSingleFile ? images : images[0];
      const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage.url;

      const urlParts = imageUrl.split('.');
      const fileType = urlParts[urlParts.length - 1].toLowerCase();

      const extractionFields: Record<string, any> = {};

      Object.entries(schema.properties).forEach(([key, field]) => {
        if (field.type === 'files' || field.type === 'file') return;

        switch (field.type) {
          case 'string':
          case 'select':
          case 'description':
            extractionFields[key] = "N/A";
            break;
          case 'number':
          case 'amount':
            extractionFields[key] = 0;
            break;
          case 'boolean':
            extractionFields[key] = false;
            break;
          case 'date':
            extractionFields[key] = "N/A";
            break;
          default:
            extractionFields[key] = "N/A";
        }
      });

      const result: ProcessImageResponse = await apiService.processImage({
        url: imageUrl,
        filetype: fileType,
        extractionFields: extractionFields
      });

      if (result.success && result.data) {
        const extractedData = result.data.extractedData;
        const newValues = { ...values };

        Object.entries(extractedData).forEach(([key, value]) => {
          if (schema.properties[key] && value !== "N/A" && value !== null && value !== undefined) {
            const fieldType = schema.properties[key].type;

            switch (fieldType) {
              case 'boolean':
                if (typeof value === 'string') {
                  newValues[key] = value.toLowerCase() === 'true' || value.toLowerCase() === 'yes';
                } else {
                  newValues[key] = Boolean(value);
                }
                break;
              case 'number':
              case 'amount':
                if (typeof value === 'string') {
                  const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
                  newValues[key] = isNaN(numValue) ? 0 : numValue;
                } else {
                  newValues[key] = Number(value) || 0;
                }
                break;
              default:
                newValues[key] = String(value);
            }
          }
        });

        setValues(newValues);
        setAiSuccess('AI extracted data successfully!');
        setTimeout(() => setAiSuccess(null), 4000);
      } else {
        setAiError(result.error || 'Failed to process image');
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Network error occurred');
    } finally {
      setAiProcessing(null);
    }
  };

  const validateField = (key: string, value: any, field: MetadataField, isRequired: boolean): string => {
    if (isRequired && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.description || key} is required`;
    }

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
        const sanitized = value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
        const phoneRegex = /^\+?[0-9]\d{9,14}$/;
        const digitsOnly = sanitized.replace(/\D/g, '');
        if (!phoneRegex.test(sanitized) || digitsOnly.length < 10 || digitsOnly.length > 15) {
          return 'Please enter a valid phone number (10-15 digits)';
        }
        break;
      }
      case 'landline': {
        const sanitized = value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
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

  const validateAllFields = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    const allFieldsToValidate = getAllFields();

    allFieldsToValidate.forEach(({ key, field, parentSchema, fieldType }) => {
      const isRequired = parentSchema.required?.includes(key);

      if (fieldType === 'file' || fieldType === 'singlefile') {
        if (isRequired && (!values[key] ||
          (Array.isArray(values[key]) && values[key].length === 0) ||
          (!Array.isArray(values[key]) && !values[key]))) {
          errors[key] = `${field.description || key} is required. Please upload an image.`;
        }
      } else {
        const error = validateField(key, values[key], field, isRequired);
        if (error) {
          errors[key] = error;
        }
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const handleFormSubmit = () => {
    const validation = validateAllFields();

    if (validation.isValid) {
      onSubmit();
    } else {
      setValidationErrors(validation.errors);
      const firstErrorKey = Object.keys(validation.errors)[0];
      const firstError = validation.errors[firstErrorKey];
      if (firstError) {
        Alert.alert('Validation Error', firstError);
      }
    }
  };

  const renderField = (key: string, field: MetadataField, parentSchema: any) => {
    const isRequired = parentSchema.required?.includes(key);
    const hasError = validationErrors[key];

    const handleInputChange = (newValue: string) => {
      setValues({ ...values, [key]: newValue });

      if (hasError) {
        const newErrors = { ...validationErrors };
        delete newErrors[key];
        setValidationErrors(newErrors);
      }
    };

    const inputStyle = [
      styles.textInput,
      {
        borderColor: hasError ? theme.colors.error : theme.colors.border,
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
      }
    ];

    switch (field.type) {
      case 'number':
      case 'amount':
        return (
          <View style={styles.inputContainer}>
            {field.type === 'amount' && (
              <View style={styles.amountContainer}>
                <TextInput
                  style={[inputStyle, styles.amountInput]}
                  value={values[key]?.toString() || ''}
                  onChangeText={(text) => {
                    const numValue = parseFloat(text);
                    if (!isNaN(numValue) && numValue >= 0) {
                      handleInputChange(text);
                    } else if (text === '') {
                      handleInputChange('');
                    }
                  }}
                  placeholder={`Enter ${field.description} ${isRequired ? '*' : ''}`}
                  keyboardType="decimal-pad"
                />
                {field.currency && (
                  <View style={[styles.currencyLabel, { backgroundColor: theme.colors.surface }]}>
                    <ThemedText size="sm" weight="medium">
                      {field.currency.toUpperCase()}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}
            {field.type === 'number' && (
              <TextInput
                style={inputStyle}
                value={values[key]?.toString() || ''}
                onChangeText={(text) => {
                  const numValue = parseFloat(text);
                  if (!isNaN(numValue) && numValue >= 0) {
                    handleInputChange(text);
                  } else if (text === '') {
                    handleInputChange('');
                  }
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            )}
            {hasError && (
              <ThemedText size="xs" style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>
                {hasError}
              </ThemedText>
            )}
          </View>
        );

      case 'email':
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={inputStyle}
              value={values[key] || ''}
              onChangeText={handleInputChange}
              placeholder={`Enter ${field.description} ${isRequired ? '*' : ''}`}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {hasError && (
              <ThemedText size="xs" style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>
                {hasError}
              </ThemedText>
            )}
          </View>
        );

      case 'phone':
      case 'landline':
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={inputStyle}
              value={values[key] || ''}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9+\-\s()]/g, '');
                handleInputChange(cleaned);
              }}
              placeholder={`Enter ${field.description} ${isRequired ? '*' : ''}`}
              keyboardType="phone-pad"
            />
            {hasError && (
              <ThemedText size="xs" style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>
                {hasError}
              </ThemedText>
            )}
          </View>
        );

      case 'select':
        return (
          <View style={styles.inputContainer}>
            <View style={[styles.pickerContainer, { borderColor: hasError ? theme.colors.error : theme.colors.border }]}>
              <Picker
                selectedValue={values[key] || ''}
                onValueChange={(itemValue) => handleInputChange(itemValue)}
                style={[styles.picker, { color: theme.colors.text }]}
              >
                <Picker.Item
                  label={`Select ${(field.description || key).replace(' field', '')}`}
                  value=""
                  color={theme.colors.textSecondary}
                />
                {field.options?.map((option: string) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </View>
            {hasError && (
              <ThemedText size="xs" style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>
                {hasError}
              </ThemedText>
            )}
          </View>
        );

      case 'boolean':
        return (
          <View style={styles.inputContainer}>
            <View style={[styles.pickerContainer, { borderColor: hasError ? theme.colors.error : theme.colors.border }]}>
              <Picker
                selectedValue={values[key] || ''}
                onValueChange={(itemValue) => handleInputChange(itemValue)}
                style={[styles.picker, { color: theme.colors.text }]}
              >
                <Picker.Item
                  label={`Select ${(field.description || key).replace(' field', '')}`}
                  value=""
                  color={theme.colors.textSecondary}
                />
                <Picker.Item label="Yes" value="true" />
                <Picker.Item label="No" value="false" />
              </Picker>
            </View>
            {hasError && (
              <ThemedText size="xs" style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>
                {hasError}
              </ThemedText>
            )}
          </View>
        );

      case 'date':
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={inputStyle}
              value={values[key] || ''}
              onChangeText={handleInputChange}
              placeholder="YYYY-MM-DD"
            />
            {hasError && (
              <ThemedText size="xs" style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>
                {hasError}
              </ThemedText>
            )}
          </View>
        );

      case 'description':
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={[inputStyle, styles.textArea]}
              value={values[key] || ''}
              onChangeText={handleInputChange}
              placeholder={`Enter ${field.description} ${isRequired ? '*' : ''}`}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {hasError && (
              <ThemedText size="xs" style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>
                {hasError}
              </ThemedText>
            )}
          </View>
        );

      default:
        return (
          <View style={styles.inputContainer}>
            <TextInput
              style={inputStyle}
              value={values[key] || ''}
              onChangeText={handleInputChange}
              placeholder={`Enter ${field.description} ${isRequired ? '*' : ''}`}
            />
            {hasError && (
              <ThemedText size="xs" style={{ color: theme.colors.error, marginTop: theme.spacing.xs }}>
                {hasError}
              </ThemedText>
            )}
          </View>
        );
    }
  };

  const getAllFields = () => {
    const allFields: any[] = [];

    fileFields.forEach(fieldData => {
      allFields.push({ ...fieldData, fieldType: 'file' });
    });

    fieldsToRender.forEach(fieldData => {
      allFields.push({ ...fieldData, fieldType: 'regular' });
    });

    Object.entries(schema.properties).forEach(([key, field]) => {
      const dependencySchema = field.dependencies?.[values[key]];
      if (dependencySchema?.properties) {
        Object.entries(dependencySchema.properties).forEach(([depKey, depField]) => {
          let fieldType = 'regular';
          if (depField.type === 'files') {
            fieldType = 'file';
          } else if (depField.type === 'file') {
            fieldType = 'singlefile';
          }

          allFields.push({
            key: depKey,
            field: depField,
            parentSchema: dependencySchema,
            fieldType: fieldType
          });
        });
      }
    });

    return allFields.sort((a, b) => (a.field.priority || 999) - (b.field.priority || 999));
  };

  const getMultipleForField = (fieldKey: string | null): boolean => {
    if (!fieldKey) return true;
    const fieldConfig = getAllFields().find(({ key }) => key === fieldKey);
    return fieldConfig?.field.type === 'files';
  };

  const sortedFields = getAllFields();

// Updated deleteCurrentImage function for React Native
const deleteCurrentImage = () => {
  const currentFieldKey = Object.keys(values).find(key => {
    const fieldValue = values[key];
    if (Array.isArray(fieldValue)) {
      return fieldValue.some(item =>
        getImageUrl(item) === imageViewer.images[imageViewer.currentIndex]
      );
    } else if (fieldValue) {
      return getImageUrl(fieldValue) === imageViewer.images[imageViewer.currentIndex];
    }
    return false;
  });

  if (currentFieldKey) {
    const fieldValue = values[currentFieldKey];
    if (Array.isArray(fieldValue)) {
      const imageIndex = fieldValue.findIndex(item =>
        getImageUrl(item) === imageViewer.images[imageViewer.currentIndex]
      );
      if (imageIndex !== -1) {
        removeUrl(currentFieldKey, imageIndex);

        const newImages = imageViewer.images.filter((_, idx) => idx !== imageViewer.currentIndex);
        if (newImages.length === 0) {
          closeImageViewer();
        } else {
          const newIndex = imageViewer.currentIndex >= newImages.length ?
            newImages.length - 1 : imageViewer.currentIndex;
          setImageViewer(prev => ({
            ...prev,
            images: newImages,
            currentIndex: newIndex
          }));
        }
      }
    } else {
      removeUrl(currentFieldKey, 0);
      closeImageViewer();
    }
  }
};
  return (
    <ThemedView variant="background" style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: theme.spacing['3xl'] }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <ThemedView
          variant="transparent"
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.primary,
              marginBottom: theme.spacing.md,
            }
          ]}
        >
          <ThemedText
            size="xl"
            weight="bold"
            style={{ color: theme.colors.background, textAlign: 'center' }}
          >
            {folder?.name} Entry
          </ThemedText>
          <ThemedText
            size="sm"
            style={{
              color: theme.colors.background,
              opacity: 0.9,
              textAlign: 'center',
              marginTop: theme.spacing.xs
            }}
          >
            Enter {folder?.name} details
          </ThemedText>
        </ThemedView>

        {/* AI Status Messages */}
        {(aiSuccess || aiError) && (
          <View style={[styles.statusContainer, { marginBottom: theme.spacing.md }]}>
            {aiSuccess && (
              <ThemedView
                variant="transparent"
                style={[
                  styles.statusMessage,
                  {
                    backgroundColor: `${theme.colors.success}20`,
                    borderColor: theme.colors.success,
                  }
                ]}
              >
                <View style={styles.statusContent}>
                  <Text style={[styles.statusIcon, { color: theme.colors.success }]}>✨</Text>
                  <ThemedText
                    size="sm"
                    weight="medium"
                    style={{ color: theme.colors.success, flex: 1 }}
                  >
                    {aiSuccess}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setAiSuccess(null)}>
                    <Text style={[styles.closeButton, { color: theme.colors.success }]}>×</Text>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            )}
            {aiError && (
              <ThemedView
                variant="transparent"
                style={[
                  styles.statusMessage,
                  {
                    backgroundColor: `${theme.colors.error}20`,
                    borderColor: theme.colors.error,
                  }
                ]}
              >
                <View style={styles.statusContent}>
                  <Text style={[styles.statusIcon, { color: theme.colors.error }]}>⚠</Text>
                  <ThemedText
                    size="sm"
                    weight="medium"
                    style={{ color: theme.colors.error, flex: 1 }}
                  >
                    {aiError}
                  </ThemedText>
                  <TouchableOpacity onPress={() => setAiError(null)}>
                    <Text style={[styles.closeButton, { color: theme.colors.error }]}>×</Text>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            )}
          </View>
        )}

        {/* Form Container */}
        <ThemedView
          variant="surface"
          style={[
            styles.formContainer,
            {
              borderRadius: theme.borderRadius.lg,
              padding: theme.spacing.md,
              borderColor: theme.colors.border,
            }
          ]}
        >
          {sortedFields.map(({ key, field, parentSchema, fieldType }) => {
            const isRequired = parentSchema.required?.includes(key);
            const hasError = validationErrors[key];

            return (
              <View
                key={key}
                style={[{ marginBottom: theme.spacing.md }]}
              >
                {(fieldType === 'file' || fieldType === 'singlefile') ? (
                  // File upload field
                  <View>
                    <ThemedText
                      size="sm"
                      weight="medium"
                      style={{
                        color: theme.colors.text,
                        marginBottom: theme.spacing.sm
                      }}
                    >
                      {field.description || key}
                      {isRequired && (
                        <Text style={{ color: theme.colors.error }}> *</Text>
                      )}
                    </ThemedText>

                    <View style={styles.uploadSection}>
                      {/* Main Row Container */}
                      <View style={styles.uploadRow}>
                        {/* Upload Button */}
                        <TouchableOpacity
                          style={[
                            styles.uploadButton,
                            {
                              borderColor: hasError ? theme.colors.error : theme.colors.border,
                              backgroundColor: uploadingKey === key ? theme.colors.surface : 'transparent',
                            }
                          ]}
                          onPress={() => openImagePopup(key)}
                          disabled={uploadingKey === key}
                        >
                          {uploadingKey === key ? (
                            <View style={styles.uploadingContent}>
                              <ActivityIndicator
                                size="small"
                                color={theme.colors.primary}
                              />
                              <ThemedText
                                size="xs"
                                style={{
                                  color: theme.colors.textSecondary,
                                  marginTop: 2
                                }}
                              >
                                Uploading...
                              </ThemedText>
                            </View>
                          ) : (
                            <View style={styles.uploadContent}>
                              <Text style={[styles.uploadIcon, { color: theme.colors.primary }]}>📷</Text>
                              <ThemedText
                                size="xs"
                                weight="medium"
                                style={{ color: theme.colors.primary }}
                              >
                                Upload
                              </ThemedText>
                            </View>
                          )}

                          {/* Count Badge */}
                          {values[key] && (
                            (Array.isArray(values[key]) && values[key].length > 0) ||
                            (!Array.isArray(values[key]) && values[key])
                          ) && (
                              <View
                                style={[
                                  styles.countBadge,
                                  { backgroundColor: theme.colors.primary }
                                ]}
                              >
                                <ThemedText
                                  size="xs"
                                  weight="bold"
                                  style={{ color: theme.colors.background }}
                                >
                                  {Array.isArray(values[key]) ? values[key].length : 1}
                                </ThemedText>
                              </View>
                            )}
                        </TouchableOpacity>

                        {/* Preview and AI Button Container */}
                        {values[key] && (
                          (Array.isArray(values[key]) && values[key].length > 0) ||
                          (!Array.isArray(values[key]) && values[key])
                        ) && (
                            <View style={styles.previewAiContainer }>
                              {/* Preview Thumbnails */}
                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.previewScroll}
                                contentContainerStyle={styles.previewContent}
                              >
                                {(Array.isArray(values[key]) ? values[key] : [values[key]]).map((item: any, index: number) => (
                                  <TouchableOpacity
                                    key={index}
                                    onPress={() => {
                                      const imagesToView = Array.isArray(values[key]) ? values[key] : [values[key]];
                                      openImageViewer(imagesToView, index, key);
                                    }}
                                    style={styles.previewContainer}
                                  >
                                    <Image
                                      source={{ uri: getImageUrl(item) }}
                                      style={[
                                        styles.previewImage,
                                        { borderColor: theme.colors.border }
                                      ]}
                                      resizeMode="cover"
                                    />
                                  </TouchableOpacity>
                                ))}
                              </ScrollView>

                              {/* AI Generate Button */}
                              <TouchableOpacity
                                style={[
                                  styles.aiButton,
                                  {
                                    borderColor: theme.colors.info,
                                    backgroundColor: `${theme.colors.info}10`,
                                  }
                                ]}
                                onPress={() => processImageWithAI(key)}
                                disabled={aiProcessing === key}
                              >
                                {aiProcessing === key ? (
                                  <View style={styles.aiContent}>
                                    <ActivityIndicator size="small" color={theme.colors.info} />
                                    <ThemedText
                                      size="xs"
                                      weight="medium"
                                      style={{ color: theme.colors.info, marginLeft: 4 }}
                                    >
                                      Processing...
                                    </ThemedText>
                                  </View>
                                ) : (
                                  <View style={styles.aiContent}>
                                    <Text style={[styles.aiIcon, { color: theme.colors.info }]}>⚡</Text>
                                    <ThemedText
                                      size="xs"
                                      weight="medium"
                                      style={{ color: theme.colors.info }}
                                    >
                                      AI Generate
                                    </ThemedText>
                                  </View>
                                )}
                              </TouchableOpacity>
                            </View>
                          )}
                      </View>
                    </View>

                    {hasError && (
                      <View style={styles.errorContainer}>
                        <Text style={[styles.errorIcon, { color: theme.colors.error }]}>⚠</Text>
                        <ThemedText
                          size="xs"
                          style={{ color: theme.colors.error, flex: 1 }}
                        >
                          {hasError}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                ) : (
                  // Regular form field
                  <View>
                    {/* <ThemedText
                      size="sm"
                      weight="medium"
                      style={{
                        color: theme.colors.text,
                        marginBottom: theme.spacing.sm
                      }}
                    >
                      {(field.description || key).replace(' field', '')}
                      {isRequired && (
                        <Text style={{ color: theme.colors.error }}> *</Text>
                      )}
                    </ThemedText> */}

                    {renderField(key, field, parentSchema )}
                  </View>
                )}
              </View>
            );
          })}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleFormSubmit}
            disabled={loading}
            style={[
              styles.submitButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.lg,
                marginTop: theme.spacing.lg,
                opacity: loading ? 0.5 : 1,
              }
            ]}
          >
            {loading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color={theme.colors.background} />
                <ThemedText
                  size="base"
                  weight="medium"
                  style={{
                    color: theme.colors.background,
                    marginLeft: theme.spacing.sm
                  }}
                >
                  Processing...
                </ThemedText>
              </View>
            ) : (
              <ThemedText
                size="base"
                weight="semibold"
                style={{ color: theme.colors.background }}
              >
                {submitLabel}
              </ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>

      {/* Camera Gallery Popup */}
      <CameraGalleryPopup
        isOpen={activePopup !== null}
        onClose={closeImagePopup}
        onFileSelect={(files) => {
          if (activePopup) {
            handlePopupFileSelect(activePopup, files);
          }
        }}
        accept="image/*"
        multiple={getMultipleForField(activePopup)}
      />

      {/* Full Screen Image Viewer */}
      <Modal
        visible={imageViewer.isOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerOverlay}>
          {/* Header */}
          <View style={styles.imageViewerHeader}>
            <ThemedText style={styles.imageCounter}>
              {imageViewer.currentIndex + 1} of {imageViewer.images.length}
            </ThemedText>
            <TouchableOpacity onPress={closeImageViewer}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Buttons */}
          {imageViewer.images.length > 1 && (
            <>
              <TouchableOpacity
                onPress={goToPrevious}
                style={[styles.navButton, styles.navLeft]}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={goToNext}
                style={[styles.navButton, styles.navRight]}
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageViewer.images[imageViewer.currentIndex] }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </View>

          {/* Bottom Actions */}
          <View style={styles.imageViewerFooter}>
            <View style={styles.imageIndicators}>
              {imageViewer.images.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setImageViewer(prev => ({ ...prev, currentIndex: idx }))}
                  style={[
                    styles.indicator,
                    {
                      backgroundColor: idx === imageViewer.currentIndex
                        ? theme.colors.background
                        : theme.colors.disabled
                    }
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={deleteCurrentImage}
              style={[
                styles.deleteButton,
                { backgroundColor: theme.colors.error }
              ]}
            >
              <Text style={[styles.deleteIcon, { color: theme.colors.background }]}>🗑</Text>
              <ThemedText
                size="sm"
                weight="medium"
                style={{ color: theme.colors.background, marginLeft: theme.spacing.xs }}
              >
                Delete
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  header: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusContainer: {
    paddingHorizontal: 12,
  },
  statusMessage: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIcon: {
    fontSize: 16,
  },
  closeButton: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  formContainer: {
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  // Updated Upload Section Styles
  uploadSection: {
    marginVertical: 8,
  },

  uploadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },

  uploadButton: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    width: 90,
    position: 'relative',
    flexShrink: 0,
  },

  uploadingContent: {
    alignItems: 'center',
  },

  uploadContent: {
    alignItems: 'center',
    gap: 2,
  },

  uploadIcon: {
    fontSize: 20,
  },

  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },

  previewAiContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 80,
  },

  previewScroll: {
    flex: 1,
    maxHeight: 80,
  },

  previewContent: {
    gap: 6,
    alignItems: 'center',
  },

  previewContainer: {
    borderRadius: 6,
    overflow: 'hidden',
  },

  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    borderWidth: 1,
  },

  aiButton: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 8,
    flexShrink: 0,
  },

  aiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },

  aiIcon: {
    fontSize: 14,
  },

  // Error and Input Styles
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  errorIcon: {
    fontSize: 14,
  },
  inputContainer: {
    // Container for regular inputs
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  amountContainer: {
    flexDirection: 'row',
  },
  amountInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  currencyLabel: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Image Viewer Modal Styles
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  imageCounter: {
    color: 'white',
    fontSize: 16,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  navLeft: {
    left: 16,
  },
  navRight: {
    right: 16,
  },
  navButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  fullscreenImage: {
    width: width - 32,
    height: height * 0.7,
    borderRadius: 8,
  },
  imageViewerFooter: {
    paddingHorizontal: 16,
    paddingBottom: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imageIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteIcon: {
    fontSize: 16,
  },
});

export default MobilePaymentForm;
