import { createElement, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject, type ReactNode } from 'react'
import {
  EditorProvider,
  PortableTextEditable,
  useEditor,
  type EditorEvent,
  type PortableTextBlock,
} from '@portabletext/editor'
import { formatBytes } from '../lib/pt-editor/format-bytes'
import { PORTABLE_TEXT_LIST_CSS } from '../lib/pt-editor/list-styles'
import { portableTextSchema } from '../lib/pt-editor/schema'
import { getProviderLabel, getVideoThumbnail } from '../lib/pt-editor/video'

interface ImageMeta { src: string; alt: string }
interface VideoMeta { url: string }
interface EmbedMeta { url: string; html?: string }
interface FileMeta { filename: string; filetype: string; size?: number }
type MetaStore<T> = MutableRefObject<Map<string, T>>
type ImageMetaStore = MetaStore<ImageMeta>
type VideoMetaStore = MetaStore<VideoMeta>
type EmbedMetaStore = MetaStore<EmbedMeta>
type FileMetaStore = MetaStore<FileMeta>

function ValueSync({ onChange, imageMetaStore, videoMetaStore, embedMetaStore, fileMetaStore }: {
  onChange: (value: PortableTextBlock[]) => void
  imageMetaStore: ImageMetaStore
  videoMetaStore: VideoMetaStore
  embedMetaStore: EmbedMetaStore
  fileMetaStore: FileMetaStore
}) {
  const editor = useEditor()
  const callbackRef = useRef(onChange)
  callbackRef.current = onChange

  useEffect(() => {
    const subscription = editor.on('*', (event) => {
      if (event.type === 'mutation') {
        const blocks = event.value ?? []
        const enriched = blocks.map((block) => {
          const b = block as unknown as { _type: string; _key: string }
          if (b._type === 'image') {
            const meta = imageMetaStore.current.get(b._key)
            if (meta) return { ...block, src: meta.src, alt: meta.alt }
          }
          if (b._type === 'videoEmbed') {
            const meta = videoMetaStore.current.get(b._key)
            if (meta) return { ...block, url: meta.url }
          }
          if (b._type === 'embed') {
            const meta = embedMetaStore.current.get(b._key)
            if (meta) return { ...block, url: meta.url, ...(meta.html ? { html: meta.html } : {}) }
          }
          if (b._type === 'file') {
            const meta = fileMetaStore.current.get(b._key)
            if (meta) return { ...block, filename: meta.filename, filetype: meta.filetype, ...(meta.size ? { size: meta.size } : {}) }
          }
          return block
        })
        callbackRef.current(enriched)
      }
    })
    return () => subscription.unsubscribe()
  }, [editor, imageMetaStore, videoMetaStore, embedMetaStore, fileMetaStore])

  return null
}

