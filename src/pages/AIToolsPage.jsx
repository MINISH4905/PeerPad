import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, Mic, FileText, Sparkles, X, CheckCircle,
  AlertCircle, Loader, StopCircle, Copy, Download,
  ChevronRight, BarChart2, Zap, BookOpen, TrendingUp, Check,
  Trash2, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { WavRecorder } from '../utils/audioUtils';

/* ─── helpers ─── */
const formatBytes = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/* ─── Stats strip (Real Data) ─── */
const StatsStrip = ({ stats }) => (
  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
    <div style={styles.statCard}>
      <div style={styles.statNum}>{stats.unique_users_count || 0}</div>
      <div style={styles.statLabel}>ACCOUNTS</div>
    </div>
  </div>
);

/* ─── PDF Upload & Summarizer ─── */
const PDFSummarizer = ({ activeSummary, setSummary, onSummaryGenerated, user }) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(activeSummary ? 'done' : 'idle');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const progressRef = useRef(null);

  // Sync with activeSummary if selected from history
  useEffect(() => {
    if (activeSummary) {
      setStatus('done');
    }
  }, [activeSummary]);

  const handleFile = useCallback(async (f) => {
    if (!f || f.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }
    setFile(f);
    setStatus('parsing');
    setProgress(0);

    let p = 0;
    progressRef.current = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 90) { clearInterval(progressRef.current); p = 90; }
      setProgress(Math.min(p, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('file', f);
      
      const userId = user?.id || '';
      const response = await fetch(`/api/ai/summarize?user_id=${userId}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Summarization failed');
      
      const result = await response.json();
      clearInterval(progressRef.current);
      setProgress(100);
      setSummary(result);
      setStatus('done');
      onSummaryGenerated();
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }, [onSummaryGenerated, setSummary]);

  const reset = () => {
    setFile(null);
    setStatus('idle');
    setSummary(null);
    setProgress(0);
  };

  return (
    <div style={styles.card}>
      {status === 'idle' && (
        <div
          style={{
            ...styles.dropZone,
            borderColor: dragOver ? '#0a0a0a' : '#d1d5db',
            background: dragOver ? '#f9fafb' : 'transparent',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
          <div style={styles.uploadIcon}><Upload size={26} color="#fff" /></div>
          <h3 style={styles.cardTitle}>Upload PDF for AI Summary</h3>
          <p style={styles.cardDesc}>Our Llama 3 AI will distill complex concepts into digestible insights.</p>
          <button style={styles.primaryBtn} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            Browse Documents <ChevronRight size={16} />
          </button>
        </div>
      )}

      {status === 'parsing' && (
        <div style={{ padding: '40px 32px', textAlign: 'center' }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ fontWeight: 600, marginTop: 20 }}>Analyzing <em>{file?.name}</em></p>
          <div style={styles.progressTrack}><div style={{ ...styles.progressFill, width: `${progress}%` }} /></div>
        </div>
      )}

      {status === 'error' && (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <AlertCircle size={32} color="#ef4444" />
          <p style={{ fontWeight: 600, marginTop: 12 }}>Something went wrong</p>
          <button style={{ ...styles.primaryBtn, marginTop: 16 }} onClick={reset}>Try Again</button>
        </div>
      )}

      {status === 'done' && activeSummary && (
        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 20 }}>{activeSummary.title}</h3>
              <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                <span style={styles.metaPill}>Llama 3 Summary</span>
                <span style={{ ...styles.metaPill, background: '#dcfce7', color: '#166534' }}>Verified Accuracy</span>
              </div>
            </div>
            <button style={styles.iconBtn} onClick={reset}><X size={16} /></button>
          </div>
          <div style={styles.divider} />
          <h4 style={styles.sectionHeader}>Executive Description</h4>
          <div style={{ fontSize: 15, lineHeight: 1.8, color: '#1a1a1a', whiteSpace: 'pre-wrap' }}>
            {activeSummary.description}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Recent History ─── */
const RecentSummaries = ({ refreshTrigger, onSelect, onDeleted, user }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = useCallback(() => {
    if (!user?.id) return;
    fetch(`/api/ai/recent?user_id=${user.id}`)
      .then(res => res.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  useEffect(() => { fetchRecent(); }, [refreshTrigger, fetchRecent]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this summary?')) return;
    try {
      await fetch(`/api/ai/recent/${id}`, { method: 'DELETE' });
      onDeleted();
      fetchRecent();
    } catch (err) { alert('Failed to delete'); }
  };

  if (items.length === 0 && !loading) return null;

  return (
    <div style={{ ...styles.card, padding: '24px 28px', background: '#fafafa' }}>
      <h4 style={styles.intelligenceHeader}>Recent History</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map(item => (
          <div
            key={item.id}
            style={styles.historyItem}
            onClick={() => onSelect(item)}
          >
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{item.title}</p>
              <p style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase' }}>{item.filename}</p>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button style={styles.historyBtn} onClick={() => onSelect(item)}><Eye size={14} /></button>
              <button style={{ ...styles.historyBtn, color: '#ef4444' }} onClick={(e) => handleDelete(e, item.id)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const NoteIntelligenceCard = ({ stats }) => (
  <div style={{ ...styles.card, padding: '24px 28px', background: '#fafafa' }}>
    <h4 style={styles.intelligenceHeader}>Note Intelligence</h4>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={styles.statMiniLabel}>Collaborative Growth</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Llama 3 Powered</span>
    </div>
    <div style={styles.intelligenceBar}><div style={{ ...styles.intelligenceFill, width: '100%' }} /></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
      <span style={styles.statMiniLabel}>Unique Accounts</span>
      <span style={{ fontSize: 14, fontWeight: 700 }}>{stats.unique_users_count || 0}</span>
    </div>
  </div>
);

const AIToolsPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ summaries_count: 0 });
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [activeSummary, setActiveSummary] = useState(null);
  
  const fetchStats = useCallback(() => {
    fetch('/api/ai/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
    setRefreshHistory(prev => prev + 1);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6b7280', marginBottom: 16 }}>
          <Sparkles size={16} /> <span style={styles.tag}>AI INTELLIGENCE HUB</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={styles.title}>Academic Sanctuary</h1>
            <p style={styles.subtitle}>Elevate your research with our suite of Llama 3 AI assistants.</p>
          </div>
          <StatsStrip stats={stats} />
        </div>
      </header>

      <div style={styles.grid}>
        <div style={styles.leftCol}>
          <PDFSummarizer
            activeSummary={activeSummary}
            setSummary={setActiveSummary}
            onSummaryGenerated={fetchStats}
            user={user}
          />
        </div>
        <div style={styles.rightCol}>
          <RecentSummaries
            refreshTrigger={refreshHistory}
            onSelect={setActiveSummary}
            onDeleted={fetchStats}
            user={user}
          />
          <NoteIntelligenceCard stats={stats} />
          <div style={styles.tipCard}>
            <h4 style={{ fontWeight: 800, marginBottom: 12, fontSize: 14 }}>AI Pro Tip</h4>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#666' }}>
              Upload lecture slides as PDFs for the most accurate, structured summaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '40px 60px', maxWidth: 1200, margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' },
  header: { marginBottom: 48 },
  tag: { fontSize: 11, fontWeight: 800, letterSpacing: '0.1em' },
  title: { fontSize: 42, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 8 },
  subtitle: { fontSize: 18, color: '#666', fontWeight: 500 },
  statCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 24px', textAlign: 'center', minWidth: 100 },
  statNum: { fontSize: 24, fontWeight: 800 },
  statLabel: { fontSize: 10, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.05em', marginTop: 4 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 24, overflow: 'hidden', marginBottom: 32, position: 'relative' },
  dropZone: { padding: '60px 40px', border: '2px dashed #e5e7eb', borderRadius: 20, margin: 12, textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' },
  uploadIcon: { width: 56, height: 56, background: '#0a0a0a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  cardTitle: { fontSize: 20, fontWeight: 800, marginBottom: 12 },
  cardDesc: { fontSize: 14, color: '#666', lineHeight: 1.6, maxWidth: 340, margin: '0 auto 24px' },
  primaryBtn: { background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 99, padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 },
  progressTrack: { height: 6, background: '#f3f4f6', borderRadius: 3, marginTop: 20, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#0a0a0a', transition: 'width 0.3s' },
  metaPill: { background: '#f3f4f6', padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: '#6b7280' },
  divider: { height: 1, background: '#e5e7eb', margin: '20px 0' },
  sectionHeader: { fontSize: 11, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 },
  historyItem: { padding: '12px 14px', borderRadius: 12, border: '1px solid #eee', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s', ':hover': { borderColor: '#0a0a0a' } },
  historyBtn: { background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  intelligenceHeader: { fontWeight: 800, letterSpacing: '0.06em', marginBottom: 20, fontSize: 13, textTransform: 'uppercase' },
  intelligenceBar: { height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  intelligenceFill: { height: '100%', background: '#0a0a0a' },
  statMiniLabel: { fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' },
  tipCard: { background: '#0a0a0a', color: '#fff', borderRadius: 24, padding: 32 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 8, borderRadius: 8 }
};

export default AIToolsPage;