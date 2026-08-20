const {
  STATUS_CODES,
  RISK_FLAG_CODES,
  mockConsignmentSummariesApi
} = require('../mock-api/consignment-summaries-api')

const ALL_FILTER_VALUE = '__all__'
const FOR_REVIEW_TAB = 'for-review'
const IN_PROGRESS_TAB = 'in-progress'
const DEFAULT_SORT_BY = 'days-until-arrival'
const DEFAULT_SORT_ORDER = 'asc'
const PAGE_SIZE = 5

const STATUS_LABELS = {
  REQUIRES_DOCUMENT_CHECK: 'Requires Document Check',
  IN_PROGRESS: 'In Progress',
  REQUEST_ADDITIONAL_INFORMATION: 'Request Additional Information from Importer',
  REFERRED_TO_MMO: 'Referred To MMO',
  COMPLETED: 'Completed'
}

const STATUS_TAG_CLASSES = {
  REQUIRES_DOCUMENT_CHECK: 'govuk-tag--red',
  IN_PROGRESS: 'govuk-tag--blue',
  REQUEST_ADDITIONAL_INFORMATION: 'govuk-tag--yellow',
  REFERRED_TO_MMO: 'govuk-tag--purple',
  COMPLETED: 'govuk-tag--green'
}

const RISK_FLAG_LABELS = {
  COMMODITY_MISMATCH: 'Commodity Mismatch',
  WEIGHT_MISMATCH: 'Weight Mismatch',
  MISSING_EVIDENCE: 'Missing Evidence',
  IMPORTER_DECLARATION_MISSING: 'Importer Declaration Missing',
  TRANSPORT_INFORMATION_MISSING: 'Transport Information Missing'
}

const SORT_OPTIONS = [
  { value: 'estimated-arrival', text: 'Estimated Arrival' },
  { value: 'days-until-arrival', text: 'Days Until Arrival' },
  { value: 'importer', text: 'Importer' },
  { value: 'status', text: 'Status' },
  { value: 'reference', text: 'Consignment Reference' }
]

const SORT_ORDER_OPTIONS = [
  { value: 'asc', text: 'Ascending' },
  { value: 'desc', text: 'Descending' }
]

const toUtcDate = (date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

const formatShortDate = (date) => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC'
}).format(date)

const formatWeightKg = (value) => new Intl.NumberFormat('en-GB').format(value) + ' kg'

const normalizeString = (value) => String(value || '').trim()

const normalizeSelectFilter = (value) => normalizeString(value) || ALL_FILTER_VALUE

const parsePositiveIntegerOrDefault = (value, defaultValue) => {
  const parsedValue = Number.parseInt(String(value || ''), 10)
  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return defaultValue
  }
  return parsedValue
}

const parseIsoDateInput = (value) => {
  const normalizedValue = normalizeString(value)
  if (!normalizedValue) return null
  const match = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsedDate = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(parsedDate.getTime())) return null
  return parsedDate
}

const toIsoDate = (date) => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const mapDaysUntilArrivalTagClass = (daysUntilArrival) => {
  if (daysUntilArrival < 3) return 'govuk-tag--red'
  if (daysUntilArrival <= 8) return 'govuk-tag--yellow'
  return 'govuk-tag--green'
}

const buildDocumentsProvidedText = (consignment) => {
  const documentEntries = [
    { prefix: 'CC', count: consignment.catchCertificateCount },
    { prefix: 'PS', count: consignment.processingStatementCount },
    { prefix: 'NMD', count: consignment.nmdCount },
    { prefix: 'ADD', count: consignment.additionalDocumentCount }
  ]

  return documentEntries
    .filter((entry) => entry.count > 0)
    .map((entry) => `${entry.prefix}(${entry.count})`)
}

const buildStatusOptions = () => ([
  { value: ALL_FILTER_VALUE, text: 'All statuses' },
  ...STATUS_CODES.map((statusCode) => ({ value: statusCode, text: STATUS_LABELS[statusCode] }))
])

