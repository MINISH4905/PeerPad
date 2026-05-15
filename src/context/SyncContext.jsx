import { createContext, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';

export const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
  const { emit } = useSocket();

  const dispatchEvent = useCallback((event) => {
    console.log('[Sync Event Dispatched]:', event);
    if (event.type === 'TEXT_CHANGE' || event.type === 'NOTE_EDIT') {
      emit('text_change', {
        noteId: event.payload.noteId,
        content: event.payload.content
      });
    } else if (event.type === 'DRAWING_CHANGE' || event.type === 'CANVAS_UPDATE') {
      emit('drawing_change', {
        noteId: event.payload.noteId,
        dataURL: event.payload.dataURL
      });
    }
  }, [emit]);

  return (
    <SyncContext.Provider value={{ dispatchEvent }}>
      {children}
    </SyncContext.Provider>
  );
};
