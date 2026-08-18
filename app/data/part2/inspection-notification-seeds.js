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
    statusTagClass: 'govuk-tag--red'
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
