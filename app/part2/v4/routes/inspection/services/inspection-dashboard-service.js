const {
  STATUS_CODES,
  RISK_FLAG_CODES,
  mockConsignmentSummariesApi
} = require('../mock-api/consignment-summaries-api')

const ALL_FILTER_VALUE = '__all__'
const ACTIVE_TAB = 'active'
const COMPLETED_TAB = 'completed'
const DEFAULT_SORT_BY = 'estimated-arrival'
const DEFAULT_SORT_ORDER = 'asc'

const STATUS_LABELS = {
  REQUIRES_DOCUMENT_CHECK: 'Requires document check',
  IN_PROGRESS: 'In progress',
  REQUEST_ADDITIONAL_INFORMATION: 'Request Additional Information from Importer',
  REFERRED_TO_MMO: 'Referred To MMO',
  COMPLETED: 'Completed',
  REQUIRES_PHYSICAL_INSPECTION: 'Requires physical inspection',
  APPEAL_UNDER_REVIEW: 'Appeal under review',
  REFERRED_TO_ENFORCEMENT: 'Referred to enforcement',
  REJECTED: 'Rejected',
  CLOSED: 'Closed'
}

const STATUS_TAG_CLASSES = {
  REQUIRES_DOCUMENT_CHECK: 'govuk-tag--red',
  IN_PROGRESS: 'govuk-tag--blue',
  REQUEST_ADDITIONAL_INFORMATION: 'govuk-tag--yellow',
  REFERRED_TO_MMO: 'govuk-tag--purple',
  COMPLETED: 'govuk-tag--green',
  REQUIRES_PHYSICAL_INSPECTION: 'govuk-tag--red',
  APPEAL_UNDER_REVIEW: 'govuk-tag--yellow',
  REFERRED_TO_ENFORCEMENT: 'govuk-tag--purple',
  REJECTED: 'govuk-tag--red',
  CLOSED: 'govuk-tag--grey'
}

const RISK_FLAG_LABELS = {
  COMMODITY_MISMATCH: 'Declared commodity mismatch',
  WEIGHT_MISMATCH: 'Weight Mismatch',
  MISSING_EVIDENCE: 'Missing Evidence',
  IMPORTER_DECLARATION_MISSING: 'Importer Declaration Missing',
  TRANSPORT_INFORMATION_MISSING: 'Transport Information Missing'
}

const hasEvidenceIssues = (consignment) => consignment.riskFlags.length > 0

const hasMismatch = (consignment) => consignment.riskFlags.some((flag) => (
  flag === 'COMMODITY_MISMATCH' || flag === 'WEIGHT_MISMATCH'
))

const QUICK_FILTER_GROUPS = [
  {
    key: 'awaiting-inspection',
    label: 'Awaiting inspection',
    tab: ACTIVE_TAB,
    matches: (consignment) => consignment.status === 'REQUIRES_DOCUMENT_CHECK'
  },
  {
    key: 'in-progress',
    label: 'In progress',
    tab: ACTIVE_TAB,
    matches: (consignment) => consignment.status === 'IN_PROGRESS'
  },
  {
    key: 'completed-today',
    label: 'Completed today',
    tab: COMPLETED_TAB,
    matches: (consignment) => consignment.status === 'COMPLETED' && consignment.isCompletedToday
  },
  {
    key: 'mismatches-flagged',
    label: 'Mismatches flagged',
    matches: hasMismatch
  }
]

const SORT_OPTIONS = [
  { value: 'estimated-arrival', text: 'Estimated Arrival' },
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

const formatArrivalDateHeading = (isoDate) => new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
}).format(new Date(`${isoDate}T00:00:00Z`))

const formatWeightKg = (value) => new Intl.NumberFormat('en-GB').format(value) + ' kg'

const normalizeString = (value) => String(value || '').trim()

const normalizeSelectFilter = (value) => normalizeString(value) || ALL_FILTER_VALUE

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

const formatArrivalTiming = (daysUntilArrival) => {
  if (daysUntilArrival === 0) return 'Arrival today'
  if (daysUntilArrival === 1) return 'Arrival in 1 day'
  if (daysUntilArrival > 1) return `Arrival in ${daysUntilArrival} days`
  if (daysUntilArrival === -1) return 'Overdue by 1 day'
  return `Overdue by ${Math.abs(daysUntilArrival)} days`
}

