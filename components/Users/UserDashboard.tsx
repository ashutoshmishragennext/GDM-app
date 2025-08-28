/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions 
} from "react-native";
import { 
  FolderOpen, 
  FileText, 
  Clock, 
  TrendingUp, 
  HardDrive, 
  Activity, 
  BarChart3 
} from "lucide-react-native";

// Keep the same interfaces
interface Folder {
  id: string;
  name: string;
  description?: string;
  parentFolderId: string | null;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  uploadThingFolderId?: string;
  children?: Folder[];
  metadata?: {
    documentTypeMetadataId?: string;
  };
  totalSizeBytes: string;
  totalSizeKB: string;
  documentCount: number;
  totalSize: string;
  storagePercentage: number;
  isNearLimit: boolean;
  isEmpty: boolean;
  isActive: boolean;
  lastUploadFormatted: string;
  folderAge: number;
}

interface UserStats {
  totalFolders: number;
  activeFolders: number;
  emptyFolders: number;
  totalDocuments: number;
  totalStorage: string;
  totalStorageBytes: string;
  storagePercentage: number;
  averageStoragePerFolder: string;
}

// Updated props interface - added themecolor
interface UserDashboardProps {
  folders: Folder[];
  userStats: UserStats;
  onFolderSelect: (folder: Folder) => void;
  maxSizeGB?: number;
  loading?: boolean;
  error?: string | null;
  themecolor: string;
}

const { width } = Dimensions.get('window');

