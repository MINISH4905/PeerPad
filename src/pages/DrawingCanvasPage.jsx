import { useRef, useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, PenTool, Eraser, Undo, Redo,
  ZoomIn, ZoomOut, Share2, Save, Minus, Plus
} from 'lucide-react';
import { useSync } from '../hooks/useSync';

const COLORS = [
  { value: '#000000', label: 'Black' },
  { value: '#4B5563', label: 'Dark Gray' },
  { value: '#9CA3AF', label: 'Gray' },
  { value: '#D1D5DB', label: 'Light Gray' },
  { value: '#EF4444', label: 'Red' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#10B981', label: 'Green' },
  { value: '#F59E0B', label: 'Amber' },
];

const BRUSH_SIZES = [2, 4, 8, 14];

const DrawingCanvasPage = ({ note, onBack }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { dispatchEvent } = useSync();

  const [title, setTitle] = useState(note?.title || '');
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [zoom, setZoom] = useState(100);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const lastPos = useRef(null);

  // Init canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load existing drawing if editing
    if (note?.dataURL) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        saveSnapshot();
      };
      img.src = note.dataURL;
    } else {
      saveSnapshot();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL();
    setHistory(prev => {
      const newH = prev.slice(0, historyStep + 1);
      newH.push(dataURL);
      setHistoryStep(newH.length - 1);
      return newH;
    });
    dispatchEvent({ type: 'CANVAS_UPDATE', noteId: note.id, payload: { dataURL } });
  }, [note.id, historyStep, dispatchEvent]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.nativeEvent.offsetX) * scaleX,
      y: (e.nativeEvent.offsetY) * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    lastPos.current = pos;
    setIsDrawing(true);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPos(e);
    const ctx = canvasRef.current.getContext('2d');

    ctx.lineWidth = tool === 'eraser' ? brushSize * 4 : brushSize;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Smooth line using quadratic curve
    if (lastPos.current) {
      const midX = (lastPos.current.x + pos.x) / 2;
      const midY = (lastPos.current.y + pos.y) / 2;
      ctx.quadraticCurveTo(lastPos.current.x, lastPos.current.y, midX, midY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(midX, midY);
    }
    lastPos.current = pos;
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.closePath();
    setIsDrawing(false);
    lastPos.current = null;
    saveSnapshot();
  };

  const handleUndo = () => {
    if (historyStep <= 0) return;
    const step = historyStep - 1;
    setHistoryStep(step);
    restoreFromHistory(history[step]);
  };

  const handleRedo = () => {
    if (historyStep >= history.length - 1) return;
    const step = historyStep + 1;
    setHistoryStep(step);
    restoreFromHistory(history[step]);
  };

  const restoreFromHistory = (dataURL) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataURL;
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveSnapshot();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL();
    onBack({
      id: note?.id,
      title: title.trim() || 'Untitled Drawing',
      dataURL,
      type: 'drawing',
      teamId: note?.teamId || null,
      tag: note?.tag || 'PERSONAL',
    });
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.min(200, Math.max(50, prev + delta)));
  };

  const canUndo = historyStep > 0;
  const canRedo = historyStep < history.length - 1;

  return (
    <div className="canvas-page">
      {/* Top bar */}
      <header className="canvas-topbar">
        <div className="canvas-topbar-left">
          <button className="canvas-back-btn" onClick={handleSave}>
            <ArrowLeft size={18} />
          </button>
          <div className="canvas-title-block">
            <input
              className="canvas-title-input"
              placeholder="Untitled Drawing…"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <span className="canvas-subtitle">
              {note?.tag ? `${note.tag} · ` : ''}WORKSPACE
            </span>
          </div>
        </div>

        <div className="canvas-topbar-center">
          <button
            className={`canvas-tool-btn ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Pen"
          >
            <PenTool size={16} />
            <span>Draw</span>
          </button>
          <button
            className={`canvas-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Eraser"
          >
            <Eraser size={16} />
            <span>Erase</span>
          </button>
        </div>

        <div className="canvas-topbar-right">
          <button className="canvas-icon-btn" title="Share">
            <Share2 size={16} />
          </button>
          <button className="canvas-save-btn" onClick={handleSave}>
            <Save size={15} /> Save as Note
          </button>
        </div>
      </header>

      <div className="canvas-workspace">
        {/* Left toolbar */}
        <div className="canvas-left-toolbar">
          {/* Colors */}
          <div className="toolbar-section">
            <span className="toolbar-section-label">COLOR</span>
            <div className="color-grid">
              {COLORS.map(c => (
                <button
                  key={c.value}
                  className={`color-dot ${color === c.value ? 'selected' : ''}`}
                  style={{ background: c.value, border: c.value === '#ffffff' ? '1px solid #e5e7eb' : 'none' }}
                  onClick={() => { setColor(c.value); setTool('pen'); }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Brush size */}
          <div className="toolbar-section">
            <span className="toolbar-section-label">SIZE</span>
            <div className="brush-sizes">
              {BRUSH_SIZES.map(s => (
                <button
                  key={s}
                  className={`brush-btn ${brushSize === s ? 'active' : ''}`}
                  onClick={() => setBrushSize(s)}
                  title={`${s}px`}
                >
                  <span
                    className="brush-preview"
                    style={{ width: s + 4, height: s + 4, borderRadius: '50%', background: '#000', display: 'block' }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Undo / Redo */}
          <div className="toolbar-section">
            <button
              className={`toolbar-action-btn ${!canUndo ? 'disabled' : ''}`}
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo"
            >
              <Undo size={16} />
            </button>
            <button
              className={`toolbar-action-btn ${!canRedo ? 'disabled' : ''}`}
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo"
            >
              <Redo size={16} />
            </button>
          </div>

          {/* Clear */}
          <button className="toolbar-clear-btn" onClick={handleClearCanvas}>
            Clear
          </button>
        </div>

        {/* Canvas area */}
        <div className="canvas-area" ref={containerRef}>
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className="drawing-canvas"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center', cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
      </div>

      {/* Bottom zoom bar */}
      <div className="canvas-bottom-bar">
        <button className="canvas-icon-btn-sm" onClick={() => handleZoom(-10)} disabled={zoom <= 50}>
          <ZoomOut size={15} />
        </button>
        <span className="zoom-label">{zoom}%</span>
        <button className="canvas-icon-btn-sm" onClick={() => handleZoom(10)} disabled={zoom >= 200}>
          <ZoomIn size={15} />
        </button>
        <div className="zoom-sep" />
        <button className="canvas-icon-btn-sm" onClick={() => setZoom(100)}>
          <Minus size={12} style={{ marginRight: 2 }} />
          Reset
        </button>
      </div>
    </div>
  );
};

export default DrawingCanvasPage;