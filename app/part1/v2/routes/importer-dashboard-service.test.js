const assert = require('node:assert/strict')
const test = require('node:test')
const consignments = require('../data/importer-dashboard-consignments')
const {
  filterAndSortConsignments,
  getDashboardFilters,
  getFilterOptions
} = require('./importer-dashboard-service')

test('searches current submissions across identifying information', () => {
  const filters = getDashboardFilters({ search: 'hake' })
  const results = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.deepEqual(results.map((item) => item.reference), ['GB-IUU-2026-10411'])
})

test('lists and searches draft notifications separately', () => {
  const filters = getDashboardFilters({ search: 'salmon' })
  const results = filterAndSortConsignments(consignments, filters, 'drafts')

  assert.deepEqual(results.map((item) => item.reference), ['Draft notification 002'])
})

test('filters current submissions by status and origin', () => {
  const filters = getDashboardFilters({ status: 'under-review', origin: 'Norway' })
  const results = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.deepEqual(results.map((item) => item.reference), ['GB-IUU-2026-10397'])
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
