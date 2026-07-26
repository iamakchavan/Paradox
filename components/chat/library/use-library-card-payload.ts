"use client";

import { useEffect, useRef, useState } from 'react';
import { db, type LibraryFile } from '@/lib/db';
import { base64ToBlob } from './base64-to-blob';

export function useLibraryCardPayload(file: LibraryFile) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    const currentCard = cardRef.current;
    if (currentCard) observer.observe(currentCard);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || file.id === undefined || imgSrc) return;

    db.libraryPayloads.get(file.id).then((payload) => {
      if (!payload) return;

      setDataUrl(payload.data);
      if (file.type === 'image') {
        try {
          const blob = base64ToBlob(payload.data);
          setImgSrc(URL.createObjectURL(blob));
        } catch (error) {
          console.error('Failed to convert base64 payload to object URL:', error);
          setImgSrc(payload.data);
        }
      } else {
        setImgSrc(payload.data);
      }
    }).catch((error) => {
      console.error('Failed to fetch library file payload:', file.id, error);
    });
  }, [isVisible, file.id, imgSrc, file.type]);

  useEffect(() => {
    return () => {
      if (imgSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(imgSrc);
      }
    };
  }, [imgSrc]);

  return { cardRef, dataUrl, imgSrc };
}
