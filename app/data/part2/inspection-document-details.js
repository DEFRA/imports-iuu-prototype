const consignmentReference = 'GB-IUU-2026-10482'

module.exports = {
  'CC-SEN-2026-7784': {
    consignmentReference,
    validationStatus: 'Possible mismatch',
    validationStatusClass: 'govuk-tag--yellow',
    species: [
      { species: 'Yellowfin tuna', scientificName: 'Thunnus albacares', productCode: '0303 42 12', weight: '18,600 kg' },
      { species: 'Bigeye tuna', scientificName: 'Thunnus obesus', productCode: '0303 44 10', weight: '6,200 kg' }
    ],
    sections: [
      { title: 'Document details', fields: [{ label: 'Document number', value: 'CC-SEN-2026-7784' }, { label: 'Product code', value: '0303 42 12' }, { label: 'Catch area', value: 'FAO 34 - Eastern Atlantic' }, { label: 'Fishing licence', value: 'SEN-FL-2026-1984' }] },
      { title: 'Vessel details', fields: [{ label: 'Vessel name', value: 'MV Ocean Star' }, { label: 'IMO number', value: '9214567' }] },
      { title: 'Exporter and importer details', fields: [{ label: 'Exporter details', value: 'Dakar Ocean Exports SA, Port de Dakar, Senegal' }, { label: 'Importer details', value: 'Atlantic Seafoods Ltd, Felixstowe, United Kingdom' }] },
      { title: 'Weight data', fields: [{ label: 'Net weight', value: '24,800 kg' }, { label: 'Gross weight', value: '26,100 kg' }, { label: 'Packages', value: '1,240 cartons' }] },
      { title: 'Transport details', fields: [{ label: 'Transport mode', value: 'Container vessel' }, { label: 'Container number', value: 'MSCU 7391842' }, { label: 'Departure port', value: 'Port of Dakar' }] },
      { title: 'Landing details', fields: [{ label: 'Landing port', value: 'Port of Dakar' }, { label: 'Landing date', value: '3 July 2026' }, { label: 'Catch dates', value: '12 June 2026 to 2 July 2026' }] }
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
  }
}