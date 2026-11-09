const portOfEntryOptions = require('../data/port-of-entry-options')
const chedPFishCommodityGroups = require('../data/commodities/ched-p-fish-commodities')

const currentStatuses = new Set(['submitted', 'under-review', 'action-required'])
const historicalStatuses = new Set(['accepted', 'rejected'])
const draftStatuses = new Set(['draft'])
const activeStatuses = new Set([...draftStatuses, ...currentStatuses])
const quickFilterStatusGroups = {
  'action-required': {
    label: 'Action required',
    statuses: new Set(['action-required']),
    tab: 'active',
    modifier: 'action'
  },
  drafts: { label: 'Draft notifications', statuses: draftStatuses, tab: 'active' },
  submissions: { label: 'Submitted notifications', statuses: currentStatuses, tab: 'active' },
  accepted: { label: 'Accepted notifications', statuses: new Set(['accepted']), tab: 'completed', modifier: 'submitted' }
}

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
  { value: 'arrival', text: 'Estimated arrival' },
  { value: 'reference', text: 'Notification reference' }
]

const statusSortOrder = {
  'action-required': 0,
  'under-review': 1,
  submitted: 2
}

const commodityDescriptionByCode = new Map()
chedPFishCommodityGroups.forEach((commodity) => {
  for (const code of [commodity.code, ...commodity.tariffCommodityCodes]) {
    if (!commodityDescriptionByCode.has(code)) {
      commodityDescriptionByCode.set(code, commodity.name)
    }
  }
})

const normalizeValue = (value) => typeof value === 'string' ? value.trim() : ''
const normalizeFilterValues = (value) => [...new Set((Array.isArray(value) ? value : [value])
  .map(normalizeValue)
  .filter(Boolean))]

const shortenCommodityDescription = (description) => description
  .replace(/\bfish of the families\b.*$/i, 'fish')
  .replace(/\s*\([^)]*\)/g, '')
  .replace(/\s*"[^"]*"/g, '')
  .replace(/,\s*n\.e\.s\./gi, '')
  .replace(/\s+/g, ' ')
  .trim()

const getCommodityOptions = (consignments) => {
  const commodityCodes = new Set()
  const speciesByCommodityCode = new Map()
  const addSpeciesDescription = (code, species) => {
    if (!code || !species) return
    const descriptions = speciesByCommodityCode.get(code) || new Set()
    if (![...descriptions].some((description) => description.toLowerCase() === species.toLowerCase())) {
      descriptions.add(species)
    }
    speciesByCommodityCode.set(code, descriptions)
  }

  for (const consignment of consignments) {
    const importedSpecies = Array.isArray(consignment.importedSpecies) ? consignment.importedSpecies : []
    const codes = [
      ...(Array.isArray(consignment.commodityCodes) ? consignment.commodityCodes : []),
      consignment.commodityCode,
      ...importedSpecies.map((item) => item.commodityCode)
    ].map(normalizeValue).filter(Boolean)

    codes.forEach((code) => commodityCodes.add(code))

    if (importedSpecies.length) {
      importedSpecies.forEach((item) => {
        const code = normalizeValue(item.commodityCode) || (codes.length === 1 ? codes[0] : '')
        addSpeciesDescription(code, normalizeValue(item.species))
      })
    } else {
      codes.forEach((code) => addSpeciesDescription(code, normalizeValue(consignment.species || consignment.speciesSummary)))
    }
  }

  return [...commodityCodes]
    .sort((left, right) => left.localeCompare(right, 'en-GB'))
    .map((code) => {
      const sourceDescription = commodityDescriptionByCode.get(code) ||
        [...(speciesByCommodityCode.get(code) || [])].sort((left, right) => left.localeCompare(right, 'en-GB')).join('; ')
      const description = shortenCommodityDescription(sourceDescription)
      return {
        label: code,
        value: code,
        description,
        searchTerms: [...new Set([code, description, sourceDescription].filter(Boolean))]
      }
    })
}

const getSpeciesOptions = (consignments) => {
  const speciesByName = new Map()
  const addSpecies = (name, searchTerm = '') => {
    const label = normalizeValue(name)
    if (!label) return

    const key = label.toLowerCase()
    if (!speciesByName.has(key)) {
      speciesByName.set(key, { label, value: label, searchTerms: new Set() })
    }
    if (searchTerm) speciesByName.get(key).searchTerms.add(searchTerm)
  }

  for (const consignment of consignments) {
    const importedSpecies = Array.isArray(consignment.importedSpecies) ? consignment.importedSpecies : []
    if (importedSpecies.length) {
      importedSpecies.forEach((item) => addSpecies(item.species, normalizeValue(item.scientificName)))
    } else {
      addSpecies(consignment.species)
      addSpecies(consignment.speciesSummary)
    }
  }

  return [...speciesByName.values()]
    .sort((left, right) => left.label.localeCompare(right.label, 'en-GB'))
    .map((option) => ({ ...option, searchTerms: [...option.searchTerms] }))
}

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
    'review-importer-exporter-agent-details': `New England Seafood International Ltd; ${consignment.exporter}`
  }
}

