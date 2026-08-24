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
    'filter-arrival-from': '2026-01-03',
    'filter-arrival-to': '2026-01-03',
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

  assert.equal(ascending[0].reference, 'GB-IUU-2026-11001')
  assert.equal(descending[0].reference, 'GB-IUU-2026-11002')
})

test('sorts consignments by importer, status and consignment reference', () => {
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(fixedToday)

  const byImporter = sortConsignments(consignments, buildDashboardFilters({ 'sort-by': 'importer' }))
  const byDaysUntilArrival = sortConsignments(consignments, buildDashboardFilters({ 'sort-by': 'days-until-arrival' }))
  const byStatus = sortConsignments(consignments, buildDashboardFilters({ 'sort-by': 'status' }))
  const byReference = sortConsignments(consignments, buildDashboardFilters({ 'sort-by': 'reference' }))

  assert.equal(byImporter[0].importer, 'Atlantic Seafoods Ltd')
  assert.equal(byDaysUntilArrival[0].daysUntilArrival, 2)
  assert.equal(byStatus[0].status, 'COMPLETED')
  assert.equal(byReference[0].reference, 'GB-IUU-2026-10482')
})

test('builds tab view model so in-progress records are excluded from For Review', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)

  assert.ok(viewModel.forReview.rows.every((row) => row.statusLabel !== 'In Progress'))
  assert.ok(viewModel.inProgress.rows.every((row) => row.statusLabel === 'In Progress'))
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
  const firstConsignment = viewModel.forReview.rows[0]
  assert.deepEqual(firstConsignment.documentsProvidedLines, ['CC(1)', 'ADD(4)'])
})