const UserDashboard: React.FC<UserDashboardProps> = ({ 
  folders,
  userStats,
  onFolderSelect,
  maxSizeGB = 5,
  loading = false,
  error = null,
  themecolor
}) => {
  const getUsageColorClass = (percentage: number): string => {
    if (percentage < 50) return "bg-green-500";
    if (percentage < 75) return "bg-yellow-500";
    if (percentage < 90) return "bg-orange-500";
    return "bg-red-500";
  };

  const getFolderIcon = (folder: Folder): string => {
    if (folder.isEmpty) return "📂";
    if (folder.isNearLimit) return "⚠️";
    if (folder.isActive) return "📂";
    return "📁";
  };

  const getThemeColorClass = (variant: string) => {
    const colorMap: { [key: string]: { [key: string]: string } } = {
      'blue': {
        'bg-500': 'bg-blue-500',
        'bg-50': 'bg-blue-50',
        'text-600': 'text-blue-600',
        'text-700': 'text-blue-700',
        'border-200': 'border-blue-200',
        'from-50': 'from-blue-50',
        'to-100': 'to-blue-100',
        'from-500': 'from-blue-500',
        'to-600': 'to-blue-600',
      },
      'purple': {
        'bg-500': 'bg-purple-500',
        'bg-50': 'bg-purple-50',
        'text-600': 'text-purple-600',
        'text-700': 'text-purple-700',
        'border-200': 'border-purple-200',
        'from-50': 'from-purple-50',
        'to-100': 'to-purple-100',
        'from-500': 'from-purple-500',
        'to-600': 'to-purple-600',
      },
      'green': {
        'bg-500': 'bg-green-500',
        'bg-50': 'bg-green-50',
        'text-600': 'text-green-600',
        'text-700': 'text-green-700',
        'border-200': 'border-green-200',
        'from-50': 'from-green-50',
        'to-100': 'to-green-100',
        'from-500': 'from-green-500',
        'to-600': 'to-green-600',
      }
    };
    
    return colorMap[themecolor]?.[variant] || `${variant.replace(/-(500|50|600|700|200)/, `-${themecolor}-$1`)}`;
  };

  if (loading) return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color={themecolor === 'blue' ? '#3B82F6' : themecolor === 'purple' ? '#8B5CF6' : '#10B981'} />
    </View>
  );

  if (error) return (
    <View className="flex-1 items-center justify-center p-8">
      <Text className={`${getThemeColorClass('text-600')} text-lg`}>{error}</Text>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="p-4 max-w-7xl mx-auto pb-20">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-6">
          <View className="flex-row items-center flex-1">
            <View className={`w-12 h-12 ${getThemeColorClass('bg-500')} rounded-xl shadow-md items-center justify-center mr-3`}>
              <BarChart3 size={24} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">Dashboard</Text>
              <Text className="text-base text-gray-600">Document management overview</Text>
            </View>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm text-gray-500">
            📊 {userStats.totalFolders} folders • {userStats.totalDocuments} documents • {userStats.totalStorage} used
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap mb-6">
          {/* Folders Stat */}
          <View className="w-1/2 p-2">
            <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-600 mb-1">Folders</Text>
                  <Text className={`text-2xl font-bold ${getThemeColorClass('text-600')}`}>{userStats.totalFolders}</Text>
                </View>
                <View className={`p-3 ${getThemeColorClass('bg-50')} rounded-lg ml-2`}>
                  <FolderOpen size={20} color={themecolor === 'blue' ? '#2563EB' : themecolor === 'purple' ? '#7C3AED' : '#059669'} />
                </View>
              </View>
            </View>
          </View>

          {/* Documents Stat */}
          <View className="w-1/2 p-2">
            <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-600 mb-1">Documents</Text>
                  <Text className="text-2xl font-bold text-green-600">{userStats.totalDocuments.toLocaleString()}</Text>
                </View>
                <View className="p-3 bg-green-50 rounded-lg ml-2">
                  <FileText size={20} color="#059669" />
                </View>
              </View>
            </View>
          </View>

          {/* Storage Stat */}
          <View className="w-1/2 p-2">
            <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-600 mb-1">Storage</Text>
                  <Text className="text-2xl font-bold text-purple-600">{userStats.totalStorage}</Text>
                </View>
                <View className="p-3 bg-purple-50 rounded-lg ml-2">
                  <HardDrive size={20} color="#7C3AED" />
                </View>
              </View>
            </View>
          </View>

          {/* Available Stat */}
          <View className="w-1/2 p-2">
            <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-600 mb-1">Available</Text>
                  <Text className="text-2xl font-bold text-emerald-600">
                    {((maxSizeGB * 1024 * 1024 * 1024 - parseFloat(userStats.totalStorageBytes)) / (1024 * 1024 * 1024)).toFixed(1)} GB
                  </Text>
                </View>
                <View className="p-3 bg-emerald-50 rounded-lg ml-2">
                  <HardDrive size={20} color="#059669" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Storage Usage Section */}
        <View className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-800">Storage Usage</Text>
            <View className="items-end">
              <Text className="text-base font-medium text-gray-700">{userStats.totalStorage}</Text>
              <Text className="text-xs text-gray-500">of {maxSizeGB} GB</Text>
            </View>
          </View>
          
          <View className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
            <View
              className={`h-3 rounded-full ${getUsageColorClass(userStats.storagePercentage)}`}
              style={{ width: `${userStats.storagePercentage}%` }}
            />
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text className="text-sm text-gray-600">{userStats.storagePercentage.toFixed(1)}% used</Text>
          </View>
        </View>

        {/* Section Header for Folders */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-xl font-semibold text-gray-900">Your Folders</Text>
            <Text className="text-sm text-gray-600">Tap on any folder to view and manage documents</Text>
          </View>
          <View className="bg-gray-50 px-3 py-1 rounded-full">
            <Text className="text-sm text-gray-500">
              {folders.length} {folders.length === 1 ? 'folder' : 'folders'}
            </Text>
          </View>
        </View>

        {/* Folders Grid */}
        <View className="flex-row flex-wrap">
          {folders.map(folder => {
            const usageColorClass = getUsageColorClass(folder.storagePercentage);
            const folderIcon = getFolderIcon(folder);
            
            return (
              <View key={folder.id} className="w-full p-2" style={{ width: width > 768 ? '50%' : '100%' }}>
                <TouchableOpacity
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden`}
                  onPress={() => onFolderSelect(folder)}
                  activeOpacity={0.7}
                >
                  {/* Status Indicators */}
                  <View className="absolute top-3 right-3 flex-row z-10">
                    {folder.isActive && (
                      <View className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                    )}
                    {folder.isNearLimit && (
                      <View className="w-2 h-2 bg-red-500 rounded-full mr-1" />
                    )}
                    {folder.isEmpty && (
                      <View className="w-2 h-2 bg-gray-400 rounded-full" />
                    )}
                  </View>

                  {/* Gradient Bar */}
                  <View className={`h-1 ${folder.isNearLimit ? 'bg-red-500' : 
                    folder.isActive ? 'bg-green-500' : 
                    getThemeColorClass('bg-500')}`} />
                  
                  <View className="p-4 flex-1">
                    {/* Folder Header */}
                    <View className="flex-row items-start mb-3">
                      <View className={`w-12 h-12 rounded-xl ${getThemeColorClass('bg-50')} items-center justify-center mr-3`}>
                        <Text className="text-xl">{folderIcon}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className={`font-semibold text-base text-gray-800 mb-1`} numberOfLines={1}>
                          {folder.name}
                        </Text>
                        <View className="flex-row items-center">
                          <View className="flex-row items-center mr-3">
                            <FileText size={12} color="#6B7280" />
                            <Text className="text-xs text-gray-500 ml-1">{folder.documentCount}</Text>
                          </View>
                          <View className="flex-row items-center flex-1">
                            <Clock size={12} color="#6B7280" />
                            <Text className="text-xs text-gray-500 ml-1 flex-1" numberOfLines={1}>
                              {folder.lastUploadFormatted}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                    
                    {/* Storage Information */}
                    <View className="mt-auto">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-xs font-medium text-gray-700">{folder.totalSize}</Text>
                        <Text className="text-xs text-gray-400">/ {maxSizeGB} GB</Text>
                      </View>
                      
                      <View className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                        <View
                          className={`h-2 rounded-full ${usageColorClass}`}
                          style={{ width: `${folder.storagePercentage}%` }}
                        />
                      </View>
                      
                      <View className="items-center">
                        <View className="bg-gray-50 px-2 py-1 rounded-full">
                          <Text className="text-xs font-medium text-gray-600">
                            {folder.storagePercentage.toFixed(1)}% used
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Empty State */}
        {folders.length === 0 && (
          <View className="items-center py-16">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <FolderOpen size={40} color="#9CA3AF" />
            </View>
            <Text className="text-xl font-semibold text-gray-600 mb-2">No folders available</Text>
            <Text className="text-base text-gray-500 text-center">Contact your administrator to get folder access</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default UserDashboard;
