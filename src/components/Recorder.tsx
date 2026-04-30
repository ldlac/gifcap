import { useRef, useEffect } from 'react'
import { RecordingState } from '../types'
import './Recorder.css'

interface RecorderProps {
  isRecording: boolean
  recordingTime: number
  error: string | null
  fps: number
  onFpsChange: (fps: number) => void
  onStart: () => void
  onStop: () => void
  onStateChange: (state: RecordingState) => void
}

function Recorder({ isRecording, recordingTime, error, fps, onFpsChange, onStart, onStop }: RecorderProps) {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="recorder">
      <div className="recorder-card">
        {error && <div className="error">{error}</div>}

        {!isRecording ? (
          <div className="start-section">
            <div className="icon">🎥</div>
            <h2>Record Your Screen</h2>
            <p>Select a window, tab, or entire screen to record as a GIF.</p>

            <div className="setting">
              <label htmlFor="fps">Frame Rate (FPS)</label>
              <div className="fps-selector">
                {[5, 10, 15, 20, 30].map(rate => (
                  <button
                    key={rate}
                    className={fps === rate ? 'active' : ''}
                    onClick={() => onFpsChange(rate)}
                  >
                    {rate}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary" onClick={onStart}>
              Start Recording
            </button>
          </div>
        ) : (
          <div className="recording-section">
            <div className="recording-indicator">
              <span className="dot"></span>
              <span>RECORDING</span>
            </div>
            <div className="timer">{formatTime(recordingTime)}</div>
            <p className="hint">Choose what to share in the browser dialog, then click Stop when done.</p>
            <button className="btn-danger" onClick={onStop}>
              Stop Recording
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Recorder
