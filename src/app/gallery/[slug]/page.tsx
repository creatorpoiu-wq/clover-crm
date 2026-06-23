"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Download, Play, X, Lock, Image as ImageIcon, ChevronRight, ChevronLeft } from "lucide-react";

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
  const videos = media.filter(m => m.Media_Type === 'video' && (activeAlbumId ? m.Album_ID === activeAlbumId : true));

  const scrollToContent = () => {
    document.getElementById('gallery-content')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: "#fafafa", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* Split Hero for 'both', Full Hero otherwise */}
      {gallery.Gallery_Type === 'both' ? (
        <div style={{ display: "flex", height: "100vh", flexDirection: "row" }}>
          {/* Videos Side */}
          <div onClick={scrollToContent} style={{ flex: 1, position: "relative", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, backgroundColor: "#000" }}>
               {gallery.Cover_Image && <img src={gallery.Cover_Image} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.5 }} alt="Cover" />}
            </div>
            <div style={{ position: "relative", zIndex: 10, textAlign: "center", color: "white" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid white", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto" }}>
                <Play size={24} fill="white" style={{ marginLeft: "4px" }} />
              </div>
              <h2 style={{ fontSize: "2rem", fontWeight: 300, letterSpacing: "0.1em", textTransform: "uppercase" }}>Films</h2>
            </div>
          </div>
          {/* Photos Side */}
          <div onClick={scrollToContent} style={{ flex: 1, position: "relative", cursor: "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, backgroundColor: "#111" }}>
               {gallery.Cover_Image && <img src={gallery.Cover_Image} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }} alt="Cover" />}
            </div>
            <div style={{ position: "relative", zIndex: 10, textAlign: "center", color: "white", padding: "0 1rem", width: "100%", boxSizing: "border-box" }}>
              <h1 style={{ fontSize: "clamp(2rem, 6vw, 4rem)", fontFamily: "Georgia, serif", fontStyle: "italic", margin: "0 0 1rem 0", wordWrap: "break-word" }}>{gallery.Client_Name || gallery.Title}</h1>
              <p style={{ fontSize: "1rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>View Photos</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ height: "100vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: "white" }}>
          <div style={{ position: "absolute", inset: 0, backgroundColor: "#000" }}>
             {gallery.Cover_Image && <img src={gallery.Cover_Image} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }} alt="Cover" />}
          </div>
          <div style={{ position: "relative", zIndex: 10, padding: "2rem", width: "100%", boxSizing: "border-box" }}>
            <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", fontFamily: "Georgia, serif", fontStyle: "italic", margin: "0 0 1rem 0", textShadow: "0 4px 12px rgba(0,0,0,0.3)", padding: "0 1rem", wordWrap: "break-word" }}>
              {gallery.Client_Name || gallery.Title}
            </h1>
            <p style={{ fontSize: "1.25rem", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 3rem 0", opacity: 0.9 }}>
              {gallery.Gallery_Type === 'videos' ? 'Film Collection' : 'Photo Collection'}
            </p>
            <button 
              onClick={scrollToContent}
              style={{ padding: "1rem 2.5rem", backgroundColor: "white", color: "#000", border: "none", borderRadius: "2rem", fontSize: "1rem", fontWeight: 600, letterSpacing: "0.05em", cursor: "pointer", textTransform: "uppercase" }}
            >
              Open Gallery
            </button>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div id="gallery-content" style={{ maxWidth: "1400px", margin: "0 auto", padding: "4rem 2rem" }}>
        
        {/* Albums and Download Section */}
        <div style={{ display: "flex", flexDirection: "column", marginBottom: "2rem", borderBottom: "1px solid #e5e5e5", paddingBottom: "1rem" }}>
          {gallery.Download_Url && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
              <button 
                onClick={handleDownloadAll}
                title="Download Gallery"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", border: "1px solid #e5e5e5", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", color: "#404040" }}
              >
                <Download size={18} />
              </button>
            </div>
          )}
          {albums.length > 0 && (
            <div style={{ display: "flex", gap: "2rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
              {albums.map(album => (
                <button
                  key={album.Album_ID}
                  onClick={() => setActiveAlbumId(album.Album_ID)}
                  style={{ background: "none", border: "none", padding: "0 0 0.5rem 0", fontSize: "0.875rem", fontWeight: activeAlbumId === album.Album_ID ? 600 : 400, color: activeAlbumId === album.Album_ID ? "#000" : "#737373", textTransform: "uppercase", letterSpacing: "0.1em", cursor: "pointer", position: "relative", whiteSpace: "nowrap" }}
                >
                  {album.Name}
                  {activeAlbumId === album.Album_ID && (
                    <div style={{ position: "absolute", bottom: "-1rem", left: 0, right: 0, height: "2px", backgroundColor: "#000" }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Videos Section */}
        {(gallery.Gallery_Type === 'videos' || gallery.Gallery_Type === 'both') && videos.length > 0 && (
          <div style={{ marginBottom: gallery.Gallery_Type === 'both' ? "6rem" : "0" }}>
            {gallery.Gallery_Type === 'both' && <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 300, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "3rem" }}>Films</h2>}
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem" }}>
              {videos.map(video => (
                <div 
                  key={video.Media_ID} 
                  onClick={() => setPlayingVideoUrl(video.Url)}
                  style={{ cursor: "pointer", position: "relative", borderRadius: "0.5rem", overflow: "hidden", aspectRatio: "16/9", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                >
                  <img src={video.Thumbnail_Url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }} />
                  <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.3s ease" }}>
                    <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Play size={24} fill="black" style={{ marginLeft: "4px" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos Section */}
        {(gallery.Gallery_Type === 'photos' || gallery.Gallery_Type === 'both') && (
          <div>
            {gallery.Gallery_Type === 'both' && photos.length > 0 && <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 300, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2rem" }}>Photos</h2>}

            {/* Masonry-ish Grid */}
            <div style={{ columnCount: 3, columnGap: "1rem" }}>
              {photos.map((photo, index) => (
                <div 
                  key={photo.Media_ID} 
                  onClick={() => setLightboxIndex(index)}
                  style={{ marginBottom: "1rem", position: "relative", breakInside: "avoid", cursor: "pointer", borderRadius: "0.25rem", overflow: "hidden" }}
                >
                  <img src={photo.Url} alt="" style={{ width: "100%", display: "block", backgroundColor: "#f3f4f6" }} />
                  {gallery.Allow_Download !== false && (
                    <button 
                      onClick={(e) => handleDownloadSingle(photo.Url, e)}
                      style={{ position: "absolute", bottom: "1rem", right: "1rem", backgroundColor: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", opacity: 0.8 }}
                    >
                      <Download size={16} color="#000" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {photos.length === 0 && (
              <div style={{ textAlign: "center", padding: "4rem", color: "#a3a3a3" }}>No photos in this album yet.</div>
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
