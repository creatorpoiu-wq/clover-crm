"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Download, Play, X, Lock, MonitorPlay, CloudDownload, Share2, ArrowLeft, ChevronRight, ChevronLeft } from "lucide-react";

export default function PublicGallery() {
  const params = useParams();
  const slug = params.slug as string;

  const [gallery, setGallery] = useState<any>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [activeAlbumId, setActiveAlbumId] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'photos' | 'films'>('photos');

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(`/api/galleries/${slug}?public=true`);
        const data = await res.json();
        if (data.success && data.data.Is_Published) {
          setGallery(data.data);
          setAlbums(data.data.albums);
          setMedia(data.data.media);
          if (data.data.albums.length > 0) {
            setActiveAlbumId(data.data.albums[0].Album_ID);
          }
          if (!data.data.Password) {
            setIsAuthenticated(true);
          }
          
          // Default viewmode if gallery is strictly films
          if (data.data.Gallery_Type === 'videos') {
            setViewMode('films');
          }
        } else {
          setError("Gallery not found or is not published yet.");
        }
      } catch (err) {
        setError("Error loading gallery");
      } finally {
        setLoading(false);
      }
    };
    fetchGallery();
  }, [slug]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === gallery.Password) {
      setIsAuthenticated(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password");
    }
  };

  const handleDownloadSingle = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/gallery-download?url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleDownloadAll = () => {
    if (gallery.Download_Url) {
      window.open(gallery.Download_Url, '_blank');
    } else {
      alert("The photographer has not provided a download link for this entire gallery.");
    }
  };

  if (loading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa", color: "#64748b" }}>Loading collection...</div>;
  if (error || !gallery) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa", color: "#64748b" }}>{error}</div>;

  if (!isAuthenticated) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fafafa" }}>
        <div style={{ backgroundColor: "white", padding: "3rem", borderRadius: "1rem", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", textAlign: "center", maxWidth: "400px", width: "100%" }}>
          <Lock size={32} style={{ margin: "0 auto 1rem auto", color: "#0f172a" }} />
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "0 0 0.5rem 0", color: "#0f172a" }}>Protected Gallery</h1>
          <p style={{ color: "#64748b", margin: "0 0 2rem 0" }}>Please enter the password to view {gallery.Client_Name ? `${gallery.Client_Name}'s` : 'this'} collection.</p>
          <form onSubmit={handlePasswordSubmit}>
            <input 
              type="password" 
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              placeholder="Enter password"
              style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", marginBottom: "1rem", textAlign: "center", letterSpacing: "0.1em" }}
            />
            {passwordError && <p style={{ color: "#ef4444", fontSize: "0.875rem", margin: "0 0 1rem 0" }}>{passwordError}</p>}
            <button type="submit" style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "none", backgroundColor: "#0f172a", color: "white", fontWeight: 600, cursor: "pointer" }}>
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  const photos = media.filter(m => m.Media_Type === 'photo' && (activeAlbumId ? m.Album_ID === activeAlbumId : true));
  const videos = media.filter(m => m.Media_Type === 'video'); // Films view shows all videos usually

  const scrollToContent = () => {
    document.getElementById('gallery-content')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: "#fafafa", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* Hero Section */}
      <div style={{ position: "relative", height: "60vh", width: "100%", backgroundColor: "black", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {gallery.Cover_Image && (
          <img src={gallery.Cover_Image} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} alt="Cover" />
        )}
        
        {/* Top Navigation */}
        <nav style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 20, color: "white" }}>
          
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>{gallery.Client_Name || gallery.Title}</span>
          </div>

          <div style={{ display: "flex", gap: "2rem", alignItems: "center", letterSpacing: "0.1em", fontSize: "0.875rem", fontWeight: 500, flex: 1, justifyContent: "center" }}>
            {gallery.Gallery_Type !== 'photos' && (
              <button 
                onClick={() => setViewMode('films')} 
                style={{ background: "none", border: "none", color: "white", cursor: "pointer", opacity: viewMode === 'films' ? 1 : 0.6, transition: "opacity 0.2s" }}
              >
                FILMS
              </button>
            )}
            {gallery.Gallery_Type !== 'videos' && (
              <button 
                onClick={() => setViewMode('photos')} 
                style={{ background: "none", border: "none", color: "white", cursor: "pointer", opacity: viewMode === 'photos' ? 1 : 0.6, transition: "opacity 0.2s" }}
              >
                PHOTOS
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
            <button style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "2rem", color: "white", cursor: "pointer", padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", fontWeight: 600, backdropFilter: "blur(4px)" }}>
              <MonitorPlay size={16} /> TV
            </button>
            <button onClick={handleDownloadAll} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", color: "white", cursor: "pointer", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
              <CloudDownload size={18} />
            </button>
            <button style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", color: "white", cursor: "pointer", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
              <Share2 size={18} />
            </button>
          </div>
        </nav>

        {/* Optional Title in Center */}
        {/* <div style={{ position: "relative", zIndex: 10, textAlign: "center", color: "white", padding: "0 1rem" }}>
           <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", fontFamily: "Georgia, serif", fontStyle: "italic", margin: "0 0 1rem 0", textShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
             {gallery.Client_Name || gallery.Title}
           </h1>
        </div> */}
      </div>

      {/* Sticky Sub-Navigation (Album Bar) */}
      <div id="gallery-content" style={{ position: "sticky", top: 0, zIndex: 40, backgroundColor: "#fafafa", borderBottom: "1px solid #e5e5e5", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        
        {viewMode === 'photos' ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "2rem", overflowX: "auto" }}>
              <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} style={{ background: "none", border: "1px solid #d4d4d8", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#52525b", flexShrink: 0 }}>
                <ArrowLeft size={16} />
              </button>
              
              <div style={{ display: "flex", gap: "2rem" }}>
                {albums.map(album => (
                  <button
                    key={album.Album_ID}
                    onClick={() => setActiveAlbumId(album.Album_ID)}
                    style={{ background: "none", border: "none", padding: 0, fontSize: "0.875rem", fontWeight: activeAlbumId === album.Album_ID ? 600 : 400, color: activeAlbumId === album.Album_ID ? "#000" : "#737373", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", position: "relative", whiteSpace: "nowrap" }}
                  >
                    {album.Name}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
               <span style={{ fontSize: "0.875rem", color: "#737373" }}>{photos.length} Photos</span>
               <button style={{ backgroundColor: "#a68a5c", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "0.25rem", fontSize: "0.875rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                 <Play size={14} fill="white" /> Play Slideshow
               </button>
            </div>
          </>
        ) : (
          <div style={{ width: "100%", textAlign: "center" }}>
             <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#000", textTransform: "uppercase", letterSpacing: "0.1em" }}>Films Collection</span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div style={{ padding: "0.5rem", maxWidth: "2400px", margin: "0 auto" }}>
        
        {viewMode === 'photos' ? (
          <div style={{ columnCount: 3, columnGap: "0.5rem" }}>
            {photos.map((photo, index) => (
              <div 
                key={photo.Media_ID} 
                className="group"
                onClick={() => setLightboxIndex(index)}
                style={{ marginBottom: "0.5rem", position: "relative", breakInside: "avoid", cursor: "pointer", overflow: "hidden" }}
              >
                <img src={photo.Url} alt="" style={{ width: "100%", display: "block", backgroundColor: "#f3f4f6" }} />
                {gallery.Allow_Download !== false && (
                  <button 
                    onClick={(e) => handleDownloadSingle(photo.Url, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ position: "absolute", bottom: "1rem", right: "1rem", backgroundColor: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
                  >
                    <Download size={16} color="#000" />
                  </button>
                )}
              </div>
            ))}
            {photos.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem", color: "#a3a3a3", width: "100%" }}>No photos available.</div>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1rem", padding: "2rem" }}>
            {videos.map(video => (
              <div 
                key={video.Media_ID} 
                className="group"
                onClick={() => setPlayingVideoUrl(video.Url)}
                style={{ cursor: "pointer", position: "relative", overflow: "hidden", aspectRatio: "16/9" }}
              >
                <img src={video.Thumbnail_Url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }} className="group-hover:scale-105" />
                <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.3s ease" }} className="group-hover:bg-black/10">
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                    <Play size={24} fill="black" style={{ marginLeft: "4px" }} />
                  </div>
                </div>
              </div>
            ))}
            {videos.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem", color: "#a3a3a3", gridColumn: "1 / -1" }}>No films available.</div>
            )}
          </div>
        )}
      </div>

      {/* Photo Lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.95)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", touchAction: "none" }}>
          <button onClick={() => setLightboxIndex(null)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={32} /></button>
          
          <button 
            onClick={() => setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : photos.length - 1)}
            style={{ position: "absolute", left: "1.5rem", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "48px", height: "48px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          ><ChevronLeft size={24} /></button>

          <img src={photos[lightboxIndex].Url} alt="" style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain" }} />
          
          <button 
            onClick={() => setLightboxIndex(lightboxIndex < photos.length - 1 ? lightboxIndex + 1 : 0)}
            style={{ position: "absolute", right: "1.5rem", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "48px", height: "48px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          ><ChevronRight size={24} /></button>

          {gallery.Allow_Download !== false && (
            <button 
              onClick={(e) => handleDownloadSingle(photos[lightboxIndex].Url, e)}
              style={{ position: "absolute", top: "1.5rem", right: "5rem", background: "none", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "2rem", padding: "0.5rem 1.5rem", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}
            >
              <Download size={16} /> Download
            </button>
          )}
        </div>
      )}

      {/* Video Lightbox */}
      {playingVideoUrl && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.95)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", touchAction: "none" }}>
          <button onClick={() => setPlayingVideoUrl(null)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={32} /></button>
          
          <div style={{ width: "90vw", height: "80vh", maxWidth: "1200px" }}>
            {playingVideoUrl.includes('youtube.com') || playingVideoUrl.includes('youtu.be') ? (
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${playingVideoUrl.includes("v=") ? playingVideoUrl.split("v=")[1].split("&")[0] : playingVideoUrl.split("/").pop()}?autoplay=1`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : playingVideoUrl.includes('vimeo.com') ? (
              <iframe 
                src={`https://player.vimeo.com/video/${playingVideoUrl.split("/").pop()}?autoplay=1`} 
                width="100%" 
                height="100%" 
                frameBorder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowFullScreen
              ></iframe>
            ) : (
              <video src={playingVideoUrl} controls autoPlay style={{ width: "100%", height: "100%" }}></video>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
