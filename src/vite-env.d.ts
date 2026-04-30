/// <reference types="vite/client" />

declare module 'gif.js' {
  export interface GIFOptions {
    workers?: number
    quality?: number
    width?: number
    height?: number
    workerScript?: string
    background?: string
  }

  export interface GIF {
    addFrame(canvas: HTMLCanvasElement, options: { delay: number; copy: boolean }): void
    on(event: 'progress', callback: (progress: number) => void): void
    on(event: 'finished', callback: (blob: Blob) => void): void
    on(event: 'error', callback: (error: Error) => void): void
    render(): void
    abort(): void
  }

  const GIF: {
    new (options: GIFOptions): GIF
  }

  export default GIF
}
