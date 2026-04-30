import { useRef, useCallback, useMemo } from 'react'
import './RangeSlider.css'

interface RangeSliderProps {
  min: number
  max: number
  start: number
  end: number
  fps: number
  onStartChange: (value: number) => void
  onEndChange: (value: number) => void
  onSeek?: (frameIndex: number) => void
  formatLabel?: (value: number) => string
}

function RangeSlider({ min, max, start, end, fps, onStartChange, onEndChange, onSeek, formatLabel }: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<'start' | 'end' | null>(null)

  const pct = (v: number) => ((v - min) / (max - min)) * 100

  const startPct = pct(start)
  const endPct = pct(end)

  const handleMouse = useCallback((e: React.MouseEvent, handle: 'start' | 'end') => {
    e.preventDefault()
    dragRef.current = handle
    const move = (ev: MouseEvent) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(ev.clientX - rect.left, rect.width))
      const ratio = x / rect.width
      const val = Math.round(min + ratio * (max - min))
      if (handle === 'start') onStartChange(val)
      else onEndChange(val)
      if (onSeek) onSeek(handle === 'start' ? val : val)
    }
    const up = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }, [min, max, onStartChange, onEndChange, onSeek])

  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const ratio = x / rect.width
    const val = Math.round(min + ratio * (max - min))
    const distToStart = Math.abs(val - start)
    const distToEnd = Math.abs(val - end)
    if (distToStart <= distToEnd) {
      onStartChange(val)
      if (onSeek) onSeek(val)
    } else {
      onEndChange(val)
      if (onSeek) onSeek(val)
    }
  }, [min, max, start, end, onStartChange, onEndChange, onSeek])

  const timeLabel = useMemo(() => {
    const fmt = formatLabel ?? ((v: number) => `${(v / fps).toFixed(1)}s`)
    return (v: number) => fmt(v)
  }, [formatLabel, fps])

  return (
    <div className="range-slider">
      <div className="range-track" ref={trackRef} onMouseDown={handleTrackClick}>
        <div
          className="range-track-fill"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />
        <div
          className="range-handle start-handle"
          style={{ left: `${startPct}%` }}
          onMouseDown={(e) => handleMouse(e, 'start')}
        >
          <span className="handle-tooltip">{timeLabel(start)}</span>
        </div>
        <div
          className="range-handle end-handle"
          style={{ left: `${endPct}%` }}
          onMouseDown={(e) => handleMouse(e, 'end')}
        >
          <span className="handle-tooltip">{timeLabel(end)}</span>
        </div>
      </div>
      <div className="range-labels">
        <span>{timeLabel(start)}</span>
        <span>{timeLabel(end)}</span>
      </div>
    </div>
  )
}

export default RangeSlider
