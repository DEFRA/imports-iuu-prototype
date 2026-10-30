const multiSpeciesDashboardSeed = require('./inspection-dashboard-consignment-seeds')
  .find((consignment) => consignment.reference === 'GB-IUU-2026-11021')
const multiSpeciesDocuments = require('./inspection-documents')
  .filter((document) => document.consignmentReference === 'GB-IUU-2026-11021')
const multiSpeciesCatchCertificates = multiSpeciesDocuments.filter((document) => document.type === 'catch-certificate')
const multiSpeciesProcessingStatements = multiSpeciesDocuments.filter((document) => document.type === 'processing-statement')
const multiSpeciesNmds = multiSpeciesDocuments.filter((document) => document.type === 'nmd')
const multiSpeciesAdditionalDocuments = require('./additional-documents')
  .filter((document) => document.consignmentReference === 'GB-IUU-2026-11021')
const multiSpeciesGroupsByCode = new Map()
for (const species of multiSpeciesDashboardSeed.commoditySpecies) {
  if (!multiSpeciesGroupsByCode.has(species.commodityCode)) {
    multiSpeciesGroupsByCode.set(species.commodityCode, [])
  }
  multiSpeciesGroupsByCode.get(species.commodityCode).push(species)
}
const multiSpeciesGroups = Array.from(multiSpeciesGroupsByCode, ([commodityCode, species]) => ({ commodityCode, species }))
const multiSpeciesCatchCertificateByCode = new Map(multiSpeciesCatchCertificates
  .map((document) => [document.commodityCode, document.reference]))
const getWeightKg = (weight) => Number(String(weight).replace(/[^0-9]/g, ''))
const formatWeight = (weight) => new Intl.NumberFormat('en-GB').format(weight) + ' kg'
const multiSpeciesCommodities = multiSpeciesGroups.map((group) => ({
  description: group.species.map((species) => species.species).join(', '),
  commodityCode: group.commodityCode,
  declaredQuantity: formatWeight(group.species.reduce((total, species) => total + getWeightKg(species.weight), 0))
}))
const multiSpeciesWeightComparisons = multiSpeciesGroups.flatMap((group) => group.species.map((species) => ({
  description: `${species.species} (${species.scientificName})`,
  commodityCode: group.commodityCode,
  notificationWeight: species.weight,
  catchCertificateWeight: species.weight,
  catchCertificateReferences: [multiSpeciesCatchCertificateByCode.get(group.commodityCode)],
  processingStatementWeight: species.weight,
  nonManipulationDeclarationWeight: species.weight
})))

