import { FileText, PenTool, RotateCcw, Trash2, Archive } from 'lucide-react';

const daysLeft = (expiresAt) => {
  const diff = Math.ceil((new Date(expiresAt) - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
};

const timeStr = (date) => {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ArchivePage = ({ archivedNotes = [], onRestore, onPermanentDelete }) => {
  return (
    <div className="archive-page">
      <div className="archive-header">
        <div className="archive-title-row">
          <Archive size={24} />
          <h1 className="archive-title">Archive</h1>
        </div>
        <p className="archive-sub">
          Notes you delete are kept here for 30 days before being permanently removed. You can restore them at any time.
        </p>
      </div>

      {archivedNotes.length === 0 ? (
        <div className="archive-empty">
          <div className="archive-empty-icon"><Archive size={32} /></div>
          <p className="archive-empty-title">Archive is empty</p>
          <p className="archive-empty-sub">Deleted notes will appear here for 30 days.</p>
        </div>
      ) : (
        <div className="archive-list">
          {archivedNotes.map(note => {
            const days = daysLeft(note.expiresAt);
            const urgent = days <= 3;
            return (
              <div key={note.id} className="archive-card">
                <div className="archive-card-icon">
                  {note.type === 'text' ? <FileText size={18} /> : <PenTool size={18} />}
                </div>
                <div className="archive-card-body">
                  <h3 className="archive-card-title">{note.title}</h3>
                  {note.type === 'text' && note.content && (
                    <p className="archive-card-desc">{note.content}</p>
                  )}
                  <div className="archive-card-meta">
                    <span className="archive-card-deleted">Deleted {timeStr(note.deletedAt)}</span>
                    <span className={`archive-expires ${urgent ? 'urgent' : ''}`}>
                      {days === 0 ? 'Expires today' : `${days} day${days !== 1 ? 's' : ''} left`}
                    </span>
                  </div>
                </div>
                <div className="archive-card-actions">
                  <button
                    className="archive-restore-btn"
                    onClick={() => onRestore(note.id)}
                    title="Restore note"
                  >
                    <RotateCcw size={15} /> Restore
                  </button>
                  <button
                    className="archive-delete-btn"
                    onClick={() => onPermanentDelete(note.id)}
                    title="Delete permanently"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ArchivePage;