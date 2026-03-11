'use client'

import { useEffect } from 'react'

export function PdfTemplateBackground({ url }: { url: string }) {
  useEffect(() => {
    let cancelled = false

    async function renderTemplate() {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

      const loadingTask = pdfjsLib.getDocument(url)
      const pdf = await loadingTask.promise
      if (cancelled) return

      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 2 })

      const canvas = document.createElement('canvas')
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')!

      await page.render({ canvasContext: ctx, viewport, canvas }).promise
      if (cancelled) return

      const dataUrl = canvas.toDataURL('image/png')

      const styleId = 'pdf-template-bg-style'
      let style = document.getElementById(styleId) as HTMLStyleElement | null
      if (!style) {
        style = document.createElement('style')
        style.id = styleId
        document.head.appendChild(style)
      }
      style.textContent = `
        @media screen {
          .pdf-content {
            background-image: url("${dataUrl}");
            background-size: 100% auto;
            background-repeat: no-repeat;
            background-position: top left;
          }
        }
        @media print {
          .pdf-content {
            background-image: url("${dataUrl}") !important;
            background-size: 100% auto !important;
            background-repeat: no-repeat !important;
            background-position: top left !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `

      document.dispatchEvent(new Event('pdf-template-ready'))
    }

    renderTemplate().catch(console.error)

    return () => { cancelled = true }
  }, [url])

  return null
}
