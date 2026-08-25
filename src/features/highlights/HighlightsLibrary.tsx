import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Film, Folder, FolderPlus, HardDrive, MoreHorizontal, Plus, Trash2, Upload, X } from "lucide-react";

type LocalFileHandle = {
  kind: "file";
  name: string;
  getFile: () => Promise<File>;
};

type HighlightVideo = {
  id: string;
  albumId: string;
  title: string;
  filename: string;
  addedAt: string;
  size?: number;
  handle?: LocalFileHandle;
  temporaryUrl?: string;
};

type HighlightAlbum = {
  id: string;
  name: string;
  color: "orange" | "sky" | "violet" | "emerald";
  createdAt: string;
};

type HighlightDb = {
  albums: HighlightAlbum[];
  videos: HighlightVideo[];
};

type PickerWindow = Window & {
  showOpenFilePicker?: (options?: { multiple?: boolean; types?: Array<{ description: string; accept: Record<string, string[]> }> }) => Promise<LocalFileHandle[]>;
};

const DB_NAME = "rize-highlights";
const DB_VERSION = 1;
const ALBUM_STORE = "albums";
const VIDEO_STORE = "videos";
const DEFAULT_ALBUMS: HighlightAlbum[] = [
  { id: "game-highlights", name: "Game Highlights", color: "orange", createdAt: new Date().toISOString() },
  { id: "moves-handles", name: "Moves & Handles", color: "sky", createdAt: new Date().toISOString() },
  { id: "shooting", name: "Shooting Lab", color: "violet", createdAt: new Date().toISOString() },
  { id: "dunks-athleticism", name: "Dunks & Athleticism", color: "emerald", createdAt: new Date().toISOString() },
];

function openHighlightsDb(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(ALBUM_STORE)) db.createObjectStore(ALBUM_STORE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(VIDEO_STORE)) db.createObjectStore(VIDEO_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function readDb(): Promise<HighlightDb> {
  const db = await openHighlightsDb();
  if (!db) return { albums: [], videos: [] };
  return new Promise((resolve) => {
    const transaction = db.transaction([ALBUM_STORE, VIDEO_STORE], "readonly");
    const albumsRequest = transaction.objectStore(ALBUM_STORE).getAll();
    const videosRequest = transaction.objectStore(VIDEO_STORE).getAll();
    transaction.oncomplete = () => resolve({ albums: albumsRequest.result ?? [], videos: videosRequest.result ?? [] });
    transaction.onerror = () => resolve({ albums: [], videos: [] });
  });
}

async function writeRecord(storeName: string, record: HighlightAlbum | HighlightVideo) {
  const db = await openHighlightsDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
  });
}

async function removeRecord(storeName: string, id: string) {
  const db = await openHighlightsDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
  });
}

