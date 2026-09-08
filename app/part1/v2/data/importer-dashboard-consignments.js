const confidence = {
  high: { label: 'High confidence', tagClass: 'govuk-tag--green' },
  medium: { label: 'Check information', tagClass: 'govuk-tag--yellow' },
  missing: { label: 'Missing', tagClass: 'govuk-tag--red' }
}

const row = (label, value, level = 'high') => ({
  label,
  value,
  isMissing: level === 'missing',
  confidenceLabel: confidence[level].label,
  confidenceTagClass: confidence[level].tagClass
})

const createDocuments = (consignment, options = {}) => {
  const documentStatus = options.hasIssue ? {
    label: 'Check information',
    tagClass: 'govuk-tag--yellow'
  } : {
    label: 'Extracted',
    tagClass: 'govuk-tag--green'
  }

  const documents = [
    {
      id: 'catch-certificate',
      type: 'Catch certificate',
      shortType: 'CC',
      reference: consignment.catchCertificate,
      fileName: consignment.catchCertificate + '.pdf',
      statusLabel: 'Extracted',
      statusTagClass: 'govuk-tag--green',
      confidence: 98,
      summary: 'Vessel, catch area, species and landed weight',
      sections: [
        {
          title: 'Certificate details',
          rows: [
            row('Catch certificate number', consignment.catchCertificate),
            row('Flag state', consignment.origin),
            row('Validation date', consignment.validationDate),
            row('Validating authority', consignment.validatingAuthority)
          ]
        },
        {
          title: 'Catch and product details',
          rows: [
            row('Species', consignment.species),
            row('Vessel', consignment.vessel),
            row('Catch area', consignment.catchArea),
            row('Product weight', consignment.weight)
          ]
        }
      ]
    },
    {
      id: 'processing-statement',
      type: 'Processing statement',
      shortType: 'PS',
      reference: consignment.processingStatement,
      fileName: consignment.processingStatement + '.pdf',
      statusLabel: documentStatus.label,
      statusTagClass: documentStatus.tagClass,
      confidence: options.hasIssue ? 76 : 96,
      summary: 'Processing plant, country and processed product',
      sections: [
        {
          title: 'Statement details',
          rows: [
            row('Processing statement number', consignment.processingStatement),
            row('Processing country', consignment.processingCountry),
            row('Processing plant', consignment.processingPlant, options.hasIssue ? 'medium' : 'high'),
            row('Plant approval number', consignment.plantApproval)
          ]
        },
        {
          title: 'Processed product',
          rows: [
            row('Catch certificate reference', consignment.catchCertificate),
            row('Species', consignment.species),
            row('Commodity code', consignment.commodityCode),
            row('Processed weight', consignment.weight)
          ]
        }
      ]
    }
  ]

  if (consignment.nonManipulationDeclaration) {
    documents.push({
      id: 'non-manipulation-declaration',
      type: 'Non-manipulation declaration',
      shortType: 'NMD',
      reference: consignment.nonManipulationDeclaration,
      fileName: consignment.nonManipulationDeclaration + '.pdf',
      statusLabel: options.hasIssue ? 'Information missing' : 'Extracted',
      statusTagClass: options.hasIssue ? 'govuk-tag--red' : 'govuk-tag--green',
      confidence: options.hasIssue ? 61 : 94,
      summary: 'Transit, storage and authority validation',
      sections: [
        {
          title: 'Declaration details',
          rows: [
            row('Declaration number', consignment.nonManipulationDeclaration),
            row('Country of storage', consignment.transitCountry),
            row('Storage facility', consignment.storageFacility, options.hasIssue ? 'medium' : 'high'),
            row('Date goods entered storage', consignment.storageArrival)
          ]
        },
        {
          title: 'Authority validation',
          rows: [
            row('Declaring authority', options.hasIssue ? '' : consignment.transitAuthority, options.hasIssue ? 'missing' : 'high'),
            row('Validation date', options.hasIssue ? '' : consignment.transitValidationDate, options.hasIssue ? 'missing' : 'high'),
            row('Goods remained under customs control', options.hasIssue ? 'Unclear from document' : 'Yes', options.hasIssue ? 'medium' : 'high')
          ]
        }
      ]
    })
  }

  return documents
}

