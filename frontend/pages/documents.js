import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, Trash2, X, Loader2, FolderOpen, FileText, Image, FilePlus2 } from 'lucide-react';

const DOC_TYPES = ['report', 'prescription', 'image', 'other'];
const DOC_ICONS = { report: FileText, prescription: FilePlus2, image: Image, other: FolderOpen };

export default function Documents() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [file, setFile]       = useState(null);
  const [docType, setDocType] = useState('report');
  const [title, setTitle]     = useState('');
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter]   = useState('all');

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.push('/login'); return; }
    load();
  }, [ready, user]);

  const load = () => api.get('/documents').then(r => setDocs(r.data)).finally(() => setLoading(false));

  const upload = async e => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('doc_type', docType);
    fd.append('title', title || file.name);
    try {
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
      setModal(false);
      setFile(null); setTitle(''); setDocType('report');
      toast.success('Document uploaded');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const del = async id => {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/documents/${id}`);
    setDocs(ds => ds.filter(d => d.id !== id));
    toast.success('Deleted');
  };

  const shown = filter === 'all' ? docs : docs.filter(d => d.doc_type === filter);
  const fmtSize = b => b > 1024*1024 ? `${(b/1024/1024).toFixed(1)} MB` : `${(b/1024).toFixed(0)} KB`;

  return (
    <Layout title="Documents">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Documents</h2>
            <p className="text-slate-400 text-sm mt-1">Store medical reports, prescriptions and images</p>
          </div>
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-2 mb-5">
          {['all', ...DOC_TYPES].map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition ${filter === t ? 'bg-brand-500 text-white' : 'bg-navy-700 border border-navy-600 text-slate-300 hover:bg-navy-600'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
        ) : shown.length === 0 ? (
          <div className="card text-center py-16">
            <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No documents yet. Upload your first document.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {shown.map(d => {
              const Icon = DOC_ICONS[d.doc_type] || FolderOpen;
              return (
                <div key={d.id} className="card flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-200 truncate">{d.title}</p>
                    <p className="text-xs text-slate-400">{d.file_name} · {fmtSize(d.file_size || 0)}</p>
                    <p className="text-xs text-slate-400">{new Date(d.uploaded_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={d.file_path} target="_blank" rel="noreferrer"
                      className="text-xs text-brand-400 hover:underline">View</a>
                    <button onClick={() => del(d.id)} className="text-slate-300 hover:text-red-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-navy-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-navy-600">
              <h3 className="font-bold text-slate-100">Upload Document</h3>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-200" /></button>
            </div>
            <form onSubmit={upload} className="p-5 space-y-4">
              <div>
                <label className="label">Document type</label>
                <select className="input" value={docType} onChange={e => setDocType(e.target.value)}>
                  {DOC_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Title (optional)</label>
                <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Leave blank to use filename" />
              </div>
              <div>
                <label className="label">File *</label>
                <input type="file" required
                  className="block w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-500/20 file:text-brand-300 hover:file:bg-brand-500/30"
                  onChange={e => setFile(e.target.files[0])} />
                <p className="text-xs text-slate-400 mt-1">Max 10 MB. PDF, images, DOCX accepted.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={uploading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
