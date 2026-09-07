const currentStatuses = new Set(['submitted', 'under-review', 'action-required'])
const historicalStatuses = new Set(['accepted', 'rejected'])
const draftStatuses = new Set(['draft'])

const statusOptions = [
  { value: '', text: 'All statuses' },
  { value: 'draft', text: 'Draft' },
  { value: 'submitted', text: 'Submitted' },
  { value: 'under-review', text: 'Under review' },
  { value: 'action-required', text: 'Action required' },
  { value: 'accepted', text: 'Accepted' },
  { value: 'rejected', text: 'Rejected' }
]

const sortOptions = [
  { value: 'submitted', text: 'Date submitted' },
  { value: 'arrival', text: 'Arrival date' },
  { value: 'reference', text: 'Notification reference' }
]

const normalizeValue = (value) => typeof value === 'string' ? value.trim() : ''

const getDashboardFilters = (query = {}) => {
  const status = statusOptions.some((option) => option.value && option.value === query.status)
    ? query.status
    : ''
  const sortBy = sortOptions.some((option) => option.value === query['sort-by'])
    ? query['sort-by']
    : 'submitted'

  return {
    search: normalizeValue(query.search),
    status,
    origin: normalizeValue(query.origin),
    sortBy,
    sortOrder: query['sort-order'] === 'asc' ? 'asc' : 'desc'
  }
}

const matchesSearch = (consignment, search) => {
  if (!search) return true
  const searchableText = [
    consignment.reference,
    consignment.port,
    consignment.origin,
    consignment.exporter,
    consignment.species,
    consignment.commodityCode
  ].join(' ').toLowerCase()
  return searchableText.includes(search.toLowerCase())
}

const getSortValue = (consignment, sortBy) => {
  if (sortBy === 'arrival') return consignment.arrivalAt
  if (sortBy === 'reference') return consignment.reference
  return consignment.submittedAt
}

const filterAndSortConsignments = (consignments, filters, tab) => {
  const allowedStatuses = tab === 'drafts'
    ? draftStatuses
    : (tab === 'historical' ? historicalStatuses : currentStatuses)
  const direction = filters.sortOrder === 'asc' ? 1 : -1

  return consignments
    .filter((consignment) => allowedStatuses.has(consignment.status))
    .filter((consignment) => matchesSearch(consignment, filters.search))
    .filter((consignment) => !filters.status || consignment.status === filters.status)
    .filter((consignment) => !filters.origin || consignment.origin === filters.origin)
    .sort((left, right) => {
      const comparison = getSortValue(left, filters.sortBy).localeCompare(getSortValue(right, filters.sortBy))
      return comparison * direction
    })
}

const getFilterOptions = (consignments) => ({
  draftStatusOptions: statusOptions.filter((option) => ['', 'draft'].includes(option.value)),
  submittedStatusOptions: statusOptions.filter((option) => ['', 'submitted', 'under-review', 'action-required'].includes(option.value)),
  historicalStatusOptions: statusOptions.filter((option) => ['', 'accepted', 'rejected'].includes(option.value)),
  sortOptions,
  originOptions: [
    { value: '', text: 'All origins' },
    ...Array.from(new Set(consignments.map((consignment) => consignment.origin)))
      .sort()
      .map((origin) => ({ value: origin, text: origin }))
  ]
})

module.exports = {
  filterAndSortConsignments,
  getDashboardFilters,
  getFilterOptions
}
