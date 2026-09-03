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
  { value: 'status', text: 'Status' },
  { value: 'submitted', text: 'Date submitted' },
  { value: 'arrival', text: 'Arrival date' },
  { value: 'reference', text: 'Notification reference' }
]

const statusSortOrder = {
  'action-required': 0,
  'under-review': 1,
  submitted: 2
}

const normalizeValue = (value) => typeof value === 'string' ? value.trim() : ''

const buildDraftSessionData = (consignment) => {
  const [arrivalDate = ''] = normalizeValue(consignment.arrivalAt).split('T')
  const [arrivalYear = '', arrivalMonth = '', arrivalDay = ''] = arrivalDate.split('-')
  const displayedTime = normalizeValue(consignment.arrivalDisplay).match(/\bat\s+(\d{2}):(\d{2})$/)
  const arrivalHour = displayedTime ? displayedTime[1] : ''
  const arrivalMinute = displayedTime ? displayedTime[2] : ''
  const weight = normalizeValue(consignment.weight)
    .replace(/\s*kg$/i, '')
    .replace(/,/g, '')

  return {
    'dashboard-draft-reference': consignment.reference,
    'destination-port': consignment.port,
    'port-of-entry': consignment.port,
    'arrival-date-day': arrivalDay,
    'arrival-date-month': arrivalMonth,
    'arrival-date-year': arrivalYear,
    'arrival-time-hour': arrivalHour,
    'arrival-time-minute': arrivalMinute,
    'country-of-origin': consignment.origin,
    'country-of-export': consignment.origin,
    'commodity-details-list': [{
      commodityCode: consignment.commodityCode,
      species: consignment.species,
      weight
    }],
    'scenario-a-port-of-entry': consignment.port,
    'scenario-a-estimated-arrival': consignment.arrivalAt,
    'scenario-a-species': consignment.species,
    'scenario-a-cn-code': consignment.commodityCode,
    'scenario-a-net-weight': consignment.weight,
    'scenario-a-flag-state': consignment.origin,
    'scenario-a-exporter-name': consignment.exporter,
    'review-species': consignment.species,
    'review-weight-quantity': consignment.weight,
    'review-importer-exporter-agent-details': `Nordic Sea Imports Ltd; ${consignment.exporter}`
  }
}

const getDashboardFilters = (query = {}) => {
  const status = statusOptions.some((option) => option.value && option.value === query.status)
    ? query.status
    : ''
  const sortBy = sortOptions.some((option) => option.value === query['sort-by'])
    ? query['sort-by']
    : 'status'

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
  return consignment.reference.toLowerCase().includes(search.toLowerCase())
}

const getSortValue = (consignment, sortBy) => {
  if (sortBy === 'arrival') return consignment.arrivalAt
  if (sortBy === 'reference') return consignment.reference
  return consignment.submittedAt
}

const buildDocumentsProvidedText = (consignment) => {
  const documentEntries = [
    { singular: 'Catch certificate', plural: 'Catch certificates', typeSlug: 'catch-certificate' },
    { singular: 'Processing statement', plural: 'Processing statements', typeSlug: 'processing-statement' },
    { singular: 'Non-manipulation declaration', plural: 'Non-manipulation declarations', typeSlug: 'nmd' },
    { singular: 'Additional document', plural: 'Additional documents', typeSlug: 'additional' }
  ]

  return documentEntries
    .map((entry) => ({
      ...entry,
      count: consignment.documents.filter((document) => document.typeSlug === entry.typeSlug).length
    }))
    .filter((entry) => entry.count > 0)
    .map((entry) => `${entry.count === 1 ? entry.singular : entry.plural} (${entry.count})`)
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
      if (filters.sortBy === 'status') {
        const statusComparison = (statusSortOrder[left.status] ?? 3) - (statusSortOrder[right.status] ?? 3)
        if (statusComparison !== 0) return statusComparison

        return left.submittedAt.localeCompare(right.submittedAt) * direction
      }

      const comparison = getSortValue(left, filters.sortBy).localeCompare(getSortValue(right, filters.sortBy))
      return comparison * direction
    })
    .map((consignment) => ({
      ...consignment,
      encodedReference: encodeURIComponent(consignment.reference),
      documentsProvidedLines: buildDocumentsProvidedText(consignment)
    }))
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
  buildDraftSessionData,
  filterAndSortConsignments,
  getDashboardFilters,
  getFilterOptions
}
