/**
 * @typedef {'catch-certificate'|'processing-statement'|'nmd'|'additional'} DocumentType
 * @typedef {{ label: string, value: string }} DocumentDetail
 * @typedef {{ id: string, type: DocumentType, typeLabel: string, reference: string, issuer: string, details: DocumentDetail[], sourceFile?: string }} InspectionDocument
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
    sourceFile: 'FRA-2026-CSP-000205.pdf',
    details: [
      { label: 'Vessel', value: 'PENDRUC (IMO 9741102)' },
      { label: 'Species', value: 'Skipjack tuna and Yellowfin tuna' },
      { label: 'Net weight', value: '152,000 kg' },
      { label: 'Catch area', value: 'FAO 51 - Indian Ocean Western' },
      { label: 'Catch dates', value: '1 July 2026 to 18 July 2026' }
    ]
  },
  {
    id: 'FRA-2026-CSP-100124',
    consignmentReference: 'GB-IUU-2026-11001',
    type: 'catch-certificate',
    typeLabel: 'Catch certificate',
    reference: 'FRA 2026 CSP 100124',
    issuer: 'Centre National de Surveillance des Pêches',
    sourceFile: 'CATCH.CC.FR.2026.0000148 for FRA.2025.CSP.000518.pdf',
    details: [
      { label: 'Vessel', value: 'BERNICA (IMO 9600853)' },
      { label: 'Species', value: 'Skipjack Tuna (Katsuwonus pelamis)' },
      { label: 'Net weight', value: '175,564 kg' },
      { label: 'Catch area', value: 'FAO 51 - Indian Ocean Western' },
      { label: 'Catch dates', value: '14 June 2026 to 21 June 2026' }
    ]
  },
  {
    id: 'ESP/SGCI/AI/2026/101',
    consignmentReference: 'GB-IUU-2026-11003',
    type: 'catch-certificate',
    typeLabel: 'Catch certificate',
    reference: 'ESP/SGCI/AI/2026/101',
    issuer: 'Secretaría General de Pesca',
    sourceFile: 'ESP.SGCI.AI.2025.944.pdf',
    details: [
      { label: 'Vessel', value: 'ELAI ALAI (IMO 9046966)' },
      { label: 'Species', value: 'Skipjack Tuna (Katsuwonus pelamis)' },
      { label: 'Net weight', value: '118,000 kg' },
      { label: 'Catch area', value: 'FAO 51 - Indian Ocean' },
      { label: 'Catch dates', value: '1 June 2026 to 18 June 2026' }
    ]
  },
  {
    id: 'FRA 2026 CSP 000101',
    consignmentReference: 'GB-IUU-2026-11003',
    type: 'catch-certificate',
    typeLabel: 'Catch certificate',
    reference: 'FRA 2026 CSP 000101',
    issuer: 'Centre National de Surveillance des Pêches',
    sourceFile: 'FRA-2025-CSP-000472.pdf',
    details: [
      { label: 'Vessel', value: 'BERNICA (IMO 9600853)' },
      { label: 'Species', value: 'Skipjack Tuna (Katsuwonus pelamis)' },
      { label: 'Net weight', value: '78,000 kg' },
      { label: 'Catch area', value: 'FAO 51 - Indian Ocean Western' },
      { label: 'Catch dates', value: '4 June 2026 to 21 June 2026' }
    ]
  },
  {
    id: 'SYC/SFA/10/2026-SW0454',
    consignmentReference: 'GB-IUU-2026-11003',
    type: 'catch-certificate',
    typeLabel: 'Catch certificate',
    reference: 'SYC/SFA/10/2026-SW0454',
    issuer: 'Seychelles Fishing Authority',
    sourceFile: 'SYC-SFA-10-2025-SW0454.pdf',
    details: [
      { label: 'Vessel', value: 'OCEAN VOYAGER (IMO 9800006)' },
      { label: 'Species', value: 'Skipjack Tuna (Katsuwonus pelamis)' },
      { label: 'Net weight', value: '64,000 kg' },
      { label: 'Catch area', value: 'FAO 51 - Indian Ocean' },
      { label: 'Catch dates', value: '12 June 2026 to 28 June 2026' }
    ]
  },
  {
    id: 'CL-2026-44-000079-N',
    consignmentReference: 'GB-IUU-2026-11003',
    type: 'catch-certificate',
    typeLabel: 'Catch certificate',
    reference: 'CL-2026-44-000079-N',
    issuer: 'Servicio Nacional de Pesca y Acuicultura',
    sourceFile: 'CL-2026-44-000079-N.pdf',
    details: [
      { label: 'Vessel', value: 'PACIFIC DAWN (IMO 9800005)' },
      { label: 'Species', value: 'Skipjack Tuna (Katsuwonus pelamis)' },
      { label: 'Net weight', value: '100,000 kg' },
      { label: 'Catch area', value: 'FAO 87 - South East Pacific' },
      { label: 'Catch dates', value: '20 June 2026 to 8 July 2026' }
    ]
  },
  {
    id: 'CATCH.PS.PT.2026.0001149',
    consignmentReference: 'GB-IUU-2026-11003',
    type: 'processing-statement',
    typeLabel: 'Processing statement',
    reference: 'CATCH.PS.PT.2026.0001149',
    issuer: 'EUROPEAN SEAFOOD INVESTMENTS PORTUGAL S.A.',
    sourceFile: 'CATCH.PS.PT.2026.0001149 (Exp. 0125-26-GB).pdf',
    details: [
      { label: 'Country of processing', value: 'Portugal' },
      { label: 'Species', value: 'Skipjack Tuna (Katsuwonus pelamis)' },
      { label: 'Catch certificates referenced', value: '3 of 4 supplied' },
      { label: 'Total landed weight', value: '296,000 kg' }
    ]
  }
]

const multiSpeciesConsignment = require('./inspection-dashboard-consignment-seeds')
  .find((consignment) => consignment.reference === 'GB-IUU-2026-11021')
const multiSpeciesGroupsByCode = new Map()
for (const species of multiSpeciesConsignment.commoditySpecies) {
  if (!multiSpeciesGroupsByCode.has(species.commodityCode)) {
    multiSpeciesGroupsByCode.set(species.commodityCode, [])
  }
  multiSpeciesGroupsByCode.get(species.commodityCode).push(species)
}
const multiSpeciesGroups = Array.from(multiSpeciesGroupsByCode, ([commodityCode, species]) => ({ commodityCode, species }))
const formatWeight = (weightKg) => new Intl.NumberFormat('en-GB').format(weightKg) + ' kg'
const getSpeciesWeightKg = (species) => Number(String(species.weight).replace(/[^0-9]/g, ''))
const multiSpeciesCatchCertificateReferences = multiSpeciesGroups.map((group, index) => ({
  commodityCode: group.commodityCode,
  reference: `CC-IS-2026-11021-${String(index + 1).padStart(2, '0')}`
}))
const catchCertificateReferenceByCode = new Map(multiSpeciesCatchCertificateReferences
  .map(({ commodityCode, reference }) => [commodityCode, reference]))
const multiSpeciesCatchCertificates = multiSpeciesGroups.map((group, index) => {
  const reference = multiSpeciesCatchCertificateReferences[index].reference
  const groupWeight = formatWeight(group.species.reduce((total, species) => total + getSpeciesWeightKg(species), 0))

  return {
    id: reference,
    consignmentReference: 'GB-IUU-2026-11021',
    type: 'catch-certificate',
    typeLabel: 'Catch certificate',
    reference,
    issuer: 'Icelandic Directorate of Fisheries',
    details: [
      { label: 'Document number', value: reference },
      { label: 'Commodity code', value: group.commodityCode },
      { label: 'Species', value: group.species.map((species) => species.species).join(', ') },
      { label: 'Net weight', value: groupWeight }
    ],
    validationStatus: 'Validated',
    validationStatusClass: 'govuk-tag--green',
    species: group.species.map((species) => ({
      species: species.species,
      scientificName: species.scientificName,
      productCode: group.commodityCode,
      weight: species.weight
    })),
    sections: [
      {
        title: 'Document details',
        fields: [
          { label: 'Commodity code', value: group.commodityCode },
          { label: 'Catch area', value: 'FAO 27 - Northeast Atlantic' },
          { label: 'Catch dates', value: '15 October 2026 to 17 October 2026' }
        ]
      },
      { title: 'Weight data', fields: [{ label: 'Certified weight', value: groupWeight }] }
    ]
  }
})

const getSpeciesForGroups = (groupIndexes) => groupIndexes.flatMap((index) => multiSpeciesGroups[index].species)
const getCatchCertificateReferencesForGroups = (groupIndexes) => groupIndexes
  .map((index) => multiSpeciesCatchCertificateReferences[index].reference)
const multiSpeciesProcessingStatementDefinitions = [
  { reference: 'PS-IS-2026-11021-01', groupIndexes: [0, 1] },
  { reference: 'PS-IS-2026-11021-02', groupIndexes: [2, 3] },
  { reference: 'PS-IS-2026-11021-03', groupIndexes: [4] }
]
const multiSpeciesProcessingStatements = multiSpeciesProcessingStatementDefinitions.map((definition) => {
  const species = getSpeciesForGroups(definition.groupIndexes)
  const catchCertificateReferences = getCatchCertificateReferencesForGroups(definition.groupIndexes)
  const processedWeight = formatWeight(species.reduce((total, item) => total + getSpeciesWeightKg(item), 0))

  return {
    id: definition.reference,
    consignmentReference: 'GB-IUU-2026-11021',
    type: 'processing-statement',
    typeLabel: 'Processing statement',
    reference: definition.reference,
    issuer: 'North Atlantic Seafood Processing ehf.',
    details: [
      { label: 'Document number', value: definition.reference },
      { label: 'Processing country', value: 'Iceland' },
      { label: 'Catch certificates referenced', value: String(catchCertificateReferences.length) },
      { label: 'Processed weight', value: processedWeight }
    ],
    validationStatus: 'Received',
    validationStatusClass: 'govuk-tag--blue',
    species: species.map((item) => ({
      species: item.species,
      scientificName: item.scientificName,
      productCode: item.commodityCode,
      weight: item.weight
    })),
    sections: [
      {
        title: 'Processing details',
        fields: [
          { label: 'Processing country', value: 'Iceland' },
          { label: 'Approved establishment', value: 'North Atlantic Seafood Processing ehf. (IS-PP-11021)' },
          { label: 'Catch certificate references', references: catchCertificateReferences }
        ]
      },
      { title: 'Weight data', fields: [{ label: 'Processed weight', value: processedWeight }] }
    ]
  }
})

const multiSpeciesNmdDefinitions = [
  { reference: 'NMD-IS-2026-11021-01', groupIndexes: [0, 1, 2] },
  { reference: 'NMD-IS-2026-11021-02', groupIndexes: [3, 4] }
]
const multiSpeciesNmds = multiSpeciesNmdDefinitions.map((definition) => {
  const species = getSpeciesForGroups(definition.groupIndexes)
  const catchCertificateReferences = getCatchCertificateReferencesForGroups(definition.groupIndexes)
  const weight = formatWeight(species.reduce((total, item) => total + getSpeciesWeightKg(item), 0))

  return {
    id: definition.reference,
    consignmentReference: 'GB-IUU-2026-11021',
    type: 'nmd',
    typeLabel: 'Non-manipulation declaration',
    reference: definition.reference,
    issuer: 'Icelandic Directorate of Fisheries',
    details: [
      { label: 'Document number', value: definition.reference },
      { label: 'Storage country', value: 'Iceland' },
      { label: 'Weight in', value: weight },
      { label: 'Weight out', value: weight }
    ],
    validationStatus: 'Received',
    validationStatusClass: 'govuk-tag--blue',
    species: species.map((item) => ({
      species: item.species,
      scientificName: item.scientificName,
      productCode: item.commodityCode,
      weight: item.weight
    })),
    sections: [
      {
        title: 'Declaration details',
        fields: [
          { label: 'Storage country', value: 'Iceland' },
          { label: 'Catch certificate references', references: catchCertificateReferences }
        ]
      },
      { title: 'Weight data', fields: [{ label: 'Weight in', value: weight }, { label: 'Weight out', value: weight }] }
    ]
  }
})

module.exports = [
  ...inspectionDocuments,
  ...multiSpeciesCatchCertificates,
  ...multiSpeciesProcessingStatements,
  ...multiSpeciesNmds
].map((document) => ({
  ...document,
  ...inspectionDocumentDetails[document.id],
  ...(document.type === 'catch-certificate' ? { sourceFile: 'CATCH.CC.FR.2026.0000148 for FRA.2025.CSP.000518.pdf' } : {})
}))