function formatSize(bytes?: number) {
  if (!bytes) return "Taille inconnue";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const albumStyles: Record<HighlightAlbum["color"], string> = {
  orange: "from-orange-500/25 to-amber-500/5 border-orange-300/20 text-orange-200",
  sky: "from-sky-500/25 to-blue-500/5 border-sky-300/20 text-sky-200",
  violet: "from-violet-500/25 to-fuchsia-500/5 border-violet-300/20 text-violet-200",
  emerald: "from-emerald-500/25 to-teal-500/5 border-emerald-300/20 text-emerald-200",
};

export function HighlightsLibrary() {
  const [albums, setAlbums] = useState<HighlightAlbum[]>([]);
  const [videos, setVideos] = useState<HighlightVideo[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [isAddingAlbum, setIsAddingAlbum] = useState(false);
  const [albumName, setAlbumName] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const temporaryUrls = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    readDb().then(async (stored) => {
      if (cancelled) return;
      const nextAlbums = stored.albums.length ? stored.albums : DEFAULT_ALBUMS;
      if (!stored.albums.length) await Promise.all(nextAlbums.map((album) => writeRecord(ALBUM_STORE, album)));
      setAlbums(nextAlbums);
      setVideos(stored.videos);
      setSelectedAlbumId(nextAlbums[0]?.id ?? "");
    });
    const urlsAtEffectStart = temporaryUrls.current;
    return () => {
      cancelled = true;
      urlsAtEffectStart.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId) ?? albums[0];
  const albumVideos = useMemo(() => videos.filter((video) => video.albumId === selectedAlbum?.id), [selectedAlbum?.id, videos]);

  const createAlbum = async () => {
    const name = albumName.trim();
    if (!name) return;
    const colors: HighlightAlbum["color"][] = ["orange", "sky", "violet", "emerald"];
    const album: HighlightAlbum = { id: `album-${Date.now()}`, name, color: colors[albums.length % colors.length], createdAt: new Date().toISOString() };
    await writeRecord(ALBUM_STORE, album);
    setAlbums((current) => [...current, album]);
    setSelectedAlbumId(album.id);
    setAlbumName("");
    setIsAddingAlbum(false);
  };

  const deleteAlbum = async () => {
    if (!selectedAlbum || albums.length <= 1) return;
    const videosToDelete = videos.filter((video) => video.albumId === selectedAlbum.id);
    await Promise.all(videosToDelete.map((video) => removeRecord(VIDEO_STORE, video.id)));
    await removeRecord(ALBUM_STORE, selectedAlbum.id);
    const remaining = albums.filter((album) => album.id !== selectedAlbum.id);
    setAlbums(remaining);
    setVideos((current) => current.filter((video) => video.albumId !== selectedAlbum.id));
    setSelectedAlbumId(remaining[0]?.id ?? "");
  };

  const persistImportedVideo = async (file: File, handle?: LocalFileHandle) => {
    if (!selectedAlbum) return;
    const temporaryUrl = handle ? undefined : URL.createObjectURL(file);
    if (temporaryUrl) temporaryUrls.current.push(temporaryUrl);
    const video: HighlightVideo = {
      id: `video-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      albumId: selectedAlbum.id,
      title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " "),
      filename: file.name,
      addedAt: new Date().toISOString(),
      size: file.size,
      handle,
      temporaryUrl,
    };
    await writeRecord(VIDEO_STORE, video);
    setVideos((current) => [video, ...current]);
  };

  const importFromPicker = async () => {
    const picker = (window as PickerWindow).showOpenFilePicker;
    if (!picker) {
      fileInputRef.current?.click();
      return;
    }
    try {
      const handles = await picker({ multiple: true, types: [{ description: "Basketball videos", accept: { "video/*": [".mp4", ".mov", ".webm", ".m4v"] } }] });
      for (const handle of handles) await persistImportedVideo(await handle.getFile(), handle);
      if (handles.length) setNotice(`${handles.length} vidéo${handles.length > 1 ? "s" : ""} ajoutée${handles.length > 1 ? "s" : ""} à ${selectedAlbum?.name}.`);
    } catch {
      setNotice("Import annulé. Aucune vidéo n’a été envoyée en ligne.");
    }
  };

  const handleFallbackFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    for (const file of files) await persistImportedVideo(file);
    if (files.length) setNotice("Vidéo importée pour cette session. Pour une persistance après fermeture, utilise Chrome/Edge et autorise l’accès au fichier.");
    event.target.value = "";
  };

  const openVideo = async (video: HighlightVideo) => {
    try {
      const file = video.handle ? await video.handle.getFile() : null;
      const url = file ? URL.createObjectURL(file) : video.temporaryUrl;
      if (!url) {
        setNotice("Le fichier n’est plus accessible. Réimporte-le depuis ton téléphone.");
        return;
      }
      if (file) temporaryUrls.current.push(url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setNotice("Impossible d’ouvrir cette vidéo. Réimporte-la si le fichier a été déplacé.");
    }
  };

  const deleteVideo = async (video: HighlightVideo) => {
    await removeRecord(VIDEO_STORE, video.id);
    setVideos((current) => current.filter((item) => item.id !== video.id));
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300/70">PlayIt personnel</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">Tes highlights, enfin rangés.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">Importe tes vidéos depuis ton téléphone, classe-les par album et ouvre-les dans le lecteur de ton appareil. RIZE ne téléverse aucun fichier.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300"><HardDrive size={16} /> Stockage local</div>
      </header>

      <div className="rounded-[1.75rem] border border-orange-300/15 bg-gradient-to-br from-orange-500/15 via-slate-900/70 to-slate-950/80 p-4 shadow-xl shadow-black/10 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-300"><Film size={21} /></div><div><p className="text-sm font-black text-white">Une bibliothèque, pas un deuxième cloud</p><p className="mt-1 text-xs leading-relaxed text-slate-500">Chrome/Edge peut conserver une référence locale au fichier. Sur un navigateur qui ne le permet pas, RIZE garde la vidéo seulement pour la session courante.</p></div></div>
          <button onClick={importFromPicker} disabled={!selectedAlbum} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-orange-950/30 transition hover:-translate-y-0.5 active:scale-[.98]"><Upload size={17} /> Importer une vidéo</button>
          <input ref={fileInputRef} type="file" accept="video/*" multiple onChange={handleFallbackFiles} className="hidden" />
        </div>
        {notice && <button onClick={() => setNotice(null)} className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-left text-xs text-slate-400"><span>{notice}</span><X size={14} /></button>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {albums.map((album) => <button key={album.id} onClick={() => setSelectedAlbumId(album.id)} className={`rounded-2xl border bg-gradient-to-br p-4 text-left transition hover:-translate-y-0.5 ${albumStyles[album.color]} ${selectedAlbum?.id === album.id ? "ring-2 ring-white/50" : ""}`}><div className="flex items-start justify-between"><Folder size={20} /><span className="text-xs font-black">{videos.filter((video) => video.albumId === album.id).length}</span></div><p className="mt-8 text-sm font-black">{album.name}</p><p className="mt-1 text-[11px] text-white/50">Album local</p></button>)}
        <button onClick={() => setIsAddingAlbum(true)} className="flex min-h-[132px] items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-4 text-sm font-black text-slate-400 transition hover:border-orange-300/30 hover:text-orange-200"><FolderPlus size={18} /> Nouvel album</button>
      </div>

      {isAddingAlbum && <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:flex-row"><input autoFocus value={albumName} onChange={(event) => setAlbumName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && createAlbum()} placeholder="Ex. Summer League 2026" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-3 text-sm text-white outline-none focus:border-orange-400/70" /><button onClick={createAlbum} className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-white">Créer</button><button onClick={() => setIsAddingAlbum(false)} className="rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-slate-400">Annuler</button></div>}

      {selectedAlbum && <div className="rounded-[1.75rem] border border-white/10 bg-slate-900/65 p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">Album sélectionné</p><h3 className="mt-1 text-xl font-black text-white">{selectedAlbum.name}</h3><p className="mt-1 text-xs text-slate-500">{albumVideos.length} vidéo{albumVideos.length > 1 ? "s" : ""} · conservées localement</p></div><div className="flex items-center gap-2"><button onClick={importFromPicker} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/15"><Plus size={15} /> Ajouter</button><button onClick={deleteAlbum} disabled={albums.length <= 1} aria-label="Supprimer l’album" className="rounded-xl p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300 disabled:opacity-30"><Trash2 size={16} /></button></div></div>
        {albumVideos.length === 0 ? <div className="mt-5 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-6 text-center"><Film size={28} className="text-slate-700" /><p className="mt-3 text-sm font-bold text-slate-300">Ton album est prêt.</p><p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-600">Ajoute un match, un move ou une séquence d’entraînement. Les fichiers restent sur ton téléphone.</p></div> : <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{albumVideos.map((video) => <article key={video.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-slate-950/45"><div className="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black"><Film size={32} className="text-orange-300/70" /><span className="sr-only">{video.filename}</span></div><div className="p-3"><p className="truncate text-sm font-black text-white" title={video.filename}>{video.title}</p><p className="mt-1 text-xs text-slate-600">{formatSize(video.size)} · {new Date(video.addedAt).toLocaleDateString("fr-FR")}</p><div className="mt-3 flex items-center gap-2"><button onClick={() => openVideo(video)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500/15 px-3 py-2 text-xs font-black text-orange-200 hover:bg-orange-500/25"><ExternalLink size={14} /> Ouvrir</button><button onClick={() => deleteVideo(video)} aria-label={`Supprimer ${video.title}`} className="rounded-lg p-2 text-slate-600 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 size={15} /></button><button aria-label="Plus d’options" className="rounded-lg p-2 text-slate-700"><MoreHorizontal size={15} /></button></div></div></article>)}</div>}
      </div>}
    </section>
  );
}