const records = [
  {
    reference: 'Draft notification 001',
    status: 'draft',
    statusLabel: 'Draft',
    statusTagClass: 'govuk-tag--grey',
    submittedAt: '2026-09-01T09:35:00Z',
    submittedDisplay: '1 September 2026 at 10:35',
    arrivalAt: '2026-09-07T07:30:00Z',
    arrivalDisplay: '7 September 2026 at 08:30',
    port: 'Grimsby',
    origin: 'Iceland',
    exporter: 'Nordic Catch Export hf.',
    species: 'Atlantic cod',
    commodityCode: '03047190',
    weight: '2,450 kg'
  },
  {
    reference: 'Draft notification 002',
    status: 'draft',
    statusLabel: 'Draft',
    statusTagClass: 'govuk-tag--grey',
    submittedAt: '2026-08-31T15:20:00Z',
    submittedDisplay: '31 August 2026 at 16:20',
    arrivalAt: '2026-09-10T13:00:00Z',
    arrivalDisplay: '10 September 2026 at 14:00',
    port: 'Felixstowe',
    origin: 'Norway',
    exporter: 'Fjord Seafoods AS',
    species: 'Atlantic salmon',
    commodityCode: '03021400',
    weight: '4,200 kg'
  },
  {
    reference: 'GB-IUU-2026-10418',
    status: 'submitted',
    statusLabel: 'Submitted',
    statusTagClass: 'govuk-tag--blue',
    submittedAt: '2026-08-31T10:24:00Z',
    submittedDisplay: '31 August 2026 at 11:24',
    arrivalAt: '2026-09-07T07:30:00Z',
    arrivalDisplay: '7 September 2026 at 08:30',
    port: 'Grimsby',
    origin: 'Iceland',
    exporter: 'Nordic Catch Export hf.',
    species: 'Atlantic cod',
    scientificName: 'Gadus morhua',
    commodityCode: '03047190',
    weight: '2,450 kg',
    transport: 'Vessel - MV Northern Star',
    vessel: 'IS-204 Odinn',
    catchArea: 'FAO 27 - North East Atlantic',
    catchCertificate: 'IS-2026-CC-0847',
    processingStatement: 'IS-2026-PS-0847',
    nonManipulationDeclaration: 'NL-2026-NMD-4412',
    validationDate: '26 August 2026',
    validatingAuthority: 'Directorate of Fisheries, Iceland',
    processingCountry: 'Iceland',
    processingPlant: 'Nordic Seafood Processing hf.',
    plantApproval: 'A123',
    transitCountry: 'Netherlands',
    storageFacility: 'Rotterdam Cold Store 4',
    storageArrival: '28 August 2026',
    transitAuthority: 'Netherlands Food and Consumer Product Safety Authority',
    transitValidationDate: '30 August 2026',
    timeline: [
      { date: '31 August 2026 at 11:24', text: 'Notification submitted' },
      { date: '31 August 2026 at 11:25', text: 'Sent to Grimsby Port Health Authority' }
    ]
  },
  {
    reference: 'GB-IUU-2026-10411',
    status: 'action-required',
    statusLabel: 'Action required',
    statusTagClass: 'govuk-tag--red',
    statusMessage: 'The Port Health Authority needs clearer evidence of customs control during transit.',
    submittedAt: '2026-08-30T14:10:00Z',
    submittedDisplay: '30 August 2026 at 15:10',
    arrivalAt: '2026-09-03T08:15:00Z',
    arrivalDisplay: '3 September 2026 at 09:15',
    port: 'Dover',
    origin: 'France',
    exporter: 'Maree Atlantique SAS',
    species: 'European hake',
    scientificName: 'Merluccius merluccius',
    commodityCode: '03047419',
    weight: '1,180 kg',
    transport: 'Road - FR 852 QL',
    vessel: 'FV Belle Ile',
    catchArea: 'FAO 27 - Bay of Biscay',
    catchCertificate: 'FR-2026-CC-3198',
    processingStatement: 'FR-2026-PS-7721',
    nonManipulationDeclaration: 'BE-2026-NMD-1182',
    validationDate: '24 August 2026',
    validatingAuthority: 'French Directorate of Sea Fisheries and Aquaculture',
    processingCountry: 'France',
    processingPlant: 'Maree Atlantique - Boulogne',
    plantApproval: 'FR 62.160.020 CE',
    transitCountry: 'Belgium',
    storageFacility: 'Zeebrugge Cold Chain',
    storageArrival: '27 August 2026',
    transitAuthority: '',
    transitValidationDate: '',
    timeline: [
      { date: '30 August 2026 at 15:10', text: 'Notification submitted' },
      { date: '1 September 2026 at 09:42', text: 'Further information requested by Dover Port Health Authority' }
    ],
    hasIssue: true
  },
  {
    reference: 'GB-IUU-2026-10397',
    status: 'under-review',
    statusLabel: 'Under review',
    statusTagClass: 'govuk-tag--yellow',
    submittedAt: '2026-08-29T08:05:00Z',
    submittedDisplay: '29 August 2026 at 09:05',
    arrivalAt: '2026-09-05T10:45:00Z',
    arrivalDisplay: '5 September 2026 at 11:45',
    port: 'Felixstowe',
    origin: 'Norway',
    exporter: 'Fjord Seafoods AS',
    species: 'Atlantic salmon',
    scientificName: 'Salmo salar',
    commodityCode: '03021400',
    weight: '4,200 kg',
    transport: 'Vessel - Nordic Carrier',
    vessel: 'N-118-F',
    catchArea: 'FAO 27 - Norwegian Sea',
    catchCertificate: 'NO-2026-CC-6204',
    processingStatement: 'NO-2026-PS-5091',
    validationDate: '25 August 2026',
    validatingAuthority: 'Norwegian Directorate of Fisheries',
    processingCountry: 'Norway',
    processingPlant: 'Fjord Seafoods Bergen',
    plantApproval: 'N-220',
    timeline: [
      { date: '29 August 2026 at 09:05', text: 'Notification submitted' },
      { date: '29 August 2026 at 09:06', text: 'Review started by Suffolk Coastal Port Health Authority' }
    ]
  },
  {
    reference: 'GB-IUU-2026-10172',
    status: 'accepted',
    statusLabel: 'Accepted',
    statusTagClass: 'govuk-tag--green',
    submittedAt: '2026-07-12T12:20:00Z',
    submittedDisplay: '12 July 2026 at 13:20',
    arrivalAt: '2026-07-18T05:30:00Z',
    arrivalDisplay: '18 July 2026 at 06:30',
    port: 'Grimsby',
    origin: 'Iceland',
    exporter: 'Arctic Fish Export ehf.',
    species: 'Haddock',
    scientificName: 'Melanogrammus aeglefinus',
    commodityCode: '03047200',
    weight: '3,600 kg',
    transport: 'Vessel - MV Freyja',
    vessel: 'IS-510 Freyja',
    catchArea: 'FAO 27 - Iceland Grounds',
    catchCertificate: 'IS-2026-CC-0612',
    processingStatement: 'IS-2026-PS-0612',
    validationDate: '8 July 2026',
    validatingAuthority: 'Directorate of Fisheries, Iceland',
    processingCountry: 'Iceland',
    processingPlant: 'Arctic Fish Processing',
    plantApproval: 'B412',
    timeline: [
      { date: '12 July 2026 at 13:20', text: 'Notification submitted' },
      { date: '14 July 2026 at 16:40', text: 'Notification accepted' }
    ]
  },
  {
    reference: 'GB-IUU-2026-10094',
    status: 'rejected',
    statusLabel: 'Rejected',
    statusTagClass: 'govuk-tag--red',
    statusMessage: 'The catch certificate could not be validated with the issuing authority.',
    submittedAt: '2026-06-21T09:30:00Z',
    submittedDisplay: '21 June 2026 at 10:30',
    arrivalAt: '2026-06-28T13:00:00Z',
    arrivalDisplay: '28 June 2026 at 14:00',
    port: 'Dover',
    origin: 'Spain',
    exporter: 'Pesca Norte SL',
    species: 'Yellowfin tuna',
    scientificName: 'Thunnus albacares',
    commodityCode: '03048700',
    weight: '980 kg',
    transport: 'Road - ES 1842 KMT',
    vessel: 'ES-8-AT-442',
    catchArea: 'FAO 34 - Eastern Central Atlantic',
    catchCertificate: 'ES-2026-CC-1880',
    processingStatement: 'ES-2026-PS-2994',
    validationDate: '17 June 2026',
    validatingAuthority: 'Secretaría General de Pesca',
    processingCountry: 'Spain',
    processingPlant: 'Pesca Norte Vigo',
    plantApproval: 'ES 12.0661/PO CE',
    timeline: [
      { date: '21 June 2026 at 10:30', text: 'Notification submitted' },
      { date: '24 June 2026 at 14:15', text: 'Notification rejected' }
    ]
  }
]

module.exports = records.map((consignment) => ({
  ...consignment,
  documents: consignment.status === 'draft'
    ? []
    : createDocuments(consignment, { hasIssue: consignment.hasIssue })
}))
