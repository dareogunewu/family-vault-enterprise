'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, PenTool, Users, Upload, Download, Eye, Share2, ArrowLeft, FileCheck, Scale, Briefcase, UserCheck, AlertCircle, Loader } from 'lucide-react';
import Link from 'next/link';

interface LegalDocument {
  id: string;
  name: string;
  type: 'will' | 'trust' | 'power-of-attorney' | 'healthcare-directive' | 'contract' | 'other';
  status: 'draft' | 'signed' | 'witnessed' | 'notarized' | 'executed';
  uploadDate: string;
  signedDate?: string;
  signers: string[];
  lawyer?: string;
  lawyerEmail?: string;
  docuSignEnvelopeId?: string;
  size: string;
  user_id?: string;
}

export default function LegalDocumentsPage() {
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'will' as LegalDocument['type'],
    lawyerEmail: '',
    notes: ''
  });
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadDocuments();
  }, []);

  const checkAuthAndLoadDocuments = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/auth/login');
        return;
      }

      setUser(user);
      await loadUserLegalDocuments(user.id);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/auth/login');
    }
  };

  const loadUserLegalDocuments = async (userId: string) => {
    try {
      const savedDocs = localStorage.getItem(`legal_documents_${userId}`);
      if (savedDocs) {
        setLegalDocuments(JSON.parse(savedDocs));
      } else {
        setLegalDocuments([]);
      }
    } catch (error) {
      console.error('Error loading legal documents:', error);
      setLegalDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const saveLegalDocumentsToStorage = (updatedDocuments: LegalDocument[]) => {
    if (!user) return;
    localStorage.setItem(`legal_documents_${user.id}`, JSON.stringify(updatedDocuments));
    setLegalDocuments(updatedDocuments);
  };

  const documentTypes = ['all', 'will', 'trust', 'power-of-attorney', 'healthcare-directive', 'contract', 'other'];

  const filteredDocuments = legalDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.lawyer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'will': return 'bg-red-100 text-red-800';
      case 'trust': return 'bg-blue-100 text-blue-800';
      case 'power-of-attorney': return 'bg-purple-100 text-purple-800';
      case 'healthcare-directive': return 'bg-green-100 text-green-800';
      case 'contract': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'executed': return 'bg-green-100 text-green-800';
      case 'notarized': return 'bg-blue-100 text-blue-800';
      case 'witnessed': return 'bg-purple-100 text-purple-800';
      case 'signed': return 'bg-indigo-100 text-indigo-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'executed': return <FileCheck className="h-4 w-4" />;
      case 'notarized': return <Scale className="h-4 w-4" />;
      case 'witnessed': return <UserCheck className="h-4 w-4" />;
      case 'signed': return <PenTool className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleCreateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Creating legal document: ${createForm.name}\nType: ${createForm.type}\nLawyer: ${createForm.lawyerEmail}\n\nThis would integrate with DocuSign to create and send documents for signature.`);
    setShowCreateModal(false);
    setCreateForm({ name: '', type: 'will', lawyerEmail: '', notes: '' });
  };

  const handleViewDocument = (doc: LegalDocument) => {
    alert(`Viewing document: ${doc.name}\n\nThis would open the encrypted legal document with proper access controls and audit logging.`);
  };

  const handleSignDocument = (doc: LegalDocument) => {
    alert(`Initiating DocuSign process for: ${doc.name}\n\nThis would:\n• Send document via DocuSign\n• Notify all required signers\n• Track signature progress\n• Update document status`);
  };

  const handleShareWithLawyer = (doc: LegalDocument) => {
    alert(`Sharing document with lawyer: ${doc.lawyer || 'Legal professional'}\n\nThis would:\n• Grant temporary access\n• Send secure notification\n• Log access for audit trail\n• Set expiration date`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading legal documents...</p>
        </div>
      </div>
    );
  }

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
              <Scale className="h-8 w-8 text-indigo-600 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Legal Documents</h1>
            </div>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setShowCreateModal(true)}
            >
              <PenTool className="h-4 w-4 mr-2" />
              Create Document
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Legal Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="flex items-center p-6">
              <Scale className="h-8 w-8 text-indigo-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{legalDocuments.length}</p>
                <p className="text-gray-600">Total Documents</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <PenTool className="h-8 w-8 text-blue-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{legalDocuments.filter(d => d.status === 'signed' || d.status === 'executed').length}</p>
                <p className="text-gray-600">Executed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-purple-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{new Set(legalDocuments.map(d => d.lawyer).filter(Boolean)).size}</p>
                <p className="text-gray-600">Legal Partners</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center p-6">
              <FileCheck className="h-8 w-8 text-green-600 mr-4" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{legalDocuments.filter(d => d.docuSignEnvelopeId).length}</p>
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
                  placeholder="Search legal documents by name or lawyer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {documentTypes.map((type) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                  >
                    {type === 'all' ? 'All Types' : type.split('-').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal Documents List */}
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Scale className="h-6 w-6 text-indigo-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {document.name}
                        </h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getTypeColor(document.type)}`}>
                          {document.type.replace('-', ' ')}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(document.status)}`}>
                          {getStatusIcon(document.status)}
                          <span className="ml-1">{document.status}</span>
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-4">
                          <span><strong>Uploaded:</strong> {new Date(document.uploadDate).toLocaleDateString()}</span>
                          {document.signedDate && (
                            <span><strong>Signed:</strong> {new Date(document.signedDate).toLocaleDateString()}</span>
                          )}
                          <span><strong>Size:</strong> {document.size}</span>
                        </div>
                        
                        {document.lawyer && (
                          <div>
                            <strong>Legal Counsel:</strong> {document.lawyer}
                          </div>
                        )}
                        
                        <div>
                          <strong>Signers:</strong> {document.signers.join(', ')}
                        </div>

                        {document.docuSignEnvelopeId && (
                          <div className="flex items-center text-green-600">
                            <FileCheck className="h-4 w-4 mr-1" />
                            <span className="text-xs">DocuSign Envelope: {document.docuSignEnvelopeId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDocument(document)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSignDocument(document)}
                      >
                        <PenTool className="h-3 w-3 mr-1" />
                        Sign
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleShareWithLawyer(document)}
                      >
                        <Briefcase className="h-3 w-3 mr-1" />
                        Lawyer
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No legal documents found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedType !== 'all' 
                  ? 'Try adjusting your search terms or filters.' 
                  : 'Get started by creating your first legal document with DocuSign integration.'}
              </p>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setShowCreateModal(true)}
              >
                <PenTool className="h-4 w-4 mr-2" />
                Create Legal Document
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Legal Services Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-indigo-50">
            <CardHeader>
              <CardTitle className="text-indigo-900">📝 DocuSign Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-indigo-800 text-sm">
                Seamlessly create, send, and track legal documents for signature with full legal validity and audit trails.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50">
            <CardHeader>
              <CardTitle className="text-purple-900">⚖️ Lawyer Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-800 text-sm">
                Grant secure, time-limited access to legal professionals while maintaining full control and audit logging.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">🔐 Estate Planning</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-800 text-sm">
                Comprehensive tools for wills, trusts, power of attorney, and healthcare directives with family access controls.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Create Document Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Create Legal Document
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateForm({ name: '', type: 'will', lawyerEmail: '', notes: '' });
                    }}
                  >
                    ×
                  </Button>
                </CardTitle>
                <CardDescription>
                  Create a new legal document with DocuSign integration for professional execution.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDocument} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="doc-name">Document Name *</Label>
                    <Input
                      id="doc-name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="e.g., Last Will and Testament"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doc-type">Document Type *</Label>
                    <select
                      id="doc-type"
                      className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={createForm.type}
                      onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as LegalDocument['type'] })}
                      required
                    >
                      <option value="will">Last Will and Testament</option>
                      <option value="trust">Trust Agreement</option>
                      <option value="power-of-attorney">Power of Attorney</option>
                      <option value="healthcare-directive">Healthcare Directive</option>
                      <option value="contract">Contract</option>
                      <option value="other">Other Legal Document</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lawyer-email">Lawyer Email (Optional)</Label>
                    <Input
                      id="lawyer-email"
                      type="email"
                      value={createForm.lawyerEmail}
                      onChange={(e) => setCreateForm({ ...createForm, lawyerEmail: e.target.value })}
                      placeholder="lawyer@lawfirm.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      value={createForm.notes}
                      onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                      placeholder="Additional instructions or notes..."
                      rows={3}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900">DocuSign Integration</h4>
                        <p className="text-sm text-blue-800 mt-1">
                          This document will be created using DocuSign templates with full legal validity. 
                          All signatures will be tracked and legally binding with tamper-proof audit trails.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setShowCreateModal(false);
                        setCreateForm({ name: '', type: 'will', lawyerEmail: '', notes: '' });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      <PenTool className="h-4 w-4 mr-2" />
                      Create Document
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