export const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export function validateFile(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG file.'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'File is too large. Maximum size is 10MB.'
  }
  return null
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
