const millisecondsPerDay = 24 * 60 * 60 * 1000

const inspectionNotificationSeeds = require('../../../data/part2/inspection-notification-seeds')

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

const inspectionReference = inspectionNotificationSeeds[0].reference

module.exports = {
  buildInspectionNotifications,
  getInspectionNotificationByReference,
  inspectionReference
}
