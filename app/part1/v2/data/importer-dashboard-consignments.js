const evidenceTypes = [
  { heading: 'Catch certificate', typeSlug: 'catch-certificate' },
  { heading: 'Processing statement', typeSlug: 'processing-statement' },
  { heading: 'Non-manipulation document', typeSlug: 'nmd' },
  { heading: 'Additional documents', typeSlug: 'additional' }
]

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

const records = [
  {
    reference: 'GB-IUU-2026-11002',
    status: 'under-review',
    statusLabel: 'Under review',
    statusTagClass: 'govuk-tag--yellow',
    statusMessage: 'The Port Health Authority is checking a possible commodity and weight mismatch in the catch certificate.',
    submittedAt: '2026-08-28T09:00:00Z',
    submittedDisplay: '28 August 2026 at 10:00',
    arrivalAt: '2026-09-03T08:00:00Z',
    arrivalDisplay: '3 September 2026 at 09:00',
    port: 'Grimsby',
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
    arrivalAt: '2026-09-08T00:00:00Z',
    arrivalDisplay: '8 September 2026',
    port: 'Grimsby',
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
    statusMessage: 'The processing statement does not reference catch certificate SYC/SFA/10/2026-SW0454. Provide an updated processing statement or further supporting evidence.',
    submittedAt: '2026-09-03T09:00:00Z',
    submittedDisplay: '3 September 2026 at 10:00',
    arrivalAt: '2026-12-18T00:00:00Z',
    arrivalDisplay: '18 December 2026',
    port: 'Grimsby',
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

module.exports = records.map((consignment) => ({
  ...consignment,
  speciesSummary: consignment.speciesSummary || consignment.species,
  evidenceSections: createEvidenceSections(consignment.documents)
}))
