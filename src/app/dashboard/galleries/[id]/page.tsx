"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Plus, Image as ImageIcon, Video, Settings, ExternalLink, Trash2, GripVertical, Check, Eye, EyeOff, Heart } from "lucide-react";
import Link from "next/link";
import ImageDropzone from "@/components/ui/ImageDropzone";

export default function GalleryManager() {
  const params = useParams();
  const router = useRouter();
  const galleryId = params.id as string;

  const [gallery, setGallery] = useState<any>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customDomain, setCustomDomain] = useState("");

  // UI state
  const [activeTab, setActiveTab] = useState<'media' | 'settings' | 'proofing'>('media');
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [proofingFavorites, setProofingFavorites] = useState<Record<string, any[]>>({});
  const [selectedClientEmail, setSelectedClientEmail] = useState<string | null>(null);
  const [copiedNames, setCopiedNames] = useState(false);
  
  // Modals
  const [isAddAlbumOpen, setIsAddAlbumOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaType, setNewMediaType] = useState<'photo' | 'video'>('photo');
  const [uploadTab, setUploadTab] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<{ name: string; progress: number; status: 'pending' | 'uploading' | 'success' | 'error'; error?: string }[]>([]);

  useEffect(() => {
    fetchGallery();
  }, [galleryId]);

  const fetchGallery = async () => {
    try {
      const res = await fetch(`/api/galleries/${galleryId}`);
      const data = await res.json();
      if (data.success) {
        setGallery(data.data);
        setAlbums(data.data.albums);
        setMedia(data.data.media);
        if (data.customDomain) setCustomDomain(data.customDomain);
        if (data.data.albums.length > 0 && selectedAlbumId === null) {
          setSelectedAlbumId(data.data.albums[0].Album_ID);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGallery = async (updates: any) => {
    setIsSaving(true);
    try {
      const finalUpdates = { ...updates };
      // Parse Google Drive URL if present
      if (finalUpdates.Cover_Image && finalUpdates.Cover_Image.includes('drive.google.com/file/d/')) {
        const match = finalUpdates.Cover_Image.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          finalUpdates.Cover_Image = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w2500`;
        }
      }

      const res = await fetch(`/api/galleries/${galleryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalUpdates)
      });
      const data = await res.json();
      if (data.success) {
        setGallery(data.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const fetchProofingFavorites = async () => {
    try {
      const res = await fetch(`/api/gallery-favorites/admin?galleryId=${galleryId}`);
      const data = await res.json();
      if (data.success) {
        setProofingFavorites(data.data);
        if (Object.keys(data.data).length > 0 && !selectedClientEmail) {
          setSelectedClientEmail(Object.keys(data.data)[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'proofing') {
      fetchProofingFavorites();
    }
  }, [activeTab]);

  const handleDeleteGallery = async () => {
    if (!confirm("Are you sure you want to permanently delete this gallery and all its media? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/galleries/${galleryId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/dashboard/galleries';
      } else {
        alert("Failed to delete gallery");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete gallery");
    }
  };

  const handleAddAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName) return;
    try {
      const res = await fetch(`/api/gallery-albums`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Gallery_ID: gallery.Gallery_ID, Name: newAlbumName })
      });
      const data = await res.json();
      if (data.success) {
        setAlbums([...albums, data.data]);
        setSelectedAlbumId(data.data.Album_ID);
        setIsAddAlbumOpen(false);
        setNewAlbumName("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAlbum = async (albumId: number) => {
    if (!confirm("Are you sure? This will delete the album and all its media.")) return;
    try {
      await fetch(`/api/gallery-albums?id=${albumId}`, { method: 'DELETE' });
      setAlbums(albums.filter(a => a.Album_ID !== albumId));
      setMedia(media.filter(m => m.Album_ID !== albumId));
      if (selectedAlbumId === albumId) setSelectedAlbumId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaUrl) return;

    let thumbnailUrl = newMediaUrl;
    let finalMediaType = newMediaType;

    // Auto-extract YouTube thumbnail
    if (newMediaUrl.includes("youtube.com") || newMediaUrl.includes("youtu.be")) {
      const videoId = newMediaUrl.includes("v=") ? newMediaUrl.split("v=")[1].split("&")[0] : newMediaUrl.split("/").pop();
      thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      finalMediaType = 'video';
    }
    // GDrive image link convert
    let finalUrl = newMediaUrl;
    if (finalUrl.includes('drive.google.com/file/d/')) {
      const match = finalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        // Use Google Drive thumbnail endpoint which works more reliably for display
        finalUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w2500`;
        thumbnailUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
      }
    }
    // Auto-extract Vimeo thumbnail
    if (newMediaUrl.includes("vimeo.com")) {
      finalMediaType = 'video';
      try {
        const vRes = await fetch(`https://vimeo.com/api/oembed.json?url=${newMediaUrl}`);
        if (vRes.ok) {
          const vData = await vRes.json();
          if (vData && vData.thumbnail_url) {
            thumbnailUrl = vData.thumbnail_url;
          }
        }
      } catch (e) {
        console.error("Failed to fetch Vimeo thumbnail", e);
      }
    }

    try {
      const res = await fetch(`/api/gallery-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          Gallery_ID: gallery.Gallery_ID, 
          Album_ID: selectedAlbumId,
          Media_Type: finalMediaType,
          Url: finalUrl,
          Thumbnail_Url: thumbnailUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setMedia([...media, data.data]);
        setNewMediaUrl("");
        setIsAddMediaOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    let uploadHasError = false;
    
    const newItems = Array.from(files).map(f => ({
      name: f.name,
      progress: 0,
      status: 'pending' as const
    }));
    setUploadQueue(newItems);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      setUploadQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'uploading' } : item));

      try {
        const res = await fetch('/api/gallery-media/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            galleryId: gallery.Gallery_ID,
            albumId: selectedAlbumId,
            filename: file.name,
            contentType: file.type
          })
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to get upload URL');

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', data.uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded / event.total) * 100);
              setUploadQueue(prev => prev.map((item, idx) => idx === i ? { ...item, progress: percentage } : item));
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve();
            } else {
              reject(new Error(`Upload failed (HTTP ${xhr.status}). Check R2 CORS settings.`));
            }
          };

          xhr.onerror = () => reject(new Error('Network error — R2 bucket may need CORS configured to allow PUT from this origin'));
          xhr.send(file);
        });

        const dbRes = await fetch('/api/gallery-media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Gallery_ID: gallery.Gallery_ID,
            Album_ID: selectedAlbumId,
            Media_Type: file.type.startsWith('video/') ? 'video' : 'photo',
            Url: data.publicUrl,
            Thumbnail_Url: data.publicUrl,
            File_Name: data.originalFilename || file.name
          })
        });
        const dbData = await dbRes.json();
        if (!dbData.success) throw new Error(dbData.error || 'Failed to register media');

        setMedia(prev => [...prev, dbData.data]);
        setUploadQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'success', progress: 100 } : item));

      } catch (err: any) {
        console.error(err);
        uploadHasError = true;
        const errMsg = err.message || 'Unknown error';
        setUploadQueue(prev => prev.map((item, idx) => idx === i ? { ...item, status: 'error', error: errMsg } : item));
      }
    }

    setIsUploading(false);
    if (!uploadHasError) {
      setTimeout(() => {
        setIsAddMediaOpen(false);
        setUploadQueue([]);
      }, 1500);
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    if (!confirm("Remove this media?")) return;
    try {
      await fetch(`/api/gallery-media?id=${mediaId}`, { method: 'DELETE' });
      setMedia(media.filter(m => m.Media_ID !== mediaId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Loading gallery...</div>;
  if (!gallery) return <div style={{ padding: "4rem", textAlign: "center" }}>Gallery not found</div>;

  const currentAlbumMedia = media.filter(m => m.Album_ID === selectedAlbumId);

  const getBaseUrl = () => {
    if (customDomain) {
      return customDomain.startsWith('http') ? customDomain : `https://${customDomain}`;
    }
    return typeof window !== 'undefined' ? window.location.origin : '';
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", backgroundColor: "#f8fafc" }}>
      
      {/* Left Sidebar */}
      <div style={{ width: "300px", backgroundColor: "white", borderRight: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid #e2e8f0" }}>
          <Link href="/dashboard/galleries" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#64748b", textDecoration: "none", fontSize: "0.875rem", marginBottom: "1rem" }}>
            <ChevronLeft size={16} /> Back to Galleries
          </Link>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "0 0 0.5rem 0", color: "#0f172a" }}>{gallery.Title}</h2>
          
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button 
              onClick={() => handleUpdateGallery({ Is_Published: !gallery.Is_Published })}
              style={{ flex: 1, padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: gallery.Is_Published ? "#f0fdf4" : "white", color: gallery.Is_Published ? "#166534" : "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontWeight: 500 }}
            >
              {gallery.Is_Published ? <><Check size={16}/> Published</> : <><EyeOff size={16}/> Draft</>}
            </button>
            <Link href={`${getBaseUrl()}/gallery/${gallery.Slug}`} target="_blank" style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", color: "#334155", display: "flex", alignItems: "center" }}>
              <ExternalLink size={16} />
            </Link>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "1rem" }}>
            <button 
              onClick={() => setActiveTab('media')}
              style={{ width: "100%", textAlign: "left", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "none", background: activeTab === 'media' ? "#f1f5f9" : "transparent", color: activeTab === 'media' ? "#0f172a" : "#64748b", fontWeight: activeTab === 'media' ? 600 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <ImageIcon size={18} /> Media & Albums
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              style={{ width: "100%", textAlign: "left", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "none", background: activeTab === 'settings' ? "#f1f5f9" : "transparent", color: activeTab === 'settings' ? "#0f172a" : "#64748b", fontWeight: activeTab === 'settings' ? 600 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}
            >
              <Settings size={18} /> Settings
            </button>
            {gallery.Enable_Proofing && (
              <button 
                onClick={() => setActiveTab('proofing')}
                style={{ width: "100%", textAlign: "left", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "none", background: activeTab === 'proofing' ? "#fff1f2" : "transparent", color: activeTab === 'proofing' ? "#be123c" : "#64748b", fontWeight: activeTab === 'proofing' ? 600 : 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}
              >
                <Heart size={18} /> Client Proofing
              </button>
            )}
          </div>

          {activeTab === 'media' && (
            <div style={{ padding: "0 1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 1rem", marginTop: "1rem", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#94a3b8" }}>Albums</span>
                <button onClick={() => setIsAddAlbumOpen(true)} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer", padding: 0 }}><Plus size={16}/></button>
              </div>
              
              {albums.map(album => (
                <div 
                  key={album.Album_ID}
                  onClick={() => setSelectedAlbumId(album.Album_ID)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderRadius: "0.5rem", cursor: "pointer", background: selectedAlbumId === album.Album_ID ? "#eff6ff" : "transparent", color: selectedAlbumId === album.Album_ID ? "#1d4ed8" : "#475569", fontWeight: selectedAlbumId === album.Album_ID ? 600 : 500 }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <GripVertical size={14} style={{ opacity: 0.3 }} />
                    {album.Name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{media.filter(m => m.Album_ID === album.Album_ID).length}</span>
                    {selectedAlbumId === album.Album_ID && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.Album_ID); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.25rem" }}><Trash2 size={14}/></button>
                    )}
                  </div>
                </div>
              ))}
              
              {albums.length === 0 && (
                <div style={{ padding: "1rem", textAlign: "center", color: "#94a3b8", fontSize: "0.875rem" }}>No albums yet</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        {activeTab === 'media' ? (
          <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            {selectedAlbumId ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                  <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", margin: 0 }}>
                    {albums.find(a => a.Album_ID === selectedAlbumId)?.Name}
                  </h2>
                  <button 
                    onClick={() => setIsAddMediaOpen(true)}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#0f172a", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    <Plus size={16} /> Add Media
                  </button>
                </div>

                {currentAlbumMedia.length === 0 ? (
                  <div style={{ backgroundColor: "white", padding: "4rem 2rem", borderRadius: "1rem", border: "1px dashed #cbd5e1", textAlign: "center" }}>
                    <ImageIcon size={48} style={{ margin: "0 auto 1rem auto", color: "#cbd5e1" }} />
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", margin: "0 0 0.5rem 0" }}>This album is empty</h3>
                    <p style={{ color: "#64748b", margin: "0 0 1.5rem 0" }}>Add photos or videos via URL (Cloudinary, Google Drive, YouTube, Vimeo).</p>
                    <button 
                      onClick={() => setIsAddMediaOpen(true)}
                      style={{ backgroundColor: "white", color: "#0f172a", border: "1px solid #0f172a", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer" }}
                    >
                      Add Media
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                    {currentAlbumMedia.map(item => (
                      <div key={item.Media_ID} className="group" style={{ position: "relative", aspectRatio: item.Media_Type === 'video' ? '16/9' : '1', backgroundColor: "#e2e8f0", borderRadius: "0.5rem", overflow: "hidden" }}>
                        <img src={item.Thumbnail_Url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        {item.Media_Type === 'video' && (
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                              <Video size={20} />
                            </div>
                          </div>
                        )}
                        <button 
                          onClick={() => handleDeleteMedia(item.Media_ID)}
                          style={{ position: "absolute", top: "0.5rem", right: "0.5rem", backgroundColor: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", padding: "0.25rem", borderRadius: "0.25rem", cursor: "pointer" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
                Select or create an album to view media.
              </div>
            )}
          </div>
        ) : activeTab === 'settings' ? (
          <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", margin: "0 0 2rem 0" }}>Gallery Settings</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", backgroundColor: "white", padding: "2rem", borderRadius: "1rem", border: "1px solid #e2e8f0" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Gallery Title</label>
                <input 
                  type="text" 
                  value={gallery.Title} 
                  onChange={e => setGallery({...gallery, Title: e.target.value})}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Cover Image (URL)</label>
                <input 
                  type="text"
                  placeholder="Paste image URL (Google Drive, Cloudinary, etc.)"
                  value={gallery.Cover_Image || ''}
                  onChange={(e) => setGallery({...gallery, Cover_Image: e.target.value})}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Client Name (Optional)</label>
                  <input 
                    type="text" 
                    value={gallery.Client_Name || ""} 
                    onChange={e => setGallery({...gallery, Client_Name: e.target.value})}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Event Date (Optional)</label>
                  <input 
                    type="date" 
                    value={gallery.Event_Date || ""} 
                    onChange={e => setGallery({...gallery, Event_Date: e.target.value})}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Full Gallery Download URL (Google Drive/Dropbox link)</label>
                <input 
                  type="text" 
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={gallery.Download_Url || ""} 
                  onChange={e => setGallery({...gallery, Download_Url: e.target.value})}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
                />
                <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                  If you host high-res photos on an external drive, paste the folder link here. Clients can click "Download All" to open it.
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Gallery Password (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Leave blank for public access"
                  value={gallery.Password || ""} 
                  onChange={e => setGallery({...gallery, Password: e.target.value})}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input 
                  type="checkbox" 
                  id="enable_proofing"
                  checked={gallery.Enable_Proofing || false}
                  onChange={e => setGallery({...gallery, Enable_Proofing: e.target.checked})}
                  style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
                />
                <label htmlFor="enable_proofing" style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}>Enable Client Proofing (Favorites)</label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "1rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                {saveSuccess && <span style={{ color: "#16a34a", fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}><Check size={16}/> Saved!</span>}
                <button 
                  onClick={() => handleUpdateGallery({
                    Title: gallery.Title,
                    Cover_Image: gallery.Cover_Image,
                    Client_Name: gallery.Client_Name,
                    Event_Date: gallery.Event_Date,
                    Download_Url: gallery.Download_Url,
                    Password: gallery.Password,
                    Is_Published: gallery.Is_Published,
                    Enable_Proofing: gallery.Enable_Proofing
                  })}
                  disabled={isSaving}
                  style={{ backgroundColor: "#0f172a", color: "white", border: "none", padding: "0.75rem 2rem", borderRadius: "0.5rem", fontWeight: 600, cursor: isSaving ? "not-allowed" : "pointer", opacity: isSaving ? 0.7 : 1 }}
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </button>
              </div>

              {/* Danger Zone */}
              <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid #fee2e2" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#991b1b", marginBottom: "0.5rem" }}>Danger Zone</h3>
                <p style={{ color: "#b91c1c", fontSize: "0.875rem", marginBottom: "1rem" }}>Once you delete a gallery, there is no going back. Please be certain.</p>
                <button 
                  onClick={handleDeleteGallery}
                  style={{ backgroundColor: "white", color: "#ef4444", border: "1px solid #f87171", padding: "0.75rem 2rem", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer" }}
                >
                  Delete Gallery
                </button>
              </div>

            </div>
          </div>
        ) : (
          <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", margin: "0 0 2rem 0" }}>Client Proofing</h2>
            {Object.keys(proofingFavorites).length === 0 ? (
              <div style={{ backgroundColor: "white", padding: "4rem 2rem", borderRadius: "1rem", border: "1px dashed #cbd5e1", textAlign: "center", color: "#64748b" }}>
                <Heart size={48} style={{ margin: "0 auto 1rem auto", color: "#cbd5e1" }} />
                <p>No clients have favorited any media yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "2rem", minHeight: "60vh" }}>
                {/* Email List */}
                <div style={{ width: "280px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.5rem" }}>Clients</h3>
                  {Object.keys(proofingFavorites).map(email => (
                    <button
                      key={email}
                      onClick={() => setSelectedClientEmail(email)}
                      style={{
                        textAlign: "left",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.5rem",
                        border: "none",
                        background: selectedClientEmail === email ? "#eff6ff" : "white",
                        color: selectedClientEmail === email ? "#1d4ed8" : "#475569",
                        fontWeight: selectedClientEmail === email ? 600 : 500,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        boxShadow: selectedClientEmail === email ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px", whiteSpace: "nowrap" }}>{email}</span>
                      <span style={{ fontSize: "0.75rem", backgroundColor: selectedClientEmail === email ? "#bfdbfe" : "#f1f5f9", padding: "0.2rem 0.5rem", borderRadius: "999px", fontWeight: 700 }}>
                        {proofingFavorites[email].length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Favorites List */}
                <div style={{ flex: 1, backgroundColor: "white", padding: "1.5rem", borderRadius: "1rem", border: "1px solid #e2e8f0" }}>
                  {selectedClientEmail && proofingFavorites[selectedClientEmail] ? (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", margin: 0 }}>
                          Favorites for <span style={{ color: "#3b82f6" }}>{selectedClientEmail}</span>
                          <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "#64748b", marginLeft: "0.5rem" }}>({proofingFavorites[selectedClientEmail].length} photo{proofingFavorites[selectedClientEmail].length !== 1 ? 's' : ''})</span>
                        </h3>
                        <button
                          onClick={() => {
                            const names = proofingFavorites[selectedClientEmail]
                              .map(f => f.fileName || `media-${f.mediaId}`)
                              .join(', ');
                            navigator.clipboard.writeText(names);
                            setCopiedNames(true);
                            setTimeout(() => setCopiedNames(false), 2000);
                          }}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.4rem",
                            padding: "0.5rem 1rem", borderRadius: "0.5rem",
                            border: "1px solid",
                            borderColor: copiedNames ? "#16a34a" : "#cbd5e1",
                            background: copiedNames ? "#f0fdf4" : "white",
                            color: copiedNames ? "#16a34a" : "#334155",
                            fontWeight: 600, fontSize: "0.875rem",
                            cursor: "pointer", transition: "all 0.2s"
                          }}
                        >
                          {copiedNames ? <><Check size={15} /> Copied!</> : <>Copy Filenames</>}
                        </button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {proofingFavorites[selectedClientEmail].map((fav, idx) => (
                          <div key={fav.favoriteId} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.625rem 0.75rem", borderRadius: "0.5rem", background: idx % 2 === 0 ? "#f8fafc" : "white", border: "1px solid #f1f5f9" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", width: "2rem", textAlign: "right", flexShrink: 0 }}>{idx + 1}</span>
                            <div style={{ width: "48px", height: "48px", borderRadius: "0.375rem", overflow: "hidden", flexShrink: 0, backgroundColor: "#e2e8f0", position: "relative" }}>
                              <img src={fav.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              {fav.mediaType === 'video' && (
                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
                                  <Video size={14} color="white" />
                                </div>
                              )}
                            </div>
                            <span style={{ flex: 1, fontSize: "0.875rem", color: "#0f172a", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {fav.fileName || `media-${fav.mediaId}`}
                            </span>
                            <span style={{ fontSize: "0.7rem", color: "#94a3b8", flexShrink: 0 }}>
                              {fav.mediaType}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#64748b" }}>
                      Select a client to view their favorites.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Album Modal */}
      {isAddAlbumOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <form onSubmit={handleAddAlbum} style={{ backgroundColor: "white", padding: "2rem", borderRadius: "1rem", width: "100%", maxWidth: "400px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "0 0 1rem 0" }}>New Album</h2>
            <input 
              autoFocus
              required
              type="text" 
              placeholder="e.g. Getting Ready"
              value={newAlbumName} 
              onChange={e => setNewAlbumName(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", marginBottom: "1.5rem" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button type="button" onClick={() => setIsAddAlbumOpen(false)} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", background: "white" }}>Cancel</button>
              <button type="submit" style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", background: "#0f172a", color: "white" }}>Create</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Media Modal */}
      {isAddMediaOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "1rem", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "0 0 1rem 0" }}>Add Media</h2>
            
            {/* Tab selector */}
            <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
              <button 
                type="button" 
                onClick={() => setUploadTab('upload')}
                style={{ flex: 1, padding: "0.75rem", border: "none", background: "none", borderBottom: uploadTab === 'upload' ? "2px solid #0f172a" : "none", color: uploadTab === 'upload' ? "#0f172a" : "#64748b", fontWeight: 600, cursor: "pointer" }}
              >
                Upload Files
              </button>
              <button 
                type="button" 
                onClick={() => setUploadTab('url')}
                style={{ flex: 1, padding: "0.75rem", border: "none", background: "none", borderBottom: uploadTab === 'url' ? "2px solid #0f172a" : "none", color: uploadTab === 'url' ? "#0f172a" : "#64748b", fontWeight: 600, cursor: "pointer" }}
              >
                Add via URL
              </button>
            </div>

            {uploadTab === 'upload' ? (
              <div style={{ marginBottom: "1.5rem" }}>
                <div 
                  onClick={() => !isUploading && document.getElementById('file-upload-input')?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleUploadFiles(e.dataTransfer.files); }}
                  style={{
                    border: "2px dashed #cbd5e1",
                    borderRadius: "0.75rem",
                    padding: "2.5rem 1.5rem",
                    textAlign: "center",
                    cursor: isUploading ? "not-allowed" : "pointer",
                    backgroundColor: "#f8fafc",
                    transition: "all 0.2s"
                  }}
                >
                  <input 
                    type="file" 
                    id="file-upload-input" 
                    multiple 
                    accept="image/*,video/*" 
                    onChange={e => e.target.files && handleUploadFiles(e.target.files)} 
                    style={{ display: "none" }}
                    disabled={isUploading}
                  />
                  <div style={{ color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    <Plus size={32} style={{ opacity: 0.5 }} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Click to select images or videos</span>
                    <span style={{ fontSize: "0.75rem" }}>Supports JPEG, PNG, WEBP, MP4, etc.</span>
                  </div>
                </div>

                 {uploadQueue.length > 0 && (
                  <div style={{ marginTop: "1.5rem", maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", border: "1px solid #e2e8f0", padding: "0.5rem", borderRadius: "0.5rem" }}>
                    {uploadQueue.map((item, idx) => (
                      <div key={idx} style={{ display: "flex", flexDirection: "column", fontSize: "0.75rem", padding: "0.25rem 0", borderBottom: idx < uploadQueue.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "250px", fontWeight: 500 }}>{item.name}</span>
                          <span style={{ fontWeight: 600, color: item.status === 'success' ? '#16a34a' : item.status === 'error' ? '#dc2626' : '#3b82f6' }}>
                            {item.status === 'uploading' ? `${item.progress}%` : item.status === 'success' ? 'Uploaded' : item.status === 'error' ? 'Failed' : 'Pending'}
                          </span>
                        </div>
                        {item.status === 'error' && item.error && (
                          <div style={{ color: "#dc2626", fontSize: "0.7rem", marginTop: "2px", lineHeight: "1.2" }}>
                            Reason: {item.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
                  <button type="button" onClick={() => setIsAddMediaOpen(false)} disabled={isUploading} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", background: "white", cursor: isUploading ? "not-allowed" : "pointer" }}>Cancel</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddMedia}>
                {gallery.Gallery_Type === 'both' && (
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                    <button type="button" onClick={() => setNewMediaType('photo')} style={{ flex: 1, padding: "0.5rem", borderRadius: "0.5rem", border: newMediaType === 'photo' ? "2px solid #0f172a" : "1px solid #cbd5e1", background: "white", color: newMediaType === 'photo' ? "#0f172a" : "#64748b" }}>Photo</button>
                    <button type="button" onClick={() => setNewMediaType('video')} style={{ flex: 1, padding: "0.5rem", borderRadius: "0.5rem", border: newMediaType === 'video' ? "2px solid #0f172a" : "1px solid #cbd5e1", background: "white", color: newMediaType === 'video' ? "#0f172a" : "#64748b" }}>Video</button>
                  </div>
                )}

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>
                    {newMediaType === 'photo' ? "Image URL (Google Drive, Cloudinary, etc.)" : "Video URL (YouTube or Vimeo)"}
                  </label>
                  <input 
                    autoFocus
                    required
                    type="text" 
                    placeholder="https://"
                    value={newMediaUrl} 
                    onChange={e => setNewMediaUrl(e.target.value)}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
                  />
                  <p style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.5rem" }}>
                    {newMediaType === 'photo' 
                      ? "For Google Drive, paste the 'Anyone with link can view' URL. It will be converted automatically." 
                      : "Paste a YouTube or Vimeo link."}
                  </p>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                  <button type="button" onClick={() => setIsAddMediaOpen(false)} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", background: "white" }}>Cancel</button>
                  <button type="submit" style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", background: "#0f172a", color: "white" }}>Add</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