const buildRiskOptions = () => ([
  { value: ALL_FILTER_VALUE, text: 'All risk indicators' },
  ...RISK_FLAG_CODES.map((riskCode) => ({ value: riskCode, text: RISK_FLAG_LABELS[riskCode] }))
])

const buildOptionsForValues = (values, allOptionLabel) => ([
  { value: ALL_FILTER_VALUE, text: allOptionLabel },
  ...values.map((value) => ({ value, text: value }))
])

const getFilterValue = (query, fieldName) => normalizeString(query[fieldName])

const buildDashboardFilters = (query = {}) => {
  const tab = normalizeString(query.tab) === IN_PROGRESS_TAB ? IN_PROGRESS_TAB : FOR_REVIEW_TAB
  const sortBy = normalizeString(query['sort-by'])
  const sortOrder = normalizeString(query['sort-order'])

  const filters = {
    tab,
    referenceSearch: getFilterValue(query, 'search-reference'),
    importerNameSearch: getFilterValue(query, 'search-importer-name'),
    importer: normalizeSelectFilter(query['filter-importer']),
    status: normalizeSelectFilter(query['filter-status']),
    origin: normalizeSelectFilter(query['filter-origin']),
    arrivalFrom: getFilterValue(query, 'filter-arrival-from'),
    arrivalTo: getFilterValue(query, 'filter-arrival-to'),
    riskIndicator: normalizeSelectFilter(query['filter-risk-indicator']),
    sortBy: SORT_OPTIONS.some((option) => option.value === sortBy) ? sortBy : DEFAULT_SORT_BY,
    sortOrder: SORT_ORDER_OPTIONS.some((option) => option.value === sortOrder) ? sortOrder : DEFAULT_SORT_ORDER,
    forReviewPage: parsePositiveIntegerOrDefault(query['for-review-page'], 1),
    inProgressPage: parsePositiveIntegerOrDefault(query['in-progress-page'], 1)
  }

  return filters
}

const consignmentMatchesFilters = (consignment, filters) => {
  const referenceSearch = filters.referenceSearch.toLowerCase()
  const importerNameSearch = filters.importerNameSearch.toLowerCase()
  const estimatedArrivalDateOnly = toUtcDate(consignment.estimatedArrival)
  const arrivalFromDate = parseIsoDateInput(filters.arrivalFrom)
  const arrivalToDate = parseIsoDateInput(filters.arrivalTo)

  if (referenceSearch && !consignment.reference.toLowerCase().includes(referenceSearch)) return false
  if (importerNameSearch && !consignment.importer.toLowerCase().includes(importerNameSearch)) return false
  if (filters.importer !== ALL_FILTER_VALUE && consignment.importer !== filters.importer) return false
  if (filters.status !== ALL_FILTER_VALUE && consignment.status !== filters.status) return false
  if (filters.origin !== ALL_FILTER_VALUE && consignment.originCountry !== filters.origin) return false
  if (filters.riskIndicator !== ALL_FILTER_VALUE && !consignment.riskFlags.includes(filters.riskIndicator)) return false
  if (arrivalFromDate && estimatedArrivalDateOnly < arrivalFromDate) return false
  if (arrivalToDate && estimatedArrivalDateOnly > arrivalToDate) return false

  return true
}

const filterConsignments = (consignments, filters) => consignments.filter((consignment) => consignmentMatchesFilters(consignment, filters))

const compareBySortField = (first, second, sortBy) => {
  if (sortBy === 'estimated-arrival') {
    return first.estimatedArrival.getTime() - second.estimatedArrival.getTime()
  }

  if (sortBy === 'importer') {
    return first.importer.localeCompare(second.importer, 'en-GB')
  }

  if (sortBy === 'days-until-arrival') {
    return first.daysUntilArrival - second.daysUntilArrival
  }

  if (sortBy === 'status') {
    return STATUS_LABELS[first.status].localeCompare(STATUS_LABELS[second.status], 'en-GB')
  }

  if (sortBy === 'reference') {
    return first.reference.localeCompare(second.reference, 'en-GB')
  }

  return 0
}

