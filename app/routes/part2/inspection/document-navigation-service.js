const inspectionDocuments = require('../../../data/part2/inspection-documents')
const additionalDocuments = require('../../../data/part2/additional-documents')
const { mockConsignmentSummariesApi } = require('./mock-api/consignment-summaries-api')

const supportedDocumentTypes = new Set([
  'catch-certificate',
  'processing-statement',
  'nmd',
  'additional'
])

const formatArrivalDate = (date) => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
}).format(date)

const addConsignmentArrivalDate = (document, today) => {
  if (document.type !== 'catch-certificate') return document

  const consignment = mockConsignmentSummariesApi
    .listConsignmentSummaries(today)
    .find((item) => item.reference === document.consignmentReference)

  if (!consignment) {
    throw new Error(`Missing consignment ${document.consignmentReference} for document ${document.id}`)
  }

  return {
    ...document,
    sections: document.sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) => (
        field.label === 'Landing date' || field.label === 'Date of landing'
          ? { ...field, value: formatArrivalDate(consignment.estimatedArrival) }
          : field
      ))
    }))
  }
}

const documentNavigationService = {
  getDocumentUrl (document) {
    return `/documents/${document.type}/${encodeURIComponent(document.id)}`
  },

  getDocumentLink (id) {
    const document = inspectionDocuments.find((item) => item.id === id)
    if (document) {
      return {
        text: document.reference,
        href: this.getDocumentUrl(document),
        visuallyHiddenText: `View ${document.typeLabel.toLowerCase()}`,
        issuer: document.issuer
      }
    }
    const additionalDocument = additionalDocuments.find((item) => item.id === id)
    if (!additionalDocument) return undefined
    return {
      text: additionalDocument.id,
      href: `/documents/additional/${encodeURIComponent(additionalDocument.id)}`,
      visuallyHiddenText: `View ${additionalDocument.category.toLowerCase()}`,
      issuer: additionalDocument.name
    }
  },

  getDocumentLinksByReference () {
    const inspectionDocumentReferenceLinks = inspectionDocuments.map((document) => (
      [document.reference, this.getDocumentLink(document.id)]
    ))
    const additionalDocumentLinks = additionalDocuments.map((document) => (
      [document.id, this.getDocumentLink(document.id)]
    ))

    return Object.fromEntries([
      ...inspectionDocumentReferenceLinks,
      ...additionalDocumentLinks
    ])
  },

  getDocument (type, id, today = new Date()) {
    if (!supportedDocumentTypes.has(type)) return undefined
    const document = inspectionDocuments.find((document) => document.type === type && document.id === id)
    return document ? addConsignmentArrivalDate(document, today) : undefined
  },

  getDocumentById (id) {
    return inspectionDocuments.find((document) => document.id === id)
  },

  getAdditionalDocuments () {
    return additionalDocuments.map((document) => ({
      ...document,
      href: `/documents/additional/${encodeURIComponent(document.id)}`,
      previewUrl: document.previewType === 'pdf'
        ? `/documents/additional/file/${encodeURIComponent(document.id)}`
        : document.previewUrl,
      downloadUrl: document.previewType === 'pdf'
        ? `/documents/additional/file/${encodeURIComponent(document.id)}?download=1`
        : document.previewUrl
    }))
  },

  getAdditionalDocument (id) {
    return this.getAdditionalDocuments().find((document) => document.id === id)
  },

  getReferenceGroups (consignmentReference) {
    const documentTypes = [
      { type: 'catch-certificate', typeLabel: 'Catch certificate' },
      { type: 'processing-statement', typeLabel: 'Processing statement' },
      { type: 'nmd', typeLabel: 'Non-manipulation declaration' }
    ]
    const groups = documentTypes.map(({ type, typeLabel }) => ({
      type,
      typeLabel,
      links: inspectionDocuments
        .filter((document) => document.type === type && (!consignmentReference || document.consignmentReference === consignmentReference))
        .map((document) => this.getDocumentLink(document.id))
    }))
    return groups.concat({
      type: 'additional',
      typeLabel: 'Additional document',
      links: additionalDocuments
        .filter((document) => !consignmentReference || document.consignmentReference === consignmentReference)
        .map((document) => this.getDocumentLink(document.id))
    })
  }
}

module.exports = documentNavigationService