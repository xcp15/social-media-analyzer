export const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

export function validateFile(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please upload a PDF, PNG, or JPG.'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'This file is larger than 10MB. Please choose a smaller file.'
  }
  return null
}

export function fileTypeLabel(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType === 'image/png') return 'PNG'
  if (mimeType === 'image/jpeg') return 'JPG'
  return 'FILE'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