const getDashboardFilters = (query = {}) => {
  const status = statusOptions.some((option) => option.value && option.value === query.status)
    ? query.status
    : ''
  const sortBy = sortOptions.some((option) => option.value === query['sort-by'])
    ? query['sort-by']
    : 'arrival'
  const quickFilter = Object.prototype.hasOwnProperty.call(quickFilterStatusGroups, query['quick-filter'])
    ? query['quick-filter']
    : ''

  return {
    search: normalizeValue(query.search),
    quickFilter,
    status,
    origin: normalizeValue(query.origin),
    port: normalizeValue(query.port),
    commodities: normalizeFilterValues(query.commodity),
    species: normalizeFilterValues(query.species),
    sortBy,
    sortOrder: query['sort-order'] === 'desc' ? 'desc' : 'asc'
  }
}

const matchesSearch = (consignment, search) => {
  if (!search) return true
  return consignment.reference.toLowerCase().includes(search.toLowerCase())
}

const matchesPort = (consignment, selectedPort) => {
  if (!selectedPort) return true
  const option = portOfEntryOptions.find(({ value }) => value === selectedPort)
  const acceptedValues = [selectedPort, ...(option ? option.aliases : [])]
  const consignmentPort = normalizeValue(consignment.port).toLowerCase()
  return acceptedValues.some((value) => normalizeValue(value).toLowerCase() === consignmentPort)
}

const matchesCommodities = (consignment, selectedCommodities) => {
  if (!selectedCommodities.length) return true
  const commodityCodes = [
    ...(Array.isArray(consignment.commodityCodes) ? consignment.commodityCodes : []),
    consignment.commodityCode,
    ...(Array.isArray(consignment.importedSpecies)
      ? consignment.importedSpecies.map((item) => item.commodityCode)
      : [])
  ].map((code) => normalizeValue(code).toLowerCase())
  return selectedCommodities.some((commodity) => commodityCodes.includes(commodity.toLowerCase()))
}

const matchesSpecies = (consignment, selectedSpecies) => {
  if (!selectedSpecies.length) return true
  const importedSpecies = Array.isArray(consignment.importedSpecies) ? consignment.importedSpecies : []
  const speciesNames = importedSpecies.length
    ? importedSpecies.flatMap((item) => [item.species, item.scientificName])
    : [consignment.species, consignment.speciesSummary]
  const normalizedSpecies = speciesNames.map((name) => normalizeValue(name).toLowerCase()).filter(Boolean)
  return selectedSpecies.some((species) => normalizedSpecies.some((name) => name.includes(species.toLowerCase())))
}

const getSortValue = (consignment, sortBy) => {
  if (sortBy === 'arrival') return consignment.arrivalAt
  if (sortBy === 'reference') return consignment.reference
  return consignment.submittedAt || ''
}

