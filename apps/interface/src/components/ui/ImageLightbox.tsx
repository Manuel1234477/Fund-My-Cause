"use client";

import React, { useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export interface LightboxImage {
  /** Low-res thumbnail src shown in the gallery grid. */
  thumb: string;
  /** High-res src lazy-loaded only when the lightbox opens. */
  hiRes: string;
  alt: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  /** Index of the initially open image, or null when closed. */
  initialIndex?: number | null;
  onClose: () => void;
}

/**
 * Full-screen image lightbox with:
 * - Prev / Next navigation (buttons + arrow keys)
 * - Escape to close
 * - Focus trap while open
 * - Lazy hi-res load: the full-size image is only fetched when the lightbox opens
 */
export function ImageLightbox({ images, initialIndex = 0, onClose }: ImageLightboxProps) {
  const [current, setCurrent] = useState(initialIndex ?? 0);
  const trapRef = useFocusTrap(true);

  const prev = useCallback(() => setCurrent((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, prev, next]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!images.length) return null;
  const img = images[current];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Focus trap container */}
      <div
        ref={trapRef as React.RefObject<HTMLDivElement>}
        className="relative flex h-full w-full max-w-5xl flex-col items-center justify-center gap-4 p-4"
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close lightbox"
          className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition focus:outline-none focus:ring-2 focus:ring-white"
        >
          <X size={20} />
        </button>

        {/* Prev */}
        {images.length > 1 && (
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition focus:outline-none focus:ring-2 focus:ring-white"
          >
            <ChevronLeft size={28} />
          </button>
        )}

        {/* Hi-res image — only loaded when lightbox is open */}
        <div className="relative max-h-[80vh] max-w-full overflow-hidden rounded-xl">
          <Image
            key={img.hiRes}
            src={img.hiRes}
            alt={img.alt}
            width={1200}
            height={800}
            className="max-h-[80vh] w-auto object-contain"
            priority
            sizes="100vw"
          />
        </div>

        {/* Alt text caption */}
        <p className="text-center text-sm text-white/70" aria-live="polite">
          {img.alt} ({current + 1} / {images.length})
        </p>

        {/* Next */}
        {images.length > 1 && (
          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition focus:outline-none focus:ring-2 focus:ring-white"
          >
            <ChevronRight size={28} />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Gallery grid that opens the ImageLightbox when a thumbnail is clicked.
 */
export function MediaGallery({ images }: { images: LightboxImage[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!images.length) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((img, i) => (
          <button
            key={img.thumb}
            onClick={() => setOpenIndex(i)}
            aria-label={`Open ${img.alt} in lightbox`}
            className="group relative aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <Image
              src={img.thumb}
              alt={img.alt}
              fill
              className="object-cover transition group-hover:scale-105"
              sizes="(max-width: 640px) 33vw, 25vw"
            />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <ImageLightbox
          images={images}
          initialIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
