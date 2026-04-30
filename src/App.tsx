import { useState, useCallback } from 'react'
import Recorder from './components/Recorder'
import Preview from './components/Preview'
import { RecordingState } from './types'
import { useScreenCapture } from './hooks/useScreenCapture'
import './App.css'

function App() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [frames, setFrames] = useState<ImageData[]>([])
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const {
    isRecording,
    error,
    startRecording,
    stopRecording,
    getFrames,
    fps,
    setFps,
    recordingTime,
  } = useScreenCapture(10)

  const handleStopRecording = useCallback(() => {
    stopRecording()
    const { frames: capturedFrames, width, height } = getFrames()
    if (capturedFrames.length > 0) {
      setFrames(capturedFrames)
      setDimensions({ width, height })
      setRecordingState('preview')
    } else {
      setRecordingState('idle')
    }
  }, [stopRecording, getFrames])

  const handleStartRecording = useCallback(() => {
    setRecordingState('recording')
    startRecording()
  }, [startRecording])

  const handleGifReady = useCallback((url: string) => {
    setGifUrl(url)
    setRecordingState('done')
  }, [])

  const handleReset = useCallback(() => {
    setFrames([])
    setGifUrl(null)
    setDimensions({ width: 0, height: 0 })
    setRecordingState('idle')
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎬 GifCap</h1>
        <p className="subtitle">Create animated GIFs from your screen — 100% client-side</p>
      </header>

      <main className="app-main">
        {(recordingState === 'idle' || recordingState === 'recording') && (
          <Recorder
            isRecording={isRecording}
            recordingTime={recordingTime}
            error={error}
            fps={fps}
            onFpsChange={setFps}
            onStart={handleStartRecording}
            onStop={handleStopRecording}
            onStateChange={setRecordingState}
          />
        )}

        {(recordingState === 'preview' || recordingState === 'encoding' || recordingState === 'done') && (
          <Preview
            frames={frames}
            dimensions={dimensions}
            gifUrl={gifUrl}
            state={recordingState}
            onGifReady={handleGifReady}
            onStateChange={setRecordingState}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="app-footer">
        <span>All processing happens in your browser. Nothing is uploaded.</span>
      </footer>
    </div>
  )
}

export default App
