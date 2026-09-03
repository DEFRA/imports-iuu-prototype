const createDocuments = (consignment, options = {}) => {
  const species = consignment.importedSpecies.map((item) => ({
    species: item.species,
    scientificName: item.scientificName,
    productCode: item.commodityCode,
    weight: item.weight
  }))
  const processingSections = [
    {
      title: 'Processing details',
      fields: [
        { label: 'Document number', value: consignment.processingStatement },
        { label: 'Processing country', value: consignment.processingCountry },
        { label: 'Approved establishment', value: consignment.processingPlant },
        ...(options.hasIssue
          ? []
          : [{ label: 'Catch certificate references', references: [consignment.catchCertificate] }])
      ]
    },
    {
      title: 'Weight data',
      fields: [
        { label: 'Total landed weight', value: consignment.weight },
        { label: 'Catch processed weight', value: consignment.weight },
        { label: 'Processed fishery product weight', value: consignment.weight }
      ]
    }
  ]

  if (options.hasIssue) {
    processingSections.push({
      title: 'Missing evidence',
      fields: [
        { label: 'Catch certificate not referenced', references: [consignment.catchCertificate] },
        { label: 'Unrepresented certified weight', value: consignment.weight }
      ]
    })
  }

  const documents = [
    {
      typeSlug: 'catch-certificate',
      type: 'Catch certificate',
      shortType: 'CC',
      reference: consignment.catchCertificate,
      sourceFile: 'CATCH.CC.FR.2026.0000148 for FRA.2025.CSP.000518.pdf',
      issuer: consignment.validatingAuthority,
      validationStatus: consignment.status === 'rejected' ? 'Could not be validated' : 'Valid',
      validationStatusClass: consignment.status === 'rejected' ? 'govuk-tag--red' : 'govuk-tag--green',
      statusLabel: 'Extracted',
      statusTagClass: 'govuk-tag--green',
      confidence: 98,
      summary: 'Vessel, catch area, species and landed weight',
      species,
      sections: [
        {
          title: 'Document details',
          fields: [
            { label: 'Document number', value: consignment.catchCertificate },
            { label: 'Validating authority', value: consignment.validatingAuthority },
            { label: 'Validation date', value: consignment.validationDate },
            { label: 'Catch area', value: consignment.catchArea }
          ]
        },
        {
          title: 'Vessel details',
          fields: [
            { label: 'Vessel name', value: consignment.vessel },
            { label: 'Flag state', value: consignment.origin }
          ]
        },
        {
          title: 'Exporter details',
          fields: [{ label: 'Exporter', value: consignment.exporter }]
        },
        {
          title: 'Weight data',
          fields: [{ label: 'Net fishery product weight', value: consignment.weight }]
        }
      ]
    },
    {
      typeSlug: 'processing-statement',
      type: 'Processing statement',
      shortType: 'PS',
      reference: consignment.processingStatement,
      sourceFile: 'CATCH.PS.PT.2026.0001149 (Exp. 0125-26-GB).pdf',
      issuer: consignment.processingPlant,
      validationStatus: options.hasIssue ? 'Missing evidence' : 'Valid',
      validationStatusClass: options.hasIssue ? 'govuk-tag--red' : 'govuk-tag--green',
      statusLabel: options.hasIssue ? 'Missing evidence' : 'Extracted',
      statusTagClass: options.hasIssue ? 'govuk-tag--red' : 'govuk-tag--green',
      confidence: options.hasIssue ? 76 : 96,
      summary: 'Processing plant, country and processed product',
      species,
      sections: processingSections
    }
  ]

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
    validationDate: '26 August 2026',
    validatingAuthority: 'Directorate of Fisheries, Iceland',
    processingCountry: 'Iceland',
    processingPlant: 'Nordic Seafood Processing hf.',
    plantApproval: 'A123',
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
    statusMessage: 'The Port Health Authority needs the processing statement to reference the supplied catch certificate.',
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
    speciesSummary: '2 species',
    importedSpecies: [
      {
        species: 'European hake',
        scientificName: 'Merluccius merluccius',
        productDescription: 'Frozen European hake fillets',
        commodityCode: '03047419',
        weight: '1,180 kg'
      },
      {
        species: 'Atlantic mackerel',
        scientificName: 'Scomber scombrus',
        productDescription: 'Frozen Atlantic mackerel',
        commodityCode: '03035410',
        weight: '620 kg'
      }
    ],
    weight: '1,800 kg',
    transport: 'Road - FR 852 QL',
    vessel: 'FV Belle Ile',
    catchArea: 'FAO 27 - Bay of Biscay',
    catchCertificate: 'FR-2026-CC-3198',
    processingStatement: 'FR-2026-PS-7721',
    validationDate: '24 August 2026',
    validatingAuthority: 'French Directorate of Sea Fisheries and Aquaculture',
    processingCountry: 'France',
    processingPlant: 'Maree Atlantique - Boulogne',
    plantApproval: 'FR 62.160.020 CE',
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

const evidenceTypes = [
  { heading: 'Catch certificate', documentType: 'Catch certificate' },
  { heading: 'Processing statement', documentType: 'Processing statement' },
  { heading: 'Non manipulation document', documentType: 'Non-manipulation declaration' },
  { heading: 'Additional documents', documentType: 'Additional document' }
]

module.exports = records.map((consignment) => {
  const importedSpecies = consignment.importedSpecies || [{
    species: consignment.species,
    scientificName: consignment.scientificName,
    productDescription: consignment.species,
    commodityCode: consignment.commodityCode,
    weight: consignment.weight
  }]
  const normalizedConsignment = {
    ...consignment,
    importedSpecies,
    speciesSummary: consignment.speciesSummary || consignment.species
  }
  const documents = normalizedConsignment.status === 'draft'
    ? []
    : createDocuments(normalizedConsignment, { hasIssue: normalizedConsignment.hasIssue })
  const evidenceSections = evidenceTypes.map((evidenceType) => {
    const references = documents
      .filter((document) => document.type === evidenceType.documentType)
      .map((document) => document.reference)

    return {
      heading: evidenceType.heading,
      count: references.length,
      references
    }
  })

  return { ...normalizedConsignment, documents, evidenceSections }
})