module.exports = [
  {
    reference: 'GB-IUU-2026-11002',
    hasJourneyLink: true,
    importer: 'New England Seafood International Ltd',
    importerEori: 'GB222333444000',
    arrivalOffsetDays: -1,
    arrivalTime: '9:00am',
    submittedDaysAgo: 7,
    product: 'Skipjack tuna',
    quantity: '118,000 kg',
    vesselOrCountryLines: ['PENDRUC', 'France'],
    reasonTagText: 'Mismatch flagged',
    reasonTagClass: 'govuk-tag--red',
    reasonText: 'Catch certificate contains undeclared Yellowfin tuna',
    documentsLines: ['Catch certificate received', 'Potential missing evidence flagged'],
    statusTagText: 'Requires document check',
    statusTagClass: 'govuk-tag--red',
    regulatoryStatus: 'Requires document check',
    port: 'Port of Grimsby',
    declaredWeight: '118,000 kg',
    productDescription: 'Skipjack tuna',
    commodityCode: '030343',
    declaredQuantity: '118,000 kg',
    commodities: [
      { description: 'Skipjack tuna (Katsuwonus pelamis)', commodityCode: '030343', declaredQuantity: '118,000 kg' }
    ],
    commodityWeightComparisons: [
      {
        description: 'Skipjack tuna (Katsuwonus pelamis)',
        commodityCode: '030343',
        notificationWeight: '118,000 kg',
        catchCertificateWeight: '118,000 kg',
        catchCertificateReferences: ['FRA 2026 CSP 000205'],
        processingStatementWeight: 'Not provided',
        nonManipulationDeclarationWeight: 'Not provided'
      },
      {
        description: 'Yellowfin tuna (Thunnus albacares)',
        commodityCode: '030342',
        notificationWeight: 'Not declared',
        catchCertificateWeight: '34,000 kg',
        catchCertificateReferences: ['FRA 2026 CSP 000205'],
        processingStatementWeight: 'Not provided',
        nonManipulationDeclarationWeight: 'Not provided'
      }
    ],
    exportingCountry: 'France',
    vesselName: 'PENDRUC',
    imoNumber: '9741102',
    containerNumber: 'MSCU2205101',
    documents: [
      { type: 'Catch certificates', count: 1, references: ['FRA 2026 CSP 000205'] },
      { type: 'Processing statements', count: 0, references: [] },
      { type: 'Non-manipulation declarations', count: 0, references: [] },
      { type: 'Additional documents', count: 0, references: [] }
    ],
    evidenceSummary: [
      { type: 'Catch certificate', status: 'Received', statusClass: 'govuk-tag--green', details: 'FRA 2026 CSP 000205' },
      { type: 'Weight comparison', status: 'Possible mismatch', statusClass: 'govuk-tag--yellow', details: 'Catch Certificate contains additional Yellowfin Tuna not present in the declaration' },
      { type: 'Evidence completeness', status: 'Issue', statusClass: 'govuk-tag--red', details: 'Not all expected catch certificates supplied' },
      { type: 'Authority verification', status: 'Pending', statusClass: 'govuk-tag--grey', details: 'Verification has not been completed' }
    ],
    riskFlags: [
      { status: 'Issue', label: 'Missing Evidence', details: 'Not all expected catch certificates supplied' },
      { status: 'Issue', label: 'Importer declaration', details: 'Importer declaration not completed' }
    ]
  },
  {
    reference: 'GB-IUU-2026-11021',
    hasJourneyLink: true,
    importer: 'New England Seafood International Ltd',
    importerEori: 'GB222333444000',
    arrivalOffsetDays: 2,
    arrivalTime: '6:00am',
    submittedDaysAgo: 10,
    product: '12 species across 5 commodities',
    quantity: '8,170 kg',
    vesselOrCountryLines: ['North Star', 'Iceland'],
    reasonTagText: 'Document check required',
    reasonTagClass: 'govuk-tag--red',
    reasonText: 'Initial documentary review required',
    documentsLines: ['5 catch certificates received', '3 processing statements received', '2 non-manipulation declarations received', '2 additional documents received'],
    statusTagText: 'Requires document check',
    statusTagClass: 'govuk-tag--red',
    regulatoryStatus: 'Requires document check',
    port: 'Port of Felixstowe',
    declaredWeight: '8,170 kg',
    productDescription: '12 species across 5 commodities',
    commodityCode: multiSpeciesDashboardSeed.commodityCodes.join(', '),
    declaredQuantity: '8,170 kg',
    commodities: multiSpeciesCommodities,
    commodityWeightComparisons: multiSpeciesWeightComparisons,
    exportingCountry: 'Iceland',
    vesselName: 'North Star',
    imoNumber: '9876543',
    containerNumber: 'MSCU1102101',
    warningText: 'The supporting documents have been received and are awaiting initial documentary review.',
    documents: [
      {
        type: 'Catch certificates',
        count: multiSpeciesCatchCertificates.length,
        references: multiSpeciesCatchCertificates.map((document) => document.reference)
      },
      { type: 'Processing statements', count: multiSpeciesProcessingStatements.length, references: multiSpeciesProcessingStatements.map((document) => document.reference) },
      { type: 'Non-manipulation declarations', count: multiSpeciesNmds.length, references: multiSpeciesNmds.map((document) => document.reference) },
      { type: 'Additional documents', count: multiSpeciesAdditionalDocuments.length, references: multiSpeciesAdditionalDocuments.map((document) => document.id) }
    ],
    evidenceSummary: [
      { type: 'Catch certificates', status: 'Received', statusClass: 'govuk-tag--green', details: '5 catch certificates received.' },
      { type: 'Processing statements', status: 'Received', statusClass: 'govuk-tag--green', details: '3 processing statements cover all 5 catch certificates.' },
      { type: 'Non-manipulation declarations', status: 'Received', statusClass: 'govuk-tag--green', details: '2 declarations cover the stored fishery products.' },
      { type: 'Additional documents', status: 'Received', statusClass: 'govuk-tag--green', details: 'A species and weights schedule and a transport document were supplied.' },
      { type: 'Weight comparison', status: 'Validated', statusClass: 'govuk-tag--green', details: 'Declared and certified species weights reconcile.' },
      { type: 'Evidence completeness', status: 'Complete', statusClass: 'govuk-tag--green', details: 'All required documents for this example have been supplied.' },
      { type: 'Authority verification', status: 'Pending', statusClass: 'govuk-tag--grey', details: 'Verification has not been completed.' }
    ],
    riskFlags: []
  },
  {
    reference: 'GB-IUU-2026-11001',
    hasJourneyLink: true,
    importer: 'New England Seafood International Ltd',
    importerEori: 'GB987654321000',
    arrivalOffsetDays: 4,
    arrivalTime: '',
    submittedDaysAgo: 3,
    product: 'Frozen Whole Skipjack Tuna',
    quantity: '175,564 kg',
    vesselOrCountryLines: ['BERNICA', 'France'],
    reasonText: 'Document check required',
    documentsLines: ['Catch certificate received'],
    statusTagText: 'Requires document check',
    statusTagClass: 'govuk-tag--red',
    regulatoryStatus: 'Requires document check',
    port: 'Grimsby',
    declaredWeight: '175,564 kg',
    productDescription: 'Skipjack Tuna (Katsuwonus pelamis)',
    commodityCode: '030343',
    declaredQuantity: '175,564 kg',
    commodities: [
      { description: 'Skipjack Tuna (Katsuwonus pelamis)', commodityCode: '030343', declaredQuantity: '175,564 kg' }
    ],
    commodityWeightComparisons: [
      {
        description: 'Skipjack Tuna (Katsuwonus pelamis)',
        commodityCode: '030343',
        notificationWeight: '175,564 kg',
        catchCertificateWeight: '175,564 kg',
        catchCertificateReferences: ['FRA 2026 CSP 100124'],
        processingStatementWeight: 'Not provided',
        nonManipulationDeclarationWeight: 'Not provided'
      }
    ],
    exportingCountry: 'France',
    vesselName: 'BERNICA',
    imoNumber: '9600853',
    containerNumber: 'MSCU1000333',
    documents: [
      { type: 'Catch certificates', count: 1, references: ['FRA 2026 CSP 100124'] },
      { type: 'Processing statements', count: 0, references: [] },
      { type: 'Non-manipulation declarations', count: 0, references: [] },
      { type: 'Additional documents', count: 0, references: [] }
    ],
    evidenceSummary: [
      { type: 'Catch certificate', status: 'Received', statusClass: 'govuk-tag--green', details: 'FRA 2026 CSP 100124' },
      { type: 'Weight Comparison', status: 'Validated', statusClass: 'govuk-tag--green', details: 'Provided Catch Certificate and Declaration weights reconcile' },
      { type: 'Evidence completeness', status: 'Complete', statusClass: 'govuk-tag--green', details: 'No inconsistencies detected' },
      { type: 'Authority verification', status: 'Pending', statusClass: 'govuk-tag--grey', details: 'Verification has not been completed' }
    ],
    informationText: 'The notification is supported by the documentary evidence provided. No inconsistencies were identified during the document check.',
    assessmentSummary: 'The commodity, species and product code information supplied within the notification is consistent with the supporting documentary evidence.',
    riskFlags: []
  },
  {
    reference: 'GB-IUU-2026-10510',
    hasJourneyLink: false,
    importer: 'Harbour Catch Imports',
    arrivalOffsetDays: 5,
    arrivalTime: '6:10pm',
    submittedDaysAgo: 12,
    product: 'Crab meat',
    quantity: '4,500 kg · 450 boxes',
    vesselOrCountryLines: ['FV Arktis', 'Norway'],
    reasonText: 'Authority verification pending',
    documentsLines: ['Catch certificate received', 'PS and NMD — authority check in progress'],
    statusTagText: 'Ready to start',
    statusTagClass: 'govuk-tag--blue'
  },
  {
    reference: 'GB-IUU-2026-10344',
    hasJourneyLink: false,
    importer: 'North Coast Marine Exports',
    arrivalOffsetDays: 9,
    arrivalTime: '9:00am',
    submittedDaysAgo: 18,
    product: 'Frozen cod fillets',
    quantity: '9,200 kg · 920 boxes',
    vesselOrCountryLines: ['Icelandic waters'],
    reasonText: 'Random selection',
    documentsLines: ['Catch certificate received', 'Processing statement received'],
    statusTagText: 'Awaiting allocation',
    statusTagClass: 'govuk-tag--grey'
  }
]