const sortConsignments = (consignments, filters) => {
  const sortedConsignments = [...consignments].sort((first, second) => {
    const primaryResult = compareBySortField(first, second, filters.sortBy)
    if (primaryResult !== 0) return primaryResult
    return first.reference.localeCompare(second.reference, 'en-GB')
  })

  if (filters.sortOrder === 'desc') {
    sortedConsignments.reverse()
  }

  return sortedConsignments
}

const buildInspectionDashboardHref = (filters, overrides = {}) => {
  const nextTab = overrides.tab || filters.tab
  const nextForReviewPage = overrides.forReviewPage || filters.forReviewPage
  const nextInProgressPage = overrides.inProgressPage || filters.inProgressPage
  const searchParams = new URLSearchParams()

  searchParams.set('tab', nextTab)
  searchParams.set('filter-importer', filters.importer)
  searchParams.set('filter-status', filters.status)
  searchParams.set('filter-origin', filters.origin)
  searchParams.set('filter-risk-indicator', filters.riskIndicator)
  searchParams.set('sort-by', filters.sortBy)
  searchParams.set('sort-order', filters.sortOrder)
  searchParams.set('for-review-page', String(nextForReviewPage))
  searchParams.set('in-progress-page', String(nextInProgressPage))

  if (filters.referenceSearch) searchParams.set('search-reference', filters.referenceSearch)
  if (filters.importerNameSearch) searchParams.set('search-importer-name', filters.importerNameSearch)
  if (filters.arrivalFrom) searchParams.set('filter-arrival-from', filters.arrivalFrom)
  if (filters.arrivalTo) searchParams.set('filter-arrival-to', filters.arrivalTo)

  return `/inspections?${searchParams.toString()}#${nextTab}`
}

const buildPaginationViewModel = (totalFilteredCount, requestedPage, tabId, filters) => {
  if (totalFilteredCount === 0) {
    return {
      currentPage: 1,
      pageCount: 0,
      pageLinks: [],
      previousHref: '',
      nextHref: ''
    }
  }

  const pageCount = Math.ceil(totalFilteredCount / PAGE_SIZE)
  const currentPage = Math.max(1, Math.min(requestedPage, pageCount))
  const getPageHref = (pageNumber) => {
    if (tabId === FOR_REVIEW_TAB) {
      return buildInspectionDashboardHref(filters, {
        tab: FOR_REVIEW_TAB,
        forReviewPage: pageNumber
      })
    }

    return buildInspectionDashboardHref(filters, {
      tab: IN_PROGRESS_TAB,
      inProgressPage: pageNumber
    })
  }

  return {
    currentPage,
    pageCount,
    pageLinks: Array.from({ length: pageCount }, (_, index) => {
      const pageNumber = index + 1
      return {
        number: pageNumber,
        href: getPageHref(pageNumber),
        current: pageNumber === currentPage
      }
    }),
    previousHref: currentPage > 1 ? getPageHref(currentPage - 1) : '',
    nextHref: currentPage < pageCount ? getPageHref(currentPage + 1) : ''
  }
}

const mapConsignmentForView = (consignment) => ({
  id: consignment.id,
  reference: consignment.reference,
  detailPath: `/inspection/${consignment.reference}`,
  originCountry: consignment.originCountry,
  importer: consignment.importer,
  estimatedArrivalDateDisplay: formatShortDate(consignment.estimatedArrival),
  estimatedArrivalTimeDisplay: consignment.arrivalTime,
  estimatedArrivalIsoDate: toIsoDate(consignment.estimatedArrival),
  daysUntilArrival: consignment.daysUntilArrival,
  daysUntilArrivalTagClass: mapDaysUntilArrivalTagClass(consignment.daysUntilArrival),
  commodityCodes: consignment.commodityCodes,
  species: consignment.species,
  declaredWeightDisplay: formatWeightKg(consignment.declaredWeightKg),
  documentsProvidedLines: buildDocumentsProvidedText(consignment),
  statusLabel: STATUS_LABELS[consignment.status],
  statusTagClass: STATUS_TAG_CLASSES[consignment.status],
  riskFlags: consignment.riskFlags.map((riskFlagCode) => ({
    code: riskFlagCode,
    text: RISK_FLAG_LABELS[riskFlagCode]
  }))
})

