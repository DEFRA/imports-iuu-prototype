module.exports = [
  {
    reference: 'GB-IUU-2026-10482',
    hasJourneyLink: true,
    importer: 'Atlantic Seafoods Ltd',
    arrivalOffsetDays: 3,
    arrivalTime: '2:30pm',
    submittedDaysAgo: 7,
    product: 'Frozen yellowfin tuna',
    quantity: '24,800 kg · 1,240 cartons',
    vesselOrCountryLines: ['MV Ocean Star', 'Senegal'],
    reasonTagText: 'Mismatch flagged',
    reasonTagClass: 'govuk-tag--red',
    reasonText: 'Notification weight differs from catch certificate',
    documentsLines: ['Catch certificate received', 'Processing statement received', 'NMD received'],
    statusTagText: 'Inspection required',
    statusTagClass: 'govuk-tag--red',
    regulatoryStatus: 'Inspection required',
    port: 'Port of Felixstowe',
    declaredWeight: '26,200 kg',
    productDescription: 'Frozen yellowfin tuna loins',
    commodityCode: '0303 42 12',
    declaredQuantity: '24,800 kg (1,240 cartons)',
    commodities: [
      { description: 'Frozen yellowfin tuna', commodityCode: '0303 42 12', declaredQuantity: '18,600 kg' },
      { description: 'Frozen bigeye tuna', commodityCode: '0303 44 10', declaredQuantity: '6,200 kg' }
    ],
    commodityWeightComparisons: [
      {
        description: 'Frozen yellowfin tuna',
        commodityCode: '0303 42 12',
        notificationWeight: '18,600 kg',
        catchCertificateWeight: '24,800 kg',
        catchCertificateReferences: ['CC-SEN-2026-7784', 'CC-SEN-2026-7785'],
        processingStatementWeight: '24,800 kg',
        nonManipulationDeclarationWeight: '24,800 kg'
      },
      {
        description: 'Frozen bigeye tuna',
        commodityCode: '0303 44 10',
        notificationWeight: '6,200 kg',
        catchCertificateWeight: '6,200 kg',
        catchCertificateReferences: ['CC-SEN-2026-7784'],
        processingStatementWeight: '6,200 kg',
        nonManipulationDeclarationWeight: '6,200 kg'
      }
    ],
    exportingCountry: 'Senegal',
    vesselName: 'MV Ocean Star',
    imoNumber: '9214567',
    containerNumber: 'MSCU 7391842',
    documents: [
      { type: 'Catch certificates', count: 1, references: ['CC-SEN-2026-7784'] },
      { type: 'Processing statements', count: 1, references: ['PS-SEN-2026-0441'] },
      { type: 'Non-manipulation declarations', count: 1, references: ['NMD-MMO-2026-0093'] },
      { type: 'Additional documents', count: 0, references: [] }
    ],
    evidenceSummary: [
      { type: 'Catch certificate', status: 'Received', statusClass: 'govuk-tag--green', details: 'CC-SEN-2026-7784' },
      { type: 'Processing statement', status: 'Received', statusClass: 'govuk-tag--green', details: 'PS-SEN-2026-0441' },
      { type: 'Non-manipulation declaration', status: 'Received', statusClass: 'govuk-tag--green', details: 'NMD-MMO-2026-0093' },
      { type: 'Weight comparison', status: 'Possible mismatch', statusClass: 'govuk-tag--yellow', details: 'Notification is 1,400 kg heavier than the catch certificate' },
      { type: 'Authority verification', status: 'Pending', statusClass: 'govuk-tag--grey', details: 'Verification has not been completed' }
    ],
    riskFlags: [
      { status: 'Issue', label: 'Mismatch with declared commodity', details: 'There is a potential mismatch with commodity on declaration and supplied evidence' },
      { status: 'Issue', label: 'Missing Evidence', details: 'There is a potential missing Evidence' },
      { status: 'Issue', label: 'Importer declaration', details: 'Importer declaration data missing' }
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
