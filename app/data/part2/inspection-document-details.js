const consignmentReference = 'GB-IUU-2026-11001'

module.exports = {
  'FRA-2026-CSP-000205': {
    consignmentReference,
    validationStatus: 'Possible mismatch',
    validationStatusClass: 'govuk-tag--yellow',
    species: [
      { species: 'Skipjack tuna', scientificName: 'Katsuwonus pelamis', productCode: '030343', weight: '118,000 kg' },
      { species: 'Yellowfin tuna', scientificName: 'Thunnus albacares', productCode: '030342', weight: '34,000 kg' }
    ],
    sections: [
      { title: 'Document details', fields: [{ label: 'Document number', value: 'FRA 2026 CSP 000205' }, { label: 'Product code', value: '030343; 030342' }, { label: 'Catch area', value: 'FAO 51 - Indian Ocean Western' }, { label: 'Fishing licence', value: 'CTOI-1302/000205' }] },
      { title: 'Vessel details', fields: [{ label: 'Vessel name', value: 'PENDRUC' }, { label: 'IMO number', value: '9741102' }, { label: 'Call sign', value: 'FIXF' }, { label: 'Flag, home port and registration', value: 'France - Concarneau - CC932207' }] },
      { title: 'Exporter and importer details', fields: [{ label: 'Exporter details', value: 'Compagnie Francaise du Thon Oceanique, 11 Rue des Sardiniers, 29900 Concarneau, France' }, { label: 'Importer details', value: 'New England Seafood International Ltd, Genesis Way, Healing, Grimsby DN37 9TU, United Kingdom' }] },
      { title: 'Weight data', fields: [{ label: 'Certified weight (Skipjack)', value: '118,000 kg' }, { label: 'Certified weight (Yellowfin)', value: '34,000 kg' }, { label: 'Total certified weight', value: '152,000 kg' }] },
      { title: 'Transport details', fields: [{ label: 'Transport mode', value: 'Vessel' }, { label: 'Transport document reference', value: 'BL-FRA-2026-0205' }, { label: 'Container number', value: 'MSCU2205101' }, { label: 'Country and departure point', value: 'France - Concarneau' }] },
      { title: 'Landing details', fields: [{ label: 'Port of landing', value: 'Grimsby' }, { label: 'Date of landing', value: '7 August 2026' }, { label: 'Catch dates', value: '1 July 2026 to 18 July 2026' }] }
    ]
  },
  'FRA-2026-CSP-100124': {
    consignmentReference: 'GB-IUU-2026-11003',
    validationStatus: 'Validated',
    validationStatusClass: 'govuk-tag--green',
    species: [{ species: 'Skipjack Tuna', scientificName: 'Katsuwonus pelamis', productCode: '030343', weight: '175,564 kg' }],
    sections: [
      { title: 'Document details', fields: [{ label: 'Document number', value: 'FRA 2026 CSP 100124' }, { label: 'Validating authority', value: 'Centre National de Surveillance des Pêches, 40 Avenue Louis Bougo, BP 48, 56410 Étel, France' }, { label: 'Product code', value: '030343' }, { label: 'Catch area', value: 'FAO 51 - Indian Ocean Western' }, { label: 'Fishing licence', value: 'CTOI-1302/000201' }, { label: 'Fishing gear', value: 'PS (01.1 Purse Seine)' }] },
      { title: 'Vessel details', fields: [{ label: 'Vessel name', value: 'BERNICA' }, { label: 'IMO number', value: '9600853' }, { label: 'Flag, home port and registration', value: 'FRA - DZAOUDZI - DI 929727' }, { label: 'Call sign', value: 'FLTZ' }] },
      { title: 'Exporter and importer details', fields: [{ label: 'Exporter details', value: 'SAPMER S.A., Darse de Pêche, 97420 Le Port, Réunion, France' }, { label: 'Importer details', value: 'New England Seafood International Ltd, Genesis Way, Healing, Grimsby DN37 9TU, United Kingdom' }, { label: 'Importer EORI number', value: 'GB987654321000' }, { label: 'Importer contact details', value: '+44 1472 555 1002' }] },
      { title: 'Weight data', fields: [{ label: 'Estimated weight to be landed', value: '175,564 kg' }, { label: 'Net catch weight', value: '174,564 kg' }, { label: 'Verified weight landed', value: '173,564 kg' }, { label: 'Net fishery product weight', value: '173,564 kg' }] },
      { title: 'Transport details', fields: [{ label: 'Transport mode', value: 'Vessel' }, { label: 'Transport document reference', value: 'BL-FRA-2026-1457' }, { label: 'Container number', value: 'MSCU1000333' }, { label: 'Country and departure point', value: 'France (Réunion) - Le Port' }, { label: 'Point of destination', value: 'United Kingdom' }] },
      { title: 'Landing details', fields: [{ label: 'Port of landing', value: 'Grimsby' }, { label: 'Date of landing', value: '31 August 2026' }, { label: 'Catch dates', value: '14 June 2026 to 21 June 2026' }] }
    ]
  },
  'CC-SEN-2026-7785': {
    consignmentReference,
    validationStatus: 'Valid',
    validationStatusClass: 'govuk-tag--green',
    species: [{ species: 'Yellowfin tuna', scientificName: 'Thunnus albacares', productCode: '0303 42 12', weight: '6,200 kg' }],
    sections: [
      { title: 'Document details', fields: [{ label: 'Document number', value: 'CC-SEN-2026-7785' }, { label: 'Product code', value: '0303 42 12' }, { label: 'Catch area', value: 'FAO 34 - Eastern Atlantic' }, { label: 'Fishing licence', value: 'SEN-FL-2026-2011' }] },
      { title: 'Vessel details', fields: [{ label: 'Vessel name', value: 'FV Teranga' }, { label: 'IMO number', value: '9351080' }] },
      { title: 'Exporter and importer details', fields: [{ label: 'Exporter details', value: 'Dakar Ocean Exports SA, Port de Dakar, Senegal' }, { label: 'Importer details', value: 'Atlantic Seafoods Ltd, Felixstowe, United Kingdom' }] },
      { title: 'Weight data', fields: [{ label: 'Net weight', value: '6,200 kg' }, { label: 'Gross weight', value: '6,540 kg' }, { label: 'Packages', value: '310 cartons' }] },
      { title: 'Transport details', fields: [{ label: 'Transport mode', value: 'Container vessel' }, { label: 'Container number', value: 'MSCU 7391842' }, { label: 'Departure port', value: 'Port of Dakar' }] },
      { title: 'Landing details', fields: [{ label: 'Landing port', value: 'Port of Dakar' }, { label: 'Landing date', value: '4 July 2026' }, { label: 'Catch dates', value: '18 June 2026 to 3 July 2026' }] }
    ]
  },
  'PS-SEN-2026-0441': {
    consignmentReference,
    validationStatus: 'Valid',
    validationStatusClass: 'govuk-tag--green',
    species: [
      { species: 'Yellowfin tuna', scientificName: 'Thunnus albacares', productCode: '0304 87 00', weight: '18,600 kg' },
      { species: 'Bigeye tuna', scientificName: 'Thunnus obesus', productCode: '0304 87 00', weight: '6,200 kg' }
    ],
    sections: [
      { title: 'Processing details', fields: [{ label: 'Processing country', value: 'Senegal' }, { label: 'Approved establishment', value: 'Dakar Fish Processing SAS (SEN-PP-041)' }, { label: 'Catch certificate references', references: ['CC-SEN-2026-7784', 'CC-SEN-2026-7785'] }] },
      { title: 'Weight data', fields: [{ label: 'Total landed weight', value: '31,000 kg' }, { label: 'Processed weight', value: '24,800 kg' }] }
    ]
  },
  'PS-SEN-2026-0442': {
    consignmentReference,
    validationStatus: 'Valid',
    validationStatusClass: 'govuk-tag--green',
    species: [{ species: 'Yellowfin tuna', scientificName: 'Thunnus albacares', productCode: '0304 87 00', weight: '6,200 kg' }],
    sections: [
      { title: 'Processing details', fields: [{ label: 'Processing country', value: 'Senegal' }, { label: 'Approved establishment', value: 'Dakar Fish Processing SAS (SEN-PP-041)' }, { label: 'Catch certificate references', references: ['CC-SEN-2026-7785'] }] },
      { title: 'Weight data', fields: [{ label: 'Total landed weight', value: '7,750 kg' }, { label: 'Processed weight', value: '6,200 kg' }] }
    ]
  },
  'NMD-MMO-2026-0093': {
    consignmentReference,
    validationStatus: 'Valid',
    validationStatusClass: 'govuk-tag--green',
    species: [
      { species: 'Yellowfin tuna', scientificName: 'Thunnus albacares', productCode: '0304 87 00', weight: '18,600 kg' },
      { species: 'Bigeye tuna', scientificName: 'Thunnus obesus', productCode: '0304 87 00', weight: '6,200 kg' }
    ],
    sections: [
      { title: 'Declaration details', fields: [{ label: 'Storage country', value: 'United Kingdom' }, { label: 'Catch certificate references', references: ['CC-SEN-2026-7784', 'CC-SEN-2026-7785'] }] },
      { title: 'Weight data', fields: [{ label: 'Weight in', value: '24,800 kg' }, { label: 'Weight out', value: '24,800 kg' }] },
      { title: 'Dates', fields: [{ label: 'Storage dates', value: '12 July 2026 to 15 July 2026' }, { label: 'Movement dates', value: '15 July 2026 to 16 July 2026' }] }
    ]
  },
  'NMD-MMO-2026-0094': {
    consignmentReference,
    validationStatus: 'Valid',
    validationStatusClass: 'govuk-tag--green',
    species: [{ species: 'Yellowfin tuna', scientificName: 'Thunnus albacares', productCode: '0304 87 00', weight: '6,200 kg' }],
    sections: [
      { title: 'Declaration details', fields: [{ label: 'Storage country', value: 'United Kingdom' }, { label: 'Catch certificate references', references: ['CC-SEN-2026-7785'] }] },
      { title: 'Weight data', fields: [{ label: 'Weight in', value: '6,200 kg' }, { label: 'Weight out', value: '6,200 kg' }] },
      { title: 'Dates', fields: [{ label: 'Storage dates', value: '13 July 2026 to 16 July 2026' }, { label: 'Movement dates', value: '16 July 2026 to 17 July 2026' }] }
    ]
  },
  'BOL-2026-55190': {
    consignmentReference,
    validationStatus: 'Received',
    validationStatusClass: 'govuk-tag--blue',
    species: [],
    sections: [{ title: 'Document details', fields: [{ label: 'Document type', value: 'Bill of lading' }, { label: 'Container number', value: 'MSCU 7391842' }, { label: 'Date issued', value: '16 July 2026' }] }]
  },
  'ESP/SGCI/AI/2026/101': {
    consignmentReference: 'GB-IUU-2026-11002',
    validationStatus: 'Valid',
    validationStatusClass: 'govuk-tag--green',
    species: [{ species: 'Skipjack Tuna', scientificName: 'Katsuwonus pelamis', productCode: '0303 43', weight: '118,000 kg' }],
    sections: [
      { title: 'Document details', fields: [{ label: 'Document number', value: 'ESP/SGCI/AI/2026/101' }, { label: 'Validating authority', value: 'Secretaría General de Pesca, C/ Velázquez 147, 28002 Madrid, Spain' }, { label: 'Catch area', value: 'FAO 51 - Indian Ocean' }, { label: 'Fishing licence', value: 'P0099-6/2026' }, { label: 'Fishing gear', value: 'PS (01.1 Purse Seine)' }] },
      { title: 'Vessel details', fields: [{ label: 'Vessel name', value: 'ELAI ALAI' }, { label: 'IMO number', value: '9046966' }, { label: 'Flag, home port and registration', value: 'ESPAÑA - BERMEO - 3ªBI-2-1-93' }, { label: 'Call sign', value: 'EAIW' }] },
      { title: 'Exporter and importer details', fields: [{ label: 'Exporter details', value: 'ECHEBASTAR FLEET SLU, Muelle Erroxape S/N, 48370 Bermeo, Spain' }, { label: 'Importer details', value: 'New England Seafood International Ltd, Genesis Way, Healing, Grimsby DN37 9TU' }] },
      { title: 'Weight data', fields: [{ label: 'Estimated weight to be landed', value: '120,000 kg' }, { label: 'Net catch weight', value: '119,000 kg' }, { label: 'Verified weight landed', value: '118,000 kg' }, { label: 'Net fishery product weight', value: '116,500 kg' }] },
      { title: 'Transport details', fields: [{ label: 'Transport document reference', value: 'BL-ESP-2026-0001' }, { label: 'Container number', value: 'MSCU1000030' }, { label: 'Point of departure', value: 'Seychelles - Port Victoria' }, { label: 'Point of destination', value: 'United Kingdom' }] },
      { title: 'Landing details', fields: [{ label: 'Landing port', value: 'Grimsby' }, { label: 'Landing date', value: '9 December 2026' }, { label: 'Catch dates', value: '1 June 2026 to 18 June 2026' }] }
    ]
  },
  'FRA 2026 CSP 000101': {
    consignmentReference: 'GB-IUU-2026-11002',
    validationStatus: 'Valid',
    validationStatusClass: 'govuk-tag--green',
    species: [{ species: 'Skipjack Tuna', scientificName: 'Katsuwonus pelamis', productCode: '0303 43', weight: '78,000 kg' }],
    sections: [
      { title: 'Document details', fields: [{ label: 'Document number', value: 'FRA 2026 CSP 000101' }, { label: 'Validating authority', value: 'Centre National de Surveillance des Pêches, 40 Avenue Louis Bougo, BP 48, 56410 Étel, France' }, { label: 'Catch area', value: 'FAO 51 - Indian Ocean Western' }, { label: 'Fishing licence', value: 'CTOI-1302/000201' }, { label: 'Fishing gear', value: 'PS (01.1 Purse Seine)' }] },
      { title: 'Vessel details', fields: [{ label: 'Vessel name', value: 'BERNICA' }, { label: 'IMO number', value: '9600853' }, { label: 'Flag, home port and registration', value: 'FRA - DZAOUDZI - DI 929727' }, { label: 'Call sign', value: 'FLTZ' }] },
      { title: 'Exporter and importer details', fields: [{ label: 'Exporter details', value: 'SAPMER S.A., Darse de Pêche, 97420 Le Port, Réunion, France' }, { label: 'Importer details', value: 'New England Seafood International Ltd, Genesis Way, Healing, Grimsby DN37 9TU, United Kingdom' }] },
      { title: 'Weight data', fields: [{ label: 'Estimated weight to be landed', value: '80,500 kg' }, { label: 'Net catch weight', value: '79,200 kg' }, { label: 'Verified weight landed', value: '78,000 kg' }, { label: 'Net fishery product weight', value: '76,800 kg' }] },
      { title: 'Transport details', fields: [{ label: 'Transport document reference', value: 'BL-FRA-2026-0002' }, { label: 'Container number', value: 'MSCU1000030' }, { label: 'Point of departure', value: 'France (Réunion) - Le Port' }, { label: 'Point of destination', value: 'United Kingdom' }] },
      { title: 'Landing details', fields: [{ label: 'Landing port', value: 'Grimsby' }, { label: 'Landing date', value: '9 December 2026' }, { label: 'Catch dates', value: '4 June 2026 to 21 June 2026' }] }
    ]
  },
  'SYC/SFA/10/2026-SW0454': {
    consignmentReference: 'GB-IUU-2026-11002',
    validationStatus: 'Missing from processing statement',
    validationStatusClass: 'govuk-tag--red',
    species: [{ species: 'Skipjack Tuna', scientificName: 'Katsuwonus pelamis', productCode: '0303 43', weight: '64,000 kg' }],
    sections: [
      { title: 'Document details', fields: [{ label: 'Document number', value: 'SYC/SFA/10/2026-SW0454' }, { label: 'Validating authority', value: 'Seychelles Fishing Authority, Fishing Port, Victoria, Mahé, Seychelles' }, { label: 'Catch area', value: 'FAO 51 - Indian Ocean' }, { label: 'Fishing licence', value: 'SYC-171702' }, { label: 'Fishing gear', value: 'PS (01.1 Purse Seine)' }] },
      { title: 'Vessel details', fields: [{ label: 'Vessel name', value: 'OCEAN VOYAGER' }, { label: 'IMO number', value: '9800006' }, { label: 'Flag, home port and registration', value: 'SEYCHELLES - VICTORIA - SYC7721' }, { label: 'Call sign', value: 'OVGR' }] },
      { title: 'Exporter and importer details', fields: [{ label: 'Exporter details', value: 'Indian Ocean Tuna Exports Ltd, New Port, Victoria, Mahé, Seychelles' }, { label: 'Importer details', value: 'New England Seafood International Ltd, Genesis Way, Healing, Grimsby DN37 9TU, United Kingdom' }] },
      { title: 'Weight data', fields: [{ label: 'Estimated weight to be landed', value: '66,200 kg' }, { label: 'Net catch weight', value: '65,000 kg' }, { label: 'Verified weight landed', value: '64,000 kg' }, { label: 'Net fishery product weight', value: '62,700 kg' }] },
      { title: 'Transport details', fields: [{ label: 'Transport document reference', value: 'BL-SYC-2026-0003' }, { label: 'Container number', value: 'MSCU1000030' }, { label: 'Point of departure', value: 'Seychelles - Port Victoria' }, { label: 'Point of destination', value: 'United Kingdom' }] },
      { title: 'Landing details', fields: [{ label: 'Landing port', value: 'Grimsby' }, { label: 'Landing date', value: '9 December 2026' }, { label: 'Catch dates', value: '12 June 2026 to 28 June 2026' }] }
    ]
  },
  'CL-2026-44-000079-N': {
    consignmentReference: 'GB-IUU-2026-11002',
    validationStatus: 'Valid',
    validationStatusClass: 'govuk-tag--green',
    species: [{ species: 'Skipjack Tuna', scientificName: 'Katsuwonus pelamis', productCode: '0303 43', weight: '100,000 kg' }],
    sections: [
      { title: 'Document details', fields: [{ label: 'Document number', value: 'CL-2026-44-000079-N' }, { label: 'Validating authority', value: 'Servicio Nacional de Pesca y Acuicultura, Victoria 2832, Valparaíso, Chile' }, { label: 'Catch area', value: 'FAO 87 - South East Pacific' }, { label: 'Fishing licence', value: 'CL-PS-2026-079' }, { label: 'Fishing gear', value: 'PS (01.1 Purse Seine)' }] },
      { title: 'Vessel details', fields: [{ label: 'Vessel name', value: 'PACIFIC DAWN' }, { label: 'IMO number', value: '9800005' }, { label: 'Flag, home port and registration', value: 'CHILE - VALPARAISO - CL55092' }, { label: 'Call sign', value: 'PDWN' }] },
      { title: 'Exporter and importer details', fields: [{ label: 'Exporter details', value: 'Pacific Seafood Chile S.A., Muelle Prat 887, Valparaíso, Chile' }, { label: 'Importer details', value: 'New England Seafood International Ltd, Genesis Way, Healing, Grimsby DN37 9TU, United Kingdom' }] },
      { title: 'Weight data', fields: [{ label: 'Estimated weight to be landed', value: '102,000 kg' }, { label: 'Net catch weight', value: '100,800 kg' }, { label: 'Verified weight landed', value: '100,000 kg' }, { label: 'Net fishery product weight', value: '98,400 kg' }] },
      { title: 'Transport details', fields: [{ label: 'Transport document reference', value: 'BL-CL-2026-0004' }, { label: 'Container number', value: 'MSCU1000030' }, { label: 'Point of departure', value: 'Chile - Valparaíso' }, { label: 'Point of destination', value: 'United Kingdom' }] },
      { title: 'Landing details', fields: [{ label: 'Landing port', value: 'Grimsby' }, { label: 'Landing date', value: '9 December 2026' }, { label: 'Catch dates', value: '20 June 2026 to 8 July 2026' }] }
    ]
  },
  'CATCH.PS.PT.2026.0001149': {
    consignmentReference: 'GB-IUU-2026-11002',
    validationStatus: 'Missing evidence',
    validationStatusClass: 'govuk-tag--red',
    species: [{ species: 'Skipjack Tuna', scientificName: 'Katsuwonus pelamis', productCode: '0303 43', weight: '257,400 kg' }],
    sections: [
      { title: 'Processing details', fields: [{ label: 'Document number', value: 'CATCH.PS.PT.2026.0001149' }, { label: 'Processing country', value: 'Portugal' }, { label: 'Approved establishment', value: 'EUROPEAN SEAFOOD INVESTMENTS PORTUGAL S.A.' }, { label: 'Catch certificate references', references: ['ESP/SGCI/AI/2026/101', 'FRA 2026 CSP 000101', 'CL-2026-44-000079-N'] }] },
      { title: 'Weight data', fields: [{ label: 'Total landed weight', value: '296,000 kg' }, { label: 'Catch processed weight', value: '286,000 kg' }, { label: 'Processed fishery product weight', value: '257,400 kg' }] },
      { title: 'Missing evidence', fields: [{ label: 'Catch certificate not referenced', references: ['SYC/SFA/10/2026-SW0454'] }, { label: 'Unrepresented certified weight', value: '64,000 kg' }] }
    ]
  }
}
