export type DocumentType =
  | 'catch-certificate'
  | 'processing-statement'
  | 'nmd'
  | 'additional'

export interface DocumentDetail {
  label: string
  value: string
}

export interface DocumentField {
  label: string
  value?: string
  references?: string[]
}

export interface DocumentSection {
  title: string
  fields: DocumentField[]
}

export interface SpeciesEntry {
  species: string
  scientificName: string
  productCode: string
  weight: string
}

export interface InspectionDocument {
  id: string
  type: DocumentType
  typeLabel: string
  reference: string
  consignmentReference: string
  validationStatus: string
  validationStatusClass: string
  issuer: string
  details: DocumentDetail[]
  species: SpeciesEntry[]
  sections: DocumentSection[]
}

declare const inspectionDocuments: InspectionDocument[]

export = inspectionDocuments