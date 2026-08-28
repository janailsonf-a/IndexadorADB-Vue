export const FILE_TYPES = {
  img: { label: 'Imagem',       color: '#8b5cf6', gradFrom: '#1e0d4a', gradTo: '#5b21b6' },
  pdf: { label: 'PDF',          color: '#ef4444', gradFrom: '#3b0d0d', gradTo: '#991b1b' },
  xls: { label: 'Planilha',     color: '#22c55e', gradFrom: '#0d3b16', gradTo: '#15803d' },
  ppt: { label: 'Apresentação', color: '#f97316', gradFrom: '#3b1d0d', gradTo: '#9a3412' },
  doc: { label: 'Documento',    color: '#3b82f6', gradFrom: '#0d2140', gradTo: '#2563eb' },
  vid: { label: 'Vídeo',        color: '#ec4899', gradFrom: '#3b0d24', gradTo: '#9d174d' },
  aud: { label: 'Áudio',        color: '#06b6d4', gradFrom: '#0d3038', gradTo: '#0e7490' },
  unk: { label: 'Arquivo',      color: '#6b7280', gradFrom: '#2d2820', gradTo: '#5c5040' },
}

const EXT_MAP = {
  jpg: 'img', jpeg: 'img', png: 'img', gif: 'img', webp: 'img', svg: 'img', bmp: 'img', tiff: 'img',
  pdf: 'pdf',
  xls: 'xls', xlsx: 'xls', ods: 'xls', csv: 'xls',
  ppt: 'ppt', pptx: 'ppt', odp: 'ppt', key: 'ppt',
  doc: 'doc', docx: 'doc', odt: 'doc', rtf: 'doc', txt: 'doc',
  mp4: 'vid', mov: 'vid', avi: 'vid', mkv: 'vid', webm: 'vid', wmv: 'vid',
  mp3: 'aud', wav: 'aud', ogg: 'aud', flac: 'aud', aac: 'aud', m4a: 'aud',
}

const ICONS = {
  img: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  pdf: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  xls: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
  ppt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  doc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  vid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  aud: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  unk: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`,
}

export function getFileType(filename) {
  if (!filename) return 'unk'
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return EXT_MAP[ext] || 'unk'
}

export function useFileType(type) {
  const t = type || 'unk'
  return {
    ...FILE_TYPES[t],
    icon: ICONS[t] || ICONS.unk,
    type: t,
    bg: `linear-gradient(140deg, ${FILE_TYPES[t]?.gradFrom || '#2d2820'} 0%, ${FILE_TYPES[t]?.gradTo || '#5c5040'} 100%)`,
  }
}

export const STATUS_CONFIG = {
  aprovado:  { label: 'Aprovado',    cls: 'pill-ok',   dot: '#10b981' },
  revisao:   { label: 'Em revisão',  cls: 'pill-warn', dot: '#f59e0b' },
  rascunho:  { label: 'Rascunho',    cls: 'pill-draft',dot: '#6b7280' },
  arquivado: { label: 'Arquivado',   cls: 'pill-arch', dot: '#374151' },
}

// Inverso do EXT_MAP: categoria -> extensoes. O filtro de tipo e aplicado no
// backend (a galeria e paginada, filtrar no cliente so alcancaria a pagina
// atual), e o backend nao tem esse mapa — entao mandamos as extensoes prontas.
export function extsForType(type) {
  if (!type || type === 'todos') return ''
  return Object.entries(EXT_MAP)
    .filter(([, cat]) => cat === type)
    .map(([ext]) => ext)
    .join(',')
}
