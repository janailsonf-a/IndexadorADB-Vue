import JSZip from 'jszip'
import { useToastStore } from '@/stores/toast'

function uniqueName(name, used) {
  if (!used.has(name)) return name
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  let i = 2
  while (used.has(`${base} (${i})${ext}`)) i++
  return `${base} (${i})${ext}`
}

export function useZipDownload() {
  const toast = useToastStore()

  async function downloadAsZip(files) {
    if (!files.length) return
    toast.info(`Preparando ZIP de ${files.length} arquivo(s)…`)

    const zip = new JSZip()
    const used = new Set()
    let failed = 0

    for (const file of files) {
      try {
        const res = await fetch(file.download_link)
        if (!res.ok) throw new Error(String(res.status))
        const blob = await res.blob()
        const name = uniqueName(file.name || `arquivo-${file.id}`, used)
        used.add(name)
        zip.file(name, blob)
      } catch {
        failed++
      }
    }

    if (!used.size) {
      toast.error('Nenhum arquivo pôde ser baixado para o ZIP.')
      return
    }

    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = `noxis-download-${used.size}-arquivos.zip`
    a.click()
    URL.revokeObjectURL(url)

    if (failed > 0) {
      toast.warn(`ZIP gerado com ${used.size} arquivo(s) — ${failed} falharam ao baixar.`)
    } else {
      toast.success(`ZIP com ${used.size} arquivo(s) baixado.`)
    }
  }

  return { downloadAsZip }
}
