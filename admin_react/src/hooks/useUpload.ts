import { useState } from 'react';
import { UPLOAD_IMAGE_URL } from '../config/api';

export interface CompressedImage {
  blob: Blob;
  dataUrl: string;
}

export function compressImageClientSide(file: File, maxDimension = 1100, quality = 0.80): Promise<CompressedImage> {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve({ blob: file, dataUrl: '' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDimension || h > maxDimension) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          canvas.toBlob((blob) => {
            resolve({ blob: blob || file, dataUrl });
          }, 'image/jpeg', quality);
        } else {
          resolve({ blob: file, dataUrl: e.target?.result as string || '' });
        }
      };
      img.onerror = () => resolve({ blob: file, dataUrl: e.target?.result as string || '' });
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve({ blob: file, dataUrl: '' });
    reader.readAsDataURL(file);
  });
}

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImages = async (files: FileList | File[], folder = 'apartments'): Promise<string[]> => {
    if (!files || files.length === 0) return [];
    setIsUploading(true);

    const token = localStorage.getItem('adminToken');
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImageClientSide(file, 1100, 0.80);
        const formData = new FormData();
        formData.append('file', compressed.blob, file.name.replace(/\.[^/.]+$/, '') + '.jpg');

        try {
          const res = await fetch(`${UPLOAD_IMAGE_URL}?folder=${encodeURIComponent(folder)}`, {
            method: 'POST',
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: formData,
          });

          const data = await res.json();
          const url = data.status === 'success' ? (data.url || data.data?.url) : (compressed.dataUrl || null);
          if (url) {
            uploadedUrls.push(url);
          }
        } catch (err) {
          console.warn('[useUpload] Upload request failed, falling back to dataUrl:', err);
          if (compressed.dataUrl) {
            uploadedUrls.push(compressed.dataUrl);
          }
        }
      }
    } finally {
      setIsUploading(false);
    }

    return uploadedUrls;
  };

  return { uploadImages, isUploading };
}