const buildDocumentsProvidedText = (consignment) => {
  const documentEntries = [
    { singular: 'Catch certificate', plural: 'Catch certificates', count: consignment.catchCertificateCount },
    { singular: 'Processing statement', plural: 'Processing statements', count: consignment.processingStatementCount },
    { singular: 'Non-manipulation declaration', plural: 'Non-manipulation declarations', count: consignment.nmdCount },
    { singular: 'Additional document', plural: 'Additional documents', count: consignment.additionalDocumentCount }
  ]

  return documentEntries
    .filter((entry) => entry.count > 0)
    .map((entry) => `${entry.count === 1 ? entry.singular : entry.plural} (${entry.count})`)
}

const buildCommoditySpeciesSummary = (consignment) => {
  const commoditySpecies = consignment.commoditySpecies
  if (!Array.isArray(commoditySpecies) || !commoditySpecies.length) return null

  const groupsByCode = new Map()
  for (const item of commoditySpecies) {
    if (!groupsByCode.has(item.commodityCode)) {
      groupsByCode.set(item.commodityCode, { commodityCode: item.commodityCode, species: [] })
    }
    groupsByCode.get(item.commodityCode).species.push(item)
  }
  const groups = Array.from(groupsByCode.values())

  return {
    speciesCount: commoditySpecies.length,
    commodityCount: groups.length,
    totalWeightDisplay: formatWeightKg(consignment.declaredWeightKg),
    initialGroup: groups[0],
    remainingGroups: groups.slice(1)
  }
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
  const requestedTab = normalizeString(query.tab)
  const tab = requestedTab === COMPLETED_TAB ? COMPLETED_TAB : ACTIVE_TAB
  const requestedQuickFilters = Array.isArray(query['quick-filter'])
    ? query['quick-filter']
    : [query['quick-filter']]
  const quickFilters = QUICK_FILTER_GROUPS
    .map((group) => group.key)
    .filter((key) => requestedQuickFilters.some((value) => normalizeString(value) === key))
  const sortBy = normalizeString(query['sort-by'])
  const sortOrder = normalizeString(query['sort-order'])

  const filters = {
    tab,
    quickFilters,
    search: getFilterValue(query, 'search') || getFilterValue(query, 'search-reference') || getFilterValue(query, 'search-importer-name'),
    importer: normalizeSelectFilter(query['filter-importer']),
    status: normalizeSelectFilter(query['filter-status']),
    origin: normalizeSelectFilter(query['filter-origin']),
    arrivalFrom: getFilterValue(query, 'filter-arrival-from'),
    arrivalTo: getFilterValue(query, 'filter-arrival-to'),
    riskIndicator: normalizeSelectFilter(query['filter-risk-indicator']),
    sortBy: SORT_OPTIONS.some((option) => option.value === sortBy) ? sortBy : DEFAULT_SORT_BY,
    sortOrder: SORT_ORDER_OPTIONS.some((option) => option.value === sortOrder) ? sortOrder : DEFAULT_SORT_ORDER
  }

  return filters
}

const consignmentMatchesFilters = (consignment, filters) => {
  const search = filters.search.toLowerCase()
  const estimatedArrivalDateOnly = toUtcDate(consignment.estimatedArrival)
  const arrivalFromDate = parseIsoDateInput(filters.arrivalFrom)
  const arrivalToDate = parseIsoDateInput(filters.arrivalTo)

  if (search && !consignment.reference.toLowerCase().includes(search) && !consignment.importer.toLowerCase().includes(search)) return false
  for (const key of filters.quickFilters) {
    const quickFilter = QUICK_FILTER_GROUPS.find((group) => group.key === key)
    if (quickFilter && !quickFilter.matches(consignment)) return false
  }
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
  arrivalTimingLabel: formatArrivalTiming(consignment.daysUntilArrival),
  daysUntilArrivalTagClass: mapDaysUntilArrivalTagClass(consignment.daysUntilArrival),
  commodityCodes: consignment.commodityCodes,
  commoditySpeciesSummary: buildCommoditySpeciesSummary(consignment),
  species: consignment.species,
  declaredWeightDisplay: formatWeightKg(consignment.declaredWeightKg),
  documentsProvidedLines: buildDocumentsProvidedText(consignment),
  statusLabel: consignment.statusLabelOverride || STATUS_LABELS[consignment.status],
  statusTagClass: consignment.statusTagClassOverride || STATUS_TAG_CLASSES[consignment.status],
  riskFlags: consignment.riskFlags.map((riskFlagCode) => ({
    code: riskFlagCode,
    text: RISK_FLAG_LABELS[riskFlagCode]
  }))
})

