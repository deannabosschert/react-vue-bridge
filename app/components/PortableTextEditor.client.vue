<script setup lang="ts">
import type { PortableTextBlock } from '../types/portable-text'

interface Props {
  initialValue?: PortableTextBlock[]
}

const props = withDefaults(defineProps<Props>(), {
  initialValue: () => [],
})

const emit = defineEmits<{
  change: [value: PortableTextBlock[]]
}>()

const containerRef = ref<HTMLElement | null>(null)
const isLoaded = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  if (!containerRef.value) return

  try {
    const [reactDom, react, editorModule] = await Promise.all([
      import('react-dom/client'),
      import('react'),
      import('./PortableTextReactEditor.tsx'),
    ])

    const root = reactDom.createRoot(containerRef.value)

    root.render(
      react.createElement(editorModule.PortableTextReactEditor, {
        initialValue: props.initialValue,
        onChange: (value: PortableTextBlock[]) => emit('change', value),
      }),
    )

    isLoaded.value = true
    onBeforeUnmount(() => root.unmount())
  }
  catch (e) {
    console.error('[PortableTextEditor] Mount failed:', e)
    error.value = e instanceof Error ? e.message : 'Onbekende fout'
  }
})
</script>

<template>
  <div class="pt-editor-wrapper">
    <div v-if="!isLoaded && !error" class="pt-editor-loading">
      Editor laden...
    </div>

    <div v-if="error" class="pt-editor-error">
      <p><strong>Fout bij laden editor:</strong></p>
      <pre lang="nl">{{ error }}</pre>
    </div>

    <div
      ref="containerRef"
      class="pt-editor-container"
      :class="{ 'is-loaded': isLoaded }"
    />
  </div>
</template>

<style scoped lang="scss">
.pt-editor-loading {
  padding: 16px;
  color: #888;
  font-style: italic;
  border: 1px dashed #ddd;
  border-radius: 8px;
  text-align: center;
}

.pt-editor-error {
  padding: 16px;
  background: #fff0f0;
  border: 1px solid #ffcccc;
  border-radius: 8px;
  color: #cc0000;

  pre {
    margin-top: 8px;
    font-size: 12px;
    white-space: pre-wrap;
  }
}

.pt-editor-container {
  min-height: 240px;

  &.is-loaded {
    min-height: auto;
  }
}
</style>
