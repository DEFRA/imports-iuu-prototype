const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const consignments = require('../data/importer-dashboard-consignments')
const {
  buildDraftSessionData,
  filterAndSortConsignments,
  getDashboardFilters,
  getFilterOptions,
  getSummaryCards,
  getActiveFilterChips
} = require('./importer-dashboard-service')

test('uses both restored drafts and every dashboard case from part 2', () => {
  assert.deepEqual(consignments.map((item) => item.reference), [
    'Draft notification 001',
    'Draft notification 002',
    'GB-IUU-2026-11002',
    'GB-IUU-2026-11001',
    'GB-IUU-2026-11003',
    'GB-IUU-2026-11021',
    'GB-IUU-2026-11004',
    'GB-IUU-2026-11005',
    'GB-IUU-2026-11006',
    'GB-IUU-2026-11007',
    'GB-IUU-2026-11008',
    'GB-IUU-2026-11009',
    'GB-IUU-2026-11010',
    'GB-IUU-2026-11011',
    'GB-IUU-2026-10482',
    'GB-IUU-2026-11013',
    'GB-IUU-2026-11014',
    'GB-IUU-2026-11015',
    'GB-IUU-2026-11016',
    'GB-IUU-2026-11017',
    'GB-IUU-2026-11018',
    'GB-IUU-2026-11019',
    'GB-IUU-2026-11020'
  ])
  assert.deepEqual(consignments.filter((item) => item.status !== 'draft').map((item) => [
    item.reference,
    item.arrivalOffsetDays
  ]), [
    ['GB-IUU-2026-11002', -1],
    ['GB-IUU-2026-11001', 4],
    ['GB-IUU-2026-11003', 11],
    ['GB-IUU-2026-11021', 60],
    ['GB-IUU-2026-11004', 5],
    ['GB-IUU-2026-11005', 6],
    ['GB-IUU-2026-11006', 7],
    ['GB-IUU-2026-11007', 9],
    ['GB-IUU-2026-11008', 10],
    ['GB-IUU-2026-11009', 12],
    ['GB-IUU-2026-11010', 14],
    ['GB-IUU-2026-11011', 15],
    ['GB-IUU-2026-10482', 17],
    ['GB-IUU-2026-11013', 19],
    ['GB-IUU-2026-11014', 21],
    ['GB-IUU-2026-11015', 24],
    ['GB-IUU-2026-11016', 27],
    ['GB-IUU-2026-11017', 31],
    ['GB-IUU-2026-11018', 34],
    ['GB-IUU-2026-11019', 39],
    ['GB-IUU-2026-11020', 45]
  ])
  assert.deepEqual(consignments.filter((item) => item.status === 'draft').map((item) => [
    item.reference,
    item.arrivalOffsetDays
  ]), [
    ['Draft notification 001', 3],
    ['Draft notification 002', 6]
  ])
  assert.equal(consignments.every((item) => Number.isInteger(item.arrivalOffsetDays)), true)
  const notification11003 = consignments.find((item) => item.reference === 'GB-IUU-2026-11003')
  const today = new Date()
  const startOfToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  assert.equal(notification11003.arrivalOffsetDays, 11)
  assert.equal((new Date(notification11003.arrivalAt).getTime() - startOfToday) / millisecondsPerDay, 11)
  assert.equal(consignments.every((item) => (
    item.documents.every((document) => (
      document.sections.every((section) => section.fields.every((field) => field.value || field.references))
    ))
  )), true)
  assert.equal(consignments.every((item) => item.port && item.exporter && item.submittedDisplay), true)
})

