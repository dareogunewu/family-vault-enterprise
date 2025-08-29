'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Download, Eye, Share2, Trash2, ArrowLeft, File, Image, FileVideo, X, Plus, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useVault } from '@/hooks/useVault';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  category: string;
  uploadDate: string;
  sharedWith: string[];
  encrypted: boolean;
  signed: boolean;
}

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: '',
    notes: '',
    file: null as File | null
  });
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const { addDocument, isLoading, error } = useVault();

  // Default documents data
  const defaultDocuments: Document[] = [
    {
      id: '1',
      name: 'Last_Will_Testament.pdf',
      type: 'pdf',
      size: '2.4 MB',
      category: 'Legal',
      uploadDate: '2024-01-15',
      sharedWith: ['spouse', 'lawyer'],
      encrypted: true,
      signed: true
    },
    {
      id: '2',
      name: 'Insurance_Policy_Life.pdf',
      type: 'pdf',
      size: '1.8 MB',
      category: 'Insurance',
      uploadDate: '2024-01-12',
      sharedWith: ['spouse'],
      encrypted: true,
      signed: false
    },
    {
      id: '3',
      name: 'Birth_Certificate_John.pdf',
      type: 'pdf',
      size: '856 KB',
      category: 'Personal',
      uploadDate: '2024-01-10',
      sharedWith: [],
      encrypted: true,
      signed: false
    },
    {
      id: '4',
      name: 'House_Deed.pdf',
      type: 'pdf',
      size: '3.2 MB',
      category: 'Property',
      uploadDate: '2024-01-08',
      sharedWith: ['spouse', 'lawyer'],
      encrypted: true,
      signed: true
    },
    {
      id: '5',
      name: 'Passport_Copy.jpg',
      type: 'image',
      size: '2.1 MB',
      category: 'Personal',
      uploadDate: '2024-01-05',
      sharedWith: [],
      encrypted: true,
      signed: false
    },
    {
      id: '6',
      name: 'Tax_Returns_2023.pdf',
      type: 'pdf',
      size: '4.5 MB',
      category: 'Financial',
      uploadDate: '2024-01-03',
      sharedWith: ['accountant'],
      encrypted: true,
      signed: false
    }
  ];

  const [documents, setDocuments] = useState<Document[]>([]);

  // Load documents from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('family-vault-documents');
    if (stored) {
      setDocuments(JSON.parse(stored));
    } else {
      setDocuments(defaultDocuments);
    }
  }, []);

  // Save to localStorage whenever documents change
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('family-vault-documents', JSON.stringify(documents));
    }
  }, [documents]);

  const categories = ['all', 'Legal', 'Insurance', 'Personal', 'Property', 'Financial'];
  const documentCategories = ['Legal', 'Insurance', 'Personal', 'Property', 'Financial', 'Medical', 'Other'];

  // Handle file upload
  const handleFileSelect = (file: File) => {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      alert('File size must be less than 50MB');
      return;
    }
    setUploadForm({ ...uploadForm, file, name: uploadForm.name || file.name });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.category) {
      alert('Please select a file and category');
      return;
    }

    setUploading(true);
    try {
      // In real app, use the vault service
      // await addDocument({
      //   name: uploadForm.name || uploadForm.file.name,
      //   file: uploadForm.file,
      //   category: uploadForm.category,
      //   notes: uploadForm.notes
      // });

      // For demo, add to mock data
      const newDocument: Document = {
        id: Date.now().toString(),
        name: uploadForm.name || uploadForm.file.name,
        type: uploadForm.file.type.startsWith('image/') ? 'image' : 'pdf',
        size: formatFileSize(uploadForm.file.size),
        category: uploadForm.category,
        uploadDate: new Date().toISOString().split('T')[0],
        sharedWith: [],
        encrypted: true,
        signed: false
      };
      
      setDocuments([newDocument, ...documents]);
      setShowUploadModal(false);
      setUploadForm({ name: '', category: '', notes: '', file: null });
    } catch (error) {
      alert('Upload failed. Please try again.');
    }
    setUploading(false);
  };

  const handleViewDocument = (doc: Document) => {
    // In real app, this would decrypt and display the document
    alert(`Viewing document: ${doc.name}`);
  };

  const handleDownloadDocument = (doc: Document) => {
    // In real app, this would decrypt and download the document
    alert(`Downloading document: ${doc.name}`);
  };

  const handleShareDocument = (doc: Document) => {
    // In real app, this would open sharing modal
    alert(`Sharing document: ${doc.name}`);
  };

  const handleDeleteDocument = (docId: string) => {
    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      setDocuments(documents.filter(d => d.id !== docId));
    }
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <File className="h-6 w-6 text-red-600" />;
      case 'image': return <Image className="h-6 w-6 text-blue-600" />;
      case 'video': return <FileVideo className="h-6 w-6 text-purple-600" />;
      default: return <FileText className="h-6 w-6 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Legal': return 'bg-red-100 text-red-800';
      case 'Insurance': return 'bg-blue-100 text-blue-800';
      case 'Personal': return 'bg-green-100 text-green-800';
      case 'Property': return 'bg-purple-100 text-purple-800';
      case 'Financial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <FileText className="h-8 w-8 text-green-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Document Vault</h1>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Storage Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <FileText className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
                <p className="text-gray-600">Total Documents</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Upload className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{documents.filter(d => d.encrypted).length}</p>
                <p className="text-gray-600">Encrypted</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Share2 className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{documents.filter(d => d.sharedWith.length > 0).length}</p>
                <p className="text-gray-600">Shared</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <FileText className="h-8 w-8 text-orange-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{documents.filter(d => d.signed).length}</p>
                <p className="text-gray-600">DocuSigned</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search documents by name or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === 'all' ? 'All Categories' : category}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(document.type)}
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate max-w-48">
                        {document.name}
                      </h3>
                      <p className="text-sm text-gray-500">{document.size}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoryColor(document.category)}`}>
                      {document.category}
                    </span>
                    {document.encrypted && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                        🔒 Encrypted
                      </span>
                    )}
                    {document.signed && (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                        ✓ DocuSigned
                      </span>
                    )}
                  </div>

                  <div className="text-sm text-gray-600">
                    <div><strong>Uploaded:</strong> {new Date(document.uploadDate).toLocaleDateString()}</div>
                    {document.sharedWith.length > 0 && (
                      <div><strong>Shared with:</strong> {document.sharedWith.join(', ')}</div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewDocument(document)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDownloadDocument(document)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleShareDocument(document)}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteDocument(document.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search terms or filters.' 
                  : 'Get started by uploading your first document.'}
              </p>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Document
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Features Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">🔒 Zero-Knowledge Encryption</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800 text-sm">
                All documents are encrypted client-side with ChaCha20-Poly1305 before upload. Even we can't access your files.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">✍️ DocuSign Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-800 text-sm">
                Sign important documents digitally with full legal validity and audit trails.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-900">👥 Family Sharing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-800 text-sm">
                Securely share documents with family members and trusted professionals with granular permissions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Upload New Document
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadForm({ name: '', category: '', notes: '', file: null });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  Upload and encrypt your important documents with zero-knowledge encryption.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUploadSubmit} className="space-y-6">
                  {/* File Upload Area */}
                  <div className="space-y-2">
                    <Label>Document File *</Label>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        dragActive 
                          ? 'border-green-500 bg-green-50' 
                          : uploadForm.file 
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      {uploadForm.file ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center">
                            {uploadForm.file.type.startsWith('image/') ? (
                              <Image className="h-12 w-12 text-green-600" />
                            ) : (
                              <File className="h-12 w-12 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{uploadForm.file.name}</p>
                            <p className="text-sm text-gray-600">
                              {formatFileSize(uploadForm.file.size)}
                            </p>
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setUploadForm({ ...uploadForm, file: null })}
                          >
                            Remove File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                          <div>
                            <p className="text-lg font-semibold text-gray-700">
                              Drop your document here or click to browse
                            </p>
                            <p className="text-sm text-gray-500">
                              Supports PDF, images, and other document formats (max 50MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.docx,.doc,.txt"
                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Name */}
                  <div className="space-y-2">
                    <Label htmlFor="document-name">Document Name</Label>
                    <Input
                      id="document-name"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                      placeholder="Enter document name (or leave blank to use filename)"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <select
                      id="category"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                      required
                    >
                      <option value="" disabled>Select a category</option>
                      {documentCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={uploadForm.notes}
                      onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                      placeholder="Add any notes or description for this document..."
                      rows={3}
                    />
                  </div>

                  {/* Security Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900">Zero-Knowledge Encryption</h4>
                        <p className="text-sm text-blue-800 mt-1">
                          Your document will be encrypted with ChaCha20-Poly1305 on your device before upload. 
                          Only you and authorized family members can decrypt and view this document.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setShowUploadModal(false);
                        setUploadForm({ name: '', category: '', notes: '', file: null });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={!uploadForm.file || !uploadForm.category || uploading}
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Encrypting & Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}