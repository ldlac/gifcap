export type RecordingState = 'idle' | 'recording' | 'preview' | 'encoding' | 'done'

export interface FrameData {
  imageData: ImageData
  timestamp: number
}

export interface CropRegion {
  x: number
  y: number
  width: number
  height: number
}

export interface TrimRange {
  start: number
  end: number
}
