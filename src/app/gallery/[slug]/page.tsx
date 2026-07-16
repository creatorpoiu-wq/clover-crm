"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { Download, Play, X, Lock, MonitorPlay, CloudDownload, Share2, ArrowLeft, ChevronRight, ChevronLeft, Heart, ShoppingCart, MessageCircle, Mail } from "lucide-react";
import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

export default function PublicGallery() {
  const params = useParams();
  const slug = params.slug as string;

  const [gallery, setGallery] = useState<any>(null);
  const [albums, setAlbums] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [activeAlbumId, setActiveAlbumId] = useState<number | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [isSlideshowPlaying, setIsSlideshowPlaying] = useState(false);

  const [viewMode, setViewMode] = useState<'photos' | 'films'>('photos');
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteActionMediaId, setFavoriteActionMediaId] = useState<number | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(`/api/galleries/${slug}?public=true`);
        const data = await res.json();
        if (data.success && data.data.Is_Published) {
          setGallery(data.data);
          setAlbums(data.data.albums);
          setMedia(data.data.media);
          setCompanyName(data.companyName || "");
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

  // Load email from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEmail = localStorage.getItem(`gallery_email_${slug}`);
      if (savedEmail) {
        setClientEmail(savedEmail);
      }
    }
  }, [slug]);

  // Fetch favorites when email or gallery changes
  useEffect(() => {
    if (clientEmail && gallery?.Gallery_ID) {
      fetchFavorites();
    }
  }, [clientEmail, gallery]);

  const fetchFavorites = async () => {
    try {
      const res = await fetch(`/api/gallery-favorites?galleryId=${gallery.Gallery_ID}&email=${encodeURIComponent(clientEmail || '')}`);
      const data = await res.json();
      if (data.success) {
        setFavorites(data.data);
      }
    } catch (err) {
      console.error("Error loading favorites:", err);
    }
  };

  const handleToggleFavorite = async (mediaId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (!clientEmail) {
      setFavoriteActionMediaId(mediaId);
      setIsEmailModalOpen(true);
      return;
    }

    try {
      const isFav = favorites.includes(mediaId);
      setFavorites(prev => isFav ? prev.filter(id => id !== mediaId) : [...prev, mediaId]);

      const res = await fetch('/api/gallery-favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          galleryId: gallery.Gallery_ID,
          mediaId,
          email: clientEmail
        })
      });
      const data = await res.json();
      if (!data.success) {
        setFavorites(prev => isFav ? [...prev, mediaId] : prev.filter(id => id !== mediaId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavoriteDirect = async (mediaId: number, email: string) => {
    try {
      const isFav = favorites.includes(mediaId);
      setFavorites(prev => isFav ? prev.filter(id => id !== mediaId) : [...prev, mediaId]);

      const res = await fetch('/api/gallery-favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          galleryId: gallery.Gallery_ID,
          mediaId,
          email
        })
      });
      const data = await res.json();
      if (!data.success) {
        setFavorites(prev => isFav ? [...prev, mediaId] : prev.filter(id => id !== mediaId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempEmail || !tempEmail.includes('@')) return;
    
    const email = tempEmail.toLowerCase().trim();
    localStorage.setItem(`gallery_email_${slug}`, email);
    setClientEmail(email);
    setIsEmailModalOpen(false);
    
    if (favoriteActionMediaId !== null) {
      const mediaId = favoriteActionMediaId;
      setFavoriteActionMediaId(null);
      setTimeout(() => {
        handleToggleFavoriteDirect(mediaId, email);
      }, 100);
    }
  };

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

  const visibleAlbums = useMemo(() => {
    return albums.filter(album => {
      return media.some(m => m.Album_ID === album.Album_ID && m.Media_Type === (viewMode === 'photos' ? 'photo' : 'video'));
    });
  }, [albums, media, viewMode]);

  useEffect(() => {
    if (visibleAlbums.length > 0 && !visibleAlbums.some(a => a.Album_ID === activeAlbumId)) {
      setActiveAlbumId(visibleAlbums[0].Album_ID);
    } else if (visibleAlbums.length === 0 && activeAlbumId !== null) {
      setActiveAlbumId(null);
    }
  }, [viewMode, visibleAlbums, activeAlbumId]);

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

  const photos = media.filter(m => {
    const matchesAlbum = activeAlbumId ? m.Album_ID === activeAlbumId : true;
    const matchesFavorites = showFavoritesOnly ? favorites.includes(m.Media_ID) : true;
    return m.Media_Type === 'photo' && matchesAlbum && matchesFavorites;
  });
  const videos = media.filter(m => {
    const matchesAlbum = activeAlbumId ? m.Album_ID === activeAlbumId : true;
    const matchesFavorites = showFavoritesOnly ? favorites.includes(m.Media_ID) : true;
    return m.Media_Type === 'video' && matchesAlbum && matchesFavorites;
  });
  const hasVideos = media.some(m => m.Media_Type === 'video'); // compute on all media
  const hasPhotos = media.some(m => m.Media_Type === 'photo');





  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSlideshowPlaying && lightboxIndex !== null && photos.length > 0) {
      interval = setInterval(() => {
        setLightboxIndex(prev => {
          if (prev === null) return 0;
          return prev < photos.length - 1 ? prev + 1 : 0;
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSlideshowPlaying, lightboxIndex, photos.length]);

  const scrollToContent = () => {
    document.getElementById('gallery-content')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: "#fafafa", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* Hero Section */}
      <div style={{ position: "relative", height: "100vh", width: "100%", backgroundColor: "black", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {gallery.Cover_Image && (
          <img src={gallery.Cover_Image} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} alt="Cover" />
        )}
        
        {/* Subtle gradient overlay at bottom for text readability */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)", zIndex: 5 }}></div>

        {/* Title in Center */}
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", color: "white", padding: "0 1rem", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
           <h1 style={{ fontSize: "clamp(3rem, 10vw, 6rem)", fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 1.5rem 0", textShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
             {gallery.Client_Name || gallery.Title}
           </h1>
           
           <button 
             onClick={scrollToContent}
             style={{ 
               background: "transparent", 
               border: "1px solid rgba(255,255,255,0.7)", 
               color: "white", 
               padding: "0.75rem 2.5rem", 
               fontSize: "0.75rem", 
               fontWeight: 500,
               letterSpacing: "0.2em", 
               textTransform: "uppercase", 
               cursor: "pointer",
               transition: "background-color 0.3s, color 0.3s",
               backdropFilter: "blur(4px)"
             }}
             onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "white"; e.currentTarget.style.color = "black"; }}
             onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "white"; }}
           >
             View Gallery
           </button>
        </div>

        <div style={{ position: "absolute", bottom: "2rem", left: 0, right: 0, textAlign: "center", zIndex: 10 }}>
          <p style={{ color: "white", fontSize: "0.7rem", letterSpacing: "0.3em", textTransform: "uppercase", margin: 0, opacity: 0.9 }}>
            {companyName || "C. R MARK PHOTOGRAPHY"}
          </p>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div id="gallery-content" style={{ position: "sticky", top: 0, zIndex: 40, backgroundColor: "white", padding: "1.25rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        
        {/* Left: Branding */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 800, fontSize: "1.125rem", letterSpacing: "0.05em", color: "#111", textTransform: "uppercase" }}>
            {gallery.Client_Name || gallery.Title}
          </span>
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.25em", color: "#a3a3a3", textTransform: "uppercase", marginTop: "4px" }}>
            {companyName || "C. R MARK PHOTOGRAPHY"}
          </span>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <button onClick={() => window.location.href = `/gallery/${slug}/store`} style={{ background: "none", border: "none", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", color: "#a3a3a3", cursor: "pointer", textTransform: "uppercase", transition: "color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.color = "#111"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"}>
            Print Store
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", color: "#a3a3a3" }}>
            <ShoppingCart size={20} style={{ cursor: "pointer", transition: "color 0.2s" }} onClick={() => window.location.href = `/gallery/${slug}/store`} onMouseEnter={(e) => e.currentTarget.style.color = "#111"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"} />
            <Heart size={20} style={{ cursor: "pointer", transition: "color 0.2s" }} onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} onMouseEnter={(e) => e.currentTarget.style.color = "#111"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"} />
            <Download size={20} style={{ cursor: "pointer", transition: "color 0.2s" }} onClick={handleDownloadAll} onMouseEnter={(e) => e.currentTarget.style.color = "#111"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"} />
            <Share2 size={20} style={{ cursor: "pointer", transition: "color 0.2s" }} onClick={() => setIsShareModalOpen(true)} onMouseEnter={(e) => e.currentTarget.style.color = "#111"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"} />
            {hasVideos ? (
              <Play size={20} style={{ cursor: "pointer", transition: "color 0.2s" }} onClick={() => setViewMode('films')} onMouseEnter={(e) => e.currentTarget.style.color = "#111"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"} />
            ) : (
              <Play size={20} style={{ cursor: "pointer", transition: "color 0.2s" }} onClick={() => { if(photos.length > 0) { setLightboxIndex(0); setIsSlideshowPlaying(true); } }} onMouseEnter={(e) => e.currentTarget.style.color = "#111"} onMouseLeave={(e) => e.currentTarget.style.color = "#a3a3a3"} />
            )}
          </div>
        </div>
      </div>

      {/* Album Navigation (Secondary) */}
      {visibleAlbums.length > 1 && (
        <div style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e5e5e5", padding: "1rem 2rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2rem", overflowX: "auto" }}>
            {visibleAlbums.map(album => (
              <button
                key={album.Album_ID}
                onClick={() => setActiveAlbumId(album.Album_ID)}
                style={{ background: "none", border: "none", padding: 0, fontSize: "0.75rem", fontWeight: activeAlbumId === album.Album_ID ? 600 : 400, color: activeAlbumId === album.Album_ID ? "#000" : "#737373", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", position: "relative", whiteSpace: "nowrap", transition: "color 0.2s" }}
              >
                {album.Name}
              </button>
            ))}
          </div>
        </div>
      )}

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
                {gallery.Enable_Proofing && (
                  <button
                    onClick={(e) => handleToggleFavorite(photo.Media_ID, e)}
                    style={{
                      position: "absolute",
                      top: "1rem",
                      left: "1rem",
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      border: "none",
                      borderRadius: "50%",
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                      zIndex: 10,
                      transition: "transform 0.2s"
                    }}
                    className="hover:scale-105"
                  >
                    <Heart size={16} fill={favorites.includes(photo.Media_ID) ? "#ef4444" : "none"} color={favorites.includes(photo.Media_ID) ? "#ef4444" : "#475569"} />
                  </button>
                )}
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
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))", gap: "1rem", padding: "1rem" }}>
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
          <button onClick={() => { setLightboxIndex(null); setIsSlideshowPlaying(false); }} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={32} /></button>
          
          <button 
            onClick={() => { setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : photos.length - 1); setIsSlideshowPlaying(false); }}
            style={{ position: "absolute", left: "1.5rem", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "48px", height: "48px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          ><ChevronLeft size={24} /></button>

          <img src={photos[lightboxIndex].Url} alt="" style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain" }} />
          
          <button 
            onClick={() => { setLightboxIndex(lightboxIndex < photos.length - 1 ? lightboxIndex + 1 : 0); setIsSlideshowPlaying(false); }}
            style={{ position: "absolute", right: "1.5rem", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%", width: "48px", height: "48px", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          ><ChevronRight size={24} /></button>

          {gallery.Enable_Proofing && (
            <button 
              onClick={(e) => handleToggleFavorite(photos[lightboxIndex].Media_ID, e)}
              style={{ position: "absolute", top: "1.5rem", right: "14rem", background: "none", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "2rem", padding: "0.5rem 1.5rem", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem" }}
            >
              <Heart size={16} fill={favorites.includes(photos[lightboxIndex].Media_ID) ? "#ef4444" : "none"} color={favorites.includes(photos[lightboxIndex].Media_ID) ? "#ef4444" : "white"} />
              {favorites.includes(photos[lightboxIndex].Media_ID) ? "Favorited" : "Favorite"}
            </button>
          )}

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
          
          {gallery.Download_Url && (
            <button 
              onClick={() => window.open(gallery.Download_Url, '_blank')}
              style={{ position: "absolute", top: "1.5rem", right: "5rem", background: "none", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "2rem", padding: "0.5rem 1.5rem", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", zIndex: 110 }}
            >
              <Download size={16} /> Download
            </button>
          )}
          
          <div style={{ width: "90vw", height: "80vh", maxWidth: "1200px" }}>
            {(() => {
              const Player = ReactPlayer as any;
              return (
                <Player 
                  url={playingVideoUrl} 
                  playing={true} 
                  controls={true}
                  width="100%"
                  height="100%"
                  onEnded={() => setPlayingVideoUrl(null)}
                  config={{
                    youtube: {
                      playerVars: { modestbranding: 1, rel: 0 }
                    },
                    vimeo: {
                      playerOptions: { byline: false, portrait: false, title: false }
                    }
                  }}
                />
              );
            })()}
          </div>
        </div>
      )}

      {/* Floating Favorites Bar */}
      {gallery.Enable_Proofing && favorites.length > 0 && (
        <div style={{
          position: "fixed",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#0f172a",
          color: "white",
          padding: "0.75rem 1.5rem",
          borderRadius: "9999px",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
          zIndex: 45,
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Heart size={18} fill="#ef4444" color="#ef4444" />
            <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{favorites.length} Selected</span>
          </div>
          <div style={{ width: "1px", height: "16px", backgroundColor: "#334155" }} />
          <button 
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            style={{
              background: "none",
              border: "none",
              color: showFavoritesOnly ? "#ef4444" : "#94a3b8",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.25rem"
            }}
          >
            {showFavoritesOnly ? "Show All" : "View Selected Only"}
          </button>
        </div>
      )}

      {/* Email Collection Modal */}
      {isEmailModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110 }}>
          <form onSubmit={handleEmailSubmit} style={{ backgroundColor: "white", padding: "2rem", borderRadius: "1rem", width: "100%", maxWidth: "400px", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <Heart size={32} fill="#ef4444" color="#ef4444" style={{ margin: "0 auto 1rem auto" }} />
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#0f172a", margin: "0 0 0.5rem 0" }}>Favorite this Photo</h2>
            <p style={{ color: "#64748b", fontSize: "0.875rem", margin: "0 0 1.5rem 0" }}>
              Please enter your email to create a favorites list. This allows the photographer to view your selections.
            </p>
            <input 
              required
              type="email" 
              placeholder="your.email@example.com"
              value={tempEmail}
              onChange={e => setTempEmail(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", marginBottom: "1.5rem", textAlign: "center" }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={() => setIsEmailModalOpen(false)} style={{ flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1", background: "white", cursor: "pointer" }}>Cancel</button>
              <button type="submit" style={{ flex: 1, padding: "0.75rem", borderRadius: "0.5rem", border: "none", backgroundColor: "#0f172a", color: "white", fontWeight: 600, cursor: "pointer" }}>Submit</button>
            </div>
          </form>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 110 }}>
          <div style={{ backgroundColor: "white", padding: "2.5rem", borderRadius: "0", width: "100%", maxWidth: "500px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#111", margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>Share</h2>
              <button onClick={() => setIsShareModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}><X size={24} color="#737373" /></button>
            </div>
            
            <div style={{ display: "flex", marginBottom: "2.5rem", backgroundColor: "#f5f5f5" }}>
              <input 
                type="text" 
                readOnly 
                value={shareUrl} 
                style={{ flex: 1, padding: "1rem", border: "none", backgroundColor: "transparent", color: "#333", fontSize: "0.875rem" }}
              />
              <button 
                onClick={() => { navigator.clipboard.writeText(shareUrl); alert("Copied!"); }}
                style={{ backgroundColor: "#333", color: "white", border: "none", padding: "0 2rem", fontWeight: 500, letterSpacing: "0.1em", cursor: "pointer" }}
              >
                COPY
              </button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", textAlign: "center" }}>
              {[
                { name: 'Messenger', icon: <MessageCircle size={24} /> },
                { name: 'WhatsApp', icon: <MessageCircle size={24} /> },
                { name: 'Facebook', icon: <Share2 size={24} /> },
                { name: 'Email', icon: <Mail size={24} /> },
                { name: 'X (Twitter)', icon: <Share2 size={24} /> },
                { name: 'Pinterest', icon: <Share2 size={24} /> },
                { name: 'Threads', icon: <Share2 size={24} /> },
                { name: 'More', icon: <Share2 size={24} /> },
              ].map(item => (
                <div key={item.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={() => alert("Integration pending for " + item.name)}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#737373", color: "white", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#111"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#737373"}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#737373" }}>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
