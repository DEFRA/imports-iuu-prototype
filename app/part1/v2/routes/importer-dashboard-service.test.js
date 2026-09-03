const assert = require('node:assert/strict')
const test = require('node:test')
const consignments = require('../data/importer-dashboard-consignments')
const {
  buildDraftSessionData,
  filterAndSortConsignments,
  getDashboardFilters,
  getFilterOptions
} = require('./importer-dashboard-service')

test('searches current submissions by reference', () => {
  const filters = getDashboardFilters({ search: '10411' })
  const results = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.deepEqual(results.map((item) => item.reference), ['GB-IUU-2026-10411'])
})

test('lists and searches draft notifications separately', () => {
  const filters = getDashboardFilters({ search: '002' })
  const results = filterAndSortConsignments(consignments, filters, 'drafts')

  assert.deepEqual(results.map((item) => item.reference), ['Draft notification 002'])
})

test('builds the saved review state for a draft notification', () => {
  const draft = consignments.find((item) => item.reference === 'Draft notification 002')
  const draftData = buildDraftSessionData(draft)

  assert.deepEqual(draftData['commodity-details-list'], [{
    commodityCode: '03021400',
    species: 'Atlantic salmon',
    weight: '4200'
  }])
  assert.equal(draftData['dashboard-draft-reference'], 'Draft notification 002')
  assert.equal(draftData['destination-port'], 'Felixstowe')
  assert.equal(draftData['arrival-date-day'], '10')
  assert.equal(draftData['arrival-date-month'], '09')
  assert.equal(draftData['arrival-date-year'], '2026')
  assert.equal(draftData['arrival-time-hour'], '14')
  assert.equal(draftData['arrival-time-minute'], '00')
  assert.equal(draftData['country-of-origin'], 'Norway')
  assert.equal(draftData['scenario-a-exporter-name'], 'Fjord Seafoods AS')
})

test('filters current submissions by status and origin', () => {
  const filters = getDashboardFilters({ status: 'under-review', origin: 'Norway' })
  const results = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.deepEqual(results.map((item) => item.reference), ['GB-IUU-2026-10397'])
})

test('sorts submissions by status priority by default', () => {
  const filters = getDashboardFilters()
  const results = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.equal(filters.sortBy, 'status')
  assert.deepEqual(results.map((item) => item.reference), [
    'GB-IUU-2026-10411',
    'GB-IUU-2026-10397',
    'GB-IUU-2026-10418'
  ])
})

test('keeps the status priority when the sort direction changes', () => {
  const filters = getDashboardFilters({
    'sort-by': 'status',
    'sort-order': 'asc'
  })
  const results = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.deepEqual(results.map((item) => item.reference), [
    'GB-IUU-2026-10411',
    'GB-IUU-2026-10397',
    'GB-IUU-2026-10418'
  ])
})

test('sorts historical submissions by arrival date', () => {
  const filters = getDashboardFilters({ 'sort-by': 'arrival', 'sort-order': 'asc' })
  const results = filterAndSortConsignments(consignments, filters, 'historical')

  assert.deepEqual(results.map((item) => item.reference), [
    'GB-IUU-2026-10094',
    'GB-IUU-2026-10172'
  ])
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
  assert.deepEqual(options.draftStatusOptions.map((option) => option.value), ['', 'draft'])
  assert.deepEqual(options.submittedStatusOptions.map((option) => option.value), [
    '',
    'submitted',
    'under-review',
    'action-required'
  ])
  assert.deepEqual(options.historicalStatusOptions.map((option) => option.value), [
    '',
    'accepted',
    'rejected'
  ])
  assert.deepEqual(options.originOptions.map((option) => option.value), [
    '',
    'France',
    'Iceland',
    'Norway',
    'Spain'
  ])
})

test('shows every non-manipulation declaration as not provided', () => {
  for (const consignment of consignments) {
    const nmdEvidence = consignment.evidenceSections.find((section) => section.heading === 'Non manipulation document')
    assert.equal(nmdEvidence.count, 0)
    assert.deepEqual(nmdEvidence.references, [])
    assert.equal(consignment.documents.some((document) => document.typeSlug === 'nmd'), false)
  }
})

test('uses the processing statement detail pattern for missing evidence', () => {
  const consignment = consignments.find((item) => item.reference === 'GB-IUU-2026-10411')
  const processingStatement = consignment.documents.find((document) => document.typeSlug === 'processing-statement')

  assert.deepEqual(consignment.importedSpecies, [
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
  ])
  assert.equal(consignment.weight, '1,800 kg')
  assert.deepEqual(processingStatement.species, [
    {
      species: 'European hake',
      scientificName: 'Merluccius merluccius',
      productCode: '03047419',
      weight: '1,180 kg'
    },
    {
      species: 'Atlantic mackerel',
      scientificName: 'Scomber scombrus',
      productCode: '03035410',
      weight: '620 kg'
    }
  ])
  assert.equal(processingStatement.validationStatus, 'Missing evidence')
  assert.deepEqual(processingStatement.sections.map((section) => section.title), [
    'Processing details',
    'Weight data',
    'Missing evidence'
  ])
  assert.deepEqual(processingStatement.sections[1].fields.map((field) => field.label), [
    'Total landed weight',
    'Catch processed weight',
    'Processed fishery product weight'
  ])
})

test('maps supporting documents as full per-type counts', () => {
  const filters = getDashboardFilters()
  const submitted = filterAndSortConsignments(consignments, filters, 'submitted')
  const drafts = filterAndSortConsignments(consignments, filters, 'drafts')

  assert.deepEqual(submitted[0].documentsProvidedLines, [
    'Catch certificate (1)',
    'Processing statement (1)'
  ])
  assert.deepEqual(drafts[0].documentsProvidedLines, [])
})