const buildTabViewModel = (consignments, filters) => {
  const filteredConsignments = filterConsignments(consignments, filters)
  const sortedConsignments = sortConsignments(filteredConsignments, filters)
  const hasRows = sortedConsignments.length > 0
  const rows = sortedConsignments.map(mapConsignmentForView)

  if (filters.sortBy === DEFAULT_SORT_BY) {
    let previousArrivalDate
    for (const row of rows) {
      if (row.estimatedArrivalIsoDate !== previousArrivalDate) {
        row.arrivalDateHeading = formatArrivalDateHeading(row.estimatedArrivalIsoDate)
        previousArrivalDate = row.estimatedArrivalIsoDate
      }
    }
  }

  return {
    rows,
    totalCount: consignments.length,
    filteredTotalCount: sortedConsignments.length,
    filteredStart: hasRows ? 1 : 0,
    filteredEnd: sortedConsignments.length,
    pagination: {
      currentPage: 1,
      pageCount: hasRows ? 1 : 0,
      pageLinks: [],
      previousHref: '',
      nextHref: ''
    }
  }
}

const buildDashboardHref = (filters, basePath, tab, overrides = {}) => {
  const query = new URLSearchParams({ tab })
  const values = {
    'quick-filter': filters.quickFilters,
    search: filters.search,
    'filter-importer': filters.importer === ALL_FILTER_VALUE ? '' : filters.importer,
    'filter-status': filters.status === ALL_FILTER_VALUE ? '' : filters.status,
    'filter-origin': filters.origin === ALL_FILTER_VALUE ? '' : filters.origin,
    'filter-risk-indicator': filters.riskIndicator === ALL_FILTER_VALUE ? '' : filters.riskIndicator,
    'filter-arrival-from': filters.arrivalFrom,
    'filter-arrival-to': filters.arrivalTo,
    'sort-by': filters.sortBy === DEFAULT_SORT_BY ? '' : filters.sortBy,
    'sort-order': filters.sortOrder === DEFAULT_SORT_ORDER ? '' : filters.sortOrder,
    ...overrides
  }

  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) query.append(key, item)
      }
    } else if (value) {
      query.set(key, value)
    }
  }

  return `${basePath}/inspections?${query.toString()}#${tab}`
}

const getSummaryCards = (consignments, filters, basePath) => QUICK_FILTER_GROUPS.map((group) => {
  const active = filters.quickFilters.includes(group.key)
  const tab = active ? filters.tab : (group.tab || filters.tab)
  const selectedQuickFilters = active
    ? filters.quickFilters.filter((key) => key !== group.key)
    : [...filters.quickFilters, group.key]

  return {
    key: group.key,
    label: group.label,
    count: consignments.filter((consignment) => (
      (group.tab || filters.tab) === COMPLETED_TAB
        ? consignment.status === 'COMPLETED'
        : consignment.status !== 'COMPLETED'
    )).filter(group.matches).length,
    modifier: ['awaiting-inspection', 'mismatches-flagged'].includes(group.key) ? 'action' : '',
    active,
    tabVariants: group.key === 'mismatches-flagged'
      ? [ACTIVE_TAB, COMPLETED_TAB].map((targetTab) => ({
          tab: targetTab,
          count: consignments.filter((item) => (item.status === 'COMPLETED') === (targetTab === COMPLETED_TAB)).filter(group.matches).length,
          href: buildDashboardHref(filters, basePath, targetTab, { 'quick-filter': selectedQuickFilters })
        }))
      : [],
    href: buildDashboardHref(filters, basePath, tab, {
      'quick-filter': selectedQuickFilters
    })
  }
})