const formatArrivalDateHeading = (arrivalAt) => {
  const isoDate = normalizeValue(arrivalAt).split('T')[0]
  if (!isoDate) return ''

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${isoDate}T00:00:00Z`))
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
      count: consignment.documentCounts?.[entry.typeSlug] ??
        consignment.documents.filter((document) => document.typeSlug === entry.typeSlug).length
    }))
    .filter((entry) => entry.count > 0)
    .map((entry) => `${entry.count === 1 ? entry.singular : entry.plural} (${entry.count})`)
}

const buildCommoditySpeciesSummary = (importedSpecies) => {
  if (!Array.isArray(importedSpecies) || !importedSpecies.length) return null

  return {
    speciesCount: importedSpecies.length,
    commodityCount: new Set(importedSpecies.map((item) => item.commodityCode || 'Commodity code not provided')).size,
    displayText: importedSpecies.map((item) => (
      `${item.commodityCode || 'Commodity code not provided'} ${item.species || 'Species not provided'} ${item.notificationWeight || 'Weight not provided'}`
    )).join(', ')
  }
}

const filterAndSortConsignments = (consignments, filters, tab) => {
  const allowedStatuses = tab === 'completed' ? historicalStatuses : activeStatuses
  const direction = filters.sortOrder === 'asc' ? 1 : -1
  let previousArrivalDate

  return consignments
    .filter((consignment) => allowedStatuses.has(consignment.status))
    .filter((consignment) => !filters.quickFilter || quickFilterStatusGroups[filters.quickFilter].statuses.has(consignment.status))
    .filter((consignment) => matchesSearch(consignment, filters.search))
    .filter((consignment) => !filters.status || consignment.status === filters.status)
    .filter((consignment) => !filters.origin || consignment.origin === filters.origin)
    .filter((consignment) => matchesPort(consignment, filters.port))
    .filter((consignment) => matchesCommodities(consignment, filters.commodities))
    .filter((consignment) => matchesSpecies(consignment, filters.species))
    .sort((left, right) => {
      if (filters.sortBy === 'status') {
        const statusComparison = (statusSortOrder[left.status] ?? 3) - (statusSortOrder[right.status] ?? 3)
        if (statusComparison !== 0) return statusComparison

        return normalizeValue(left.submittedAt).localeCompare(normalizeValue(right.submittedAt)) * direction
      }

      const comparison = getSortValue(left, filters.sortBy).localeCompare(getSortValue(right, filters.sortBy))
      return comparison * direction
    })
    .map((consignment) => {
      const arrivalDate = normalizeValue(consignment.arrivalAt).split('T')[0]
      const arrivalDateHeading = filters.sortBy === 'arrival' && arrivalDate && arrivalDate !== previousArrivalDate
        ? formatArrivalDateHeading(consignment.arrivalAt)
        : undefined
      previousArrivalDate = arrivalDate

      return {
        ...consignment,
        encodedReference: encodeURIComponent(consignment.reference),
        documentsProvidedLines: buildDocumentsProvidedText(consignment),
        commoditySpeciesSummary: buildCommoditySpeciesSummary(consignment.importedSpecies),
        arrivalDateHeading
      }
    })
}

const getFilterOptions = (consignments) => ({
  activeStatusOptions: statusOptions.filter((option) => ['', 'draft', 'submitted', 'under-review', 'action-required'].includes(option.value)),
  completedStatusOptions: statusOptions.filter((option) => ['', 'accepted', 'rejected'].includes(option.value)),
  sortOptions,
  originOptions: [
    { value: '', text: 'All origins' },
    ...Array.from(new Set(consignments.map((consignment) => consignment.origin)))
      .sort()
      .map((origin) => ({ value: origin, text: origin }))
  ],
  commodityOptions: getCommodityOptions(consignments),
  speciesOptions: getSpeciesOptions(consignments),
  referenceOptions: consignments.map((consignment) => consignment.reference).sort((first, second) => first.localeCompare(second, 'en-GB'))
})

const buildDashboardHref = (filters, basePath, variant, tab, overrides = {}) => {
  const values = {
    search: filters.search,
    'quick-filter': filters.quickFilter,
    status: filters.status,
    origin: filters.origin,
    port: filters.port,
    commodity: filters.commodities,
    species: filters.species,
    'sort-by': filters.sortBy,
    'sort-order': filters.sortOrder,
    ...overrides
  }
  const query = new URLSearchParams({ variant, tab })

  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => query.append(key, item))
      continue
    }
    if (!value || (key === 'sort-by' && value === 'arrival') || (key === 'sort-order' && value === 'asc')) continue
    query.set(key, value)
  }

  return `${basePath}/dashboard?${query.toString()}#${tab}`
}

const getSummaryCards = (consignments, filters, basePath, variant, activeTab) => (
  Object.entries(quickFilterStatusGroups).map(([key, group]) => {
    const active = filters.quickFilter === key
    const tab = active ? activeTab : group.tab

    return {
      key,
      label: group.label,
      modifier: group.modifier || '',
      count: consignments.filter((consignment) => group.statuses.has(consignment.status)).length,
      active,
      href: buildDashboardHref(filters, basePath, variant, tab, {
        'quick-filter': active ? '' : key
      })
    }
  })
)

const getActiveFilterChips = (filters, options, basePath, variant, activeTab) => {
  const chips = []
  const addChip = (key, label, resetValue = '') => {
    chips.push({
      label,
      href: buildDashboardHref(filters, basePath, variant, activeTab, { [key]: resetValue })
    })
  }

  if (filters.quickFilter) addChip('quick-filter', `View: ${quickFilterStatusGroups[filters.quickFilter].label}`)
  if (filters.search) addChip('search', `Reference: ${filters.search}`)
  if (filters.status) {
    const statusLabel = statusOptions.find((option) => option.value === filters.status)?.text || filters.status
    addChip('status', `Status: ${statusLabel}`)
  }
  if (filters.origin) addChip('origin', `Exporting country: ${filters.origin}`)
  if (filters.port) addChip('port', `Port of entry: ${filters.port}`)
  filters.commodities.forEach((commodity) => {
    addChip('commodity', `Commodity: ${commodity}`, filters.commodities.filter((value) => value !== commodity))
  })
  filters.species.forEach((species) => {
    addChip('species', `Species: ${species}`, filters.species.filter((value) => value !== species))
  })
  if (filters.sortBy !== 'arrival') {
    const sortByLabel = options.sortOptions.find((option) => option.value === filters.sortBy)?.text || filters.sortBy
    addChip('sort-by', `Sort by: ${sortByLabel}`, 'arrival')
  }
  if (filters.sortOrder !== 'asc') addChip('sort-order', 'Sort order: Newest first', 'asc')

  return chips
}

module.exports = {
  buildDraftSessionData,
  filterAndSortConsignments,
  getDashboardFilters,
  getFilterOptions,
  getSummaryCards,
  getActiveFilterChips
}
