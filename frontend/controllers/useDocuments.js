import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getDocuments, uploadDocument, deleteDocument } from '@/services/documentsService';

export function useDocuments() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [docs, setDocs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [file, setFile]           = useState(null);
  const [docType, setDocType]     = useState('report');
  const [title, setTitle]         = useState('');
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter]       = useState('all');

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    load();
  }, [ready, user]);

  const load = () => getDocuments().then(setDocs).finally(() => setLoading(false));

  const upload = async e => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file',     file);
    fd.append('doc_type', docType);
    fd.append('title',    title || file.name);
    try {
      await uploadDocument(fd);
      await load();
      setModal(false);
      setFile(null); setTitle(''); setDocType('report');
      toast.success('Document uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const del = async id => {
    if (!confirm('Delete this document?')) return;
    await deleteDocument(id);
    setDocs(ds => ds.filter(d => d.id !== id));
    toast.success('Deleted');
  };

  const shown = filter === 'all' ? docs : docs.filter(d => d.doc_type === filter);

  return {
    docs, loading, modal, setModal, file, setFile,
    docType, setDocType, title, setTitle, uploading,
    filter, setFilter, upload, del, shown,
  };
}
