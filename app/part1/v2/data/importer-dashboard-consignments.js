const evidenceTypes = [
  { heading: 'Catch certificate', typeSlug: 'catch-certificate' },
  { heading: 'Processing statement', typeSlug: 'processing-statement' },
  { heading: 'Non-manipulation document', typeSlug: 'nmd' },
  { heading: 'Additional documents', typeSlug: 'additional' }
]

const toUtcDate = (date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

const addDays = (date, dayOffset) => {
  const nextDate = new Date(date.getTime())
  nextDate.setUTCDate(nextDate.getUTCDate() + dayOffset)
  return nextDate
}

const dashboardToday = toUtcDate(new Date())

const applyArrivalOffset = (consignment) => {
  if (!Number.isInteger(consignment.arrivalOffsetDays)) return consignment

  const arrivalAt = addDays(dashboardToday, consignment.arrivalOffsetDays)
  const arrivalDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/London'
  }).format(arrivalAt)

  return {
    ...consignment,
    arrivalAt: arrivalAt.toISOString(),
    arrivalDisplay: consignment.arrivalTime
      ? `${arrivalDate} at ${consignment.arrivalTime}`
      : arrivalDate
  }
}

const createEvidenceSections = (documents) => evidenceTypes.map((evidenceType) => {
  const references = documents
    .filter((document) => document.typeSlug === evidenceType.typeSlug)
    .map((document) => document.reference)

  return {
    heading: evidenceType.heading,
    count: references.length,
    references
  }
})

const unavailableUnderReviewReferences = new Set([
  'GB-IUU-2026-11005',
  'GB-IUU-2026-11011',
  'GB-IUU-2026-11016'
])

const unavailableAcceptedReferences = new Set([
  'GB-IUU-2026-11006'
])

const unavailableRejectedReferences = new Set([
  'GB-IUU-2026-11014'
])

const createUnavailableRecord = (seed) => {
  const isUnderReview = unavailableUnderReviewReferences.has(seed.reference)
  const isAccepted = unavailableAcceptedReferences.has(seed.reference)
  const isRejected = unavailableRejectedReferences.has(seed.reference)

  return {
    reference: seed.reference,
    status: isAccepted ? 'accepted' : (isRejected ? 'rejected' : (isUnderReview ? 'under-review' : 'submitted')),
    statusLabel: isAccepted ? 'Accepted' : (isRejected ? 'Rejected' : (isUnderReview ? 'Under review' : 'Submitted')),
    statusTagClass: isAccepted ? 'govuk-tag--green' : (isRejected ? 'govuk-tag--red' : (isUnderReview ? 'govuk-tag--yellow' : 'govuk-tag--blue')),
    statusMessage: isRejected ? 'The catch certificate could not be validated with the issuing authority.' : '',
    inspectionStatus: seed.inspectionStatus,
    submittedAt: seed.submittedAt,
    submittedDisplay: seed.submittedDisplay,
    arrivalOffsetDays: seed.arrivalOffsetDays,
    arrivalTime: seed.arrivalTime,
    port: seed.port,
    importer: seed.importer,
    origin: seed.origin,
    exporter: seed.exporter,
    species: seed.species,
    speciesSummary: seed.species,
    commodityCode: seed.commodityCodes[0],
    commodityCodes: seed.commodityCodes,
    weight: new Intl.NumberFormat('en-GB').format(seed.declaredWeightKg) + ' kg',
    documentCounts: {
      'catch-certificate': seed.catchCertificateCount,
      'processing-statement': seed.processingStatementCount,
      nmd: seed.nmdCount,
      additional: seed.additionalDocumentCount
    },
    isAvailable: false,
    documents: []
  }
}

