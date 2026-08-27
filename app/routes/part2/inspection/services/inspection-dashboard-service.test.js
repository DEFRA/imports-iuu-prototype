const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildDashboardFilters,
  filterConsignments,
  sortConsignments,
  buildInspectionDashboardViewModel
} = require('./inspection-dashboard-service')
const { mockConsignmentSummariesApi } = require('../mock-api/consignment-summaries-api')

const fixedToday = new Date(Date.UTC(2026, 0, 1))

test('filters consignments by reference and importer-name search', () => {
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(fixedToday)
  const filters = buildDashboardFilters({
    'search-reference': '11001',
    'search-importer-name': 'new england'
  })

  const filtered = filterConsignments(consignments, filters)
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].reference, 'GB-IUU-2026-11001')
})

test('filters consignments by importer, status, origin, arrival range and risk indicator', () => {
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(fixedToday)
  const filters = buildDashboardFilters({
    'filter-importer': 'New England Seafood International Ltd',
    'filter-status': 'REQUIRES_DOCUMENT_CHECK',
    'filter-origin': 'France',
    'filter-arrival-from': '2026-08-07',
    'filter-arrival-to': '2026-08-07',
    'filter-risk-indicator': 'WEIGHT_MISMATCH'
  })

  const filtered = filterConsignments(consignments, filters)
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].reference, 'GB-IUU-2026-11001')
})

test('sorts consignments by estimated arrival', () => {
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(fixedToday)
  const ascending = sortConsignments(consignments, buildDashboardFilters({
    'sort-by': 'estimated-arrival',
    'sort-order': 'asc'
  }))
  const descending = sortConsignments(consignments, buildDashboardFilters({
    'sort-by': 'estimated-arrival',
    'sort-order': 'desc'
  }))

  assert.equal(ascending[0].reference, 'GB-IUU-2026-11004')
  assert.equal(descending[0].reference, 'GB-IUU-2026-11002')
})

test('sorts consignments by importer, status and consignment reference', () => {
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(fixedToday)

  const byImporter = sortConsignments(consignments, buildDashboardFilters({ 'sort-by': 'importer' }))
  const byDaysUntilArrival = sortConsignments(consignments, buildDashboardFilters({ 'sort-by': 'days-until-arrival' }))
  const byStatus = sortConsignments(consignments, buildDashboardFilters({ 'sort-by': 'status' }))
  const byReference = sortConsignments(consignments, buildDashboardFilters({ 'sort-by': 'reference' }))

  assert.equal(byImporter[0].importer, 'Atlantic Seafoods Ltd')
  assert.equal(byDaysUntilArrival[0].daysUntilArrival, 5)
  assert.equal(byStatus[0].status, 'COMPLETED')
  assert.equal(byReference[0].reference, 'GB-IUU-2026-10482')
})

test('builds tab view model so in-progress records are excluded from For Review', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)

  assert.ok(viewModel.forReview.rows.every((row) => row.statusLabel !== 'In Progress'))
  assert.ok(viewModel.inProgress.rows.every((row) => row.statusLabel === 'In Progress'))
  assert.equal(viewModel.filterOptions.referenceOptions.length, 20)
  assert.ok(viewModel.filterOptions.referenceOptions.includes('GB-IUU-2026-11001'))
  assert.ok(viewModel.filterOptions.importerNameOptions.includes('Frinsa UK'))
})

test('sorts both dashboard tabs by consignment reference on initial load', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)

  for (const tab of [viewModel.forReview, viewModel.inProgress]) {
    const references = tab.rows.map((row) => row.reference)
    const sortedReferences = [...references].sort((first, second) => first.localeCompare(second, 'en-GB'))
    assert.deepEqual(references, sortedReferences)
  }
})

test('lists every matching reference in each dashboard tab', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)

  assert.equal(viewModel.forReview.rows.length, viewModel.forReview.filteredTotalCount)
  assert.equal(viewModel.forReview.pagination.pageCount, 1)
  assert.equal(viewModel.forReview.filteredStart, 1)
  assert.equal(viewModel.forReview.filteredEnd, viewModel.forReview.filteredTotalCount)

  assert.equal(viewModel.inProgress.rows.length, viewModel.inProgress.filteredTotalCount)
  assert.equal(viewModel.inProgress.pagination.pageCount, 1)
})

test('maps document counts as separate display lines', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)
  const consignment = viewModel.forReview.rows.find((row) => row.reference === 'GB-IUU-2026-11001')
  assert.deepEqual(consignment.documentsProvidedLines, ['Catch certificate (1)'])

  const documentLabels = viewModel.forReview.rows.flatMap((row) => row.documentsProvidedLines)
  assert.ok(documentLabels.some((label) => label.startsWith('Processing statement')))
  assert.ok(documentLabels.some((label) => label.startsWith('Non-manipulation declaration')))
})

test('labels past arrival dates as overdue', () => {
  const viewModel = buildInspectionDashboardViewModel({}, new Date(Date.UTC(2026, 7, 26)))
  const overdueRows = [...viewModel.forReview.rows, ...viewModel.inProgress.rows]
    .filter((row) => row.daysUntilArrival < 0)

  assert.ok(overdueRows.length > 0)
  assert.ok(overdueRows.every((row) => row.arrivalTimingLabel.startsWith('Overdue by ')))
})
