import GIF from 'gif.js'

interface GifEncodeOptions {
  frames: ImageData[]
  width: number
  height: number
  fps?: number
  quality?: number
  crop?: { x: number; y: number; width: number; height: number }
  onProgress?: (progress: number) => void
  onComplete?: (blob: Blob) => void
  onError?: (error: Error) => void
}

export function encodeGif({
  frames,
  width,
  height,
  fps = 10,
  quality = 10,
  crop,
  onProgress,
  onComplete,
  onError,
}: GifEncodeOptions): { stop: () => void } {
  const targetWidth = crop ? crop.width : width
  const targetHeight = crop ? crop.height : height

  const gif = new GIF({
    workers: 4,
    quality,
    width: targetWidth,
    height: targetHeight,
    workerScript: new URL('gif.js/dist/gif.worker.js', import.meta.url).href,
    background: '#00000000',
  })

  const delay = Math.round(1000 / fps)

  for (const frame of frames) {
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')!
    if (crop) {
      ctx.putImageData(frame, -crop.x, -crop.y)
    } else {
      ctx.putImageData(frame, 0, 0)
    }

    gif.addFrame(canvas, { delay, copy: true })
  }

  gif.on('progress', (p: number) => {
    onProgress?.(p)
  })

  gif.on('finished', (blob: Blob) => {
    onComplete?.(blob)
  })

  gif.on('error', (error: Error) => {
    onError?.(error)
  })

  gif.render()

  return {
    stop: () => gif.abort(),
  }
}
