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
      { title: 'Landing details', fields: [{ label: 'Port of landing', value: 'Grimsby' }, { label: 'Date of landing', value: '12 September 2026' }, { label: 'Catch dates', value: '1 July 2026 to 18 July 2026' }] }
    ]
  }
}