const records = [
  {
    reference: 'Draft notification 001',
    status: 'draft',
    statusLabel: 'Draft',
    statusTagClass: 'govuk-tag--grey',
    submittedAt: '2026-09-01T09:35:00Z',
    submittedDisplay: '1 September 2026 at 10:35',
    arrivalOffsetDays: 3,
    arrivalTime: '08:30',
    port: 'Grimsby',
    importer: 'New England Seafood International Ltd',
    origin: 'Iceland',
    exporter: 'Nordic Catch Export hf.',
    species: 'Atlantic cod',
    commodityCode: '03047190',
    weight: '2,450 kg',
    documents: []
  },
  {
    reference: 'Draft notification 002',
    status: 'draft',
    statusLabel: 'Draft',
    statusTagClass: 'govuk-tag--grey',
    submittedAt: '2026-08-31T15:20:00Z',
    submittedDisplay: '31 August 2026 at 16:20',
    arrivalOffsetDays: 6,
    arrivalTime: '14:00',
    port: 'Felixstowe',
    importer: 'New England Seafood International Ltd',
    origin: 'Norway',
    exporter: 'Fjord Seafoods AS',
    species: 'Atlantic salmon',
    commodityCode: '03021400',
    weight: '4,200 kg',
    documents: []
  },
  {
    reference: 'GB-IUU-2026-11002',
    status: 'under-review',
    statusLabel: 'Under review',
    statusTagClass: 'govuk-tag--yellow',
    submittedAt: '2026-08-28T09:00:00Z',
    submittedDisplay: '28 August 2026 at 10:00',
    arrivalOffsetDays: -1,
    arrivalTime: '09:00',
    port: 'Grimsby',
    importer: 'New England Seafood International Ltd',
    origin: 'France',
    exporter: 'Compagnie Française du Thon Océanique',
    species: 'Skipjack tuna (Katsuwonus pelamis)',
    speciesSummary: 'Skipjack tuna and Yellowfin tuna',
    scientificName: 'Katsuwonus pelamis',
    commodityCode: '030343',
    weight: '118,000 kg',
    catchCertificateWeight: '152,000 kg',
    transport: 'Vessel - container MSCU2205101',
    vessel: 'PENDRUC (IMO 9741102)',
    catchArea: 'FAO 51 - Indian Ocean Western',
    importedSpecies: [
      {
        species: 'Skipjack tuna',
        scientificName: 'Katsuwonus pelamis',
        declarationStatus: 'Declared',
        commodityCode: '030343',
        notificationWeight: '118,000 kg',
        catchCertificateWeight: '118,000 kg'
      },
      {
        species: 'Yellowfin tuna',
        scientificName: 'Thunnus albacares',
        declarationStatus: 'Not declared',
        commodityCode: '030342',
        notificationWeight: 'Not declared',
        catchCertificateWeight: '34,000 kg'
      }
    ],
    timeline: [
      { date: '28 August 2026 at 10:00', text: 'Notification submitted' },
      { date: '28 August 2026 at 10:01', text: 'Sent to Grimsby Port Health Authority' }
    ],
    documents: [
      {
        typeSlug: 'catch-certificate',
        type: 'Catch certificate',
        reference: 'FRA 2026 CSP 000205',
        issuer: 'Centre National de Surveillance des Pêches, France',
        validationStatus: 'Possible mismatch',
        validationStatusClass: 'govuk-tag--yellow',
        species: [
          { species: 'Skipjack tuna', scientificName: 'Katsuwonus pelamis', productCode: '030343', weight: '118,000 kg' },
          { species: 'Yellowfin tuna', scientificName: 'Thunnus albacares', productCode: '030342', weight: '34,000 kg' }
        ],
        sections: [
          {
            title: 'Document details',
            fields: [
              { label: 'Document number', value: 'FRA 2026 CSP 000205' },
              { label: 'Product code', value: '030343; 030342' },
              { label: 'Catch area', value: 'FAO 51 - Indian Ocean Western' },
              { label: 'Fishing licence', value: 'CTOI-1302/000205' }
            ]
          },
          {
            title: 'Vessel details',
            fields: [
              { label: 'Vessel name', value: 'PENDRUC' },
              { label: 'IMO number', value: '9741102' },
              { label: 'Call sign', value: 'FIXF' },
              { label: 'Flag, home port and registration', value: 'France - Concarneau - CC932207' }
            ]
          },
          {
            title: 'Exporter and importer details',
            fields: [
              { label: 'Exporter details', value: 'Compagnie Française du Thon Océanique, 11 Rue des Sardiniers, 29900 Concarneau, France' },
              { label: 'Importer details', value: 'New England Seafood International Ltd, Genesis Way, Healing, Grimsby DN37 9TU, United Kingdom' }
            ]
          },
          {
            title: 'Weight data',
            fields: [
              { label: 'Certified weight (Skipjack)', value: '118,000 kg' },
              { label: 'Certified weight (Yellowfin)', value: '34,000 kg' },
              { label: 'Total certified weight', value: '152,000 kg' }
            ]
          },
          {
            title: 'Transport details',
            fields: [
              { label: 'Transport mode', value: 'Vessel' },
              { label: 'Transport document reference', value: 'BL-FRA-2026-0205' },
              { label: 'Container number', value: 'MSCU2205101' },
              { label: 'Country and departure point', value: 'France - Concarneau' }
            ]
          },
          {
            title: 'Catch landing details',
            fields: [
              { label: 'Port of landing', value: 'Grimsby' },
              { label: 'Date of landing', value: '7 August 2026' },
              { label: 'Catch dates', value: '1 July 2026 to 18 July 2026' }
            ]
          }
        ]
      }
    ]
  },
  {
    reference: 'GB-IUU-2026-11001',
    status: 'submitted',
    statusLabel: 'Submitted',
    statusTagClass: 'govuk-tag--blue',
    submittedAt: '2026-09-01T09:00:00Z',
    submittedDisplay: '1 September 2026 at 10:00',
    arrivalOffsetDays: 4,
    arrivalTime: '',
    port: 'Grimsby',
    importer: 'New England Seafood International Ltd',
    origin: 'France',
    exporter: 'SAPMER S.A.',
    species: 'Skipjack Tuna (Katsuwonus pelamis)',
    speciesSummary: 'Skipjack Tuna (Katsuwonus pelamis)',
    scientificName: 'Katsuwonus pelamis',
    commodityCode: '030343',
    weight: '175,564 kg',
    catchCertificateWeight: '175,564 kg',
    transport: 'Vessel - container MSCU1000333',
    vessel: 'BERNICA (IMO 9600853)',
    catchArea: 'FAO 51 - Indian Ocean Western',
    importedSpecies: [
      {
        species: 'Skipjack Tuna',
        scientificName: 'Katsuwonus pelamis',
        declarationStatus: 'Declared',
        commodityCode: '030343',
        notificationWeight: '175,564 kg',
        catchCertificateWeight: '175,564 kg'
      }
    ],
    timeline: [
      { date: '1 September 2026 at 10:00', text: 'Notification submitted' },
      { date: '1 September 2026 at 10:01', text: 'Sent to Grimsby Port Health Authority' }
    ],
    documents: [
      {
        typeSlug: 'catch-certificate',
        type: 'Catch certificate',
        reference: 'FRA 2026 CSP 100124',
        issuer: 'Centre National de Surveillance des Pêches',
        validationStatus: 'Validated',
        validationStatusClass: 'govuk-tag--green',
        species: [
          { species: 'Skipjack tuna', scientificName: 'Katsuwonus pelamis', productCode: '030343', weight: '175,564 kg' }
        ],
        sections: [
          {
            title: 'Document details',
            fields: [
              { label: 'Document number', value: 'FRA 2026 CSP 100124' },
              { label: 'Validating authority', value: 'Centre National de Surveillance des Pêches, 40 Avenue Louis Bougo, BP 48, 56410 Étel, France' },
              { label: 'Product code', value: '030343' },
              { label: 'Catch area', value: 'FAO 51 - Indian Ocean Western' },
              { label: 'Fishing licence', value: 'CTOI-1302/000201' },
              { label: 'Fishing gear', value: 'PS (01.1 Purse Seine)' }
            ]
          },
          {
            title: 'Vessel details',
            fields: [
              { label: 'Vessel name', value: 'BERNICA' },
              { label: 'IMO number', value: '9600853' },
              { label: 'Flag, home port and registration', value: 'FRA - DZAOUDZI - DI 929727' },
              { label: 'Call sign', value: 'FLTZ' }
            ]
          },
          {
            title: 'Exporter and importer details',
            fields: [
              { label: 'Exporter details', value: 'SAPMER S.A., Darse de Pêche, 97420 Le Port, Réunion, France' },
              { label: 'Importer details', value: 'New England Seafood International Ltd, Genesis Way, Healing, Grimsby DN37 9TU, United Kingdom' },
              { label: 'Importer EORI number', value: 'GB987654321000' },
              { label: 'Importer contact details', value: '+44 1472 555 1002' }
            ]
          },
          {
            title: 'Weight data',
            fields: [
              { label: 'Estimated weight to be landed', value: '175,564 kg' },
              { label: 'Net catch weight', value: '174,564 kg' },
              { label: 'Verified weight landed', value: '173,564 kg' },
              { label: 'Net fishery product weight', value: '173,564 kg' }
            ]
          },
          {
            title: 'Transport details',
            fields: [
              { label: 'Transport mode', value: 'Vessel' },
              { label: 'Transport document reference', value: 'BL-FRA-2026-1457' },
              { label: 'Container number', value: 'MSCU1000333' },
              { label: 'Country and departure point', value: 'France (Réunion) - Le Port' },
              { label: 'Point of destination', value: 'United Kingdom' }
            ]
          },
          {
            title: 'Catch landing details',
            fields: [
              { label: 'Port of landing', value: 'Grimsby' },
              { label: 'Date of landing', value: '31 August 2026' },
              { label: 'Catch dates', value: '14 June 2026 to 21 June 2026' }
            ]
          }
        ]
      }
    ]
  },
  {
    reference: 'GB-IUU-2026-11003',
    status: 'action-required',
    statusLabel: 'Action required',
    statusTagClass: 'govuk-tag--red',
    statusMessage: 'There is missing evidence. The Port Health Authority has requested that you provide additional or more up-to-date documents.',
    submittedAt: '2026-09-03T09:00:00Z',
    submittedDisplay: '3 September 2026 at 10:00',
    arrivalOffsetDays: 11,
    arrivalTime: '',
    port: 'Grimsby',
    importer: 'New England Seafood International Ltd',
    origin: 'Spain, France, Seychelles and Chile',
    exporter: 'Multiple exporters',
    species: 'Skipjack Tuna (Katsuwonus pelamis)',
    speciesSummary: 'Skipjack Tuna (Katsuwonus pelamis)',
    scientificName: 'Katsuwonus pelamis',
    commodityCode: '030343',
    weight: '360,000 kg',
    catchCertificateWeight: '360,000 kg',
    transport: 'Vessel - container MSCU1000030',
    vessel: 'Multiple vessels',
    catchArea: 'FAO 51 - Indian Ocean and FAO 87 - South East Pacific',
    importedSpecies: [
      {
        species: 'Skipjack Tuna',
        scientificName: 'Katsuwonus pelamis',
        declarationStatus: 'Declared',
        commodityCode: '030343',
        notificationWeight: '360,000 kg',
        catchCertificateWeight: '360,000 kg'
      }
    ],
    timeline: [
      { date: '3 September 2026 at 10:00', text: 'Notification submitted' },
      { date: '4 September 2026 at 09:30', text: 'Further information requested by Grimsby Port Health Authority' }
    ],
    documents: [
      {
        typeSlug: 'catch-certificate',
        type: 'Catch certificate',
        reference: 'ESP/SGCI/AI/2026/101',
        issuer: 'Secretaría General de Pesca',
        validationStatus: 'Valid',
        validationStatusClass: 'govuk-tag--green',
        species: [
          { species: 'Skipjack tuna', scientificName: 'Katsuwonus pelamis', productCode: '030343', weight: '118,000 kg' }
        ],
        sections: [
          {
            title: 'Document details',
            fields: [
              { label: 'Document number', value: 'ESP/SGCI/AI/2026/101' },
              { label: 'Validating authority', value: 'Secretaría General de Pesca, C/ Velázquez 147, 28002 Madrid, Spain' },
              { label: 'Catch area', value: 'FAO 51 - Indian Ocean' },
              { label: 'Fishing licence', value: 'P0099-6/2026' },
              { label: 'Fishing gear', value: 'PS (01.1 Purse Seine)' }
            ]
          },
          {
            title: 'Vessel details',
            fields: [
              { label: 'Vessel name', value: 'ELAI ALAI' },
              { label: 'IMO number', value: '9046966' },
              { label: 'Flag, home port and registration', value: 'Spain - Bermeo - 3ªBI-2-1-93' },
              { label: 'Call sign', value: 'EAIW' }
            ]
          },
          {
            title: 'Exporter and importer details',
            fields: [
              { label: 'Exporter details', value: 'ECHEBASTAR FLEET SLU, Muelle Erroxape S/N, 48370 Bermeo, Spain' },
              { label: 'Importer details', value: 'New England Seafood International Ltd, Genesis Way, Healing, Grimsby DN37 9TU, United Kingdom' }
            ]
          },
          {
            title: 'Weight data',
            fields: [
              { label: 'Estimated weight to be landed', value: '120,000 kg' },
              { label: 'Net catch weight', value: '119,000 kg' },
              { label: 'Verified weight landed', value: '118,000 kg' },
              { label: 'Net fishery product weight', value: '116,500 kg' }
            ]
          },
          {
            title: 'Transport details',
            fields: [
              { label: 'Transport document reference', value: 'BL-ESP-2026-0001' },
              { label: 'Container number', value: 'MSCU1000030' },
              { label: 'Point of departure', value: 'Seychelles - Port Victoria' },
              { label: 'Point of destination', value: 'United Kingdom' }
            ]
          },
          {
            title: 'Catch landing details',
            fields: [
              { label: 'Landing port', value: 'Grimsby' },
              { label: 'Landing date', value: '9 December 2026' },
              { label: 'Catch dates', value: '1 June 2026 to 18 June 2026' }
            ]
          }
        ]
      },
      {
        typeSlug: 'catch-certificate',
        type: 'Catch certificate',
        reference: 'FRA 2026 CSP 000101',
        issuer: 'Centre National de Surveillance des Pêches',
        validationStatus: 'Valid',
        validationStatusClass: 'govuk-tag--green',
        species: [
          { species: 'Skipjack tuna', scientificName: 'Katsuwonus pelamis', productCode: '030343', weight: '78,000 kg' }
        ],
        sections: [
          {
            title: 'Document details',
            fields: [
              { label: 'Document number', value: 'FRA 2026 CSP 000101' },
              { label: 'Validating authority', value: 'Centre National de Surveillance des Pêches, 40 Avenue Louis Bougo, BP 48, 56410 Étel, France' },
              { label: 'Catch area', value: 'FAO 51 - Indian Ocean Western' },
              { label: 'Fishing licence', value: 'CTOI-1302/000201' },
              { label: 'Fishing gear', value: 'PS (01.1 Purse Seine)' }
            ]
          },
          {
            title: 'Vessel details',
            fields: [
              { label: 'Vessel name', value: 'BERNICA' },
              { label: 'IMO number', value: '9600853' },
              { label: 'Flag, home port and registration', value: 'France - Dzaoudzi - DI 929727' },
              { label: 'Call sign', value: 'FLTZ' }
            ]
          },
          {
            title: 'Exporter and importer details',
            fields: [
              { label: 'Exporter details', value: 'SAPMER S.A., Darse de Pêche, 97420 Le Port, Réunion, France' },
              { label: 'Importer details', value: 'New England Seafood International Ltd, Genesis Way, Healing, Grimsby DN37 9TU, United Kingdom' }
            ]
          },
          {
            title: 'Weight data',
            fields: [
              { label: 'Estimated weight to be landed', value: '80,500 kg' },
              { label: 'Net catch weight', value: '79,200 kg' },
              { label: 'Verified weight landed', value: '78,000 kg' },
              { label: 'Net fishery product weight', value: '76,800 kg' }
            ]
          },
          {
            title: 'Transport details',
            fields: [
              { label: 'Transport document reference', value: 'BL-FRA-2026-0002' },
              { label: 'Container number', value: 'MSCU1000030' },
              { label: 'Point of departure', value: 'France (Réunion) - Le Port' },
              { label: 'Point of destination', value: 'United Kingdom' }
            ]
          },
          {
            title: 'Catch landing details',
            fields: [
              { label: 'Landing port', value: 'Grimsby' },
              { label: 'Landing date', value: '9 December 2026' },
              { label: 'Catch dates', value: '4 June 2026 to 21 June 2026' }
            ]
          }
        ]
      },
      {
        typeSlug: 'catch-certificate',
        type: 'Catch certificate',
        reference: 'SYC/SFA/10/2026-SW0454',
        issuer: 'Seychelles Fishing Authority',
        validationStatus: 'Missing from processing statement',
        validationStatusClass: 'govuk-tag--red',
        species: [
          { species: 'Skipjack tuna', scientificName: 'Katsuwonus pelamis', productCode: '030343', weight: '64,000 kg' }
        ],
        sections: [
          {
            title: 'Document details',
            fields: [
              { label: 'Document number', value: 'SYC/SFA/10/2026-SW0454' },
              { label: 'Validating authority', value: 'Seychelles Fishing Authority, Fishing Port, Victoria, Mahé, Seychelles' },
              { label: 'Catch area', value: 'FAO 51 - Indian Ocean' },
              { label: 'Fishing licence', value: 'SYC-171702' },
              { label: 'Fishing gear', value: 'PS (01.1 Purse Seine)' }
            ]
          },
          {
            title: 'Vessel details',
            fields: [
              { label: 'Vessel name', value: 'OCEAN VOYAGER' },
              { label: 'IMO number', value: '9800006' },
              { label: 'Flag, home port and registration', value: 'Seychelles - Victoria - SYC7721' },
              { label: 'Call sign', value: 'OVGR' }
            ]
          },
          {
            title: 'Exporter and importer details',
            fields: [
              { label: 'Exporter details', value: 'Indian Ocean Tuna Exports Ltd, New Port, Victoria, Mahé, Seychelles' },
              { label: 'Importer details', value: 'New England Seafood International Ltd, Genesis Way, Healing, Grimsby DN37 9TU, United Kingdom' }
            ]
          },
          {
            title: 'Weight data',
            fields: [
              { label: 'Estimated weight to be landed', value: '66,200 kg' },
              { label: 'Net catch weight', value: '65,000 kg' },
              { label: 'Verified weight landed', value: '64,000 kg' },
              { label: 'Net fishery product weight', value: '62,700 kg' }
            ]
          },
          {
            title: 'Transport details',
            fields: [
              { label: 'Transport document reference', value: 'BL-SYC-2026-0003' },
              { label: 'Container number', value: 'MSCU1000030' },
              { label: 'Point of departure', value: 'Seychelles - Port Victoria' },
              { label: 'Point of destination', value: 'United Kingdom' }
            ]
          },
          {
            title: 'Catch landing details',
            fields: [
              { label: 'Landing port', value: 'Grimsby' },
              { label: 'Landing date', value: '9 December 2026' },
              { label: 'Catch dates', value: '12 June 2026 to 28 June 2026' }
            ]
          }
        ]
      },
      {
        typeSlug: 'catch-certificate',
        type: 'Catch certificate',
        reference: 'CL-2026-44-000079-N',
        sourceFile: 'CL-2026-44-000079-N.pdf',
        issuer: 'Servicio Nacional de Pesca y Acuicultura',
        validationStatus: 'Valid',
        validationStatusClass: 'govuk-tag--green',
        species: [
          { species: 'Skipjack tuna', scientificName: 'Katsuwonus pelamis', productCode: '030343', weight: '100,000 kg' }
        ],
        sections: [
          {
            title: 'Document details',
            fields: [
              { label: 'Document number', value: 'CL-2026-44-000079-N' },
              { label: 'Validating authority', value: 'Servicio Nacional de Pesca y Acuicultura, Victoria 2832, Valparaíso, Chile' },
              { label: 'Catch area', value: 'FAO 87 - South East Pacific' },
              { label: 'Fishing licence', value: 'CL-PS-2026-079' },
              { label: 'Fishing gear', value: 'PS (01.1 Purse Seine)' }
            ]
          },
          {
            title: 'Vessel details',
            fields: [
              { label: 'Vessel name', value: 'PACIFIC DAWN' },
              { label: 'IMO number', value: '9800005' },
              { label: 'Flag, home port and registration', value: 'Chile - Valparaíso - CL55092' },
              { label: 'Call sign', value: 'PDWN' }
            ]
          },
          {
            title: 'Exporter and importer details',
            fields: [
              { label: 'Exporter details', value: 'Pacific Seafood Chile S.A., Muelle Prat 887, Valparaíso, Chile' },
              { label: 'Importer details', value: 'New England Seafood International Ltd, Genesis Way, Healing, Grimsby DN37 9TU, United Kingdom' }
            ]
          },
          {
            title: 'Weight data',
            fields: [
              { label: 'Estimated weight to be landed', value: '102,000 kg' },
              { label: 'Net catch weight', value: '100,800 kg' },
              { label: 'Verified weight landed', value: '100,000 kg' },
              { label: 'Net fishery product weight', value: '98,400 kg' }
            ]
          },
          {
            title: 'Transport details',
            fields: [
              { label: 'Transport document reference', value: 'BL-CL-2026-0004' },
              { label: 'Container number', value: 'MSCU1000030' },
              { label: 'Point of departure', value: 'Chile - Valparaíso' },
              { label: 'Point of destination', value: 'United Kingdom' }
            ]
          },
          {
            title: 'Catch landing details',
            fields: [
              { label: 'Landing port', value: 'Grimsby' },
              { label: 'Landing date', value: '9 December 2026' },
              { label: 'Catch dates', value: '20 June 2026 to 8 July 2026' }
            ]
          }
        ]
      },
      {
        typeSlug: 'processing-statement',
        type: 'Processing statement',
        reference: 'CATCH.PS.PT.2026.0001149',
        sourceFile: 'CATCH.PS.PT.2026.0001149 (Exp. 0125-26-GB).pdf',
        issuer: 'EUROPEAN SEAFOOD INVESTMENTS PORTUGAL S.A.',
        validationStatus: 'Missing evidence',
        validationStatusClass: 'govuk-tag--red',
        species: [
          { species: 'Skipjack tuna', scientificName: 'Katsuwonus pelamis', productCode: '030343', weight: '257,400 kg' }
        ],
        sections: [
          {
            title: 'Processing details',
            fields: [
              { label: 'Document number', value: 'CATCH.PS.PT.2026.0001149' },
              { label: 'Processing country', value: 'Portugal' },
              { label: 'Approved establishment', value: 'EUROPEAN SEAFOOD INVESTMENTS PORTUGAL S.A.' },
              { label: 'Catch certificate references', references: ['ESP/SGCI/AI/2026/101', 'FRA 2026 CSP 000101', 'CL-2026-44-000079-N'] }
            ]
          },
          {
            title: 'Weight data',
            fields: [
              { label: 'Total landed weight', value: '296,000 kg' },
              { label: 'Catch processed weight', value: '286,000 kg' },
              { label: 'Processed fishery product weight', value: '257,400 kg' }
            ]
          },
          {
            title: 'Missing evidence',
            fields: [
              { label: 'Catch certificate not referenced', references: ['SYC/SFA/10/2026-SW0454'] },
              { label: 'Unrepresented certified weight', value: '64,000 kg' }
            ]
          }
        ]
      }
    ]
  }
]

