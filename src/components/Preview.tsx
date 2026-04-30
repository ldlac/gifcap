import { useState, useEffect, useRef, useCallback } from 'react'
import { RecordingState, CropRegion, TrimRange } from '../types'
import { encodeGif } from '../utils/gifEncoder'
import RangeSlider from './RangeSlider'
import './Preview.css'

interface PreviewProps {
  frames: ImageData[]
  dimensions: { width: number; height: number }
  gifUrl: string | null
  state: RecordingState
  onGifReady: (url: string) => void
  onStateChange: (state: RecordingState) => void
  onReset: () => void
}

function Preview({ frames, dimensions, gifUrl, state, onGifReady, onStateChange, onReset }: PreviewProps) {
  const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: frames.length - 1 })
  const [cropRegion, setCropRegion] = useState<CropRegion | null>(null)
  const [progress, setProgress] = useState(0)
  const [previewFrame, setPreviewFrame] = useState(0)
  const [isCropping, setIsCropping] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const seekingRef = useRef(false)
  const seekTimerRef = useRef(0)
  const previewIntervalRef = useRef<number | null>(null)
  const encoderRef = useRef<{ stop: () => void } | null>(null)

  const [dragState, setDragState] = useState<{
    active: boolean
    startX: number
    startY: number
    currentX: number
    currentY: number
  } | null>(null)

  const totalFrames = frames.length
  const fps = 10

  useEffect(() => {
    if (state !== 'preview' && state !== 'done') return

    previewIntervalRef.current = window.setInterval(() => {
      if (seekingRef.current) return
      setPreviewFrame(prev => {
        const start = trimRange.start
        const end = trimRange.end
        const range = end - start + 1
        const next = prev + 1
        return start + ((next - start) % range)
      })
    }, 1000 / fps)

    return () => {
      if (previewIntervalRef.current) clearInterval(previewIntervalRef.current)
    }
  }, [state, trimRange, fps])

  useEffect(() => {
    if (!canvasRef.current || frames.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const frameIndex = Math.min(previewFrame, frames.length - 1)
    const frame = trimRange.start <= frameIndex && frameIndex <= trimRange.end
      ? frames[frameIndex]
      : frames[trimRange.start]

    if (frame) {
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      ctx.putImageData(frame, 0, 0)
    }
  }, [previewFrame, frames, dimensions, trimRange])

  const getCanvasCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = innerRef.current!.getBoundingClientRect()
    const scaleX = dimensions.width / rect.width
    const scaleY = dimensions.height / rect.height
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    }
  }

  const handleCropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCropping) return
    const { x, y } = getCanvasCoords(e)
    setDragState({ active: true, startX: x, startY: y, currentX: x, currentY: y })
  }

  const handleCropMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragState?.active) return
    const { x, y } = getCanvasCoords(e)
    setDragState(prev => prev ? { ...prev, currentX: x, currentY: y } : null)
  }

  const handleCropMouseUp = () => {
    if (!dragState?.active) return
    const x = Math.min(dragState.startX, dragState.currentX)
    const y = Math.min(dragState.startY, dragState.currentY)
    const w = Math.abs(dragState.currentX - dragState.startX)
    const h = Math.abs(dragState.currentY - dragState.startY)
    if (w > 10 && h > 10) {
      setCropRegion({ x, y, width: w, height: h })
    }
    setDragState(null)
  }

  const cropRect = dragState?.active
    ? {
        x: Math.min(dragState.startX, dragState.currentX),
        y: Math.min(dragState.startY, dragState.currentY),
        width: Math.abs(dragState.currentX - dragState.startX),
        height: Math.abs(dragState.currentY - dragState.startY),
      }
    : cropRegion

  const cropStyle = cropRect && isCropping ? {
    left: `${(cropRect.x / dimensions.width) * 100}%`,
    top: `${(cropRect.y / dimensions.height) * 100}%`,
    width: `${(cropRect.width / dimensions.width) * 100}%`,
    height: `${(cropRect.height / dimensions.height) * 100}%`,
  } : null

  const handleEncode = useCallback(() => {
    onStateChange('encoding')
    setProgress(0)

    const trimmedFrames = frames.slice(trimRange.start, trimRange.end + 1)

    encoderRef.current = encodeGif({
      frames: trimmedFrames,
      width: cropRegion ? cropRegion.width : dimensions.width,
      height: cropRegion ? cropRegion.height : dimensions.height,
      fps,
      quality: 10,
      crop: cropRegion ?? undefined,
      onProgress: (p) => setProgress(p),
      onComplete: (blob) => {
        const url = URL.createObjectURL(blob)
        onGifReady(url)
      },
      onError: (err) => {
        console.error('GIF encoding error:', err)
        onStateChange('preview')
      },
    })
  }, [frames, trimRange, cropRegion, dimensions, fps, onGifReady, onStateChange])

  const handleDownload = () => {
    if (!gifUrl) return
    const a = document.createElement('a')
    a.href = gifUrl
    a.download = `recording-${Date.now()}.gif`
    a.click()
  }

  const handleTrimStartChange = useCallback((value: number) => {
    setTrimRange(prev => ({ start: Math.min(value, prev.end - 1), end: prev.end }))
  }, [])

  const handleTrimEndChange = useCallback((value: number) => {
    setTrimRange(prev => ({ start: prev.start, end: Math.max(value, prev.start + 1) }))
  }, [])

  const handleSeek = useCallback((frameIndex: number) => {
    setPreviewFrame(frameIndex)
    seekingRef.current = true
    clearTimeout(seekTimerRef.current)
    seekTimerRef.current = window.setTimeout(() => {
      seekingRef.current = false
    }, 500)
  }, [])

  const toggleCrop = () => {
    const next = !isCropping
    setIsCropping(next)
    if (!next) {
      setCropRegion(null)
      setDragState(null)
    } else {
      setCropRegion(null)
    }
  }

  const frameCount = trimRange.end - trimRange.start + 1
  const duration = (frameCount / fps).toFixed(1)

  return (
    <div className="preview">
      <div className="preview-card">
        <h2>{state === 'encoding' ? 'Encoding GIF...' : 'Preview & Export'}</h2>

        <div className="canvas-wrapper">
          <div className="canvas-inner" ref={innerRef}>
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '400px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
              }}
            />

            {isCropping && (
              <div
                className="crop-overlay"
                onMouseDown={handleCropMouseDown}
                onMouseMove={handleCropMouseMove}
                onMouseUp={handleCropMouseUp}
                onMouseLeave={handleCropMouseUp}
              >
                {cropStyle && (
                  <div className="crop-rect" style={cropStyle}>
                    <div className="crop-handle top-left" />
                    <div className="crop-handle top-right" />
                    <div className="crop-handle bottom-left" />
                    <div className="crop-handle bottom-right" />
                  </div>
                )}
                {!cropRect && !dragState?.active && (
                  <div className="crop-hint">Drag to select crop region</div>
                )}
              </div>
            )}
          </div>
        </div>

        {state === 'encoding' && (
          <div className="encoding-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p>{Math.round(progress * 100)}% encoded</p>
          </div>
        )}

        {state !== 'encoding' && (
          <>
            <div className="controls-section">
          <div className="trim-controls">
                <h3>Trim</h3>
                <RangeSlider
                  min={0}
                  max={totalFrames - 1}
                  start={trimRange.start}
                  end={trimRange.end}
                  fps={fps}
                  onStartChange={handleTrimStartChange}
                  onEndChange={handleTrimEndChange}
                  onSeek={handleSeek}
                  formatLabel={(v) => `Frame ${v} (${(v / fps).toFixed(1)}s)`}
                />
                <span className="frame-info">{frameCount} frames ({duration}s)</span>
              </div>

              <div className="crop-controls">
                <h3>Crop</h3>
                <button className={`btn-secondary ${isCropping ? 'active' : ''}`} onClick={toggleCrop}>
                  {isCropping ? 'Done Cropping' : 'Select Crop Region'}
                </button>
                {cropRegion && !isCropping && (
                  <div className="crop-info">
                    {cropRegion.width} × {cropRegion.height}
                    <button className="clear-crop" onClick={() => setCropRegion(null)}>✕</button>
                  </div>
                )}
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn-primary" onClick={handleEncode}>
                Generate GIF
              </button>

              {gifUrl && (
                <button className="btn-success" onClick={handleDownload}>
                  Download GIF
                </button>
              )}

              <button className="btn-secondary" onClick={onReset}>
                New Recording
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Preview
