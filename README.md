# Portable Text-editor (Nuxt 4 + React-bridge)


PoC: [`@portabletext/editor`](https://www.npmjs.com/package/@portabletext/editor) in een **Nuxt 4**-app, terwijl de rest van de UI **Vue** blijft. De inhoud is **Portable Text** (JSON met blokken, marks en custom object types), editor is een React-component.

Laat op de client een dedicated DOM-node renderen door Vue, daar een **React root** op zetten met `react-dom/client` (`createRoot`). 

Sanity's editor is React-first; in een Nuxt/Sanity-stack wil je daarom soms toch die editor zonder de hele app naar React te trekken.

## Setup

```bash
yarn install
yarn dev
```

Open `/editor` (root redirect daar ook naartoe).

## Projectstructuur

| Pad | Rol |
|-----|-----|
| `app/components/PortableTextReactEditor.tsx` | De React-editor |
| `app/components/PortableTextEditor.client.vue` | Vue-wrapper: alleen op de client, laadt React dynamisch en roept `createRoot` aan |
| `app/pages/editor.vue` | Editorpage |
| `app/lib/` | Schema, assets, css import uit PT  |
| `app/types/portable-text.ts` | TypeScript-types |
| `nuxt.config.ts` | o.a. `vite.esbuild.jsxImportSource: 'react'` voor `.tsx` |