test('preserves all species and weights from the part 2 evidence comparisons', () => {
  const expectedSpecies = {
    'GB-IUU-2026-11002': [
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
    'GB-IUU-2026-11001': [
      {
        species: 'Skipjack Tuna',
        scientificName: 'Katsuwonus pelamis',
        declarationStatus: 'Declared',
        commodityCode: '030343',
        notificationWeight: '175,564 kg',
        catchCertificateWeight: '175,564 kg'
      }
    ],
    'GB-IUU-2026-11003': [
      {
        species: 'Skipjack Tuna',
        scientificName: 'Katsuwonus pelamis',
        declarationStatus: 'Declared',
        commodityCode: '030343',
        notificationWeight: '360,000 kg',
        catchCertificateWeight: '360,000 kg'
      }
    ]
  }

  for (const consignment of consignments.filter((item) => (
    item.status !== 'draft' && item.isAvailable !== false && item.detailPageAvailable !== false
  ))) {
    assert.deepEqual(consignment.importedSpecies, expectedSpecies[consignment.reference])
  }

  const mismatchConsignment = consignments.find((item) => item.reference === 'GB-IUU-2026-11002')
  assert.equal(mismatchConsignment.speciesSummary, 'Skipjack tuna and Yellowfin tuna')
  assert.equal(mismatchConsignment.weight, '118,000 kg')
  assert.equal(mismatchConsignment.catchCertificateWeight, '152,000 kg')
})

test('groups each species and notification weight under its commodity code and previews three species', () => {
  const importedSpecies = [
    { commodityCode: '03024400', species: 'Atlantic mackerel', notificationWeight: '1,200 kg' },
    { commodityCode: '03024400', species: 'Pacific chub mackerel', notificationWeight: '800 kg' },
    { commodityCode: '03025419', species: 'Argentine hake', notificationWeight: '1,100 kg' },
    { commodityCode: '03025419', species: 'European hake', notificationWeight: '900 kg' }
  ]
  const filters = getDashboardFilters()
  const [consignment] = filterAndSortConsignments([{
    reference: 'GB-IUU-2026-TEST',
    status: 'submitted',
    arrivalAt: '2026-11-01T00:00:00Z',
    submittedAt: '2026-10-01T00:00:00Z',
    documents: [],
    importedSpecies
  }], filters, 'active')

  assert.equal(consignment.commoditySpeciesSummary.speciesCount, 4)
  assert.equal(consignment.commoditySpeciesSummary.commodityCount, 2)
  assert.equal(consignment.commoditySpeciesSummary.displayText, [
    '03024400 Atlantic mackerel 1,200 kg',
    '03024400 Pacific chub mackerel 800 kg',
    '03025419 Argentine hake 1,100 kg',
    '03025419 European hake 900 kg'
  ].join(', '))
})

test('pairs commodity filter codes with catalogue descriptions or associated species names', () => {
  const options = getFilterOptions(consignments).commodityOptions
  const codOption = options.find((option) => option.value === '03047190')
  const skipjackOption = options.find((option) => option.value === '030343')

  assert.equal(codOption.description, 'Frozen fillets of cod')
  assert.equal(codOption.searchTerms.includes('Frozen fillets of cod "Gadus morhua, Gadus ogac"'), true)
  assert.equal(skipjackOption.description, 'Skipjack tuna')
  assert.deepEqual(skipjackOption.searchTerms, ['030343', 'Skipjack tuna'])
})

test('seeds a multi-commodity example with twelve catalog-backed species', () => {
  const consignment = consignments.find((item) => item.reference === 'GB-IUU-2026-11021')
  const summary = filterAndSortConsignments(consignments, getDashboardFilters(), 'active')
    .find((item) => item.reference === consignment.reference)

  assert.equal(consignment.detailPageAvailable, false)
  assert.equal(consignment.importedSpecies.length, 12)
  assert.equal(summary.commoditySpeciesSummary.speciesCount, 12)
  assert.equal(summary.commoditySpeciesSummary.commodityCount, 5)
  assert.equal(summary.commoditySpeciesSummary.displayText, consignment.importedSpecies.map((item) => (
    `${item.commodityCode} ${item.species} ${item.notificationWeight}`
  )).join(', '))
  assert.equal(summary.commoditySpeciesSummary.displayText.includes('Total weight'), false)
  assert.equal(Object.prototype.hasOwnProperty.call(consignment, 'weight'), false)
  assert.equal(consignment.importedSpecies.every((item) => item.species && item.commodityCode && item.notificationWeight), true)
})

test('copies every unavailable dashboard row from part 2', () => {
  const unavailable = consignments.filter((item) => item.isAvailable === false)

  assert.deepEqual(unavailable.map((item) => [
    item.reference,
    item.arrivalOffsetDays,
    item.importer,
    item.origin,
    item.species,
    item.commodityCodes.join(', '),
    item.weight,
    item.statusLabel,
    Object.values(item.documentCounts).join(',')
  ]), [
    ['GB-IUU-2026-11004', 5, 'Atlantic Tuna Imports Ltd', 'Spain', 'Bluefin tuna loins', '03048720', '9,700 kg', 'Submitted', '2,1,1,1'],
    ['GB-IUU-2026-11005', 6, 'Harbour Catch Imports', 'Ecuador', 'Skipjack tuna (SKJ)', '16041416', '4,200 kg', 'Under review', '2,2,0,3'],
    ['GB-IUU-2026-11006', 7, 'Ocean Harvest Imports', 'Iceland', 'Haddock fillets', '03047400', '5,600 kg', 'Accepted', '1,1,1,0'],
    ['GB-IUU-2026-11007', 9, 'Atlantic Seafoods Ltd', 'Mauritius', 'Swordfish steaks', '03038955', '8,800 kg', 'Submitted', '2,1,0,1'],
    ['GB-IUU-2026-11008', 10, 'New England Seafood International', 'Morocco', 'Octopus', '03049999, 03038910', '7,100 kg', 'Submitted', '2,2,1,2'],
    ['GB-IUU-2026-11009', 12, 'Frinsa UK', 'India', 'Prawns', '16052110', '3,900 kg', 'Submitted', '1,1,0,1'],
    ['GB-IUU-2026-11010', 14, 'Atlantic Tuna Imports Ltd', 'Ghana', 'Fresh tuna', '03023210', '2,400 kg', 'Submitted', '1,0,1,2'],
    ['GB-IUU-2026-11011', 15, 'Harbour Catch Imports', 'Vietnam', 'Crab meat', '03061792', '5,200 kg', 'Under review', '3,2,0,1'],
    ['GB-IUU-2026-10482', 17, 'Atlantic Seafoods Ltd', 'Senegal', 'Frozen yellowfin tuna', '03034320', '24,800 kg', 'Submitted', '1,1,1,1'],
    ['GB-IUU-2026-11013', 19, 'New England Seafood International', 'Namibia', 'Hake', '03036611, 03025500', '11,200 kg', 'Submitted', '2,2,1,0'],
    ['GB-IUU-2026-11014', 21, 'Frinsa UK', 'Portugal', 'Prepared sardines', '16042050', '3,400 kg', 'Rejected', '1,1,0,0'],
    ['GB-IUU-2026-11015', 24, 'Atlantic Tuna Imports Ltd', 'Thailand', 'Canned tuna', '16041418', '9,100 kg', 'Submitted', '3,2,0,4'],
    ['GB-IUU-2026-11016', 27, 'Ocean Harvest Imports', 'Indonesia', 'Mackerel', '03035400', '7,600 kg', 'Under review', '2,1,1,2'],
    ['GB-IUU-2026-11017', 31, 'Atlantic Seafoods Ltd', 'Peru', 'Anchovy fillets', '03044990', '2,800 kg', 'Submitted', '2,1,0,1'],
    ['GB-IUU-2026-11018', 34, 'New England Seafood International', 'Canada', 'Pollock', '03036700', '6,700 kg', 'Submitted', '2,2,1,1'],
    ['GB-IUU-2026-11019', 39, 'Frinsa UK', 'Chile', 'Salmon portions', '03048100', '5,300 kg', 'Submitted', '1,1,1,2'],
    ['GB-IUU-2026-11020', 45, 'Atlantic Tuna Imports Ltd', 'South Korea', 'Albacore tuna', '03048790, 03049410', '14,900 kg', 'Submitted', '4,3,1,4']
  ])

  assert.equal(unavailable.filter((item) => item.status === 'submitted').length, 12)
  assert.equal(unavailable.filter((item) => item.status === 'under-review').length, 3)
  assert.equal(unavailable.filter((item) => item.status === 'accepted').length, 1)
  assert.equal(unavailable.filter((item) => item.status === 'rejected').length, 1)
  assert.equal(unavailable.every((item) => (
    item.port !== 'Not provided' &&
    item.exporter !== 'Not provided' &&
    item.submittedDisplay !== 'Not provided' &&
    new Date(item.submittedAt) < new Date(item.arrivalAt)
  )), true)
  assert.deepEqual(
    unavailable
      .filter((item) => ['accepted', 'rejected'].includes(item.status))
      .map((item) => [item.reference, item.port, item.exporter, item.submittedDisplay]),
    [
      ['GB-IUU-2026-11006', 'Grimsby', 'Arctic Fish Export ehf.', '2 September 2026 at 14:15'],
      ['GB-IUU-2026-11014', 'Dover', 'Ramirez & Filhos, S.A.', '3 September 2026 at 09:40']
    ]
  )
  assert.equal(
    unavailable.find((item) => item.status === 'rejected').statusMessage,
    'The catch certificate could not be validated with the issuing authority.'
  )
})

test('does not show warning messages for under review consignments', () => {
  const underReviewConsignments = consignments.filter((item) => item.status === 'under-review')

  assert.equal(underReviewConsignments.length, 4)
  assert.equal(underReviewConsignments.every((item) => !item.statusMessage), true)
})

test('uses a generic missing evidence warning for the action required consignment', () => {
  const actionRequiredConsignment = consignments.find((item) => item.status === 'action-required')

  assert.equal(
    actionRequiredConsignment.statusMessage,
    'There is missing evidence. The Port Health Authority has requested that you provide additional or more up-to-date documents.'
  )
})

test('searches current submissions by reference', () => {
  const filters = getDashboardFilters({ search: '11003', 'quick-filter': 'submissions' })
  const results = filterAndSortConsignments(consignments, filters, 'active')

  assert.deepEqual(results.map((item) => item.reference), ['GB-IUU-2026-11003'])
})

test('lists and searches restored drafts through the drafts quick filter', () => {
  const filters = getDashboardFilters({ search: '002', 'quick-filter': 'drafts' })
  const results = filterAndSortConsignments(consignments, filters, 'active')

  assert.deepEqual(results.map((item) => item.reference), ['Draft notification 002'])
})

test('builds the saved review state for a draft notification', () => {
  const draft = consignments.find((item) => item.reference === 'Draft notification 002')
  const draftData = buildDraftSessionData(draft)
  const [arrivalYear, arrivalMonth, arrivalDay] = draft.arrivalAt.split('T')[0].split('-')

  assert.deepEqual(draftData['commodity-details-list'], [{
    commodityCode: '03021400',
    species: 'Atlantic salmon',
    weight: '4200'
  }])
  assert.equal(draftData['dashboard-draft-reference'], 'Draft notification 002')
  assert.equal(draftData['destination-port'], 'Felixstowe')
  assert.equal(draftData['arrival-date-day'], arrivalDay)
  assert.equal(draftData['arrival-date-month'], arrivalMonth)
  assert.equal(draftData['arrival-date-year'], arrivalYear)
  assert.equal(draftData['arrival-time-hour'], '14')
  assert.equal(draftData['arrival-time-minute'], '00')
  assert.equal(draftData['country-of-origin'], 'Norway')
  assert.equal(draftData['scenario-a-exporter-name'], 'Fjord Seafoods AS')
  assert.equal(draftData['review-importer-exporter-agent-details'], 'New England Seafood International Ltd; Fjord Seafoods AS')
})

test('filters current submissions by status and origin', () => {
  const filters = getDashboardFilters({ status: 'under-review', origin: 'France' })
  const results = filterAndSortConsignments(consignments, filters, 'active')

  assert.deepEqual(results.map((item) => item.reference), ['GB-IUU-2026-11002'])
})

test('filters seaport and airport selections against official entry names and seeded locations', () => {
  const makeConsignment = (reference, port) => ({
    reference,
    status: 'submitted',
    statusLabel: 'Submitted',
    statusTagClass: 'govuk-tag--blue',
    submittedAt: '2026-11-05T12:00:00.000Z',
    arrivalAt: '2026-11-06T12:00:00.000Z',
    port,
    origin: 'Iceland',
    documents: []
  })
  const entries = [
    makeConsignment('FELIXSTOWE', 'Felixstowe'),
    makeConsignment('HEATHROW', 'Heathrow'),
    makeConsignment('LIVERPOOL', 'Liverpool')
  ]

  const seaportFilters = getDashboardFilters({ port: 'Felixstowe - Temperature controlled examination facility (TCEF)' })
  const airportFilters = getDashboardFilters({ port: 'Heathrow Airport - Heathrow Perishable Centre (HPC)' })
  const combinedFilters = getDashboardFilters({ port: 'Liverpool', origin: 'Iceland' })

  assert.deepEqual(filterAndSortConsignments(entries, seaportFilters, 'active').map((item) => item.reference), ['FELIXSTOWE'])
  assert.deepEqual(filterAndSortConsignments(entries, airportFilters, 'active').map((item) => item.reference), ['HEATHROW'])
  assert.deepEqual(filterAndSortConsignments(entries, combinedFilters, 'active').map((item) => item.reference), ['LIVERPOOL'])

  const chips = getActiveFilterChips(combinedFilters, getFilterOptions(entries), '/part1/v5', 'a', 'active')
  const portChip = chips.find((chip) => chip.label === 'Port of entry: Liverpool')
  const chipQuery = new URL(portChip.href, 'http://localhost').searchParams
  assert.equal(chipQuery.get('port'), null)
  assert.equal(chipQuery.get('origin'), 'Iceland')
})

test('matches any selected commodity and species while allowing extra values on the notification', () => {
  const makeConsignment = (reference, importedSpecies) => ({
    reference,
    status: 'submitted',
    statusLabel: 'Submitted',
    statusTagClass: 'govuk-tag--blue',
    submittedAt: '2026-11-05T12:00:00.000Z',
    arrivalAt: '2026-11-06T12:00:00.000Z',
    port: 'Grimsby',
    origin: 'Iceland',
    commodityCodes: importedSpecies.map((item) => item.commodityCode),
    importedSpecies,
    documents: []
  })
  const entries = [
    makeConsignment('MATCH-COMMODITY-A-SPECIES-B', [
      { commodityCode: '030343', species: 'Skipjack tuna', scientificName: 'Katsuwonus pelamis' },
      { commodityCode: '030342', species: 'Yellowfin tuna', scientificName: 'Thunnus albacares' },
      { commodityCode: '030999', species: 'Blue ling', scientificName: 'Molva dypterygia' }
    ]),
    makeConsignment('MATCH-COMMODITY-B-SPECIES-A', [
      { commodityCode: '030342', species: 'Atlantic cod', scientificName: 'Gadus morhua' },
      { commodityCode: '030998', species: 'Pacific cod', scientificName: 'Gadus macrocephalus' }
    ]),
    makeConsignment('COMMODITY-ONLY', [
      { commodityCode: '030343', species: 'Skipjack tuna', scientificName: 'Katsuwonus pelamis' }
    ]),
    makeConsignment('SPECIES-ONLY', [
      { commodityCode: '030999', species: 'Atlantic cod', scientificName: 'Gadus morhua' }
    ])
  ]
  const filters = getDashboardFilters({
    commodity: ['030343', '030342'],
    species: ['Atlantic cod', 'Yellowfin tuna']
  })
  const results = filterAndSortConsignments(entries, filters, 'active')

  assert.deepEqual(results.map((item) => item.reference), [
    'MATCH-COMMODITY-A-SPECIES-B',
    'MATCH-COMMODITY-B-SPECIES-A'
  ])

  const options = getFilterOptions(entries)
  assert.equal(options.commodityOptions.some((option) => option.value === '030999'), true)
  assert.equal(options.speciesOptions.find((option) => option.value === 'Yellowfin tuna').searchTerms.includes('Thunnus albacares'), true)

  const chips = getActiveFilterChips(filters, options, '/part1/v5', 'a', 'active')
  const commodityChip = chips.find((chip) => chip.label === 'Commodity: 030343')
  const commodityChipQuery = new URL(commodityChip.href, 'http://localhost').searchParams
  assert.deepEqual(commodityChipQuery.getAll('commodity'), ['030342'])
  assert.deepEqual(commodityChipQuery.getAll('species'), ['Atlantic cod', 'Yellowfin tuna'])
})

test('active and completed tabs group importer statuses without changing status values', () => {
  const filters = getDashboardFilters()
  const active = filterAndSortConsignments(consignments, filters, 'active')
  const completed = filterAndSortConsignments(consignments, filters, 'completed')

  assert.equal(active.length, 21)
  assert.equal(completed.length, 2)
  assert.equal(active.every((item) => ['draft', 'submitted', 'under-review', 'action-required'].includes(item.status)), true)
  assert.equal(completed.every((item) => ['accepted', 'rejected'].includes(item.status)), true)
})

test('quick filters use existing importer statuses and show counts across tabs', () => {
  const filters = getDashboardFilters()
  const cards = getSummaryCards(consignments, filters, '/part1/v5', 'a', 'submitted')

  assert.deepEqual(cards.map(({ key, label, count }) => [key, label, count]), [
    ['action-required', 'Action required', 1],
    ['drafts', 'Draft notifications', 2],
    ['submissions', 'Submitted notifications', 19],
    ['accepted', 'Accepted notifications', 1]
  ])

  const draftCard = cards.find((card) => card.key === 'drafts')
  const draftCardQuery = new URL(draftCard.href, 'http://localhost').searchParams
  assert.equal(draftCardQuery.get('tab'), 'active')
  assert.equal(draftCardQuery.get('quick-filter'), 'drafts')

  const actionRequired = filterAndSortConsignments(
    consignments,
    getDashboardFilters({ 'quick-filter': 'action-required' }),
    'active'
  )
  assert.deepEqual(actionRequired.map((item) => item.status), ['action-required'])
})

test('active quick-filter cards remove only their own filter', () => {
  const filters = getDashboardFilters({
    'quick-filter': 'action-required',
    search: '11003',
    origin: 'France'
  })
  const cards = getSummaryCards(consignments, filters, '/part1/v5', 'a', 'active')
  const activeCard = cards.find((card) => card.key === 'action-required')
  const query = new URL(activeCard.href, 'http://localhost').searchParams

  assert.equal(activeCard.active, true)
  assert.equal(query.get('quick-filter'), null)
  assert.equal(query.get('search'), '11003')
  assert.equal(query.get('origin'), 'France')
})

test('active filter chips each remove only their own query filter', () => {
  const filters = getDashboardFilters({
    'quick-filter': 'action-required',
    search: '11003',
    status: 'action-required',
    origin: 'France',
    'sort-by': 'status',
    'sort-order': 'desc'
  })
  const chips = getActiveFilterChips(filters, getFilterOptions(consignments), '/part1/v5', 'a', 'active')

  assert.deepEqual(chips.map((chip) => chip.label), [
    'View: Action required',
    'Reference: 11003',
    'Status: Action required',
    'Exporting country: France',
    'Sort by: Status',
    'Sort order: Newest first'
  ])

  const searchChip = chips.find((chip) => chip.label === 'Reference: 11003')
  const query = new URL(searchChip.href, 'http://localhost').searchParams
  assert.equal(query.get('search'), null)
  assert.equal(query.get('quick-filter'), 'action-required')
  assert.equal(query.get('status'), 'action-required')
  assert.equal(query.get('origin'), 'France')
})

test('sorts submissions by arrival date by default', () => {
  const filters = getDashboardFilters({ 'quick-filter': 'submissions' })
  const results = filterAndSortConsignments(consignments, filters, 'active')

  assert.equal(filters.sortBy, 'arrival')
  assert.equal(filters.sortOrder, 'asc')
  assert.deepEqual(results.slice(0, 4).map((item) => item.reference), [
    'GB-IUU-2026-11002',
    'GB-IUU-2026-11001',
    'GB-IUU-2026-11004',
    'GB-IUU-2026-11005'
  ])
  assert.equal(results.length, 19)
  assert.equal(results[6].reference, 'GB-IUU-2026-11003')
  assert.equal(results.at(-1).reference, 'GB-IUU-2026-11021')
})

test('adds arrival date headings only when results are sorted by arrival', () => {
  const filters = getDashboardFilters()
  const results = filterAndSortConsignments(consignments, filters, 'active')
  let previousArrivalDate

  for (const result of results) {
    const arrivalDate = result.arrivalAt.split('T')[0]
    if (arrivalDate !== previousArrivalDate) {
      assert.equal(result.arrivalDateHeading, new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(new Date(`${arrivalDate}T00:00:00Z`)))
    } else {
      assert.equal(result.arrivalDateHeading, undefined)
    }
    previousArrivalDate = arrivalDate
  }

  assert.ok(results.some((result) => result.arrivalDateHeading))
  const referenceSorted = filterAndSortConsignments(consignments, { ...filters, sortBy: 'reference' }, 'active')
  assert.ok(referenceSorted.every((result) => result.arrivalDateHeading === undefined))
})

test('sorts submissions by status priority when selected', () => {
  const filters = getDashboardFilters({
    'sort-by': 'status',
    'sort-order': 'desc',
    'quick-filter': 'submissions'
  })
  const results = filterAndSortConsignments(consignments, filters, 'active')

  assert.equal(results[0].status, 'action-required')
  assert.equal(results[0].reference, 'GB-IUU-2026-11003')
  assert.equal(results.length, 19)
})

test('provides distinct sorted origin filter options', () => {
  const options = getFilterOptions(consignments)

  assert.deepEqual(options.sortOptions.map((option) => option.value), [
    'status',
    'submitted',
    'arrival',
    'reference'
  ])
  assert.equal(options.sortOptions[0].text, 'Status')
  assert.deepEqual(options.activeStatusOptions.map((option) => option.value), [
    '',
    'draft',
    'submitted',
    'under-review',
    'action-required'
  ])
  assert.deepEqual(options.completedStatusOptions.map((option) => option.value), [
    '',
    'accepted',
    'rejected'
  ])
  assert.equal(options.originOptions.length, 21)
  assert.equal(options.originOptions[0].value, '')
  assert.equal(options.originOptions.some((option) => option.value === 'South Korea'), true)
  assert.equal(options.originOptions.some((option) => option.value === 'Spain, France, Seychelles and Chile'), true)
})

test('maps supporting documents as full per-type counts', () => {
  const filters = getDashboardFilters({ 'quick-filter': 'submissions' })
  const submitted = filterAndSortConsignments(consignments, filters, 'active')

  assert.deepEqual(submitted[0].documentsProvidedLines, ['Catch certificate (1)'])
  assert.deepEqual(submitted[1].documentsProvidedLines, ['Catch certificate (1)'])
  assert.deepEqual(submitted[2].documentsProvidedLines, [
    'Catch certificates (2)',
    'Processing statement (1)',
    'Non-manipulation declaration (1)',
    'Additional document (1)'
  ])
  const multiDocumentCase = submitted.find((item) => item.reference === 'GB-IUU-2026-11003')
  assert.deepEqual(multiDocumentCase.documentsProvidedLines, [
    'Catch certificates (4)',
    'Processing statement (1)'
  ])
})

test('keeps evidence references within their consignment', () => {
  for (const consignment of consignments) {
    const documentReferences = new Set(consignment.documents.map((document) => document.reference))

    for (const evidenceSection of consignment.evidenceSections) {
      for (const reference of evidenceSection.references) {
        assert.equal(documentReferences.has(reference), true, `${reference} is not part of ${consignment.reference}`)
      }
    }

    for (const document of consignment.documents) {
      for (const section of document.sections) {
        for (const field of section.fields) {
          for (const reference of field.references || []) {
            assert.equal(documentReferences.has(reference), true, `${reference} is not part of ${consignment.reference}`)
          }
        }
      }
    }
  }
})

test('reconciles the multi-document case and identifies its missing evidence', () => {
  const consignment = consignments.find((item) => item.reference === 'GB-IUU-2026-11003')
  const catchCertificates = consignment.documents.filter((document) => document.typeSlug === 'catch-certificate')
  const processingStatement = consignment.documents.find((document) => document.typeSlug === 'processing-statement')
  const processingDetails = processingStatement.sections.find((section) => section.title === 'Processing details')
  const referencedCertificates = processingDetails.fields.find((field) => field.label === 'Catch certificate references').references
  const missingEvidence = processingStatement.sections.find((section) => section.title === 'Missing evidence')

  assert.equal(consignment.weight, '360,000 kg')
  assert.deepEqual(catchCertificates.map((document) => document.species[0].weight), [
    '118,000 kg',
    '78,000 kg',
    '64,000 kg',
    '100,000 kg'
  ])
  assert.deepEqual(referencedCertificates, [
    'ESP/SGCI/AI/2026/101',
    'FRA 2026 CSP 000101',
    'CL-2026-44-000079-N'
  ])
  assert.deepEqual(missingEvidence.fields, [
    { label: 'Catch certificate not referenced', references: ['SYC/SFA/10/2026-SW0454'] },
    { label: 'Unrepresented certified weight', value: '64,000 kg' }
  ])
})

test('offers local PDFs for every submitted document in consignments 11001 to 11003', () => {
  const targetReferences = new Set([
    'GB-IUU-2026-11001',
    'GB-IUU-2026-11002',
    'GB-IUU-2026-11003'
  ])
  const targetConsignments = consignments.filter((consignment) => targetReferences.has(consignment.reference))
  const sourceDocuments = targetConsignments.flatMap((consignment) => consignment.documents)
  const sampleDocumentsPath = path.join(__dirname, '..', 'data', 'sample-documents')

  assert.equal(targetConsignments.length, 3)
  assert.equal(sourceDocuments.length, 7)
  assert.equal(sourceDocuments.every((document) => document.sourceFile), true)

  for (const document of sourceDocuments) {
    assert.equal(fs.existsSync(path.join(sampleDocumentsPath, document.sourceFile)), true)
  }
})
