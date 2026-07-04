import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button,
  IconButton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Upload, Eye, Download, Trash2, X } from 'lucide-react';
import PatientTimeline from './PatientTimeline';
import API_BASE_URL from '../apiConfig';
import { authFetch } from '../utils/authFetch';

function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function fetchAsBlob(endpoint) {
  const res = await authFetch(`${API_BASE_URL}${endpoint}`, {});
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.blob();
}

function PatientDocuments() {
  // Patient search state
  const [patientName, setPatientName] = useState('');
  const [patientData, setPatientData] = useState([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientSearchError, setPatientSearchError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Tab state (default Documents = 1)
  const [activeTab, setActiveTab] = useState(1);

  // Document categories
  const [docCategories, setDocCategories] = useState([]);

  // Document filter state
  const [docFilterId, setDocFilterId] = useState('');
  const [docFilterTitle, setDocFilterTitle] = useState('');

  // Documents grid state
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');
  const [docSearchDone, setDocSearchDone] = useState(false);

  // Upload modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    documentId: '',
    documentTitle: '',
    documentDate: '',
    remarks: '',
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewType, setPreviewType] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // Fetch document categories on mount
  useEffect(() => {
    authFetch(`${API_BASE_URL}/api/document-master`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDocCategories(data);
      })
      .catch(() => {});
  }, []);

  // Patient search handler
  const handlePatientSearch = async () => {
    if (!patientName.trim()) return;
    setPatientSearchLoading(true);
    setPatientSearchError('');
    try {
      const res = await authFetch(
        `${API_BASE_URL}/fetchpat?patientName=${encodeURIComponent(patientName)}`
      );
      const data = await res.json();
      if (res.ok) {
        setPatientData(data.map((p, i) => ({ id: i, ...p })));
      } else {
        setPatientSearchError(data.message || 'No patients found.');
        setPatientData([]);
      }
    } catch {
      setPatientSearchError('Error searching patients.');
    } finally {
      setPatientSearchLoading(false);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setDocuments([]);
    setDocsError('');
    setDocSearchDone(false);
    setDocFilterId('');
    setDocFilterTitle('');
    setActiveTab(1);
  };

  // Load documents helper
  const loadDocuments = async (patientId, filters = {}) => {
    setDocsLoading(true);
    setDocsError('');
    try {
      const params = new URLSearchParams();
      if (filters.docId) params.append('docId', filters.docId);
      if (filters.title) params.append('title', filters.title);
      const qs = params.toString();
      const res = await authFetch(
        `${API_BASE_URL}/api/patient-documents/${patientId}${qs ? '?' + qs : ''}`
      );
      const data = await res.json();
      if (res.ok) {
        const mapped = data.map((r) => ({
          ...r,
          id: r.PATIENT_DOCUMENT_ID,
          FILE_SIZE_FMT: fmtSize(r.FILE_SIZE),
          UPLOADED_DATE_FMT: r.UPLOADED_DATE
            ? new Date(r.UPLOADED_DATE).toLocaleString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—',
          FILE_EXTENSION: (r.FILE_EXTENSION || '').toUpperCase(),
        }));
        setDocuments(mapped);
        setDocSearchDone(true);
      } else {
        setDocsError(data.error || 'Error loading documents.');
      }
    } catch {
      setDocsError('Error loading documents.');
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDocSearch = () => {
    if (!selectedPatient) return;
    loadDocuments(selectedPatient.patient_id, {
      docId: docFilterId || undefined,
      title: docFilterTitle || undefined,
    });
  };

  const handleDocReset = () => {
    setDocFilterId('');
    setDocFilterTitle('');
    if (selectedPatient) loadDocuments(selectedPatient.patient_id);
  };

  // Preview handler
  const handlePreview = async (row) => {
    const ext = (row.FILE_EXTENSION || '').toLowerCase();
    let type = 'other';
    if (ext === 'pdf') type = 'pdf';
    else if (['jpg', 'jpeg', 'png', 'bmp', 'tiff'].includes(ext)) type = 'image';
    else if (['doc', 'docx'].includes(ext)) type = 'office';

    setPreviewTitle(row.DOCUMENT_TITLE || row.FILE_NAME);
    setPreviewType(type);

    if (type === 'office' || type === 'other') {
      setPreviewOpen(true);
      return;
    }

    try {
      const blob = await fetchAsBlob(`/api/patient-documents/file/${row.id}/preview`);
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
      setPreviewOpen(true);
    } catch (e) {
      alert('Error loading preview: ' + e.message);
    }
  };

  const handleClosePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setPreviewOpen(false);
  };

  // Download handler
  const handleDownload = async (row) => {
    try {
      const blob = await fetchAsBlob(`/api/patient-documents/file/${row.id}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = row.FILE_NAME;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Error downloading file: ' + e.message);
    }
  };

  // Delete handler
  const handleDelete = async (row) => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/api/patient-documents/${row.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        loadDocuments(selectedPatient.patient_id, {
          docId: docFilterId || undefined,
          title: docFilterTitle || undefined,
        });
      } else {
        alert(data.error || 'Error deleting document.');
      }
    } catch {
      alert('Error deleting document.');
    }
  };

  // Upload modal handlers
  const handleOpenUpload = () => {
    setUploadForm({ documentId: '', documentTitle: '', documentDate: '', remarks: '' });
    setUploadFile(null);
    setUploadError('');
    setUploadSuccess('');
    setUploadOpen(true);
  };

  const handleCloseUpload = () => {
    setUploadOpen(false);
    setUploadForm({ documentId: '', documentTitle: '', documentDate: '', remarks: '' });
    setUploadFile(null);
    setUploadError('');
    setUploadSuccess('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadFile(file);
  };
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) setUploadFile(file);
  };

  const handleUploadSubmit = async () => {
    if (!uploadForm.documentId) {
      setUploadError('Please select a document category.');
      return;
    }
    if (!uploadFile) {
      setUploadError('Please select a file to upload.');
      return;
    }
    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');
    try {
      const formData = new FormData();
      formData.append('patientId', selectedPatient.patient_id);
      formData.append('documentId', uploadForm.documentId);
      formData.append('documentTitle', uploadForm.documentTitle);
      formData.append('documentDate', uploadForm.documentDate);
      formData.append('remarks', uploadForm.remarks);
      formData.append('file', uploadFile);

      const res = await authFetch(`${API_BASE_URL}/api/patient-documents/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadSuccess('Document uploaded successfully.');
        handleCloseUpload();
        loadDocuments(selectedPatient.patient_id, {
          docId: docFilterId || undefined,
          title: docFilterTitle || undefined,
        });
      } else {
        setUploadError(data.error || 'Error uploading document.');
      }
    } catch {
      setUploadError('Error uploading document.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Patient search grid columns
  const patientSearchColumns = [
    {
      field: 'select',
      headerName: 'Select',
      width: 70,
      sortable: false,
      renderCell: (params) => (
        <input
          type="radio"
          name="patientSelect"
          checked={
            selectedPatient !== null &&
            selectedPatient.patient_id === params.row.patient_id
          }
          onChange={() => handlePatientSelect(params.row)}
        />
      ),
    },
    { field: 'patient_id', headerName: 'Patient ID', width: 110 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'date_of_birth', headerName: 'Date of Birth', width: 130 },
    { field: 'age', headerName: 'Age', width: 70 },
    { field: 'phone', headerName: 'Phone', width: 130 },
  ];

  // Documents grid columns
  const docColumns = [
    { field: 'DOCUMENT_NAME', headerName: 'Category', width: 140 },
    { field: 'DOCUMENT_TITLE', headerName: 'Title', width: 190, flex: 1 },
    { field: 'FILE_NAME', headerName: 'File Name', width: 200 },
    { field: 'FILE_EXTENSION', headerName: 'Type', width: 70 },
    { field: 'FILE_SIZE_FMT', headerName: 'Size', width: 90 },
    { field: 'DOCUMENT_DATE', headerName: 'Doc Date', width: 105 },
    { field: 'UPLOADED_BY_NAME', headerName: 'Uploaded By', width: 130 },
    { field: 'UPLOADED_DATE_FMT', headerName: 'Upload Date', width: 155 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 130,
      sortable: false,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', height: '100%' }}>
          <IconButton
            size="small"
            title="Preview"
            onClick={() => handlePreview(params.row)}
          >
            <Eye size={16} />
          </IconButton>
          <IconButton
            size="small"
            title="Download"
            onClick={() => handleDownload(params.row)}
          >
            <Download size={16} />
          </IconButton>
          <IconButton
            size="small"
            title="Delete"
            style={{ color: '#ef4444' }}
            onClick={() => handleDelete(params.row)}
          >
            <Trash2 size={16} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg,#2563eb,#0891b2)',
          boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
        }}>
          <Upload size={20} color="#fff" />
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">Patient Documents</Typography>
          <Typography variant="caption" color="text.secondary">Search patients and manage their medical documents</Typography>
        </Box>
      </Box>

      {/* Section 1: Patient Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="text-base font-medium mb-3">Search Patient</h3>
        <div className="flex items-center gap-3 mb-3">
          <input
            type="text"
            placeholder="Search by patient name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePatientSearch()}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64"
          />
          <button
            onClick={handlePatientSearch}
            disabled={patientSearchLoading}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Search size={15} />
            Search
          </button>
          {patientSearchLoading && <CircularProgress size={20} />}
        </div>

        {patientSearchError && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            {patientSearchError}
          </Alert>
        )}

        {patientData.length > 0 && (
          <div style={{ width: '100%' }}>
            <DataGrid
              rows={patientData}
              columns={patientSearchColumns}
              autoHeight
              disableRowSelectionOnClick
              pageSizeOptions={[5, 10]}
              initialState={{ pagination: { paginationModel: { pageSize: 5 } } }}
              density="compact"
            />
          </div>
        )}
      </div>

      {/* Section 2: Patient + Documents Panel */}
      {selectedPatient && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {/* Patient info card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex gap-6 flex-wrap text-sm">
            <span>
              <strong>Patient:</strong> {selectedPatient.name}
            </span>
            <span>
              <strong>ID:</strong> {selectedPatient.patient_id}
            </span>
            <span>
              <strong>DOB:</strong> {selectedPatient.date_of_birth}
            </span>
            <span>
              <strong>Phone:</strong> {selectedPatient.phone}
            </span>
            {selectedPatient.sex && (
              <span>
                <strong>Sex:</strong> {selectedPatient.sex}
              </span>
            )}
          </div>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Patient Info" value={0} />
              <Tab label="Documents" value={1} />
              <Tab label="Timeline" value={2} />
            </Tabs>
          </Box>

          {/* Tab 0: Patient Info */}
          {activeTab === 0 && (
            <div className="grid grid-cols-2 gap-1 text-sm">
              {[
                ['Patient ID', selectedPatient.patient_id],
                ['Name', selectedPatient.name],
                ['Date of Birth', selectedPatient.date_of_birth],
                ['Age', selectedPatient.age],
                ['Phone', selectedPatient.phone],
                ['Sex', selectedPatient.sex],
                ['Email', selectedPatient.email],
                ['Address', selectedPatient.address],
                ['City ID', selectedPatient.city_id],
                ['PINCODE', selectedPatient.PINCODE],
                ['Next of Kin', selectedPatient.next_of_kin_name],
                ['Next of Kin Phone', selectedPatient.next_of_kin_phone],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex gap-2 p-1.5 border-b border-gray-100"
                >
                  <span className="font-medium text-gray-600 w-36 shrink-0">{label}:</span>
                  <span className="text-gray-800">{value !== undefined && value !== null ? value : '—'}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab 1: Documents */}
          {activeTab === 1 && (
            <div>
              {/* Toolbar */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <FormControl size="small" sx={{ minWidth: 160 }}>
                    <InputLabel>Document Category</InputLabel>
                    <Select
                      value={docFilterId}
                      label="Document Category"
                      onChange={(e) => setDocFilterId(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>All Categories</em>
                      </MenuItem>
                      {docCategories.map((cat) => (
                        <MenuItem key={cat.DOCUMENT_ID} value={cat.DOCUMENT_ID}>
                          {cat.DOCUMENT_NAME}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <input
                    type="text"
                    placeholder="Search by title"
                    value={docFilterTitle}
                    onChange={(e) => setDocFilterTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDocSearch()}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                  <button
                    onClick={handleDocSearch}
                    className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                  >
                    <Search size={14} />
                    Search
                  </button>
                  <button
                    onClick={handleDocReset}
                    className="px-3 py-1.5 rounded text-sm border border-gray-300 bg-white hover:bg-gray-100"
                  >
                    Reset
                  </button>
                </div>
                <button
                  onClick={handleOpenUpload}
                  className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                >
                  <Upload size={14} />
                  Upload Document
                </button>
              </div>

              {docsError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {docsError}
                </Alert>
              )}

              {docsLoading ? (
                <div className="flex justify-center py-8">
                  <CircularProgress />
                </div>
              ) : !docSearchDone ? (
                <div className="text-center text-gray-400 py-8 text-sm border border-dashed border-gray-200 rounded-lg">
                  Select a patient and click Search to load documents.
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center text-gray-400 py-8 text-sm border border-dashed border-gray-200 rounded-lg">
                  No documents found for this patient.
                </div>
              ) : (
                <div style={{ width: '100%' }}>
                  <DataGrid
                    rows={documents}
                    columns={docColumns}
                    autoHeight
                    disableRowSelectionOnClick
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    density="compact"
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Timeline */}
          {activeTab === 2 && (
            <PatientTimeline patientId={selectedPatient.patient_id} />
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={uploadOpen} onClose={handleCloseUpload} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {uploadError}
            </Alert>
          )}
          {uploadSuccess && (
            <Alert severity="success" sx={{ mb: 2, mt: 1 }}>
              {uploadSuccess}
            </Alert>
          )}

          <FormControl fullWidth size="small" sx={{ mb: 2, mt: 1 }} required>
            <InputLabel>Document Category *</InputLabel>
            <Select
              value={uploadForm.documentId}
              label="Document Category *"
              onChange={(e) =>
                setUploadForm((f) => ({ ...f, documentId: e.target.value }))
              }
            >
              <MenuItem value="" disabled>
                <em>Select category</em>
              </MenuItem>
              {docCategories.map((cat) => (
                <MenuItem key={cat.DOCUMENT_ID} value={cat.DOCUMENT_ID}>
                  {cat.DOCUMENT_NAME}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="Document Title"
            value={uploadForm.documentTitle}
            onChange={(e) =>
              setUploadForm((f) => ({ ...f, documentTitle: e.target.value }))
            }
            sx={{ mb: 2 }}
          />

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Document Date</label>
            <input
              type="date"
              value={uploadForm.documentDate}
              onChange={(e) =>
                setUploadForm((f) => ({ ...f, documentDate: e.target.value }))
              }
              className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full"
            />
          </div>

          <TextField
            fullWidth
            size="small"
            label="Remarks"
            multiline
            rows={2}
            value={uploadForm.remarks}
            onChange={(e) =>
              setUploadForm((f) => ({ ...f, remarks: e.target.value }))
            }
            sx={{ mb: 2 }}
          />

          {/* File drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{
              border: `2px dashed ${dragOver ? '#2563eb' : '#d1d5db'}`,
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: dragOver ? '#eff6ff' : '#f9fafb',
              transition: 'all 0.2s',
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.jpg,.jpeg,.png,.bmp,.tiff,.doc,.docx"
              onChange={handleFileInputChange}
            />
            <Upload
              size={24}
              style={{ margin: '0 auto 8px', color: '#6b7280', display: 'block' }}
            />
            {uploadFile ? (
              <p className="text-sm text-blue-600 font-medium">{uploadFile.name}</p>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Drag &amp; drop a file here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Supported: PDF, JPG, PNG, BMP, TIFF, DOC, DOCX (max 50 MB)
                </p>
              </>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpload} disabled={uploadLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleUploadSubmit}
            disabled={uploadLoading}
            startIcon={
              uploadLoading ? <CircularProgress size={16} /> : <Upload size={16} />
            }
          >
            {uploadLoading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="lg" fullWidth>
        <DialogTitle>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
              {previewTitle}
            </span>
            <IconButton onClick={handleClosePreview} size="small" sx={{ ml: 1 }}>
              <X size={18} />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent>
          {previewType === 'pdf' && previewBlobUrl && (
            <iframe
              src={previewBlobUrl}
              style={{ width: '100%', height: '70vh', border: 'none' }}
              title={previewTitle}
            />
          )}
          {previewType === 'image' && previewBlobUrl && (
            <img
              src={previewBlobUrl}
              alt={previewTitle}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                display: 'block',
                margin: '0 auto',
              }}
            />
          )}
          {(previewType === 'office' || previewType === 'other') && (
            <div className="text-center py-8 text-gray-500">
              This file type cannot be previewed. Please download it.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default PatientDocuments;
