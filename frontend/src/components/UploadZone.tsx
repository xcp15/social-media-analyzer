import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { ACCEPTED_EXTENSIONS, ACCEPTED_MIME_TYPES } from '../lib/file'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
}

type DragState = 'none' | 'valid' | 'invalid'

function dragHasAcceptedType(e: DragEvent<HTMLDivElement>): boolean {
  const items = e.dataTransfer.items
  if (!items || items.length === 0) return true
  return Array.from(items).some((item) => item.kind === 'file' && ACCEPTED_MIME_TYPES.includes(item.type))
}

export default function UploadZone({ onFileSelect }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragState, setDragState] = useState<DragState>('none')

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragState(dragHasAcceptedType(e) ? 'valid' : 'invalid')
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragState('none')
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragState('none')
    const file = e.dataTransfer.files?.[0]
    if (file) onFileSelect(file)
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
    e.target.value = ''
  }

  const borderClass =
    dragState === 'valid'
      ? 'border-emerald-400 bg-emerald-50/50'
      : dragState === 'invalid'
        ? 'border-red-300 bg-red-50/40'
        : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload a social media post file"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${borderClass}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          dragState === 'invalid' ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-500'
        }`}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 8.25 12 3.75m0 0L7.5 8.25M12 3.75v13.5"
          />
        </svg>
      </div>

      {dragState === 'invalid' ? (
        <p className="font-medium text-red-600">Unsupported file type</p>
      ) : dragState === 'valid' ? (
        <p className="font-medium text-emerald-700">Drop to upload</p>
      ) : (
        <p className="font-medium text-slate-700">
          Drop your post here, or <span className="text-emerald-600">browse from your device</span>
        </p>
      )}

      <p className="text-sm text-slate-400">PNG • JPG • PDF · Up to 10MB</p>
    </div>
  )
}
