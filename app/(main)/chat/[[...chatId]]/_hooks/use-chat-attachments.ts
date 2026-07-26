"use client";

import { useCallback, useRef, useState } from 'react';
import { MODELS_REGISTRY } from '@/lib/models';
import type { ChatPdfAttachment } from '../_lib/types';

const PDF_LIMIT_BYTES = 10 * 1024 * 1024;
const IMAGE_LIMIT_BYTES = 20 * 1024 * 1024;
const PDF_UNSUPPORTED_MODELS = new Set(['mistral-small-latest', 'codestral-latest']);

interface UseChatAttachmentsOptions {
  selectedModelId: string;
  setError: (error: string | null) => void;
}

export function useChatAttachments({ selectedModelId, setError }: UseChatAttachmentsOptions) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedPDFs, setSelectedPDFs] = useState<ChatPdfAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.type === 'application/pdf') {
        const activeModel = MODELS_REGISTRY.find(model => model.id === selectedModelId);
        if (activeModel && PDF_UNSUPPORTED_MODELS.has(activeModel.id)) {
          setError('PDF uploads are not supported in light response models');
          continue;
        }
        if (file.size > PDF_LIMIT_BYTES) {
          setError('PDF size should be less than 10MB');
          continue;
        }
        const reader = new FileReader();
        reader.onload = loadEvent => {
          const result = loadEvent.target?.result;
          if (result) {
            setSelectedPDFs(previous => [...previous, { name: file.name, data: result as string }]);
          }
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('image/')) {
        if (file.size > IMAGE_LIMIT_BYTES) {
          setError('Image size should be less than 20MB');
          continue;
        }
        const reader = new FileReader();
        reader.onload = loadEvent => {
          if (loadEvent.target?.result) {
            setSelectedImages(previous => [...previous, loadEvent.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedModelId, setError]);

  const removeImage = useCallback((index: number) => {
    setSelectedImages(previous => previous.filter((_, currentIndex) => currentIndex !== index));
  }, []);

  const removePDF = useCallback((index: number) => {
    setSelectedPDFs(previous => previous.filter((_, currentIndex) => currentIndex !== index));
  }, []);

  const clearAttachments = useCallback(() => {
    setSelectedImages([]);
    setSelectedPDFs([]);
  }, []);

  return {
    selectedImages,
    selectedPDFs,
    setSelectedImages,
    setSelectedPDFs,
    fileInputRef,
    handleFileUpload,
    removeImage,
    removePDF,
    clearAttachments,
  };
}
