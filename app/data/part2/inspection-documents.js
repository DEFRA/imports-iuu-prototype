/**
 * @typedef {'catch-certificate'|'processing-statement'|'nmd'|'additional'} DocumentType
 * @typedef {{ label: string, value: string }} DocumentDetail
 * @typedef {{ id: string, type: DocumentType, typeLabel: string, reference: string, issuer: string, details: DocumentDetail[] }} InspectionDocument
 */

/** @type {InspectionDocument[]} */
const inspectionDocumentDetails = require('./inspection-document-details')

const inspectionDocuments = [
  {
    id: 'FRA-2026-CSP-000205',
    type: 'catch-certificate',
    typeLabel: 'Catch certificate',
    reference: 'FRA 2026 CSP 000205',
    issuer: 'Centre National de Surveillance des Peches, France',
    details: [
      { label: 'Vessel', value: 'PENDRUC (IMO 9741102)' },
      { label: 'Species', value: 'Skipjack tuna and Yellowfin tuna' },
      { label: 'Net weight', value: '152,000 kg' },
      { label: 'Catch area', value: 'FAO 51 - Indian Ocean Western' },
      { label: 'Catch dates', value: '1 July 2026 to 18 July 2026' }
    ]
  }
]

module.exports = inspectionDocuments.map((document) => ({
  ...document,
  ...inspectionDocumentDetails[document.id]
}))