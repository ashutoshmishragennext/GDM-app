import { OptimizationInfo } from '@/api/types';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { uploadImageFromCamera, uploadImageFromPicker } from './uploadHelper';

const ImageUploadComponent = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [optimizationInfo, setOptimizationInfo] = useState<OptimizationInfo | null>(null);

  const handleImageUpload = async (fromCamera: boolean = false) => {
    setUploading(true);
    try {
      const result = fromCamera 
        ? await uploadImageFromCamera() 
        : await uploadImageFromPicker();
      
      if (result) {
        setUploadedImageUrl(result.url);
        setOptimizationInfo(result.optimization);
        
        Alert.alert(
          'Upload Success!', 
          `Image compressed from ${result.optimization.originalSize} to ${result.optimization.finalSize}`
        );
      }
    } catch (error) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        Image Upload
      </Text>

      <TouchableOpacity
        onPress={() => handleImageUpload(false)}
        disabled={uploading}
        style={{
          backgroundColor: uploading ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 8,
          marginBottom: 10,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {uploading ? 'Uploading...' : 'Upload from Gallery'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleImageUpload(true)}
        disabled={uploading}
        style={{
          backgroundColor: uploading ? '#ccc' : '#34C759',
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {uploading ? 'Uploading...' : 'Take Photo & Upload'}
        </Text>
      </TouchableOpacity>

      {uploading && (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginBottom: 20 }} />
      )}

      {uploadedImageUrl && (
        <View>
          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>Uploaded Image:</Text>
          <Image 
            source={{ uri: uploadedImageUrl }} 
            style={{ width: 200, height: 200, marginBottom: 10 }}
            resizeMode="contain"
          />
          <Text>URL: {uploadedImageUrl}</Text>
          
          {optimizationInfo && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: 'bold' }}>Optimization Info:</Text>
              <Text>Original Size: {optimizationInfo.originalSize}</Text>
              <Text>Final Size: {optimizationInfo.finalSize}</Text>
              {optimizationInfo.resolutionReduced && (
                <Text>Resolution: Reduced</Text>
              )}
              {optimizationInfo.finalQuality && (
                <Text>Quality: {optimizationInfo.finalQuality}%</Text>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default ImageUploadComponent;