function Toolbar({ imageMetaStore, videoMetaStore, embedMetaStore, fileMetaStore, onMetaUpdate }: {
  imageMetaStore: ImageMetaStore
  videoMetaStore: VideoMetaStore
  embedMetaStore: EmbedMetaStore
  fileMetaStore: FileMetaStore
  onMetaUpdate: () => void
}) {
  const editor = useEditor()
  const [linkInputOpen, setLinkInputOpen] = useState(false)
  const [linkHref, setLinkHref] = useState('')
  const linkInputRef = useRef<HTMLInputElement | null>(null)

  const [imageFormOpen, setImageFormOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [imageInputMode, setImageInputMode] = useState<'file' | 'url'>('file')
  const imageFileRef = useRef<HTMLInputElement | null>(null)
  const imageSrcRef = useRef<HTMLInputElement | null>(null)

  const [videoFormOpen, setVideoFormOpen] = useState(false)
  const [videoUrl, setVideoUrl] = useState('')
  const videoUrlRef = useRef<HTMLInputElement | null>(null)

  const [embedFormOpen, setEmbedFormOpen] = useState(false)
  const [embedUrl, setEmbedUrl] = useState('')
  const [embedHtml, setEmbedHtml] = useState('')
  const embedUrlRef = useRef<HTMLInputElement | null>(null)

  const [fileFormOpen, setFileFormOpen] = useState(false)
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const buttonStyle: CSSProperties = {
    padding: '4px 10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    lineHeight: '1.4',
  }

  const groupStyle: CSSProperties = {
    display: 'inline-flex',
    gap: '3px',
    marginRight: '16px',
  }

  const toolbarStyle: CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid #e5e5e5',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    background: '#fafafa',
    alignItems: 'center',
  }

  const send = (event: EditorEvent) => {
    editor.send(event)
    editor.send({ type: 'focus' })
  }

  const handleOpenLinkInput = () => {
    setLinkHref('')
    setLinkInputOpen(true)
    setTimeout(() => linkInputRef.current?.focus(), 0)
  }

  const handleApplyLink = () => {
    const trimmed = linkHref.trim()
    if (!trimmed) return
    editor.send({
      type: 'annotation.toggle',
      annotation: { name: 'link', value: { href: trimmed } },
    })
    editor.send({ type: 'focus' })
    setLinkInputOpen(false)
    setLinkHref('')
  }

  const handleLinkKeyDown = (e: { key: string }) => {
    if (e.key === 'Enter') handleApplyLink()
    if (e.key === 'Escape') {
      setLinkInputOpen(false)
      setLinkHref('')
      editor.send({ type: 'focus' })
    }
  }

  const handleImageFileChange = (e: { target: { files: FileList | null } }) => {
    const file = e.target?.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(reader.result as string)
      if (!imageAlt) setImageAlt(file.name.replace(/\.[^.]+$/, ''))
    }
    reader.readAsDataURL(file)
  }

  const handleInsertImage = () => {
    const src = imageSrc.trim()
    const alt = imageAlt.trim()

    const knownKeys = new Set<string>()
    for (const [key] of imageMetaStore.current) knownKeys.add(key)

    const sub = editor.on('*', (event) => {
      if (event.type === 'mutation' && event.value) {
        for (const block of event.value) {
          const b = block as unknown as { _type: string; _key: string }
          if (b._type === 'image' && !knownKeys.has(b._key)) {
            imageMetaStore.current.set(b._key, { src, alt })
            onMetaUpdate()
          }
        }
        sub.unsubscribe()
      }
    })

    editor.send({
      type: 'insert.block object',
      placement: 'auto',
      blockObject: { name: 'image', value: { src, alt } },
    })
    editor.send({ type: 'focus' })
    setImageFormOpen(false)
    setImageSrc('')
    setImageAlt('')
  }

  const handleInsertVideo = () => {
    const url = videoUrl.trim()
    if (!url) return

    const knownKeys = new Set<string>()
    for (const [key] of videoMetaStore.current) knownKeys.add(key)

    const sub = editor.on('*', (event) => {
      if (event.type === 'mutation' && event.value) {
        for (const block of event.value) {
          const b = block as unknown as { _type: string; _key: string }
          if (b._type === 'videoEmbed' && !knownKeys.has(b._key)) {
            videoMetaStore.current.set(b._key, { url })
            onMetaUpdate()
          }
        }
        sub.unsubscribe()
      }
    })

    editor.send({
      type: 'insert.block object',
      placement: 'auto',
      blockObject: { name: 'videoEmbed', value: { url } },
    })
    editor.send({ type: 'focus' })
    setVideoFormOpen(false)
    setVideoUrl('')
  }

  const handleInsertEmbed = () => {
    const url = embedUrl.trim()
    const html = embedHtml.trim()
    if (!url && !html) return

    const knownKeys = new Set<string>()
    for (const [key] of embedMetaStore.current) knownKeys.add(key)

    const sub = editor.on('*', (event) => {
      if (event.type === 'mutation' && event.value) {
        for (const block of event.value) {
          const b = block as unknown as { _type: string; _key: string }
          if (b._type === 'embed' && !knownKeys.has(b._key)) {
            embedMetaStore.current.set(b._key, { url, ...(html ? { html } : {}) })
            onMetaUpdate()
          }
        }
        sub.unsubscribe()
      }
    })

    editor.send({
      type: 'insert.block object',
      placement: 'auto',
      blockObject: { name: 'embed', value: { url, ...(html ? { html } : {}) } },
    })
    editor.send({ type: 'focus' })
    setEmbedFormOpen(false)
    setEmbedUrl('')
    setEmbedHtml('')
  }

  const handleFileChange = (e: { target: { files: FileList | null } }) => {
    const file = e.target?.files?.[0]
    if (!file) return
    setFileName(file.name)
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const typeMap: Record<string, string> = {
      pdf: 'pdf', docx: 'docx', doc: 'docx', xlsx: 'xlsx', xls: 'xlsx',
      pptx: 'pptx', ppt: 'pptx', csv: 'csv', zip: 'zip',
    }
    setFileType(typeMap[ext] || ext || 'other')
    setFileSize(file.size)
  }

  const handleInsertFile = () => {
    const filename = fileName.trim()
    const filetype = fileType.trim()
    if (!filename) return

    const knownKeys = new Set<string>()
    for (const [key] of fileMetaStore.current) knownKeys.add(key)

    const sub = editor.on('*', (event) => {
      if (event.type === 'mutation' && event.value) {
        for (const block of event.value) {
          const b = block as unknown as { _type: string; _key: string }
          if (b._type === 'file' && !knownKeys.has(b._key)) {
            fileMetaStore.current.set(b._key, { filename, filetype, size: fileSize })
            onMetaUpdate()
          }
        }
        sub.unsubscribe()
      }
    })

    editor.send({
      type: 'insert.block object',
      placement: 'auto',
      blockObject: { name: 'file', value: { filename, filetype, size: fileSize } },
    })
    editor.send({ type: 'focus' })
    setFileFormOpen(false)
    setFileName('')
    setFileType('')
    setFileSize(0)
  }

  const linkInputStyle: CSSProperties = {
    padding: '4px 8px',
    border: '1px solid #0066cc',
    borderRadius: '4px',
    fontSize: '13px',
    width: '220px',
    outline: 'none',
  }

  const linkApplyBtnStyle: CSSProperties = {
    ...buttonStyle,
    background: '#0066cc',
    color: '#fff',
    borderColor: '#0066cc',
  }

  return createElement(
    'div',
    { style: toolbarStyle },
    createElement(
      'div',
      { style: groupStyle },
      ...portableTextSchema.styles.map((s) =>
        createElement(
          'button',
          {
            key: s.name,
            type: 'button',
            style: buttonStyle,
            onClick: () => send({ type: 'style.toggle', style: s.name }),
          },
          s.title,
        ),
      ),
    ),
    createElement(
      'div',
      { style: groupStyle },
      ...portableTextSchema.decorators.map((d) =>
        createElement(
          'button',
          {
            key: d.name,
            type: 'button',
            style: {
              ...buttonStyle,
              fontWeight: d.name === 'strong' ? 700 : undefined,
              fontStyle: d.name === 'em' ? 'italic' : undefined,
            },
            onClick: () => send({ type: 'decorator.toggle', decorator: d.name }),
          },
          d.title,
        ),
      ),
    ),
    createElement(
      'div',
      { style: groupStyle },
      ...portableTextSchema.lists.map((l) =>
        createElement(
          'button',
          {
            key: l.name,
            type: 'button',
            style: buttonStyle,
            onClick: () => send({ type: 'list item.toggle', listItem: l.name }),
          },
          l.title,
        ),
      ),
    ),
    createElement(
      'div',
      { style: { ...groupStyle, alignItems: 'center' } },
      linkInputOpen
        ? createElement(
            'div',
            { style: { display: 'inline-flex', gap: '4px', alignItems: 'center' } },
            createElement('input', {
              ref: linkInputRef,
              type: 'url',
              value: linkHref,
              placeholder: 'https://...',
              style: linkInputStyle,
              'aria-label': 'Link URL',
              onChange: (e: { target: { value: string } }) => setLinkHref(e.target.value),
              onKeyDown: handleLinkKeyDown,
            }),
            createElement(
              'button',
              { type: 'button', style: linkApplyBtnStyle, onClick: handleApplyLink },
              'Toepassen',
            ),
            createElement(
              'button',
              {
                type: 'button',
                style: buttonStyle,
                onClick: () => {
                  setLinkInputOpen(false)
                  setLinkHref('')
                  editor.send({ type: 'focus' })
                },
              },
              'Annuleren',
            ),
          )
        : createElement(
            'button',
            { type: 'button', style: buttonStyle, onClick: handleOpenLinkInput },
            'Link',
          ),
    ),
    createElement(
      'div',
      { style: { ...groupStyle, alignItems: 'center' } },
      imageFormOpen
        ? createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '8px 12px',
                background: '#f0f7ff',
                border: '1px solid #4a9eff',
                borderRadius: '6px',
              },
            },
            createElement(
              'div',
              { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              createElement('strong', { style: { fontSize: '13px' } }, 'Afbeelding'),
              createElement(
                'div',
                { style: { display: 'flex', gap: '2px', fontSize: '11px' } },
                createElement('button', {
                  type: 'button',
                  style: { ...buttonStyle, fontSize: '11px', padding: '2px 6px', background: imageInputMode === 'file' ? '#4a9eff' : '#fff', color: imageInputMode === 'file' ? '#fff' : '#333' },
                  onClick: () => setImageInputMode('file'),
                }, 'Bestand'),
                createElement('button', {
                  type: 'button',
                  style: { ...buttonStyle, fontSize: '11px', padding: '2px 6px', background: imageInputMode === 'url' ? '#4a9eff' : '#fff', color: imageInputMode === 'url' ? '#fff' : '#333' },
                  onClick: () => setImageInputMode('url'),
                }, 'URL'),
              ),
            ),
            imageInputMode === 'file'
              ? createElement(
                  'div',
                  { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
                  createElement('input', {
                    ref: imageFileRef,
                    type: 'file',
                    accept: 'image/*',
                    'aria-label': 'Kies afbeelding',
                    style: { fontSize: '12px' },
                    onChange: handleImageFileChange,
                  }),
                  imageSrc && createElement('img', {
                    src: imageSrc,
                    alt: 'Preview',
                    style: { maxWidth: '200px', maxHeight: '80px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #ddd' },
                  }),
                )
              : createElement('input', {
                  ref: imageSrcRef,
                  type: 'url',
                  value: imageSrc,
                  placeholder: 'https://...',
                  'aria-label': 'Afbeelding URL',
                  style: linkInputStyle,
                  onChange: (e: { target: { value: string } }) => setImageSrc(e.target.value),
                  onKeyDown: (e: { key: string }) => { if (e.key === 'Escape') { setImageFormOpen(false); editor.send({ type: 'focus' }) } },
                }),
            createElement('input', {
              type: 'text',
              value: imageAlt,
              placeholder: 'Alt text',
              'aria-label': 'Alt text',
              style: linkInputStyle,
              onChange: (e: { target: { value: string } }) => setImageAlt(e.target.value),
              onKeyDown: (e: { key: string }) => {
                if (e.key === 'Enter') handleInsertImage()
                if (e.key === 'Escape') { setImageFormOpen(false); editor.send({ type: 'focus' }) }
              },
            }),
            createElement(
              'div',
              { style: { display: 'flex', gap: '4px' } },
              createElement(
                'button',
                { type: 'button', style: linkApplyBtnStyle, onClick: handleInsertImage, disabled: !imageSrc },
                'Invoegen',
              ),
              createElement(
                'button',
                {
                  type: 'button',
                  style: buttonStyle,
                  onClick: () => { setImageFormOpen(false); setImageSrc(''); setImageAlt(''); editor.send({ type: 'focus' }) },
                },
                'Annuleren',
              ),
            ),
          )
        : createElement(
            'button',
            {
              type: 'button',
              style: { ...buttonStyle, background: '#f0f7ff' },
              onClick: () => { setImageFormOpen(true); setImageInputMode('file') },
            },
            '+ Afbeelding',
          ),
      videoFormOpen
        ? createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '8px 12px',
                background: '#fff5f5',
                border: '1px solid #ff4a4a',
                borderRadius: '6px',
              },
            },
            createElement('strong', { style: { fontSize: '13px' } }, 'Video embed'),
            createElement('input', {
              ref: videoUrlRef,
              type: 'url',
              value: videoUrl,
              placeholder: 'YouTube / Vimeo / embed URL',
              'aria-label': 'Video URL',
              style: { ...linkInputStyle, borderColor: '#ff4a4a' },
              onChange: (e: { target: { value: string } }) => setVideoUrl(e.target.value),
              onKeyDown: (e: { key: string }) => {
                if (e.key === 'Enter') handleInsertVideo()
                if (e.key === 'Escape') { setVideoFormOpen(false); editor.send({ type: 'focus' }) }
              },
            }),
            createElement(
              'div',
              { style: { display: 'flex', gap: '4px' } },
              createElement(
                'button',
                {
                  type: 'button',
                  style: { ...linkApplyBtnStyle, background: '#ff4a4a', borderColor: '#ff4a4a' },
                  onClick: handleInsertVideo,
                },
                'Invoegen',
              ),
              createElement(
                'button',
                {
                  type: 'button',
                  style: buttonStyle,
                  onClick: () => { setVideoFormOpen(false); setVideoUrl(''); editor.send({ type: 'focus' }) },
                },
                'Annuleren',
              ),
            ),
          )
        : createElement(
            'button',
            {
              type: 'button',
              style: { ...buttonStyle, background: '#fff5f5' },
              onClick: () => { setVideoFormOpen(true); setTimeout(() => videoUrlRef.current?.focus(), 0) },
            },
            '+ Video',
          ),
      embedFormOpen
        ? createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '8px 12px',
                background: '#f5f0ff',
                border: '1px solid #8b5cf6',
                borderRadius: '6px',
              },
            },
            createElement('strong', { style: { fontSize: '13px' } }, 'Embed'),
            createElement('input', {
              ref: embedUrlRef,
              type: 'url',
              value: embedUrl,
              placeholder: 'URL (bijv. tweet, CodePen, ...)',
              'aria-label': 'Embed URL',
              style: { ...linkInputStyle, borderColor: '#8b5cf6' },
              onChange: (e: { target: { value: string } }) => setEmbedUrl(e.target.value),
              onKeyDown: (e: { key: string }) => {
                if (e.key === 'Enter' && !embedHtml) handleInsertEmbed()
                if (e.key === 'Escape') { setEmbedFormOpen(false); editor.send({ type: 'focus' }) }
              },
            }),
            createElement('textarea', {
              value: embedHtml,
              placeholder: 'HTML embed code (optioneel)',
              'aria-label': 'Embed HTML',
              rows: 3,
              style: {
                ...linkInputStyle,
                borderColor: '#8b5cf6',
                width: '280px',
                resize: 'vertical' as const,
                fontFamily: 'monospace',
                fontSize: '12px',
              },
              onChange: (e: { target: { value: string } }) => setEmbedHtml(e.target.value),
              onKeyDown: (e: { key: string }) => {
                if (e.key === 'Escape') { setEmbedFormOpen(false); editor.send({ type: 'focus' }) }
              },
            }),
            createElement(
              'div',
              { style: { display: 'flex', gap: '4px' } },
              createElement(
                'button',
                {
                  type: 'button',
                  style: { ...linkApplyBtnStyle, background: '#8b5cf6', borderColor: '#8b5cf6' },
                  onClick: handleInsertEmbed,
                },
                'Invoegen',
              ),
              createElement(
                'button',
                {
                  type: 'button',
                  style: buttonStyle,
                  onClick: () => { setEmbedFormOpen(false); setEmbedUrl(''); setEmbedHtml(''); editor.send({ type: 'focus' }) },
                },
                'Annuleren',
              ),
            ),
          )
        : createElement(
            'button',
            {
              type: 'button',
              style: { ...buttonStyle, background: '#f5f0ff' },
              onClick: () => { setEmbedFormOpen(true); setTimeout(() => embedUrlRef.current?.focus(), 0) },
            },
            '+ Embed',
          ),
      fileFormOpen
        ? createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '8px 12px',
                background: '#f0fdf4',
                border: '1px solid #22c55e',
                borderRadius: '6px',
              },
            },
            createElement('strong', { style: { fontSize: '13px' } }, 'Bestand'),
            createElement('input', {
              ref: fileInputRef,
              type: 'file',
              accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.zip,.txt,.rtf',
              'aria-label': 'Kies bestand',
              style: { fontSize: '12px' },
              onChange: handleFileChange,
            }),
            fileName && createElement(
              'div',
              { style: { fontSize: '12px', color: '#333', display: 'flex', gap: '8px', alignItems: 'center' } },
              createElement('span', null, fileName),
              fileType && createElement('span', {
                style: { background: '#22c55e', color: '#fff', padding: '1px 6px', borderRadius: '3px', fontSize: '10px', fontWeight: 600 },
              }, fileType.toUpperCase()),
              fileSize > 0 && createElement('span', { style: { color: '#888' } }, formatBytes(fileSize)),
            ),
            createElement(
              'div',
              { style: { display: 'flex', gap: '4px' } },
              createElement(
                'button',
                {
                  type: 'button',
                  style: { ...linkApplyBtnStyle, background: '#22c55e', borderColor: '#22c55e' },
                  onClick: handleInsertFile,
                  disabled: !fileName,
                },
                'Invoegen',
              ),
              createElement(
                'button',
                {
                  type: 'button',
                  style: buttonStyle,
                  onClick: () => { setFileFormOpen(false); setFileName(''); setFileType(''); setFileSize(0); editor.send({ type: 'focus' }) },
                },
                'Annuleren',
              ),
            ),
          )
        : createElement(
            'button',
            {
              type: 'button',
              style: { ...buttonStyle, background: '#f0fdf4' },
              onClick: () => { setFileFormOpen(true) },
            },
            '+ Bestand',
          ),
    ),
  )
}

