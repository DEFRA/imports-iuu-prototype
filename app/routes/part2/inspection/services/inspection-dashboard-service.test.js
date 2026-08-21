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
  assert.equal(descending[0].reference, 'GB-IUU-2026-11020')
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

test('paginates dashboard results with five rows per page', () => {
  const firstPage = buildInspectionDashboardViewModel({}, fixedToday)
  const secondPage = buildInspectionDashboardViewModel({ 'for-review-page': '2' }, fixedToday)

  assert.equal(firstPage.forReview.rows.length, 5)
  assert.equal(firstPage.forReview.pagination.pageCount, 3)
  assert.equal(firstPage.forReview.filteredStart, 1)
  assert.equal(firstPage.forReview.filteredEnd, 5)

  assert.equal(secondPage.forReview.rows.length, 5)
  assert.equal(secondPage.forReview.filteredStart, 6)
  assert.equal(secondPage.forReview.filteredEnd, 10)
})

test('maps document counts as separate display lines', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)
  const firstConsignment = viewModel.forReview.rows[0]
  assert.deepEqual(firstConsignment.documentsProvidedLines, ['CC(1)', 'ADD(4)'])
})
