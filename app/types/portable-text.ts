export interface PortableTextSpan {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

export interface PortableTextMarkDef {
  _type: string
  _key: string
  [key: string]: unknown
}

export interface PortableTextTextBlock {
  _type: 'block'
  _key: string
  style: string
  markDefs: PortableTextMarkDef[]
  children: PortableTextSpan[]
  listItem?: string
  level?: number
  [key: string]: unknown
}

export interface PortableTextBlockObject {
  _type: string
  _key: string
  [key: string]: unknown
}

/** Example custom object; extend with `assetId` / `url` after upload. */
export interface PortableTextFileObject extends PortableTextBlockObject {
  _type: 'file'
  filename: string
  filetype: string
  size?: number
}

export type PortableTextBlock = PortableTextTextBlock | PortableTextBlockObject