const renderStyle = (props: { schemaType: { name: string }; children: ReactNode }) => {
  const tag =
    props.schemaType.name === 'h1' ? 'h1'
      : props.schemaType.name === 'h2' ? 'h2'
        : props.schemaType.name === 'h3' ? 'h3'
          : props.schemaType.name === 'h4' ? 'h4'
            : props.schemaType.name === 'blockquote' ? 'blockquote'
              : 'p'

  const style: CSSProperties | undefined =
    tag === 'blockquote'
      ? { borderLeft: '3px solid #ccc', paddingLeft: '1rem', color: '#666' }
      : undefined

  return createElement(tag, { style }, props.children)
}

const renderDecorator = (props: { schemaType: { name: string }; children: ReactNode }) => {
  if (props.schemaType.name === 'strong') return createElement('strong', null, props.children)
  if (props.schemaType.name === 'em') return createElement('em', null, props.children)
  if (props.schemaType.name === 'underline') {
    return createElement('span', { style: { textDecoration: 'underline' } }, props.children)
  }
  return createElement('span', null, props.children)
}

const renderListItem = (props: { children: ReactNode }) =>
  createElement('div', null, props.children)

const renderAnnotation = (props: { schemaType: { name: string }; children: ReactNode }) => {
  if (props.schemaType.name === 'link') {
    return createElement(
      'span',
      { style: { color: '#0066cc', textDecoration: 'underline', cursor: 'pointer' } },
      props.children,
    )
  }
  return createElement('span', null, props.children)
}

