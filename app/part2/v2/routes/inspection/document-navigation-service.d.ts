import type { DocumentType, InspectionDocument } from '../../data/inspection-documents'
import type { AdditionalDocument } from '../../data/additional-documents'

export interface DocumentLink {
  text: string
  href: string
  visuallyHiddenText: string
  issuer: string
}

export interface DocumentReferenceList {
  type: DocumentType
  typeLabel: string
  links: DocumentLink[]
}

export interface DocumentNavigationService {
  getDocumentUrl(document: InspectionDocument): string
  getDocumentLink(id: string): DocumentLink | undefined
  getDocumentLinksByReference(): Record<string, DocumentLink | undefined>
  getDocument(type: string, id: string): InspectionDocument | undefined
  getDocumentById(id: string): InspectionDocument | undefined
  getAdditionalDocuments(): Array<AdditionalDocument & { href: string, previewUrl: string, downloadUrl: string }>
  getAdditionalDocument(id: string): (AdditionalDocument & { href: string, previewUrl: string, downloadUrl: string }) | undefined
  getReferenceGroups(consignmentReference?: string): DocumentReferenceList[]
}

declare const documentNavigationService: DocumentNavigationService

export = documentNavigationService