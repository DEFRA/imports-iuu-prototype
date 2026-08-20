export type PreviewType = 'pdf' | 'image'

export interface AdditionalDocument {
  id: string
  category: string
  name: string
  uploadDate: string
  fileType: string
  fileSize: string
  previewType: PreviewType
  sourceFile?: string
  previewUrl?: string
}

declare const additionalDocuments: AdditionalDocument[]

export = additionalDocuments