"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Plus, Image as ImageIcon, Video, Settings, ExternalLink, Trash2, GripVertical, Check, Eye, EyeOff } from "lucide-react";
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

  // UI state
  const [activeTab, setActiveTab] = useState<'media' | 'settings'>('media');
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  
  // Modals
  const [isAddAlbumOpen, setIsAddAlbumOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [isAddMediaOpen, setIsAddMediaOpen] = useState(false);
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [newMediaType, setNewMediaType] = useState<'photo' | 'video'>('photo');

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
    try {
      const res = await fetch(`/api/galleries/${galleryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setGallery(data.data);
      }
    } catch (err) {
      console.error(err);
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
    // Auto-extract YouTube thumbnail
    if (newMediaUrl.includes("youtube.com") || newMediaUrl.includes("youtu.be")) {
      const videoId = newMediaUrl.includes("v=") ? newMediaUrl.split("v=")[1].split("&")[0] : newMediaUrl.split("/").pop();
      thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    // GDrive image link convert
    let finalUrl = newMediaUrl;
    if (finalUrl.includes('drive.google.com/file/d/')) {
      const match = finalUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        finalUrl = `https://drive.google.com/uc?id=${match[1]}`;
        thumbnailUrl = finalUrl;
      }
    }

    try {
      const res = await fetch(`/api/gallery-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          Gallery_ID: gallery.Gallery_ID, 
          Album_ID: selectedAlbumId,
          Media_Type: newMediaType,
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
            <Link href={`/gallery/${gallery.Slug}`} target="_blank" style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", background: "white", color: "#334155", display: "flex", alignItems: "center" }}>
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
        ) : (
          <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#0f172a", margin: "0 0 2rem 0" }}>Gallery Settings</h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", backgroundColor: "white", padding: "2rem", borderRadius: "1rem", border: "1px solid #e2e8f0" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Gallery Title</label>
                <input 
                  type="text" 
                  value={gallery.Title} 
                  onChange={e => handleUpdateGallery({ Title: e.target.value })}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Cover Image (URL)</label>
                <ImageDropzone 
                  value={gallery.Cover_Image || ''}
                  onChange={(val) => handleUpdateGallery({ Cover_Image: val })}
                  label="Gallery Cover Photo"
                  aspectRatio="video"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Client Name (Optional)</label>
                  <input 
                    type="text" 
                    value={gallery.Client_Name || ""} 
                    onChange={e => handleUpdateGallery({ Client_Name: e.target.value })}
                    style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Event Date (Optional)</label>
                  <input 
                    type="date" 
                    value={gallery.Event_Date || ""} 
                    onChange={e => handleUpdateGallery({ Event_Date: e.target.value })}
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
                  onChange={e => handleUpdateGallery({ Download_Url: e.target.value })}
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
                  onChange={e => handleUpdateGallery({ Password: e.target.value })}
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>
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
          <form onSubmit={handleAddMedia} style={{ backgroundColor: "white", padding: "2rem", borderRadius: "1rem", width: "100%", maxWidth: "500px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "0 0 1rem 0" }}>Add Media</h2>
            
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
        </div>
      )}
    </div>
  );
}
