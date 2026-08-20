const consignmentSummarySeeds = require('../../../../data/part2/inspection-dashboard-consignment-seeds')

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * @typedef {'REQUIRES_DOCUMENT_CHECK' | 'IN_PROGRESS' | 'REQUEST_ADDITIONAL_INFORMATION' | 'REFERRED_TO_MMO' | 'COMPLETED'} ConsignmentStatus
 */

/**
 * @typedef {'COMMODITY_MISMATCH' | 'WEIGHT_MISMATCH' | 'MISSING_EVIDENCE' | 'IMPORTER_DECLARATION_MISSING' | 'TRANSPORT_INFORMATION_MISSING'} RiskFlag
 */

/**
 * @typedef {Object} ConsignmentSummary
 * @property {string} id
 * @property {string} reference
 * @property {string} importer
 * @property {string} originCountry
 * @property {Date} estimatedArrival
 * @property {string} arrivalTime
 * @property {number} daysUntilArrival
 * @property {string[]} commodityCodes
 * @property {string} species
 * @property {number} declaredWeightKg
 * @property {number} catchCertificateCount
 * @property {number} processingStatementCount
 * @property {number} nmdCount
 * @property {number} additionalDocumentCount
 * @property {ConsignmentStatus} status
 * @property {RiskFlag[]} riskFlags
 * @property {string} riskNotes
 */

const STATUS_CODES = [
  'REQUIRES_DOCUMENT_CHECK',
  'IN_PROGRESS',
  'REQUEST_ADDITIONAL_INFORMATION',
  'REFERRED_TO_MMO',
  'COMPLETED'
]

const RISK_FLAG_CODES = [
  'COMMODITY_MISMATCH',
  'WEIGHT_MISMATCH',
  'MISSING_EVIDENCE',
  'IMPORTER_DECLARATION_MISSING',
  'TRANSPORT_INFORMATION_MISSING'
]

const statusCodeSet = new Set(STATUS_CODES)
const riskFlagCodeSet = new Set(RISK_FLAG_CODES)

const toUtcDate = (date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))

const addDays = (date, dayOffset) => {
  const nextDate = new Date(date.getTime())
  nextDate.setUTCDate(nextDate.getUTCDate() + dayOffset)
  return nextDate
}

const getDifferenceInDays = (laterDate, earlierDate) => {
  return Math.round((laterDate.getTime() - earlierDate.getTime()) / MILLISECONDS_PER_DAY)
}

const assertPositiveInteger = (value, fieldName, reference) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid ${fieldName} for consignment ${reference}`)
  }
}

const assertSeedValid = (seed) => {
  if (!seed || typeof seed !== 'object') {
    throw new Error('Each consignment seed must be an object')
  }

  if (!seed.id || !seed.reference || !seed.importer || !seed.originCountry || !seed.species || !seed.arrivalTime) {
    throw new Error(`Missing required consignment data for ${seed.reference || seed.id || 'unknown reference'}`)
  }

  if (!Number.isInteger(seed.arrivalOffsetDays) || seed.arrivalOffsetDays < 2 || seed.arrivalOffsetDays > 45) {
    throw new Error(`arrivalOffsetDays must be between 2 and 45 for ${seed.reference}`)
  }

  if (!Array.isArray(seed.commodityCodes) || seed.commodityCodes.length === 0) {
    throw new Error(`commodityCodes must be a non-empty array for ${seed.reference}`)
  }

  if (!statusCodeSet.has(seed.status)) {
    throw new Error(`Invalid status ${seed.status} for ${seed.reference}`)
  }

  if (!Array.isArray(seed.riskFlags)) {
    throw new Error(`riskFlags must be an array for ${seed.reference}`)
  }

  for (const riskFlag of seed.riskFlags) {
    if (!riskFlagCodeSet.has(riskFlag)) {
      throw new Error(`Invalid risk flag ${riskFlag} for ${seed.reference}`)
    }
  }

  assertPositiveInteger(seed.declaredWeightKg, 'declaredWeightKg', seed.reference)
  assertPositiveInteger(seed.catchCertificateCount, 'catchCertificateCount', seed.reference)
  assertPositiveInteger(seed.processingStatementCount, 'processingStatementCount', seed.reference)
  assertPositiveInteger(seed.nmdCount, 'nmdCount', seed.reference)
  assertPositiveInteger(seed.additionalDocumentCount, 'additionalDocumentCount', seed.reference)
}

const buildConsignmentSummary = (seed, startOfToday) => {
  assertSeedValid(seed)
  const estimatedArrival = addDays(startOfToday, seed.arrivalOffsetDays)

  return {
    id: seed.id,
    reference: seed.reference,
    importer: seed.importer,
    originCountry: seed.originCountry,
    estimatedArrival,
    arrivalTime: seed.arrivalTime,
    daysUntilArrival: getDifferenceInDays(estimatedArrival, startOfToday),
    commodityCodes: seed.commodityCodes,
    species: seed.species,
    declaredWeightKg: seed.declaredWeightKg,
    catchCertificateCount: seed.catchCertificateCount,
    processingStatementCount: seed.processingStatementCount,
    nmdCount: seed.nmdCount,
    additionalDocumentCount: seed.additionalDocumentCount,
    status: seed.status,
    riskFlags: seed.riskFlags,
    riskNotes: seed.riskNotes || ''
  }
}

/**
 * @param {Date} [today]
 * @returns {ConsignmentSummary[]}
 */
const listConsignmentSummaries = (today = new Date()) => {
  const startOfToday = toUtcDate(today)
  return consignmentSummarySeeds.map((seed) => buildConsignmentSummary(seed, startOfToday))
}

const mockConsignmentSummariesApi = {
  listConsignmentSummaries
}

module.exports = {
  STATUS_CODES,
  RISK_FLAG_CODES,
  mockConsignmentSummariesApi
}