const imageCardStyle: CSSProperties = {
  border: '1px solid #e0e0e0',
  borderRadius: '6px',
  padding: '12px 16px',
  margin: '8px 0',
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
}

const imageThumbStyle: CSSProperties = {
  width: '80px',
  height: '60px',
  objectFit: 'cover',
  borderRadius: '4px',
  border: '1px solid #ddd',
  flexShrink: 0,
  background: '#f0f0f0',
}

const imageMetaContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2px',
  overflow: 'hidden',
  flex: 1,
  minWidth: 0,
}

const imageUrlStyle: CSSProperties = {
  fontSize: '12px',
  color: '#555',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
}

const imageAltStyle: CSSProperties = {
  fontSize: '12px',
  color: '#888',
  fontStyle: 'italic',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
}

const fileTypeBadge = (filetype: string): string => {
  const t = (filetype || 'file').toUpperCase()
  return t.length > 5 ? t.slice(0, 5) : t
}

function createRenderBlock(imageMetaStore: ImageMetaStore, videoMetaStore: VideoMetaStore, embedMetaStore: EmbedMetaStore, fileMetaStore: FileMetaStore) {
  return (props: { schemaType: { name: string }; value: PortableTextBlock; children: ReactNode }) => {
    if (props.schemaType.name === 'image') {
      const val = props.value as unknown as { _key: string; src?: string; alt?: string }
      let src = val?.src || ''
      let alt = val?.alt || ''

      if (!src && val?._key) {
        const stored = imageMetaStore.current.get(val._key)
        if (stored) {
          src = stored.src
          alt = stored.alt
        }
      }

      return createElement(
        'div',
        { style: imageCardStyle },
        src
          ? createElement('img', { src, alt: alt || '', style: imageThumbStyle })
          : createElement(
              'div',
              {
                style: { ...imageThumbStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '11px', textAlign: 'center' as const },
              },
              'Geen afbeelding',
            ),
        createElement(
          'div',
          { style: imageMetaContainerStyle },
          src && createElement('span', { style: imageUrlStyle }, createElement('span', { style: { color: '#888', marginRight: '4px' } }, 'URL: '), src),
          alt && createElement('span', { style: imageAltStyle }, createElement('span', { style: { color: '#888', marginRight: '4px', fontStyle: 'normal' } }, 'Alt: '), alt),
        ),
        props.children,
      )
    }

    if (props.schemaType.name === 'videoEmbed') {
      const val = props.value as unknown as { _key: string; url?: string }
      let url = val?.url || ''

      if (!url && val?._key) {
        const stored = videoMetaStore.current.get(val._key)
        if (stored) url = stored.url
      }

      const thumbnail = url ? getVideoThumbnail(url) : null
      const providerLabel = url ? getProviderLabel(url) : 'Video embed'

      const videoCardStyle: CSSProperties = {
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        padding: '12px 16px',
        margin: '8px 0',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }

      const videoThumbWrapperStyle: CSSProperties = {
        position: 'relative',
        width: '120px',
        height: '68px',
        flexShrink: 0,
        borderRadius: '4px',
        overflow: 'hidden',
        background: '#111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }

      const playOverlayStyle: CSSProperties = {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.35)',
        color: '#fff',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        pointerEvents: 'none',
      }

      return createElement(
        'div',
        { style: videoCardStyle },
        createElement(
          'div',
          { style: videoThumbWrapperStyle },
          thumbnail
            ? createElement('img', {
                src: thumbnail,
                alt: 'Video thumbnail',
                style: { width: '100%', height: '100%', objectFit: 'cover' },
              })
            : null,
          createElement('div', { style: playOverlayStyle }, 'Play'),
        ),
        createElement(
          'div',
          { style: imageMetaContainerStyle },
          createElement('strong', { style: { fontSize: '13px', color: '#333' } }, providerLabel),
          url
            ? createElement('span', { style: imageUrlStyle }, createElement('span', { style: { color: '#888', marginRight: '4px' } }, 'URL: '), url)
            : createElement('span', { style: { fontSize: '12px', color: '#aaa' } }, 'Geen URL'),
        ),
        props.children,
      )
    }

    if (props.schemaType.name === 'embed') {
      const val = props.value as unknown as { _key: string; url?: string; html?: string }
      let url = val?.url || ''
      let html = val?.html || ''

      if (!url && !html && val?._key) {
        const stored = embedMetaStore.current.get(val._key)
        if (stored) {
          url = stored.url
          html = stored.html || ''
        }
      }

      const embedCardStyle: CSSProperties = {
        border: '1px solid #d8b4fe',
        borderRadius: '6px',
        padding: '12px 16px',
        margin: '8px 0',
        background: '#faf5ff',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }

      const iconStyle: CSSProperties = {
        width: '40px',
        height: '40px',
        borderRadius: '6px',
        background: '#8b5cf6',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        flexShrink: 0,
      }

      return createElement(
        'div',
        { style: embedCardStyle },
        createElement('div', { style: { ...iconStyle, fontSize: '11px', fontWeight: 700 } }, 'EMB'),
        createElement(
          'div',
          { style: imageMetaContainerStyle },
          createElement('strong', { style: { fontSize: '13px', color: '#333' } }, 'Embed'),
          url && createElement('span', { style: imageUrlStyle }, createElement('span', { style: { color: '#888', marginRight: '4px' } }, 'URL: '), url),
          html && createElement('span', { style: { fontSize: '11px', color: '#888', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, html.slice(0, 80) + (html.length > 80 ? '...' : '')),
        ),
        props.children,
      )
    }

    if (props.schemaType.name === 'file') {
      const val = props.value as unknown as { _key: string; filename?: string; filetype?: string; size?: number }
      let filename = val?.filename || ''
      let filetype = val?.filetype || ''
      let size = val?.size || 0

      if (!filename && val?._key) {
        const stored = fileMetaStore.current.get(val._key)
        if (stored) {
          filename = stored.filename
          filetype = stored.filetype
          size = stored.size || 0
        }
      }

      const badge = fileTypeBadge(filetype)
      const typeLabel = filetype ? filetype.toUpperCase() : ''
      const sizeLabel = size > 0 ? formatBytes(size) : ''

      const fileCardStyle: CSSProperties = {
        border: '1px solid #bbf7d0',
        borderRadius: '6px',
        padding: '12px 16px',
        margin: '8px 0',
        background: '#f0fdf4',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }

      const fileIconStyle: CSSProperties = {
        width: '40px',
        height: '40px',
        borderRadius: '6px',
        background: '#22c55e',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        fontWeight: 700,
        flexShrink: 0,
      }

      return createElement(
        'div',
        { style: fileCardStyle },
        createElement('div', { style: fileIconStyle }, badge),
        createElement(
          'div',
          { style: imageMetaContainerStyle },
          createElement('strong', { style: { fontSize: '13px', color: '#333' } }, filename || 'Bestand'),
          createElement(
            'div',
            { style: { display: 'flex', gap: '8px', alignItems: 'center' } },
            typeLabel && createElement('span', { style: { fontSize: '11px', color: '#16a34a', fontWeight: 600 } }, typeLabel),
            sizeLabel && createElement('span', { style: { fontSize: '11px', color: '#888' } }, sizeLabel),
          ),
        ),
        props.children,
      )
    }
    return createElement('div', null, props.children)
  }
}

function ListStyles() {
  return createElement('style', { dangerouslySetInnerHTML: { __html: PORTABLE_TEXT_LIST_CSS } })
}

export interface PortableTextReactEditorProps {
  initialValue?: PortableTextBlock[]
  onChange?: (value: PortableTextBlock[]) => void
}

export function PortableTextReactEditor({ initialValue, onChange }: PortableTextReactEditorProps) {
  const imageMetaStore = useRef(new Map<string, ImageMeta>())
  const videoMetaStore = useRef(new Map<string, VideoMeta>())
  const embedMetaStore = useRef(new Map<string, EmbedMeta>())
  const fileMetaStore = useRef(new Map<string, FileMeta>())
  const [metaVersion, setMetaVersion] = useState(0)

  const handleMetaUpdate = useCallback(() => {
    setMetaVersion((v) => v + 1)
  }, [])

  useEffect(() => {
    if (!initialValue) return
    for (const block of initialValue) {
      const b = block as unknown as { _type: string; _key: string; src?: string; alt?: string; url?: string; html?: string; filename?: string; filetype?: string; size?: number }
      if (b._type === 'image' && (b.src || b.alt)) {
        imageMetaStore.current.set(b._key, { src: b.src || '', alt: b.alt || '' })
      }
      if (b._type === 'videoEmbed' && b.url) {
        videoMetaStore.current.set(b._key, { url: b.url })
      }
      if (b._type === 'embed' && (b.url || b.html)) {
        embedMetaStore.current.set(b._key, { url: b.url || '', html: b.html })
      }
      if (b._type === 'file' && (b.filename || b.filetype)) {
        const sz = typeof b.size === 'number' ? b.size : undefined
        fileMetaStore.current.set(b._key, { filename: b.filename || '', filetype: b.filetype || '', ...(sz !== undefined ? { size: sz } : {}) })
      }
    }
  }, [initialValue])

  const handleChange = useCallback(
    (value: PortableTextBlock[]) => {
      if (onChange) onChange(value)
    },
    [onChange],
  )

  const renderBlock = useMemo(
    () => createRenderBlock(imageMetaStore, videoMetaStore, embedMetaStore, fileMetaStore),
    [metaVersion, imageMetaStore, videoMetaStore, embedMetaStore, fileMetaStore],
  )

  const wrapperStyle: CSSProperties = {
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    fontFamily: 'system-ui, sans-serif',
  }

  const editableStyle: CSSProperties = {
    minHeight: '240px',
    padding: '16px 20px',
    outline: 'none',
    lineHeight: '1.7',
    fontSize: '15px',
  }

  return createElement(
    'div',
    { style: wrapperStyle },
    createElement(
      EditorProvider,
      { initialConfig: { schemaDefinition: portableTextSchema, initialValue } },
      createElement(ListStyles),
      createElement(ValueSync, { onChange: handleChange, imageMetaStore, videoMetaStore, embedMetaStore, fileMetaStore }),
      createElement(Toolbar, { imageMetaStore, videoMetaStore, embedMetaStore, fileMetaStore, onMetaUpdate: handleMetaUpdate }),
      createElement(PortableTextEditable, {
        style: editableStyle,
        renderStyle,
        renderDecorator,
        renderBlock,
        renderListItem,
        renderAnnotation,
      }),
    ),
  )
}

export default PortableTextReactEditor
