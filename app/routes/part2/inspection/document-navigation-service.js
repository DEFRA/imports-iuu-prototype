const inspectionDocuments = require('../../../data/part2/inspection-documents')
const additionalDocuments = require('../../../data/part2/additional-documents')

const supportedDocumentTypes = new Set([
  'catch-certificate',
  'processing-statement',
  'nmd',
  'additional'
])

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
    const references = [
      ...inspectionDocuments.map((document) => document.reference),
      ...additionalDocuments.map((document) => document.id)
    ]
    return Object.fromEntries(references.map((reference) => [reference, this.getDocumentLink(reference)]))
  },

  getDocument (type, id) {
    if (!supportedDocumentTypes.has(type)) return undefined
    return inspectionDocuments.find((document) => document.type === type && document.id === id)
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

  getReferenceGroups () {
    const groups = inspectionDocuments
      .filter((document) => document.type !== 'additional')
      .reduce((groups, document) => {
      let group = groups.find((item) => item.type === document.type)
      if (!group) {
        group = { type: document.type, typeLabel: document.typeLabel, links: [] }
        groups.push(group)
      }
      group.links.push(this.getDocumentLink(document.id))
      return groups
    }, [])
    groups.push({
      type: 'additional',
      typeLabel: 'Additional document',
      links: additionalDocuments.map((document) => this.getDocumentLink(document.id))
    })
    return groups
  }
}

module.exports = documentNavigationService