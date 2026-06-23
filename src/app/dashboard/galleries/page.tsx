"use client";

import { useState, useEffect } from "react";
import { Plus, Image as ImageIcon, Video, Layers, Link as LinkIcon, Trash2, Edit2, Copy, ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Gallery {
  Gallery_ID: number;
  Title: string;
  Client_Name: string | null;
  Event_Date: string | null;
  Gallery_Type: 'photos' | 'videos' | 'both';
  Cover_Image: string | null;
  Slug: string;
  Is_Published: boolean;
  Photo_Count: number;
  Video_Count: number;
}

export default function GalleriesList() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<'all' | 'photos' | 'videos' | 'both'>('all');
  
  // Modal state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<'photos' | 'videos' | 'both'>('photos');
  const [newSlug, setNewSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    fetchGalleries();
  }, []);

  const fetchGalleries = async () => {
    try {
      const res = await fetch('/api/galleries');
      const data = await res.json();
      if (data.success) {
        setGalleries(data.data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError("Failed to fetch galleries");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSlug) return;
    
    setIsCreating(true);
    try {
      const res = await fetch('/api/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Title: newTitle,
          Slug: newSlug,
          Gallery_Type: newType
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setIsNewModalOpen(false);
        router.push(`/dashboard/galleries/${data.data.Gallery_ID}`);
      } else {
        alert(data.error || "Failed to create gallery");
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const generateSlug = (title: string) => {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setNewSlug(slug);
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/gallery/${slug}`;
    navigator.clipboard.writeText(url);
    alert("Gallery link copied to clipboard!");
  };

  const filteredGalleries = filter === 'all' 
    ? galleries 
    : galleries.filter(g => g.Gallery_Type === filter);

  const getIconForType = (type: string) => {
    if (type === 'photos') return <ImageIcon size={16} />;
    if (type === 'videos') return <Video size={16} />;
    return <Layers size={16} />;
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", color: "#0f172a", margin: 0 }}>Client Galleries</h1>
          <p style={{ color: "#64748b", margin: "0.5rem 0 0 0" }}>Deliver beautiful photo and video collections to your clients.</p>
        </div>
        <button 
          onClick={() => setIsNewModalOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "#0f172a", color: "white", border: "none", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer" }}
        >
          <Plus size={18} /> New Gallery
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {['all', 'photos', 'videos', 'both'].map((type) => (
          <button 
            key={type}
            onClick={() => setFilter(type as any)}
            style={{ 
              padding: '0.5rem 1rem', 
              borderRadius: '2rem', 
              border: filter === type ? '1px solid #0f172a' : '1px solid #e2e8f0', 
              background: filter === type ? '#0f172a' : 'white',
              color: filter === type ? 'white' : '#64748b',
              fontWeight: 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>Loading galleries...</div>
      ) : filteredGalleries.length === 0 ? (
        <div style={{ backgroundColor: "white", padding: "4rem 2rem", borderRadius: "1rem", border: "1px dashed #cbd5e1", textAlign: "center" }}>
          <ImageIcon size={48} style={{ margin: "0 auto 1rem auto", color: "#cbd5e1" }} />
          <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#0f172a", margin: "0 0 0.5rem 0" }}>No galleries found</h3>
          <p style={{ color: "#64748b", margin: "0 0 1.5rem 0" }}>Get started by creating your first client gallery delivery.</p>
          <button 
            onClick={() => setIsNewModalOpen(true)}
            style={{ backgroundColor: "white", color: "#0f172a", border: "1px solid #0f172a", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer" }}
          >
            Create Gallery
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {filteredGalleries.map(gallery => (
            <div key={gallery.Gallery_ID} style={{ backgroundColor: "white", borderRadius: "1rem", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column" }}>
              <div style={{ height: "180px", backgroundColor: "#f1f5f9", backgroundImage: gallery.Cover_Image ? `url(${gallery.Cover_Image})` : 'none', backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
                {!gallery.Cover_Image && (
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#cbd5e1" }}>
                    <ImageIcon size={40} />
                  </div>
                )}
                <div style={{ position: "absolute", top: "0.75rem", right: "0.75rem", display: "flex", gap: "0.5rem" }}>
                  <span style={{ backgroundColor: gallery.Is_Published ? "#dcfce7" : "#f1f5f9", color: gallery.Is_Published ? "#166534" : "#475569", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600 }}>
                    {gallery.Is_Published ? "Published" : "Draft"}
                  </span>
                </div>
                <div style={{ position: "absolute", bottom: "0.75rem", left: "0.75rem", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "white", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  {getIconForType(gallery.Gallery_Type)}
                  <span style={{ textTransform: "capitalize" }}>{gallery.Gallery_Type}</span>
                </div>
              </div>
              
              <div style={{ padding: "1.25rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.125rem", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {gallery.Title}
                </h3>
                <p style={{ margin: "0 0 1rem 0", fontSize: "0.875rem", color: "#64748b", display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {gallery.Client_Name || "No client specified"}
                  {gallery.Event_Date && <> &bull; <Calendar size={12}/> {new Date(gallery.Event_Date).toLocaleDateString()}</>}
                </p>
                
                <div style={{ marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "0.875rem", color: "#64748b" }}>
                    {gallery.Gallery_Type === 'photos' || gallery.Gallery_Type === 'both' ? `${gallery.Photo_Count} photos` : ''}
                    {gallery.Gallery_Type === 'both' ? ' • ' : ''}
                    {gallery.Gallery_Type === 'videos' || gallery.Gallery_Type === 'both' ? `${gallery.Video_Count} videos` : ''}
                  </div>
                  
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={() => copyLink(gallery.Slug)} title="Copy Link" style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: "0.25rem" }}>
                      <Copy size={16} />
                    </button>
                    {gallery.Is_Published && (
                      <Link href={`/gallery/${gallery.Slug}`} target="_blank" title="View Live" style={{ color: "#64748b", padding: "0.25rem" }}>
                        <ExternalLink size={16} />
                      </Link>
                    )}
                    <Link href={`/dashboard/galleries/${gallery.Gallery_ID}`} title="Edit" style={{ color: "#3b82f6", padding: "0.25rem" }}>
                      <Edit2 size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Gallery Modal */}
      {isNewModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "white", padding: "2rem", borderRadius: "1rem", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>Create New Gallery</h2>
              <button onClick={() => setIsNewModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>&times;</button>
            </div>
            
            <form onSubmit={handleCreateGallery} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Collection Title</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => { setNewTitle(e.target.value); generateSlug(e.target.value); }}
                  placeholder="e.g. Emma & Alex Wedding"
                  style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>URL Slug</label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ padding: "0.75rem", backgroundColor: "#f1f5f9", border: "1px solid #cbd5e1", borderRight: "none", borderRadius: "0.5rem 0 0 0.5rem", color: "#64748b", fontSize: "0.875rem" }}>
                    /gallery/
                  </span>
                  <input 
                    required
                    type="text" 
                    value={newSlug} 
                    onChange={(e) => setNewSlug(e.target.value)}
                    style={{ flex: 1, padding: "0.75rem", borderRadius: "0 0.5rem 0.5rem 0", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Gallery Type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  <button type="button" onClick={() => setNewType('photos')} style={{ padding: "0.75rem", border: newType === 'photos' ? "2px solid #0f172a" : "1px solid #cbd5e1", borderRadius: "0.5rem", background: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", color: newType === 'photos' ? "#0f172a" : "#64748b" }}>
                    <ImageIcon size={20} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Photos</span>
                  </button>
                  <button type="button" onClick={() => setNewType('videos')} style={{ padding: "0.75rem", border: newType === 'videos' ? "2px solid #0f172a" : "1px solid #cbd5e1", borderRadius: "0.5rem", background: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", color: newType === 'videos' ? "#0f172a" : "#64748b" }}>
                    <Video size={20} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Videos</span>
                  </button>
                  <button type="button" onClick={() => setNewType('both')} style={{ padding: "0.75rem", border: newType === 'both' ? "2px solid #0f172a" : "1px solid #cbd5e1", borderRadius: "0.5rem", background: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", color: newType === 'both' ? "#0f172a" : "#64748b" }}>
                    <Layers size={20} />
                    <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Both</span>
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setIsNewModalOpen(false)} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", background: "white", fontWeight: 600, cursor: "pointer", color: "#334155" }}>
                  Cancel
                </button>
                <button type="submit" disabled={isCreating} style={{ padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "none", background: "#0f172a", color: "white", fontWeight: 600, cursor: isCreating ? "not-allowed" : "pointer", opacity: isCreating ? 0.7 : 1 }}>
                  {isCreating ? "Creating..." : "Create Gallery"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
