import React, { useRef, useState, useEffect } from 'react'
import { Image as ImageIcon, Upload, X, ZoomIn, Download, Paperclip, ClipboardPaste } from 'lucide-react'

// Lightweight client-side compression to keep storage fast and lightweight
export function compressImageFile(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(event.target?.result as string)
          return
        }

        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve(event.target?.result as string)
    }
    reader.onerror = () => resolve('')
  })
}

interface ScreenshotAttachmentProps {
  images: string[]
  onChange: (images: string[]) => void
  label?: string
  helperText?: string
  maxImages?: number
  disabled?: boolean
  compact?: boolean
}

export const ScreenshotAttachment: React.FC<ScreenshotAttachmentProps> = ({
  images = [],
  onChange,
  label = 'Attached Screenshots / Images',
  helperText = 'Upload, drag & drop, or paste (Ctrl+V) screenshots directly',
  maxImages = 6,
  disabled = false,
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [activePreview, setActivePreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Handle files
  const handleFiles = async (files: FileList | File[]) => {
    if (disabled || isProcessing) return
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) return

    setIsProcessing(true)
    try {
      const compressedList: string[] = []
      for (const file of fileArray) {
        if (images.length + compressedList.length >= maxImages) break
        const compressed = await compressImageFile(file)
        if (compressed) compressedList.push(compressed)
      }
      onChange([...images, ...compressedList])
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Clipboard Paste Support (Ctrl + V)
  const handlePaste = async (e: React.ClipboardEvent | ClipboardEvent) => {
    if (disabled) return
    const items = e.clipboardData?.items
    if (!items) return

    const imageFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) imageFiles.push(file)
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault()
      await handleFiles(imageFiles)
    }
  }

  // Remove an image
  const removeImage = (indexToRemove: number) => {
    if (disabled) return
    onChange(images.filter((_, idx) => idx !== indexToRemove))
  }

  return (
    <div
      ref={containerRef}
      onPaste={handlePaste}
      tabIndex={0}
      className="space-y-2 focus:outline-none"
    >
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
          {label}
          {images.length > 0 && (
            <span className="text-[11px] font-normal text-slate-400">
              ({images.length}/{maxImages})
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || images.length >= maxImages || isProcessing}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Paperclip className="w-3 h-3" />
          Attach Screenshot
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />

      {/* Drop / Paste Zone (if empty or compact is false) */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragging(false)
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-lg transition-all cursor-pointer text-center ${
            compact ? 'p-2.5' : 'p-3.5'
          } ${
            isDragging
              ? 'border-blue-500 bg-blue-50/60'
              : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70'
          }`}
        >
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {isProcessing
                ? 'Processing screenshot...'
                : 'Click to upload screenshot, drag & drop, or'}
            </span>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200/80 font-mono text-[10px] text-slate-700">
              <ClipboardPaste className="w-3 h-3" /> Ctrl + V
            </span>
          </div>
          {helperText && !compact && (
            <p className="text-[10px] text-slate-400 mt-1">{helperText}</p>
          )}
        </div>
      )}

      {/* Thumbnails Grid */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs"
            >
              <img
                src={img}
                alt={`Screenshot ${idx + 1}`}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setActivePreview(img)}
              />
              <div
                onClick={() => setActivePreview(img)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
              >
                <ZoomIn className="w-4 h-4" />
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage(idx)
                  }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-sm opacity-90 hover:opacity-100 hover:scale-110 transition-all cursor-pointer"
                  title="Remove screenshot"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {activePreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setActivePreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 text-white border-b border-slate-700 text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-400" /> Screenshot Preview
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={activePreview}
                  download="lead_screenshot.jpg"
                  className="px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs flex items-center gap-1 transition-colors"
                  title="Download image"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  type="button"
                  onClick={() => setActivePreview(null)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Image */}
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[80vh] bg-slate-950">
              <img
                src={activePreview}
                alt="Enlarged screenshot"
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
