module.exports = [
  {
    reference: 'GB-IUU-2026-11001',
    hasJourneyLink: true,
    importer: 'New England Seafood International Ltd',
    importerEori: 'GB222333444000',
    arrivalOffsetDays: 2,
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
      { type: 'Additional documents', count: 4, references: ['BOL-2026-55190', 'INV-2026-88421', 'TRN-2026-10982', 'SUP-2026-00418'] }
    ],
    evidenceSummary: [
      { type: 'Catch certificate', status: 'Received', statusClass: 'govuk-tag--green', details: 'FRA 2026 CSP 000205' },
      { type: 'Weight comparison', status: 'Possible mismatch', statusClass: 'govuk-tag--yellow', details: 'Catch Certificate contains additional Yellowfin Tuna not present in the declaration' },
      { type: 'Evidence completeness', status: 'Issue', statusClass: 'govuk-tag--red', details: 'Not all expected catch certificates supplied' },
      { type: 'Authority verification', status: 'Pending', statusClass: 'govuk-tag--grey', details: 'Verification has not been completed' }
    ],
    riskFlags: [
      { status: 'Issue', label: 'Declared commodity mismatch', details: 'There is a potential mismatch with commodity on declaration and supplied evidence' },
      { status: 'Issue', label: 'Missing Evidence', details: 'Not all expected catch certificates supplied' },
      { status: 'Issue', label: 'Importer declaration', details: 'Importer declaration not completed' }
    ]
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
