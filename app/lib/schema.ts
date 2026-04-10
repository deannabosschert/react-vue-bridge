import { defineSchema } from '@portabletext/editor'

export const portableTextSchema = defineSchema({
  styles: [
    { name: 'normal', title: 'Normaal' },
    { name: 'h1', title: 'Heading 1' },
    { name: 'h2', title: 'Heading 2' },
    { name: 'h3', title: 'Heading 3' },
    { name: 'h4', title: 'Heading 4' },
    { name: 'blockquote', title: 'Citaat' },
  ],
  decorators: [
    { name: 'strong', title: 'Bold' },
    { name: 'em', title: 'Italic' },
    { name: 'underline', title: 'Underline' },
  ],
  lists: [
    { name: 'bullet', title: 'Opsomming' },
    { name: 'number', title: 'Genummerd' },
  ],
  annotations: [{ name: 'link', title: 'Link' }],
  blockObjects: [
    { name: 'image', title: 'Afbeelding' },
    { name: 'videoEmbed', title: 'Video (YouTube/Vimeo)' },
    { name: 'embed', title: 'Embed' },
    { name: 'file', title: 'Bestand' },
  ],
  inlineObjects: [],
})