const unavailableRecords = [
  {
    reference: 'GB-IUU-2026-11004',
    importer: 'Atlantic Tuna Imports Ltd',
    origin: 'Spain',
    submittedAt: '2026-09-01T10:05:00Z',
    submittedDisplay: '1 September 2026 at 11:05',
    arrivalOffsetDays: 5,
    arrivalTime: '08:30',
    port: 'Dover',
    exporter: 'Conservas del Mediterraneo S.L.',
    commodityCodes: ['03048720'],
    species: 'Bluefin tuna loins',
    declaredWeightKg: 9700,
    catchCertificateCount: 2,
    processingStatementCount: 1,
    nmdCount: 1,
    additionalDocumentCount: 1,
    inspectionStatus: 'REQUIRES_DOCUMENT_CHECK'
  },
  {
    reference: 'GB-IUU-2026-11005',
    importer: 'Harbour Catch Imports',
    origin: 'Ecuador',
    submittedAt: '2026-09-01T14:20:00Z',
    submittedDisplay: '1 September 2026 at 15:20',
    arrivalOffsetDays: 6,
    arrivalTime: '16:20',
    port: 'Felixstowe',
    exporter: 'Pacific Tuna Ecuador S.A.',
    commodityCodes: ['16041416'],
    species: 'Skipjack tuna (SKJ)',
    declaredWeightKg: 4200,
    catchCertificateCount: 2,
    processingStatementCount: 2,
    nmdCount: 0,
    additionalDocumentCount: 3,
    inspectionStatus: 'REFERRED_TO_MMO'
  },
  {
    reference: 'GB-IUU-2026-11006',
    importer: 'Ocean Harvest Imports',
    origin: 'Iceland',
    submittedAt: '2026-09-02T13:15:00Z',
    submittedDisplay: '2 September 2026 at 14:15',
    arrivalOffsetDays: 7,
    arrivalTime: '13:10',
    port: 'Grimsby',
    exporter: 'Arctic Fish Export ehf.',
    commodityCodes: ['03047400'],
    species: 'Haddock fillets',
    declaredWeightKg: 5600,
    catchCertificateCount: 1,
    processingStatementCount: 1,
    nmdCount: 1,
    additionalDocumentCount: 0,
    inspectionStatus: 'COMPLETED'
  },
  {
    reference: 'GB-IUU-2026-11007',
    importer: 'Atlantic Seafoods Ltd',
    origin: 'Mauritius',
    submittedAt: '2026-08-31T09:45:00Z',
    submittedDisplay: '31 August 2026 at 10:45',
    arrivalOffsetDays: 9,
    arrivalTime: '10:45',
    port: 'Portsmouth',
    exporter: 'Mauritius Ocean Products Ltd',
    commodityCodes: ['03038955'],
    species: 'Swordfish steaks',
    declaredWeightKg: 8800,
    catchCertificateCount: 2,
    processingStatementCount: 1,
    nmdCount: 0,
    additionalDocumentCount: 1,
    inspectionStatus: 'REQUIRES_DOCUMENT_CHECK'
  },
  {
    reference: 'GB-IUU-2026-11008',
    importer: 'New England Seafood International',
    origin: 'Morocco',
    submittedAt: '2026-08-31T08:25:00Z',
    submittedDisplay: '31 August 2026 at 09:25',
    arrivalOffsetDays: 10,
    arrivalTime: '09:25',
    port: 'Dover',
    exporter: 'Atlas Seafood Export SARL',
    commodityCodes: ['03049999', '03038910'],
    species: 'Octopus',
    declaredWeightKg: 7100,
    catchCertificateCount: 2,
    processingStatementCount: 2,
    nmdCount: 1,
    additionalDocumentCount: 2,
    inspectionStatus: 'IN_PROGRESS'
  },
  {
    reference: 'GB-IUU-2026-11009',
    importer: 'Frinsa UK',
    origin: 'India',
    submittedAt: '2026-08-30T14:35:00Z',
    submittedDisplay: '30 August 2026 at 15:35',
    arrivalOffsetDays: 12,
    arrivalTime: '15:35',
    port: 'Felixstowe',
    exporter: 'Kerala Marine Exports Pvt Ltd',
    commodityCodes: ['16052110'],
    species: 'Prawns',
    declaredWeightKg: 3900,
    catchCertificateCount: 1,
    processingStatementCount: 1,
    nmdCount: 0,
    additionalDocumentCount: 1,
    inspectionStatus: 'IN_PROGRESS'
  },
  {
    reference: 'GB-IUU-2026-11010',
    importer: 'Atlantic Tuna Imports Ltd',
    origin: 'Ghana',
    submittedAt: '2026-09-02T11:05:00Z',
    submittedDisplay: '2 September 2026 at 12:05',
    arrivalOffsetDays: 14,
    arrivalTime: '12:05',
    port: 'Heathrow',
    exporter: 'Tema Tuna Exports Ltd',
    commodityCodes: ['03023210'],
    species: 'Fresh tuna',
    declaredWeightKg: 2400,
    catchCertificateCount: 1,
    processingStatementCount: 0,
    nmdCount: 1,
    additionalDocumentCount: 2,
    inspectionStatus: 'REQUEST_ADDITIONAL_INFORMATION'
  },
  {
    reference: 'GB-IUU-2026-11011',
    importer: 'Harbour Catch Imports',
    origin: 'Vietnam',
    submittedAt: '2026-08-30T06:50:00Z',
    submittedDisplay: '30 August 2026 at 07:50',
    arrivalOffsetDays: 15,
    arrivalTime: '07:50',
    port: 'Felixstowe',
    exporter: 'Viet Ocean Seafood Co. Ltd',
    commodityCodes: ['03061792'],
    species: 'Crab meat',
    declaredWeightKg: 5200,
    catchCertificateCount: 3,
    processingStatementCount: 2,
    nmdCount: 0,
    additionalDocumentCount: 1,
    inspectionStatus: 'REFERRED_TO_MMO'
  },
  {
    reference: 'GB-IUU-2026-10482',
    importer: 'Atlantic Seafoods Ltd',
    origin: 'Senegal',
    submittedAt: '2026-08-29T13:30:00Z',
    submittedDisplay: '29 August 2026 at 14:30',
    arrivalOffsetDays: 17,
    arrivalTime: '14:30',
    port: 'Portsmouth',
    exporter: 'Dakar Tuna Export SA',
    commodityCodes: ['03034320'],
    species: 'Frozen yellowfin tuna',
    declaredWeightKg: 24800,
    catchCertificateCount: 1,
    processingStatementCount: 1,
    nmdCount: 1,
    additionalDocumentCount: 1,
    inspectionStatus: 'IN_PROGRESS'
  },
  {
    reference: 'GB-IUU-2026-11013',
    importer: 'New England Seafood International',
    origin: 'Namibia',
    submittedAt: '2026-08-29T17:05:00Z',
    submittedDisplay: '29 August 2026 at 18:05',
    arrivalOffsetDays: 19,
    arrivalTime: '18:05',
    port: 'Grimsby',
    exporter: 'Namibia Marine Products Ltd',
    commodityCodes: ['03036611', '03025500'],
    species: 'Hake',
    declaredWeightKg: 11200,
    catchCertificateCount: 2,
    processingStatementCount: 2,
    nmdCount: 1,
    additionalDocumentCount: 0,
    inspectionStatus: 'REQUIRES_DOCUMENT_CHECK'
  },
  {
    reference: 'GB-IUU-2026-11014',
    importer: 'Frinsa UK',
    origin: 'Portugal',
    submittedAt: '2026-09-03T08:40:00Z',
    submittedDisplay: '3 September 2026 at 09:40',
    arrivalOffsetDays: 21,
    arrivalTime: '09:40',
    port: 'Dover',
    exporter: 'Ramirez & Filhos, S.A.',
    commodityCodes: ['16042050'],
    species: 'Prepared sardines',
    declaredWeightKg: 3400,
    catchCertificateCount: 1,
    processingStatementCount: 1,
    nmdCount: 0,
    additionalDocumentCount: 0,
    inspectionStatus: 'COMPLETED'
  },
  {
    reference: 'GB-IUU-2026-11015',
    importer: 'Atlantic Tuna Imports Ltd',
    origin: 'Thailand',
    submittedAt: '2026-08-28T10:55:00Z',
    submittedDisplay: '28 August 2026 at 11:55',
    arrivalOffsetDays: 24,
    arrivalTime: '11:55',
    port: 'Felixstowe',
    exporter: 'Thai Union Manufacturing Co. Ltd',
    commodityCodes: ['16041418'],
    species: 'Canned tuna',
    declaredWeightKg: 9100,
    catchCertificateCount: 3,
    processingStatementCount: 2,
    nmdCount: 0,
    additionalDocumentCount: 4,
    inspectionStatus: 'REQUEST_ADDITIONAL_INFORMATION'
  },
  {
    reference: 'GB-IUU-2026-11016',
    importer: 'Ocean Harvest Imports',
    origin: 'Indonesia',
    submittedAt: '2026-08-28T07:10:00Z',
    submittedDisplay: '28 August 2026 at 08:10',
    arrivalOffsetDays: 27,
    arrivalTime: '08:10',
    port: 'Felixstowe',
    exporter: 'Nusantara Fisheries Ltd',
    commodityCodes: ['03035400'],
    species: 'Mackerel',
    declaredWeightKg: 7600,
    catchCertificateCount: 2,
    processingStatementCount: 1,
    nmdCount: 1,
    additionalDocumentCount: 2,
    inspectionStatus: 'IN_PROGRESS'
  },
  {
    reference: 'GB-IUU-2026-11017',
    importer: 'Atlantic Seafoods Ltd',
    origin: 'Peru',
    submittedAt: '2026-08-27T15:45:00Z',
    submittedDisplay: '27 August 2026 at 16:45',
    arrivalOffsetDays: 31,
    arrivalTime: '16:45',
    port: 'London Gateway',
    exporter: 'Pacific Anchovy Peru S.A.C.',
    commodityCodes: ['03044990'],
    species: 'Anchovy fillets',
    declaredWeightKg: 2800,
    catchCertificateCount: 2,
    processingStatementCount: 1,
    nmdCount: 0,
    additionalDocumentCount: 1,
    inspectionStatus: 'REQUIRES_DOCUMENT_CHECK'
  },
  {
    reference: 'GB-IUU-2026-11018',
    importer: 'New England Seafood International',
    origin: 'Canada',
    submittedAt: '2026-08-27T11:20:00Z',
    submittedDisplay: '27 August 2026 at 12:20',
    arrivalOffsetDays: 34,
    arrivalTime: '12:20',
    port: 'Liverpool',
    exporter: 'Atlantic Canada Seafoods Ltd',
    commodityCodes: ['03036700'],
    species: 'Pollock',
    declaredWeightKg: 6700,
    catchCertificateCount: 2,
    processingStatementCount: 2,
    nmdCount: 1,
    additionalDocumentCount: 1,
    inspectionStatus: 'REFERRED_TO_MMO'
  },
  {
    reference: 'GB-IUU-2026-11019',
    importer: 'Frinsa UK',
    origin: 'Chile',
    submittedAt: '2026-08-26T09:05:00Z',
    submittedDisplay: '26 August 2026 at 10:05',
    arrivalOffsetDays: 39,
    arrivalTime: '10:05',
    port: 'Felixstowe',
    exporter: 'Patagonia Salmones S.A.',
    commodityCodes: ['03048100'],
    species: 'Salmon portions',
    declaredWeightKg: 5300,
    catchCertificateCount: 1,
    processingStatementCount: 1,
    nmdCount: 1,
    additionalDocumentCount: 2,
    inspectionStatus: 'IN_PROGRESS'
  },
  {
    reference: 'GB-IUU-2026-11020',
    importer: 'Atlantic Tuna Imports Ltd',
    origin: 'South Korea',
    submittedAt: '2026-08-26T16:30:00Z',
    submittedDisplay: '26 August 2026 at 17:30',
    arrivalOffsetDays: 45,
    arrivalTime: '17:30',
    port: 'Felixstowe',
    exporter: 'Busan Ocean Fisheries Co. Ltd',
    commodityCodes: ['03048790', '03049410'],
    species: 'Albacore tuna',
    declaredWeightKg: 14900,
    catchCertificateCount: 4,
    processingStatementCount: 3,
    nmdCount: 1,
    additionalDocumentCount: 4,
    inspectionStatus: 'REQUIRES_DOCUMENT_CHECK'
  }
].map(createUnavailableRecord)

module.exports = [...records, ...unavailableRecords]
  .map(applyArrivalOffset)
  .map((consignment) => ({
    ...consignment,
    port: consignment.port || 'Not provided',
    exporter: consignment.exporter || 'Not provided',
    submittedDisplay: consignment.submittedDisplay || 'Not provided',
    speciesSummary: consignment.speciesSummary || consignment.species,
    commodityCodes: consignment.commodityCodes || [consignment.commodityCode],
    evidenceSections: createEvidenceSections(consignment.documents)
  }))
