import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';

interface ImageDropzoneProps {
  value: string;
  onChange: (base64: string) => void;
  label?: string;
  maxDimension?: number;
  quality?: number;
  aspectRatio?: 'auto' | 'square' | 'video';
  className?: string;
  thumbnailMode?: boolean;
}

export default function ImageDropzone({
  value,
  onChange,
  label = "Upload Image",
  maxDimension = 2400,
  quality = 0.9,
  aspectRatio = 'auto',
  className = "",
  thumbnailMode = false
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Compress and resize
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // If converting to JPEG, fill with white first to avoid black backgrounds on transparent pixels
          const outputType = (file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/svg+xml') ? file.type : 'image/jpeg';
          
          if (outputType === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL(outputType, quality);
          onChange(compressedBase64);
        }
        setIsProcessing(false);
      };
      img.onerror = () => setIsProcessing(false);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => setIsProcessing(false);
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const aspectStyles = {
    square: { aspectRatio: '1 / 1' },
    video: { aspectRatio: '16 / 9' },
    auto: {}
  };

  // Thumbnail mode: compact horizontal row with small preview
  if (thumbnailMode && value) {
    return (
      <div className={className}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>
          {label}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '0.75rem', background: 'var(--background)' }}>
          <img
            src={value}
            alt="Logo preview"
            style={{ width: '64px', height: '64px', objectFit: 'contain', borderRadius: '0.5rem', background: 'var(--muted-bg)', padding: '4px', flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Logo uploaded</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>Click Replace to change it</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              style={{ padding: '0.4rem 0.85rem', border: '1px solid var(--border)', borderRadius: '0.5rem', background: 'var(--background)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ImageIcon size={13} /> Replace
            </button>
            <button
              onClick={removeImage}
              style={{ padding: '0.4rem 0.6rem', border: '1px solid #fecaca', borderRadius: '0.5rem', background: '#fff1f1', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
      </div>
    );
  }

  return (
    <div className={className}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--foreground)' }}>
        {label}
      </label>
      
      <div 
        onClick={() => !value && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? '#3b82f6' : 'var(--border)'}`,
          borderRadius: '0.75rem',
          backgroundColor: isDragging ? '#eff6ff' : value ? 'var(--muted-bg)' : 'var(--background)',
          cursor: value ? 'default' : 'pointer',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          minHeight: '160px',
          ...aspectStyles[aspectRatio]
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
        />

        {isProcessing ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--muted)' }}>
            <div className="animate-spin" style={{ marginBottom: '0.5rem' }}>
              <UploadCloud size={32} />
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Processing...</span>
          </div>
        ) : value ? (
          <>
            <img 
              src={value} 
              alt="Uploaded preview" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.5rem' }} 
            />
            <button
              onClick={removeImage}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: 'rgba(255, 255, 255, 0.9)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                color: '#ef4444'
              }}
            >
              <X size={18} />
            </button>
            <div 
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              style={{
                position: 'absolute',
                bottom: '0.5rem',
                right: '0.5rem',
                background: 'rgba(0, 0, 0, 0.6)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                backdropFilter: 'blur(4px)'
              }}
            >
              <ImageIcon size={14} /> Replace
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--muted)', padding: '2rem' }}>
            <UploadCloud size={40} style={{ marginBottom: '1rem', color: isDragging ? '#3b82f6' : '#94a3b8' }} />
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500, color: 'var(--foreground)' }}>
              Click to upload or drag and drop
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem' }}>
              SVG, PNG, JPG or GIF (max. 5MB)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
