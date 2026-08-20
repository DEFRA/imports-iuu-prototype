/**
 * @typedef {'catch-certificate'|'processing-statement'|'nmd'|'additional'} DocumentType
 * @typedef {{ label: string, value: string }} DocumentDetail
 * @typedef {{ id: string, type: DocumentType, typeLabel: string, reference: string, issuer: string, details: DocumentDetail[] }} InspectionDocument
 */

/** @type {InspectionDocument[]} */
const inspectionDocumentDetails = require('./inspection-document-details')

const inspectionDocuments = [
  {
    id: 'CC-SEN-2026-7784',
    type: 'catch-certificate',
    typeLabel: 'Catch certificate',
    reference: 'CC-SEN-2026-7784',
    issuer: 'Direction des Pêches Maritimes, Senegal',
    details: [
      { label: 'Vessel', value: 'MV Ocean Star (IMO 9214567)' },
      { label: 'Species', value: 'Yellowfin tuna (Thunnus albacares)' },
      { label: 'Net weight', value: '24,800 kg' },
      { label: 'Catch area', value: 'FAO 34 - Eastern Atlantic' },
      { label: 'Catch dates', value: '12 June 2026 to 2 July 2026' }
    ]
  },
  {
    id: 'CC-SEN-2026-7785',
    type: 'catch-certificate',
    typeLabel: 'Catch certificate',
    reference: 'CC-SEN-2026-7785',
    issuer: 'Direction des Pêches Maritimes, Senegal',
    details: [
      { label: 'Vessel', value: 'FV Teranga (IMO 9351080)' },
      { label: 'Species', value: 'Yellowfin tuna (Thunnus albacares)' },
      { label: 'Net weight', value: '6,200 kg' },
      { label: 'Catch area', value: 'FAO 34 - Eastern Atlantic' },
      { label: 'Catch dates', value: '18 June 2026 to 3 July 2026' }
    ]
  },
  {
    id: 'PS-SEN-2026-0441',
    type: 'processing-statement',
    typeLabel: 'Processing statement',
    reference: 'PS-SEN-2026-0441',
    issuer: 'Dakar Fish Processing SAS',
    details: [
      { label: 'Country of processing', value: 'Senegal' },
      { label: 'Product description', value: 'Frozen yellowfin tuna loins, IQF' },
      { label: 'Net weight', value: '24,800 kg' },
      { label: 'Date processed', value: '9 July 2026' }
    ]
  },
  {
    id: 'PS-SEN-2026-0442',
    type: 'processing-statement',
    typeLabel: 'Processing statement',
    reference: 'PS-SEN-2026-0442',
    issuer: 'Dakar Fish Processing SAS',
    details: [
      { label: 'Country of processing', value: 'Senegal' },
      { label: 'Product description', value: 'Frozen yellowfin tuna loins, IQF' },
      { label: 'Net weight', value: '6,200 kg' },
      { label: 'Date processed', value: '10 July 2026' }
    ]
  },
  {
    id: 'NMD-MMO-2026-0093',
    type: 'nmd',
    typeLabel: 'Non-manipulation declaration',
    reference: 'NMD-MMO-2026-0093',
    issuer: 'Marine Management Organisation',
    details: [
      { label: 'Exporter', value: 'Atlantic Seafoods Ltd' },
      { label: 'Statement', value: 'Products have not been altered or re-packed since the processing statement was issued' },
      { label: 'Date issued', value: '14 July 2026' }
    ]
  },
  {
    id: 'NMD-MMO-2026-0094',
    type: 'nmd',
    typeLabel: 'Non-manipulation declaration',
    reference: 'NMD-MMO-2026-0094',
    issuer: 'Marine Management Organisation',
    details: [
      { label: 'Exporter', value: 'Atlantic Seafoods Ltd' },
      { label: 'Statement', value: 'Products remained under customs control during storage' },
      { label: 'Date issued', value: '15 July 2026' }
    ]
  },
  {
    id: 'BOL-2026-55190',
    type: 'additional',
    typeLabel: 'Additional document',
    reference: 'BOL-2026-55190',
    issuer: 'Atlantic Maritime Logistics',
    details: [
      { label: 'Document type', value: 'Bill of lading' },
      { label: 'Container number', value: 'MSCU 7391842' },
      { label: 'Date issued', value: '16 July 2026' }
    ]
  }
]

module.exports = inspectionDocuments.map((document) => ({
  ...document,
  ...inspectionDocumentDetails[document.id]
}))