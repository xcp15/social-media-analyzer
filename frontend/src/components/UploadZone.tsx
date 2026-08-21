import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { ACCEPTED_EXTENSIONS } from '../lib/file'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
}

export default function UploadZone({ onFileSelect }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragActive(true)
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragActive(false)
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFileSelect(file)
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
    e.target.value = ''
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
      className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
        isDragActive
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-slate-300 bg-white hover:border-slate-400'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="hidden"
        onChange={handleInputChange}
      />
      <svg
        className="h-10 w-10 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 8.25 12 3.75m0 0L7.5 8.25M12 3.75v13.5"
        />
      </svg>
      <p className="text-slate-700 font-medium">
        Drag & drop a file here, or click to browse
      </p>
      <p className="text-sm text-slate-400">Accepted: PDF, JPG, JPEG, PNG · Max 10MB</p>
    </div>
  )
}
