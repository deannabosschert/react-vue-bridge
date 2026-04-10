<script setup lang="ts">
import PortableTextEditor from '../components/PortableTextEditor.client.vue'
import type { PortableTextBlock } from '../types/portable-text'

const showDebugPanel = ref(true)
const useExampleData = ref(false)
const portableTextValue = ref<PortableTextBlock[]>([])
const copyDone = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

const handleEditorChange = (value: PortableTextBlock[]) => {
  portableTextValue.value = value
}

const copyJson = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(portableTextValue.value, null, 2))
    copyDone.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copyDone.value = false }, 2000)
  }
  catch {
    console.error('Clipboard copy failed')
  }
}

const exampleInitialValue: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'ex-normal',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-normal-s', text: 'Normale tekst', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'ex-h1',
    style: 'h1',
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-h1-s', text: 'Heading 1', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'ex-h2',
    style: 'h2',
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-h2-s', text: 'Heading 2', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'ex-h3',
    style: 'h3',
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-h3-s', text: 'Heading 3', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'ex-h4',
    style: 'h4',
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-h4-s', text: 'Heading 4', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'ex-quote',
    style: 'blockquote',
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-quote-s', text: 'Citaat', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'ex-bold',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-bold-s', text: 'Bold', marks: ['strong'] }],
  },
  {
    _type: 'block',
    _key: 'ex-italic',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-italic-s', text: 'Italic', marks: ['em'] }],
  },
  {
    _type: 'block',
    _key: 'ex-underline',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-underline-s', text: 'Underline', marks: ['underline'] }],
  },
  {
    _type: 'block',
    _key: 'ex-combined',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-combined-s', text: 'Bold Italic Underline', marks: ['strong', 'em', 'underline'] }],
  },
  {
    _type: 'block',
    _key: 'ex-bullet-1',
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-bullet-1-s', text: 'opsomming 1', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'ex-bullet-2',
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-bullet-2-s', text: 'opsomming 2', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'ex-number-1',
    style: 'normal',
    listItem: 'number',
    level: 1,
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-number-1-s', text: 'genummerde opsomming 1', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'ex-number-2',
    style: 'normal',
    listItem: 'number',
    level: 1,
    markDefs: [],
    children: [{ _type: 'span', _key: 'ex-number-2-s', text: 'genummerde opsomming 2', marks: [] }],
  },
  {
    _type: 'block',
    _key: 'ex-link',
    style: 'normal',
    markDefs: [{ _type: 'link', _key: 'lnk-rick', href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }],
    children: [{ _type: 'span', _key: 'ex-link-s', text: 'linkje', marks: ['lnk-rick'] }],
  },
  {
    _type: 'image',
    _key: 'ex-img',
    src: 'https://images.unsplash.com/photo-1633100590683-433ef5afe319?q=80&w=2352&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    alt: 'unsplash image',
  },
  {
    _type: 'videoEmbed',
    _key: 'ex-video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    _type: 'videoEmbed',
    _key: 'ex-video-vimeo',
    url: 'https://vimeo.com/200797216',
  },
  {
    _type: 'embed',
    _key: 'ex-embed',
    url: 'https://codepen.io/deannabosschert/pen/pvEOrEd',
    html: '<iframe title="CodePen" src="https://codepen.io/deannabosschert/pen/pvEOrEd" width="100%" height="300"></iframe>',
  },
  {
    _type: 'file',
    _key: 'ex-file',
    filename: 'een-bestand.pdf',
    filetype: 'pdf',
    size: 239277,
  },
]

const initialValue = computed(() => (useExampleData.value ? exampleInitialValue : []))

watch(useExampleData, (enabled) => {
  portableTextValue.value = enabled ? structuredClone(exampleInitialValue) : []
})

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer)
})
</script>

<template>
  <div class="poc-page">
    <header class="poc-header">
      <h1>Portable Text editor</h1>
      <p><code>@portabletext/editor</code> in Nuxt 4, gemount met React DOM.</p>
    </header>

    <div class="poc-controls">
      <label>
        <input v-model="useExampleData" type="checkbox" aria-label="Laad voorbeeld data">
        Laad voorbeelddata
      </label>
      <label>
        <input v-model="showDebugPanel" type="checkbox" aria-label="Toon JSON output">
        Toon JSON output
      </label>
    </div>

    <section class="poc-section">
      <h2>Editor</h2>
      <PortableTextEditor
        :key="String(useExampleData)"
        :initial-value="initialValue"
        @change="handleEditorChange"
      />
    </section>

    <section v-if="showDebugPanel" class="poc-section">
      <header class="poc-debug-header">
        <h2>Portable Text JSON Output</h2>
        <button type="button" class="poc-copy-btn" @click="copyJson">
          {{ copyDone ? 'Gekopieerd' : 'Kopieer JSON' }}
        </button>
      </header>
      <pre class="poc-json">{{ JSON.stringify(portableTextValue, null, 2) }}</pre>
    </section>
  </div>
</template>

<style scoped lang="scss">
.poc-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 24px;
  font-family: system-ui, -apple-system, sans-serif;
}

.poc-header {
  margin-bottom: 28px;

  h1 {
    font-size: 1.6rem;
    font-weight: 700;
    margin: 0 0 6px;
  }

  p {
    color: #666;
    margin: 0;
  }

  code {
    background: #f0f0f0;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.85em;
  }
}

.poc-controls {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #f7f7f7;
  border-radius: 8px;

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 14px;
  }
}

.poc-section {
  margin-bottom: 32px;

  h2 {
    font-size: 1.1rem;
    font-weight: 600;
    margin: 0 0 10px;
  }
}

.poc-debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  button {
    padding: 6px 14px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
    font-size: 13px;
    min-width: 7.5rem;

    &:hover {
      background: #f5f5f5;
    }
  }
}

.poc-json {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px 20px;
  border-radius: 8px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
  max-height: 400px;
}
</style>
