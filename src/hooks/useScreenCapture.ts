import { useRef, useState, useCallback, useEffect } from 'react'
import { FrameData } from '../types'

export function useScreenCapture(defaultFps = 10) {
  const [isRecording, setIsRecording] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fps, setFps] = useState(defaultFps)
  const [recordingTime, setRecordingTime] = useState(0)

  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const framesRef = useRef<FrameData[]>([])
  const intervalRef = useRef<number | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const fpsRef = useRef(fps)

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      })

      streamRef.current = mediaStream
      setStream(mediaStream)
      setRecordingTime(0)

      const video = document.createElement('video')
      video.srcObject = mediaStream
      video.play()
      videoRef.current = video

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play()
          resolve()
        }
      })

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvasRef.current = canvas
      ctxRef.current = canvas.getContext('2d', { willReadFrequently: true })

      framesRef.current = []

      const interval = 1000 / fpsRef.current
      intervalRef.current = window.setInterval(() => {
        if (ctxRef.current && videoRef.current && canvasRef.current) {
          ctxRef.current.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
          const imageData = ctxRef.current.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
          framesRef.current.push({
            imageData,
            timestamp: Date.now(),
          })
        }
      }, interval)

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      setIsRecording(true)

      mediaStream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start screen capture')
      setIsRecording(false)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
      setStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current = null
    }

    setIsRecording(false)
    return framesRef.current
  }, [])

  const getFrames = useCallback(() => {
    return {
      frames: framesRef.current.map(f => f.imageData),
      width: canvasRef.current?.width || 0,
      height: canvasRef.current?.height || 0,
    }
  }, [])

  useEffect(() => {
    fpsRef.current = fps
  }, [fps])

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  return {
    isRecording,
    stream,
    error,
    fps,
    setFps,
    recordingTime,
    startRecording,
    stopRecording,
    getFrames,
  }
}
