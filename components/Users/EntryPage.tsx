import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { format as formatDateFns } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';
import { ThemedView, ThemedText, ThemedButton } from '@/components/utils/ThemeComponents';
import { apiService } from '@/api';
import BottomNav from './BottomNav';
import FolderGrid from './UserDashboard';
import MetaForm from './MetaForm';
import Summary from './PaymentSummary/MainSummary';
import type { Document as AppDocument } from './DocumentsScreen';
import DocumentDetailsScreen from './DocumentsScreen';
import { useAuth } from '@/context/AuthContext';

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

interface UserDashboardResponse {
  folders: Folder[];
  userStats: UserStats;
}

interface DocumentType {
  id: string;
  name: string;
  description?: string;
  metadata?: Metadata[];
}

interface Metadata {
  id: string;
  documentTypeId: string;
  schema: MetadataSchema;
  version: string;
}

interface MetadataSchema {
  type: string;
  required: string[];
  properties: Record<string, MetadataField>;
}

interface MetadataField {
  type: string;
  description: string;
}

interface Document {
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
  uploadThingUrl: string;
  metadata?: Record<string, any>;
  verificationStatus: string;
}

const DocumentManagementDashboard = () => {
  const { theme } = useTheme();
  const currentuser = useAuth().user
  // --- State ---
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  // const [users, setUsers] = useState<any>();
  const [currentView, setCurrentView] = useState<'home' | 'form' | 'summary' | 'document-details'>('home');
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [selectedFolderSchema, setSelectedFolderSchema] = useState<MetadataSchema | null>(null);
  const [metaFormValues, setMetaFormValues] = useState<Record<string, any>>({});
  const [metaFormFiles, setMetaFormFiles] = useState<Record<string, File[]>>({});
  const [metaFormUploading, setMetaFormUploading] = useState(false);
  const [directoryFiles, setDirectoryFiles] = useState<Document[]>([]);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<AppDocument | null>(null);
  const [metaFormTargetFolder, setMetaFormTargetFolder] = useState<Folder | null>(null);
  const [metaFormSchema, setMetaFormSchema] = useState<MetadataSchema | null>(null);
  const [user, setUser] = useState<any>(null);
  const [mainView, setMainView] = useState<'home' | 'form' | 'summary'>('home');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  const today = new Date();
  const defaultDate = formatDateFns(today, 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(defaultDate);
  const [endDate, setEndDate] = useState(defaultDate);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
    fetchDocumentTypes();
  }, []);

  // Fetch folders only after user is loaded and user.folder is available
  useEffect(() => {
    if(user) {
      console.log("User state changed:", user);
    }
    if (user && Array.isArray(user[0].folder)) {
      fetchFolders();
    }
  }, [user]);

  const fetchDocuments = async (start = startDate, end = endDate) => {
    try {
      const data = await apiService.getDocuments({
        userId : currentuser ? currentuser.id : '',
        folderId: selectedFolder?.id,
        startDate: start,
        endDate: end,
      });
      
      setDirectoryFiles(data || []);
      setDocuments(data || []);
    } catch (error) {
      console.log("Failed to fetch documents:", error);
      
      Alert.alert('Error', 'Failed to fetch documents');
    }
  };

  useEffect(() => {
    if (selectedFolder)
    fetchDocuments();
  }, [selectedFolder, startDate, endDate]);

  const handleDateChange = ({ startDate: newStart, endDate: newEnd }: { startDate?: string; endDate?: string }) => {
    setStartDate(newStart || defaultDate);
    setEndDate(newEnd || defaultDate);
  };

  const payments = documents.map((doc: any) => ({
    id: doc.id,
    filename: doc.filename,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    uploadThingFileId: doc.uploadThingFileId,
    uploadThingUrl: doc.uploadThingUrl,
    documentTypeId: doc.documentTypeId,
    metadata: doc.metadata,
    uploadedBy: doc.uploadedBy,
    verificationStatus: doc.verificationStatus,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    documentType: doc.documentType,
    
    // Keep these for backward compatibility
    amount: doc.metadata?.["Amount"] || doc.metadata?.["Amount Paid"],
    billNo: doc.metadata?.["Bill No"],
    paidTo: doc.metadata?.["Paid to"],
    size: doc.fileSize || 0,
    userName: doc.metadata?.["User Name"],
    modeOfPayment: doc.metadata?.["Mode Of Payment"],
    purpose: doc.metadata?.["Purpose of Payment"],
    amountPaid: doc.metadata?.["Amount Paid"],
    bankName: doc.metadata?.["Bank Name"],
    accountNo: doc.metadata?.["Account No"],
    cardNo: doc.metadata?.["Card No"],
    uploadImage: doc.metadata?.["Upload Image"],
  }));

  // --- Fetch Functions ---
  const fetchUser = async () => {
    try {
    console.log("userData:", currentuser);
    
      const data = await apiService.getUserById(currentuser?.id ? currentuser.id : ''); // Fetch full user data
      console.log("Fetched user data:", data);
      
      setUser(data);
      // setUsers(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load user data');
    }
  };

  const fetchFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching folders for user:", user);
      
      if (!user[0]?.id) throw new Error('User not found');
      
      const data: UserDashboardResponse = await apiService.getFolders({
        userId: user[0].id,
        organizationId: user[0].organizationId
      });
      
      const { folders: fetchedFolders, userStats: fetchedUserStats } = data;
      
      // Only include folders that are in the user's folder array
      const userFolderIds = Array.isArray(user[0]?.folder) ? user[0].folder : [];
      const filteredFolders = fetchedFolders.filter((f: any) => userFolderIds.includes(f.id));
      
      setFolders(filteredFolders);
      
      setUserStats({
        ...fetchedUserStats,
        totalFolders: filteredFolders.length,
        activeFolders: filteredFolders.filter(f => f.documentCount > 0).length,
        emptyFolders: filteredFolders.filter(f => f.documentCount === 0).length,
      });
      
      if (filteredFolders.length > 0)
        setSelectedFolder(filteredFolders[0]);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load folders');
      Alert.alert('Error', 'Failed to load folders');
    } finally {
      setLoading(false);
    }
  };

  const summaryRedirect = () => {
    setMainView('summary');
    setCurrentView('home');
  };

  const fetchDocumentTypes = async () => {
    try {
      const data = await apiService.getDocumentTypes();
      setDocumentTypes(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load document types');
    }
  };

  // --- Folder Selection and Schema ---
  useEffect(() => {
    if (selectedFolder && documentTypes.length > 0) {
      const metaId = selectedFolder.metadata?.documentTypeMetadataId;
      const docType = documentTypes.find(dt => dt.metadata && dt.metadata[0]?.id === metaId);
      if (docType && docType.metadata && docType.metadata[0]?.schema) {
        setSelectedFolderSchema(docType.metadata[0].schema);
        
        const now = new Date().toISOString();
        const initialValues: Record<string, any> = {};
        Object.entries(docType.metadata[0].schema.properties).forEach(([key, field]) => {
          if ((field.description && field.description.toLowerCase().includes('date time')) || key.toLowerCase().includes('date time')) {
            initialValues[key] = now;
          }
        });
        setMetaFormTargetFolder(selectedFolder);
        setMetaFormSchema(docType.metadata[0].schema);
        setMetaFormValues(initialValues);
        setMetaFormFiles({});
      }
    }
  }, [selectedFolder, documentTypes]);

  // --- Handlers ---
  const handleSelectFolder = async (folder: Folder) => {
    setSelectedFolder(folder);
    setMainView('form');
    
    const metaId = folder.metadata?.documentTypeMetadataId;
    const docType = documentTypes.find(dt => dt.metadata && dt.metadata[0]?.id === metaId);
    if (docType && docType.metadata && docType.metadata[0]?.schema) {
      setSelectedFolderSchema(docType.metadata[0].schema);
      
      const now = new Date().toISOString();
      const initialValues: Record<string, any> = {};
      Object.entries(docType.metadata[0].schema.properties).forEach(([key, field]) => {
        if ((field.description && field.description.toLowerCase().includes('date time')) || key.toLowerCase().includes('date time')) {
          initialValues[key] = now;
        }
      });
      setMetaFormTargetFolder(folder);
      setMetaFormSchema(docType.metadata[0].schema);
      setMetaFormValues(initialValues);
      setMetaFormFiles({});
    }
    
    try {
      const docs = await apiService.getDocuments({ folderId: folder.id , userId : currentuser?.id });
      setDirectoryFiles(docs || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch folder documents');
    }
  };

  const handleShowSummary = () => setSummaryModalOpen(true);
  const handleCloseSummary = () => setSummaryModalOpen(false);

  const handleShowForm = () => {
    setCurrentView('form');
  };

  const handleShowHome = () => {
    setCurrentView('home');
    setSelectedFolder(null);
  };

  const handleRowClick = (doc: AppDocument) => {
    setSelectedDocument(doc);
    setCurrentView('document-details');
  };

  const handleBackToDashboard = () => {
    setCurrentView(selectedFolder ? 'form' : 'home');
    setSelectedDocument(null);
  };

  // --- MetaForm Handlers ---
  const handleMetaFormFileChange = (key: string, files: File[] | null) => {
    if (files) {
      setMetaFormFiles((prev: any) => ({ ...prev, [key]: files }));
    }
  };

  const removeMetaFormFile = (key: string, index: number) => {
    setMetaFormFiles((prev: any) => ({ ...prev, [key]: prev[key]?.filter((_: any, i: number) => i !== index) || [] }));
  };

  const handleDirectMetaFormSubmit = async () => {
    setMetaFormUploading(true);
    try {
      const datetime = new Date().toISOString();
      
      let totalFileSize = 0;
      const processedMetadata: Record<string, any> = {};
      
      Object.entries(metaFormValues).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          const urls: string[] = [];
          
          value.forEach((item: any) => {
            if (typeof item === 'object' && item.url) {
              urls.push(item.url);
              if (item.size && typeof item.size === 'number') {
                totalFileSize += (item.size / 1024);
              }
            } else if (typeof item === 'string') {
              urls.push(item);
            }
          });
          processedMetadata[key] = urls;
        } else if (typeof value === 'object' && value !== null && value.url) {
          processedMetadata[key] = [value.url];
          
          if (value.size && typeof value.size === 'number') {
            totalFileSize += (value.size / 1024);
          }
        } else {
          processedMetadata[key] = value;
        }
      });
      
      const metadata: Record<string, any> = {
        ...processedMetadata,
        "Date Time": datetime,
        "User Name": user?.name || "Unknown User"
      };
      
      await apiService.createDocument({
        filename: 'Document Upload',
        fileSize: totalFileSize,
        mimeType: 'form',
        uploadThingUrl: '',
        folderId: selectedFolder ? selectedFolder.id : "",
        organizationId: user?.organizationId,
        documentTypeId: documentTypes.find(dt => dt.metadata && dt.metadata[0]?.id === selectedFolder?.metadata?.documentTypeMetadataId)?.id,
        metadata,
        metadataSchemaId: selectedFolder?.metadata?.documentTypeMetadataId,
        uploadedBy: user?.id || 'unknown',
        verificationStatus: 'APPROVED',
      });
      
      Alert.alert('Success', 'Document uploaded successfully!');
      if (selectedFolder?.id) {
        fetchDocuments();
      }
      setMetaFormValues({});
      setMetaFormFiles({});
      summaryRedirect();
    } catch (error) {
      Alert.alert('Error', 'Upload failed');
    } finally {
      setMetaFormUploading(false);
    }
  };

  // --- Render ---
  if (currentView === 'document-details' && mainView === "summary" && selectedDocument) {
    return (
      <ThemedView variant="background" style={{ flex: 1 }}>
        <View style={styles.desktopLayout}>
          {/* <DesktopNav /> */}
          <View style={styles.mainContent}>
            <DocumentDetailsScreen
              document={selectedDocument} 
              onBack={handleBackToDashboard}  
              schema={selectedFolderSchema} 
            />
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView variant="background" style={{ flex: 1 }}>
      <View style={styles.desktopLayout}>
        {currentView === 'document-details' && mainView === "summary" && selectedDocument ? (
          <DocumentDetailsScreen 
            document={selectedDocument} 
            onBack={handleBackToDashboard} 
            schema={selectedFolderSchema} 
          />
        ) : (
          <>
            {/* <DesktopNav /> */}
            <ScrollView style={styles.mainContent}>
              {mainView === 'home' && (
                <FolderGrid 
                  folders={folders}
                  userStats={userStats || {
                    totalFolders: 0,
                    activeFolders: 0,
                    emptyFolders: 0,
                    totalDocuments: 0,
                    totalStorage: '0 Bytes',
                    totalStorageBytes: '0',
                    storagePercentage: 0,
                    averageStoragePerFolder: '0 Bytes'
                  }}
                  onFolderSelect={handleSelectFolder}
                  maxSizeGB={5}
                  loading={loading}
                  error={error}
                />
              )}
              
              {mainView === 'form' && selectedFolder && selectedFolderSchema && (
                <View style={{ marginHorizontal: theme.spacing.md }}>
                  <MetaForm
                    folder={selectedFolder}
                    schema={selectedFolderSchema}
                    values={metaFormValues}
                    setValues={setMetaFormValues}
                    files={metaFormFiles}
                    setFiles={setMetaFormFiles}
                    loading={metaFormUploading}
                    onSubmit={handleDirectMetaFormSubmit}
                    removeFile={removeMetaFormFile}
                    handleFileChange={handleMetaFormFileChange}
                    submitLabel="Submit"
                    userName={selectedFolder.name}
                  />
                </View>
              )}
              
              {mainView === 'summary' && selectedFolder && (
                <Summary
                  payments={payments}
                  startDate={startDate}
                  endDate={endDate}
                  onDateChange={handleDateChange}
                  onRowClick={(id: any) => {
                    const doc = directoryFiles.find(d => d.id === id);
                    if (doc) {
                      setSelectedDocument(doc);
                      setCurrentView('document-details');
                    }
                  }}
                  folder={selectedFolder}
                  metadata={selectedFolderSchema}
                />
              )}
            </ScrollView>
            
            <BottomNav
              onHome={() => {setMainView('home'); setCurrentView('home');}}
              onForm={() => {setMainView('form'); setCurrentView('home');}}
              onSummary={() => setMainView('summary')}
              active={mainView}
            />
          </>
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopNav: {
    width: 256, // 64 * 4 = 256px equivalent to w-64
    borderRightWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  desktopNavHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  navItems: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    minHeight: 48,
  },
  navIcon: {
    fontSize: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  desktopNavFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  mainContent: {
    flex: 1,
  },
});

export default DocumentManagementDashboard;