const buildTabViewModel = (consignments, filters, tabId, requestedPage) => {
  const filteredConsignments = filterConsignments(consignments, filters)
  const sortedConsignments = sortConsignments(filteredConsignments, filters)
  const pagination = buildPaginationViewModel(sortedConsignments.length, requestedPage, tabId, filters)
  const currentPageRowsStartIndex = (pagination.currentPage - 1) * PAGE_SIZE
  const currentPageRows = sortedConsignments.slice(currentPageRowsStartIndex, currentPageRowsStartIndex + PAGE_SIZE)
  const filteredStart = sortedConsignments.length > 0 ? currentPageRowsStartIndex + 1 : 0
  const filteredEnd = sortedConsignments.length > 0
    ? Math.min(currentPageRowsStartIndex + currentPageRows.length, sortedConsignments.length)
    : 0

  return {
    rows: currentPageRows.map(mapConsignmentForView),
    totalCount: consignments.length,
    filteredTotalCount: sortedConsignments.length,
    filteredStart,
    filteredEnd,
    pagination
  }
}

const buildInspectionDashboardViewModel = (query = {}, today = new Date()) => {
  const filters = buildDashboardFilters(query)
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(today)
  const forReviewConsignments = consignments.filter((consignment) => consignment.status !== 'IN_PROGRESS')
  const inProgressConsignments = consignments.filter((consignment) => consignment.status === 'IN_PROGRESS')

  const forReview = buildTabViewModel(forReviewConsignments, filters, FOR_REVIEW_TAB, filters.forReviewPage)
  const inProgress = buildTabViewModel(inProgressConsignments, filters, IN_PROGRESS_TAB, filters.inProgressPage)
  const uniqueImporters = [...new Set(consignments.map((consignment) => consignment.importer))].sort((first, second) => first.localeCompare(second, 'en-GB'))
  const uniqueOrigins = [...new Set(consignments.map((consignment) => consignment.originCountry))].sort((first, second) => first.localeCompare(second, 'en-GB'))
  const mismatchesFlaggedCount = consignments.filter((consignment) => {
    return consignment.riskFlags.includes('COMMODITY_MISMATCH') || consignment.riskFlags.includes('WEIGHT_MISMATCH')
  }).length

  const hasActiveDashboardFilters = (
    Boolean(filters.referenceSearch) ||
    Boolean(filters.importerNameSearch) ||
    filters.importer !== ALL_FILTER_VALUE ||
    filters.status !== ALL_FILTER_VALUE ||
    filters.origin !== ALL_FILTER_VALUE ||
    Boolean(filters.arrivalFrom) ||
    Boolean(filters.arrivalTo) ||
    filters.riskIndicator !== ALL_FILTER_VALUE ||
    filters.sortBy !== DEFAULT_SORT_BY ||
    filters.sortOrder !== DEFAULT_SORT_ORDER
  )

  return {
    activeTab: filters.tab,
    dashboardFilters: filters,
    filterOptions: {
      importerOptions: buildOptionsForValues(uniqueImporters, 'All importers'),
      statusOptions: buildStatusOptions(),
      originOptions: buildOptionsForValues(uniqueOrigins, 'All origins'),
      riskOptions: buildRiskOptions(),
      sortOptions: SORT_OPTIONS,
      sortOrderOptions: SORT_ORDER_OPTIONS
    },
    forReview,
    inProgress,
    forReviewCount: forReviewConsignments.length,
    inProgressCount: inProgressConsignments.length,
    completedTodayCount: consignments.filter((consignment) => consignment.status === 'COMPLETED').length,
    mismatchesFlaggedCount,
    hasActiveDashboardFilters
  }
}

module.exports = {
  ALL_FILTER_VALUE,
  buildDashboardFilters,
  filterConsignments,
  sortConsignments,
  buildInspectionDashboardViewModel
}
