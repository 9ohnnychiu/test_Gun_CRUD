'use client';

import { useState, useEffect, useRef } from 'react';
import Gun from 'gun';
import { Trash2, Edit2, Check, X, Plus } from 'lucide-react';

interface Note {
  id: string;
  text: string;
  createdAt: number;
}

export default function GunDemo() {
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [newNoteText, setNewNoteText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  
  const gunRef = useRef<any>(null);
  const notesNodeRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Gun
    const gun = Gun();
    gunRef.current = gun;
    
    // Use a unique node name for this demo
    const notesNode = gun.get('demo-notes-app-v2');
    notesNodeRef.current = notesNode;

    // Read: Listen for changes
    notesNode.map().on((note: any, id: string) => {
      setNotes((prev) => {
        if (note) {
          return { ...prev, [id]: note as Note };
        } else {
          const newNotes = { ...prev };
          delete newNotes[id];
          return newNotes;
        }
      });
    });
  }, []);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !notesNodeRef.current) return;

    // Generate a random ID
    const id = Math.random().toString(36).substring(2, 15);
    const newNote = {
      id,
      text: newNoteText,
      createdAt: Date.now(),
    };

    // Create: Put the new note into the Gun node
    notesNodeRef.current.get(id).put(newNote);
    setNewNoteText('');
  };

  const handleDeleteNote = (id: string) => {
    if (!notesNodeRef.current) return;
    // Delete: Set the node to null
    notesNodeRef.current.get(id).put(null);
  };

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id);
    setEditText(note.text);
  };

  const handleSaveEdit = (id: string) => {
    if (!editText.trim() || !notesNodeRef.current) return;
    
    // Update: Put the updated text into the specific note node
    notesNodeRef.current.get(id).put({ text: editText });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  // Sort notes by creation time (newest first)
  const sortedNotes = Object.values(notes)
    .filter((note) => note && note.id && note.text)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-zinc-200 bg-zinc-50/50">
            <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">Gun.js CRUD Demo</h1>
            <p className="mt-2 text-zinc-500">A decentralized, offline-first notes app using Gun.js.</p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Create Form */}
            <form onSubmit={handleAddNote} className="mb-8">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="What's on your mind?"
                  className="flex-1 rounded-xl border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-3 border outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="inline-flex items-center justify-center rounded-xl border border-transparent bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Note
                </button>
              </div>
            </form>

            {/* Read List */}
            <div className="space-y-4">
              {sortedNotes.length === 0 ? (
                <div className="text-center py-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-300">
                  <p className="text-zinc-500">No notes yet. Add one above!</p>
                </div>
              ) : (
                sortedNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-white shadow-sm hover:border-zinc-300 transition-colors group"
                  >
                    {editingId === note.id ? (
                      <div className="flex-1 flex items-center gap-3 mr-4">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 rounded-lg border-zinc-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(note.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <button
                          onClick={() => handleSaveEdit(note.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Save"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="text-zinc-900 break-words">{note.text}</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(note)}
                            className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