const getActiveFilterChips = (filters, basePath, tab) => {
  const chips = []
  const addChip = (key, label, resetValue = '') => {
    chips.push({
      label,
      href: buildDashboardHref(filters, basePath, tab, { [key]: resetValue })
    })
  }

  for (const key of filters.quickFilters) {
    const group = QUICK_FILTER_GROUPS.find((item) => item.key === key)
    addChip('quick-filter', `View: ${group.label}`, filters.quickFilters.filter((item) => item !== key))
  }
  if (filters.search) addChip('search', `Search: ${filters.search}`)
  if (filters.importer !== ALL_FILTER_VALUE) addChip('filter-importer', `Importer: ${filters.importer}`)
  if (filters.status !== ALL_FILTER_VALUE) {
    const statusLabel = STATUS_LABELS[filters.status] || filters.status
    addChip('filter-status', `Status: ${statusLabel}`)
  }
  if (filters.origin !== ALL_FILTER_VALUE) addChip('filter-origin', `Exporting country: ${filters.origin}`)
  if (filters.riskIndicator !== ALL_FILTER_VALUE) {
    addChip('filter-risk-indicator', `Risk indicator: ${RISK_FLAG_LABELS[filters.riskIndicator] || filters.riskIndicator}`)
  }
  if (filters.arrivalFrom) addChip('filter-arrival-from', `Arrival from: ${filters.arrivalFrom}`)
  if (filters.arrivalTo) addChip('filter-arrival-to', `Arrival to: ${filters.arrivalTo}`)

  return chips
}

const buildInspectionDashboardViewModel = (query = {}, today = new Date(), statusOverrides = {}, basePath = '/part2/v4') => {
  const filters = buildDashboardFilters(query)
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(today).map((consignment) => {
    const override = statusOverrides[consignment.reference]
    if (!override) return consignment
    const isCompleted = override.statusCode === 'COMPLETED'
    const completedAt = isCompleted && override.completedAt ? new Date(override.completedAt) : null
    return {
      ...consignment,
      status: override.statusCode,
      completedAt,
      isCompletedToday: completedAt !== null && toUtcDate(completedAt).getTime() === toUtcDate(today).getTime(),
      statusLabelOverride: override.statusLabel,
      statusTagClassOverride: override.statusTagClass
    }
  })
  const activeConsignments = consignments.filter((consignment) => consignment.status !== 'COMPLETED')
  const completedConsignments = consignments.filter((consignment) => consignment.status === 'COMPLETED')

  const active = buildTabViewModel(activeConsignments, filters)
  const completed = buildTabViewModel(completedConsignments, filters)
  const uniqueImporters = [...new Set(consignments.map((consignment) => consignment.importer))].sort((first, second) => first.localeCompare(second, 'en-GB'))
  const uniqueOrigins = [...new Set(consignments.map((consignment) => consignment.originCountry))].sort((first, second) => first.localeCompare(second, 'en-GB'))
  const evidenceIssuesCount = consignments.filter(hasEvidenceIssues).length
  const completedTodayCount = consignments.filter((consignment) => (
    consignment.status === 'COMPLETED' && consignment.isCompletedToday
  )).length

  const hasActiveDashboardFilters = (
    filters.quickFilters.length > 0 ||
    Boolean(filters.search) ||
    filters.importer !== ALL_FILTER_VALUE ||
    filters.status !== ALL_FILTER_VALUE ||
    filters.origin !== ALL_FILTER_VALUE ||
    Boolean(filters.arrivalFrom) ||
    Boolean(filters.arrivalTo) ||
    filters.riskIndicator !== ALL_FILTER_VALUE ||
    filters.sortBy !== DEFAULT_SORT_BY ||
    filters.sortOrder !== DEFAULT_SORT_ORDER
  )

  const activeFilterChipsByTab = {
    [ACTIVE_TAB]: getActiveFilterChips(filters, basePath, ACTIVE_TAB),
    [COMPLETED_TAB]: getActiveFilterChips(filters, basePath, COMPLETED_TAB)
  }

  return {
    activeTab: filters.tab,
    dashboardFilters: filters,
    filterOptions: {
      referenceOptions: consignments.map((consignment) => consignment.reference).sort((first, second) => first.localeCompare(second, 'en-GB')),
      importerNameOptions: uniqueImporters,
      statusOptions: buildStatusOptions(),
      originOptions: buildOptionsForValues(uniqueOrigins, 'All origins'),
      riskOptions: buildRiskOptions(),
      sortOptions: SORT_OPTIONS,
      sortOrderOptions: SORT_ORDER_OPTIONS
    },
    active,
    completed,
    summaryCards: getSummaryCards(consignments, filters, basePath),
    activeFilterChipsByTab,
    activeCount: activeConsignments.length,
    completedCount: completedConsignments.length,
    completedTodayCount,
    evidenceIssuesCount,
    hasActiveDashboardFilters
  }
}

module.exports = {
  ALL_FILTER_VALUE,
  buildDashboardFilters,
  filterConsignments,
  sortConsignments,
  getSummaryCards,
  getActiveFilterChips,
  buildInspectionDashboardViewModel
}
