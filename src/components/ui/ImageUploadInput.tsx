'use client';

import React, { useRef } from 'react';
import { UploadCloud } from 'lucide-react';

interface ImageUploadInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ImageUploadInput({ value, onChange, placeholder = "https://example.com/image.jpg", className = "", style = {} }: ImageUploadInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          onChange(dataUrl);
        }
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input 
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        style={{ flex: 1, ...style }}
      />
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        style={{ display: 'none' }} 
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: style.padding || '10px 14px',
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: style.borderRadius || '8px',
          cursor: 'pointer',
          color: 'var(--foreground)',
          fontSize: '14px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          height: '100%',
          boxSizing: 'border-box'
        }}
        title="Upload Image"
      >
        <UploadCloud size={18} />
        Upload
      </button>
    </div>
  );
}
