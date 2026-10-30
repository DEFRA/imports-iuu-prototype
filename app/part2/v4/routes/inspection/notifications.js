const millisecondsPerDay = 24 * 60 * 60 * 1000

const inspectionNotificationSeeds = require('../../data/inspection-notification-seeds')

const toUtcDate = (date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

const addDays = (date, dayOffset) => {
  const nextDate = new Date(date.getTime())
  nextDate.setUTCDate(nextDate.getUTCDate() + dayOffset)
  return nextDate
}

const getDifferenceInDays = (laterDate, earlierDate) => {
  return Math.round((laterDate.getTime() - earlierDate.getTime()) / millisecondsPerDay)
}

const formatShortDate = (date) => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC'
}).format(date)

const buildInspectionNotifications = (today = new Date()) => {
  const startOfToday = toUtcDate(today)
  const notifications = inspectionNotificationSeeds.map((seed) => {
    const submittedOnDate = addDays(startOfToday, -seed.submittedDaysAgo)
    const arrivalDate = seed.arrivalDate
      ? new Date(seed.arrivalDate + 'T00:00:00Z')
      : addDays(startOfToday, seed.arrivalOffsetDays)

    return {
      ...seed,
      submittedOnDate,
      submittedOnDateDisplay: formatShortDate(submittedOnDate),
      arrivalDate,
      arrivalDateDisplay: formatShortDate(arrivalDate),
      arrivalOffsetDays: getDifferenceInDays(arrivalDate, startOfToday),
      daysUntilExpected: getDifferenceInDays(arrivalDate, submittedOnDate)
    }
  })

  return notifications.sort((first, second) => first.daysUntilExpected - second.daysUntilExpected)
}

const getInspectionNotificationByReference = (reference, today = new Date()) => {
  const notifications = buildInspectionNotifications(today)
  return notifications.find((notification) => notification.reference === reference)
}

const buildCommodityWeightComparison = (notification) => {
  const groupsByCode = new Map()
  for (const comparison of notification.commodityWeightComparisons || []) {
    if (!groupsByCode.has(comparison.commodityCode)) {
      groupsByCode.set(comparison.commodityCode, { code: comparison.commodityCode, species: [] })
    }
    const description = String(comparison.description || '')
    const scientificNameMatch = description.match(/^(.*?)\s+\(([^)]+)\)$/)
    groupsByCode.get(comparison.commodityCode).species.push({
      ...comparison,
      name: scientificNameMatch ? scientificNameMatch[1] : description,
      scientificName: scientificNameMatch ? scientificNameMatch[2] : ''
    })
  }
  const weightFields = ['notificationWeight', 'catchCertificateWeight', 'processingStatementWeight', 'nonManipulationDeclarationWeight']
  const groups = Array.from(groupsByCode.values()).map((group) => ({
    ...group,
    subtotals: Object.fromEntries(weightFields.map((field) => {
      const values = group.species.map((species) => String(species[field] || 'Not provided'))
      const weights = values.map((value) => {
        const match = value.match(/^([\d,]+(?:\.\d+)?)\s*kg$/)
        return match ? Number(match[1].replace(/,/g, '')) : null
      })
      const allNumeric = weights.every((weight) => weight !== null && Number.isFinite(weight))
      const subtotal = allNumeric
        ? `${new Intl.NumberFormat('en-GB', { maximumFractionDigits: 3 }).format(weights.reduce((total, weight) => total + weight, 0))} kg`
        : (new Set(values).size === 1 ? values[0] : 'Incomplete')
      return [field, subtotal]
    }))
  }))
  return {
    commodityCount: groups.length,
    speciesCount: groups.reduce((count, group) => count + group.species.length, 0),
    totalWeight: notification.declaredWeight || 'Not provided',
    initialGroup: groups[0],
    remainingGroups: groups.slice(1)
  }
}

const inspectionReference = inspectionNotificationSeeds[0].reference

module.exports = {
  buildInspectionNotifications,
  getInspectionNotificationByReference,
  buildCommodityWeightComparison,
  inspectionReference
}
