'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Gun from 'gun';
import { Trash2, Edit2, Check, X, Plus, Copy, CheckCheck, Wifi, WifiOff } from 'lucide-react';

interface Note {
  id: string;
  text: string;
  createdAt: number;
}

interface GunPeerEvent {
  url?: string;
  id?: string;
}

interface GunEventListener {
  off?: () => void;
}

// Configure relay peers via env so stale public relays can be replaced without code changes.
// Example: NEXT_PUBLIC_GUN_PEERS="https://my-relay.example/gun,https://backup-relay.example/gun"
const CONFIGURED_PEERS = (process.env.NEXT_PUBLIC_GUN_PEERS ?? '')
  .split(',')
  .map((peer) => peer.trim())
  .filter(Boolean);

// Fall back to a public community relay so cross-browser sync works on the GitHub Pages demo
// even when no custom relay is configured via the NEXT_PUBLIC_GUN_PEERS environment variable.
const FALLBACK_PEERS = ['https://peer.wallie.io/gun'];
const GUN_PEERS = CONFIGURED_PEERS.length > 0 ? CONFIGURED_PEERS : FALLBACK_PEERS;

const getPeerKey = (peer: GunPeerEvent): string => {
  if (typeof peer?.url === 'string' && peer.url) return peer.url;
  if (typeof peer?.id === 'string' && peer.id) return peer.id;
  return JSON.stringify(peer ?? {});
};

export default function GunDemo() {
  const [notes, setNotes] = useState<Record<string, Note>>({});
  const [newNoteText, setNewNoteText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  // Compute the room ID once from the URL (or generate a new one).
  // This component is client-only (SSR disabled), so window is always available.
  const [roomId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const existing = params.get('room');
    if (existing) return existing;
    const room = crypto.randomUUID().replace(/-/g, '').substring(0, 10);
    params.set('room', room);
    const query = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
    return room;
  });
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  const hasRelayPeers = GUN_PEERS.length > 0;

  const gunRef = useRef<any>(null);
  const notesNodeRef = useRef<any>(null);
  // Collect all highlight-removal timeout IDs so they can be cleared on unmount
  const highlightTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Initialize Gun once on mount (roomId is stable for the component lifetime)
  useEffect(() => {
    // Connect to relay peers so changes propagate across browsers instantly
    const gun = Gun({ peers: GUN_PEERS });
    gunRef.current = gun;
    let isMounted = true;
    const scheduleConnectionUpdate = (nextConnected: boolean) => {
      queueMicrotask(() => {
        if (isMounted) setIsConnected(nextConnected);
      });
    };

    const activePeers = new Set<string>();
    const onPeerHi = (peer: GunPeerEvent) => {
      const key = getPeerKey(peer);
      activePeers.add(key);
      scheduleConnectionUpdate(activePeers.size > 0);
    };
    const onPeerBye = (peer: GunPeerEvent) => {
      const key = getPeerKey(peer);
      activePeers.delete(key);
      scheduleConnectionUpdate(activePeers.size > 0);
    };
    const hiListener = gun.on('hi', onPeerHi) as GunEventListener | undefined;
    const byeListener = gun.on('bye', onPeerBye) as GunEventListener | undefined;

    // Scope data to the current room for isolation
    const notesNode = gun.get(`demo-notes-app-v2-${roomId}`);
    notesNodeRef.current = notesNode;

    // Read: Listen for real-time changes from all peers
    notesNode.map().on((note: any, id: string) => {
      if (note) {
        // Flash the card briefly to signal a remote update
        setRecentlyUpdated((prev) => new Set([...prev, id]));
        const t = setTimeout(() => {
          setRecentlyUpdated((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 1500);
        highlightTimeoutsRef.current.push(t);
      }
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

    const highlightTimeouts = highlightTimeoutsRef.current;
    return () => {
      hiListener?.off?.();
      byeListener?.off?.();
      isMounted = false;
      highlightTimeouts.forEach(clearTimeout);
      setIsConnected(false);
    };
  }, [roomId]);

  const handleCopyRoomUrl = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !notesNodeRef.current) return;

    // Create: Put the new note into the Gun node
    const id = crypto.randomUUID();
    const newNote = { id, text: newNoteText, createdAt: Date.now() };
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
    // Update: Merge the new text into the existing node
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

  const shareUrl =
    typeof window !== 'undefined'
      ? (() => {
          const url = new URL(window.location.href);
          url.searchParams.set('room', roomId);
          return url.toString();
        })()
      : '';
  const connectionStatusLabel = isConnected ? 'Live' : hasRelayPeers ? 'Relay offline' : 'No relay configured';

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-zinc-200 bg-zinc-50/50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">Gun.js CRUD Demo</h1>
                <p className="mt-2 text-zinc-500">
                  Real-time, cross-browser notes powered by Gun.js. Open this page in multiple browsers or tabs to see instant sync.
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 mt-1">
                {isConnected ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-zinc-400" />}
                <span className={`text-xs font-medium ${isConnected ? 'text-emerald-600' : 'text-zinc-400'}`}>
                  {connectionStatusLabel}
                </span>
              </div>
            </div>

            {/* Room share banner */}
            <div className="mt-4 flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-indigo-700 mb-0.5">Share this link to sync across browsers</p>
                <p className="text-xs text-indigo-500 font-mono truncate">{shareUrl}</p>
              </div>
              <button
                onClick={handleCopyRoomUrl}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
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
                    className={`flex items-center justify-between p-4 rounded-xl border bg-white shadow-sm hover:border-zinc-300 transition-all group ${
                      recentlyUpdated.has(note.id)
                        ? 'border-indigo-300 bg-indigo-50/30'
                        : 'border-zinc-200'
                    }`}
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
