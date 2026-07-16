"use client";

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from "lucide-react";

interface DynamicMockupProps {
  frameUrl?: string;       // The transparent PNG product mask
  photoUrl?: string;       // The dynamic gallery image
  productName: string;    
  fallbackUrl?: string;    // Optional fallback
  insetTopBottom?: string; // e.g., "10%" for a thick frame
  insetLeftRight?: string; // e.g., "10%" for a thick frame
}

export default function DynamicMockup({
  frameUrl,
  photoUrl,
  productName,
  fallbackUrl,
  insetTopBottom = '15%', // Defaulting to 15% as a standard frame inset approximation
  insetLeftRight = '15%'
}: DynamicMockupProps) {
  const [imgSrc, setImgSrc] = useState<string | undefined>(photoUrl);

  useEffect(() => {
    setImgSrc(photoUrl);
  }, [photoUrl]);

  if (!frameUrl && !photoUrl) {
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f5f5f5" }}>
        <ImageIcon size={48} color="#ccc" />
      </div>
    );
  }

  return (
    <div 
      className="mockup-container group"
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* 
        BOTTOM LAYER (Z-1): The User's Gallery Photo 
        The inset shrinks the photo to fit inside the frame's transparent window.
      */}
      {imgSrc && (
        <img
          src={imgSrc}
          alt="Gallery preview"
          loading="lazy"
          onError={() => setImgSrc(fallbackUrl)}
          style={{
            position: 'absolute',
            top: insetTopBottom,
            bottom: insetTopBottom,
            left: insetLeftRight,
            right: insetLeftRight,
            width: `calc(100% - (${insetLeftRight} * 2))`,
            height: `calc(100% - (${insetTopBottom} * 2))`,
            objectFit: 'cover',
            zIndex: 1,
            transition: 'transform 0.5s ease',
          }}
          className="group-hover:scale-105"
        />
      )}

      {/* 
        TOP LAYER (Z-2): The Transparent Product Frame 
        Must cover 100% of the container and block pointer events so hover works on the image behind it.
      */}
      {frameUrl && (
        <img
          src={frameUrl}
          alt={productName}
          loading="lazy"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
}
