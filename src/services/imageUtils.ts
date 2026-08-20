/**
 * Compress a base64 image to a target max size (default 200KB)
 */
export async function compressImage(base64: string, maxKB = 200): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Scale down if too large
      const MAX_DIM = 800;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      // Try decreasing quality until under maxKB, using WebP to preserve transparency
      let quality = 0.8;
      let result = canvas.toDataURL('image/webp', quality);
      while (result.length > maxKB * 1024 && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL('image/webp', quality);
      }
      resolve(result);
    };
    img.onerror = () => resolve(base64); // fallback
    img.src = base64;
  });
}
