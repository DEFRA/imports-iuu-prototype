const test = require('node:test')
const assert = require('node:assert/strict')

const {
  buildDashboardFilters,
  filterConsignments,
  sortConsignments,
  buildInspectionDashboardViewModel
} = require('./inspection-dashboard-service')
const { mockConsignmentSummariesApi } = require('../mock-api/consignment-summaries-api')
const { buildInspectionNotifications } = require('../notifications')
const documentNavigationService = require('../document-navigation-service')

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
    'filter-arrival-from': '2025-12-31',
    'filter-arrival-to': '2025-12-31',
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
  assert.equal(byDaysUntilArrival[0].daysUntilArrival, -1)
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

test('derives the featured consignment arrival dates from today', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)
  const rows = [...viewModel.forReview.rows, ...viewModel.inProgress.rows]
  const overdueConsignment = rows.find((row) => row.reference === 'GB-IUU-2026-11001')
  const futureConsignment = rows.find((row) => row.reference === 'GB-IUU-2026-11002')
  const notification = buildInspectionNotifications(fixedToday)
    .find((item) => item.reference === 'GB-IUU-2026-11001')

  assert.equal(overdueConsignment.estimatedArrivalIsoDate, '2025-12-31')
  assert.equal(overdueConsignment.arrivalTimingLabel, 'Overdue 1 day ago')
  assert.equal(futureConsignment.estimatedArrivalIsoDate, '2026-04-16')
  assert.equal(futureConsignment.arrivalTimingLabel, 'Arrival in 105 days')
  assert.equal(notification.arrivalDateDisplay, '31 Dec 2025')
  assert.equal(notification.arrivalOffsetDays, -1)
})

test('uses consignment arrival dates on catch certificates', () => {
  const overdueDocument = documentNavigationService.getDocument(
    'catch-certificate',
    'FRA-2026-CSP-000205',
    fixedToday
  )
  const futureDocument = documentNavigationService.getDocument(
    'catch-certificate',
    'ESP/SGCI/AI/2026/101',
    fixedToday
  )
  const findLandingDate = (document) => document.sections
    .flatMap((section) => section.fields)
    .find((field) => field.label === 'Landing date' || field.label === 'Date of landing')
    .value

  assert.equal(findLandingDate(overdueDocument), '31 December 2025')
  assert.equal(findLandingDate(futureDocument), '16 April 2026')
})
