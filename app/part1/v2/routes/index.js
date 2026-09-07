//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const fs = require('fs')
const path = require('path')
const basePath = '/part1/v2'
const sessionDataDefaults = require('../data/session-data-defaults')
const viewsPath = path.join(__dirname, '..', 'views')
const router = govukPrototypeKit.requests.setupRouter(basePath)
govukPrototypeKit.requests.serveDirectory(basePath + '/assets', path.join(__dirname, '..', 'assets'))

router.use((req, res, next) => {
  const sessionKey = 'part1-v2'
  const sharedData = req.session.data && typeof req.session.data === 'object' ? req.session.data : {}
  if (!sharedData['__versioned-session-initialized']) {
    for (const key of Object.keys(req.session)) {
      if (/^part\d+-v\d+$/.test(key)) {
        delete req.session[key]
      }
    }
  }
  sharedData['__versioned-session-initialized'] = true

  if (!req.session[sessionKey]) {
    req.session[sessionKey] = structuredClone(sessionDataDefaults)
  }
  Object.defineProperty(req.session, 'data', {
    configurable: true,
    get: () => req.session[sessionKey],
    set: (value) => { req.session[sessionKey] = value }
  })
  res.locals.data = req.session[sessionKey]

  const end = res.end
  res.end = function (...args) {
    Object.defineProperty(req.session, 'data', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: sharedData
    })
    return end.apply(this, args)
  }

  res.locals.basePath = basePath

  const render = res.render.bind(res)
  res.render = (view, ...args) => {
    const localView = view.startsWith('part1/')
      ? path.join(viewsPath, view.slice('part1/'.length) + '.html')
      : view
    return render(localView, ...args)
  }

  const redirect = res.redirect.bind(res)
  res.redirect = (statusOrPath, pathOrUndefined) => {
    if (typeof statusOrPath === 'number') {
      const redirectPath = pathOrUndefined.startsWith('/') ? basePath + pathOrUndefined : pathOrUndefined
      return redirect(statusOrPath, redirectPath)
    }
    const redirectPath = statusOrPath.startsWith('/') ? basePath + statusOrPath : statusOrPath
    return redirect(redirectPath)
  }

  next()
})

const getMissingValues = (requiredValues, actualValues) => {
  const actualSet = new Set(actualValues)
  return requiredValues.filter((value) => !actualSet.has(value))
}

const sampleDocumentsPath = path.join(__dirname, '..', 'data', 'sample-documents')
const prototypeSeedDocuments = require('../data/prototype-seed-documents.json')
const importerDashboardConsignments = require('../data/importer-dashboard-consignments')
const {
  filterAndSortConsignments,
  getDashboardFilters,
  getFilterOptions
} = require('./importer-dashboard-service')
const supportedExtractionVariants = new Set(['a', 'b'])
const reviewExtractionReturnPaths = new Set(['/review-extraction-a'])

const normalizeReviewExtractionReturnPath = (value) => {
  if (typeof value !== 'string') return ''
  const trimmedValue = value.trim()
  if (!trimmedValue) return ''
  const normalizedPath = trimmedValue.startsWith('/') ? trimmedValue : '/' + trimmedValue
  return reviewExtractionReturnPaths.has(normalizedPath) ? normalizedPath : ''
}

const isExtractionJourney = (data) => Boolean(data && data['extraction-variant'])
const getDocumentsCompleteRedirect = (data) => isExtractionJourney(data) ? '/processing' : '/check-answers'

const upsertSummaryField = (fields, label, value) => {
  const nextFields = Array.isArray(fields) ? [...fields] : []
  const index = nextFields.findIndex((item) => item && item.field === label)
  const entry = { field: label, value: value || '', extracted: true }

  if (index >= 0) {
    nextFields[index] = { ...nextFields[index], ...entry }
    return nextFields
  }

  nextFields.push(entry)
  return nextFields
}

const listSampleDocumentFiles = () => {
  if (!fs.existsSync(sampleDocumentsPath)) {
    return []
  }

  return fs.readdirSync(sampleDocumentsPath)
    .filter((filename) => !filename.startsWith('.'))
    .sort()
}

const findSampleExtractionJsonFile = () => listSampleDocumentFiles().find((filename) => /-extraction_.*\.json$/i.test(filename))

const isCatchCertificateFile = (filename) => filename.toUpperCase().includes('CATCH.CC')

const isProcessingStatementFile = (filename) => filename.toUpperCase().includes('CATCH.PS')

const buildGeneratedDocumentReference = (prefix, count) => {
  const year = new Date().getFullYear()
  const paddedCount = String(count).padStart(4, '0')
  return prefix + '.' + year + '.' + paddedCount
}

const extractCatchCertificateReference = (filename) => {
  const withoutExtension = filename.replace(/\.[^/.]+$/, '')
  const explicitReferenceMatch = withoutExtension.match(/\bfor\s+(.+)$/i)
  if (explicitReferenceMatch && explicitReferenceMatch[1]) {
    return explicitReferenceMatch[1].trim()
  }
  return withoutExtension
}

const buildCatchCertificateReferenceEntries = (catchCertificateFiles) => catchCertificateFiles.map((filename) => ({
  filename,
  reference: extractCatchCertificateReference(filename)
}))

const getUploadedFilesFromRequest = (req, fieldName) => {
  const files = []

  if (Array.isArray(req.files)) {
    files.push(...req.files)
  } else if (req.files && Array.isArray(req.files[fieldName])) {
    files.push(...req.files[fieldName])
  } else if (req.files && req.files[fieldName]) {
    files.push(req.files[fieldName])
  } else if (req.file) {
    files.push(req.file)
  }

  return files.filter(Boolean)
}

const extractProcessingStatementCatchReferences = (filename) => {
  const references = []
  const pattern = /\(Exp\.\s*([^)]+)\)/gi
  let match = pattern.exec(filename)
  while (match) {
    if (match[1]) references.push(match[1].trim())
    match = pattern.exec(filename)
  }
  return references
}

const buildExtractionFieldLookup = (fields) => {
  const lookup = {}
  for (const field of fields || []) {
    if (!field || !field.fieldName || field.value === undefined || field.value === null) continue
    lookup[field.fieldName] = String(field.value).trim()
  }
  return lookup
}

const splitAddressForDisplay = (address) => {
  if (!address) return { line1: '', line2: '', town: '', postcode: '' }
  const parts = String(address).split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length <= 1) {
    return { line1: parts[0] || '', line2: '', town: '', postcode: '' }
  }
  const tail = parts[parts.length - 1]
  const postcodeMatch = tail.match(/([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}|\d{4,6}[- ]?\d{0,4})$/i)
  const postcode = postcodeMatch ? postcodeMatch[1] : ''
  const town = postcode ? tail.replace(postcode, '').trim() : tail
  return {
    line1: parts[0] || '',
    line2: parts.length > 2 ? parts.slice(1, -1).join(', ') : '',
    town,
    postcode
  }
}

const getConfidenceTagClass = (confidence) => {
  if (confidence >= 90) return 'govuk-tag--green'
  if (confidence >= 70) return 'govuk-tag--yellow'
  return 'govuk-tag--red'
}

const getConfidenceLabel = (confidence) => {
  if (confidence >= 90) return 'High'
  if (confidence >= 70) return 'Medium'
  return 'Low'
}

const buildScenarioAStatusMeta = (statusKey) => {
  if (statusKey === 'complete') return { label: 'Complete', className: 'govuk-tag--green' }
  if (statusKey === 'needs-review') return { label: 'Needs review', className: 'govuk-tag--yellow' }
  if (statusKey === 'incomplete') return { label: 'Manual check required', className: 'govuk-tag--red' }
  return { label: 'Manual check required', className: 'govuk-tag--red' }
}

const buildScenarioADocumentReference = (prefix, sequence) => {
  const year = new Date().getFullYear()
  return prefix + '.' + year + '.' + String(sequence).padStart(4, '0')
}

const buildScenarioADocumentTypeMetadata = (documentType) => {
  if (documentType === 'Catch Certificate') {
    return { prefix: 'CATCH.CC.IS', productCode: '03036390', processingReference: 'Not applicable' }
  }

  if (documentType === 'Processing Statement') {
    return { prefix: 'CATCH.PS.IS', productCode: '03036611', processingReferencePrefix: 'CATCH.PS.IS' }
  }

  if (documentType === 'Non-Manipulation Declaration') {
    return { prefix: 'CATCH.NMD.GB', productCode: '03038920', processingReference: 'Not applicable' }
  }

  return { prefix: 'SUPPORT.DOC.GB', productCode: 'Not available', processingReference: 'Not applicable' }
}

const createScenarioADetailSection = (key, title, confidenceLabel, confidenceTagClass, rows, editedHighConfidenceFieldKeys = []) => {
  const editedHighConfidenceFields = new Set(
    Array.isArray(editedHighConfidenceFieldKeys) ? editedHighConfidenceFieldKeys : []
  )

  return {
    key,
    title,
    confidenceLabel,
    confidenceTagClass,
    rows: rows.map((row) => {
      const fieldKey = row.fieldKey || getScenarioAFieldKeyForRow(key, row.label)
      const hasEditedHighConfidence = Boolean(fieldKey && row.value && editedHighConfidenceFields.has(fieldKey))

      return {
        fieldKey,
        label: row.label,
        value: row.value || '',
        isMissing: !row.value,
        fieldConfidenceLabel: hasEditedHighConfidence ? 'High' : (row.fieldConfidenceLabel || confidenceLabel),
        fieldConfidenceTagClass: hasEditedHighConfidence ? 'govuk-tag--green' : (row.fieldConfidenceTagClass || confidenceTagClass)
      }
    })
  }
}

const getScenarioAFieldKeyForRow = (sectionKey, rowLabel) => {
  const sectionConfig = scenarioASectionEditConfigs[sectionKey]
  if (!sectionConfig || !Array.isArray(sectionConfig.fields)) return ''

  const matchingField = sectionConfig.fields.find((field) => field.label === rowLabel)
  return matchingField && matchingField.key ? matchingField.key : ''
}

const buildScenarioAExtractedFieldKey = (rowLabel, rowIndex) => {
  const normalizedLabel = String(rowLabel || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const labelPart = normalizedLabel || 'field'
  return 'extracted-field-' + String(rowIndex + 1).padStart(3, '0') + '-' + labelPart
}

const getScenarioAExtractedFieldControl = (rowLabel, rowValue) => {
  const normalizedLabel = String(rowLabel || '').toLowerCase()
  const valueLength = String(rowValue || '').length

  if (/address|details|context|date and time/.test(normalizedLabel) || valueLength > 80) {
    return { control: 'textarea', rows: 3 }
  }

  return { control: 'input' }
}

const scenarioASectionEditConfigs = {
  'additional-document-placeholder': {
    title: 'Additional document details',
    fields: [
      { key: 'additionalDocumentPlaceholder', label: 'Placeholder input', control: 'input' }
    ]
  },
  'transport-details-from-cc': {
    title: 'Transport details from CC',
    fields: [
      { key: 'portOfLanding', label: 'Port of Landing', control: 'input' },
      { key: 'dateOfLanding', label: 'Date of Landing', control: 'input' }
    ]
  },
  'catch-certificate-number': {
    title: 'Catch certificate number',
    fields: [
      { key: 'documentNumber', label: 'Document number', control: 'input' },
      { key: 'validatingAuthorityName', label: 'Validating Authority Name', control: 'input' },
      { key: 'validatingAuthorityAddress', label: 'Validating Authority Address', control: 'textarea', rows: 3 }
    ]
  },
  species: {
    title: 'Species',
    fields: [
      { key: 'species', label: 'Species', control: 'input' },
      { key: 'productCode', label: 'Product code', control: 'input' }
    ]
  },
  'catch-area': {
    title: 'Catch area',
    fields: [
      { key: 'catchArea', label: 'Catch Area', control: 'input' },
      { key: 'catchDateFrom', label: 'Catch Date from', control: 'input' },
      { key: 'catchDateTo', label: 'Catch Date to', control: 'input' }
    ]
  },
  'fishing-gear': {
    title: 'Fishing gear',
    fields: [
      { key: 'fishingLicenseNumber', label: 'Fishing License No.', control: 'input' },
      { key: 'fishingGear', label: 'Fishing Gear', control: 'input' }
    ]
  },
  'weight-quantity': {
    title: 'Weight/quantity',
    fields: [
      { key: 'estimatedWeightToBeLandedKg', label: 'Estimated weight to be landed in kg', control: 'input' },
      { key: 'netCatchWeightKg', label: 'Net catch weight in kg', control: 'input' },
      { key: 'verifiedWeightLandedKg', label: 'Verified weight landed in kg', control: 'input' }
    ]
  },
  'vessel-id-and-flag-state': {
    title: 'Vessel ID and flag State',
    fields: [
      { key: 'vesselName', label: 'Vessel Name', control: 'input' },
      { key: 'flagHomePortAndRegistrationNumber', label: 'Flag - home port and registration number', control: 'input' },
      { key: 'callSign', label: 'Call sign', control: 'input' },
      { key: 'imoNumberOrOtherUniqueIdentifier', label: 'IMO number or other unique identifier', control: 'input' }
    ]
  },
  'exporter-details': {
    title: 'exporter details',
    fields: [
      { key: 'nameOfExporter', label: 'Name of Exporter', control: 'input' },
      { key: 'exporterAddress', label: 'Exporter Address', control: 'textarea', rows: 3 }
    ]
  },
  'importer-details': {
    title: 'Importer details',
    fields: [
      { key: 'importerCompany', label: 'Importer Company', control: 'input' },
      { key: 'importerName', label: 'Importer Name', control: 'input' },
      { key: 'importerAddress', label: 'Importer address', control: 'textarea', rows: 3 },
      { key: 'importerEoriNumber', label: 'Importer EORI number', control: 'input' },
      { key: 'importerContactDetails', label: 'Importer contact details', control: 'textarea', rows: 2 }
    ]
  },
  'importer-agent-details': {
    title: 'Importer agent details',
    fields: [
      { key: 'importerRepresentativeCompany', label: 'Importer Representative Company', control: 'input' },
      { key: 'importerRepresentativeName', label: 'Importer Representative Name', control: 'input' },
      { key: 'importerRepresentativeAddress', label: 'Importer Representative address', control: 'textarea', rows: 3 },
      { key: 'importerRepresentativeEoriNumber', label: 'Importer Representative EORI number', control: 'input' },
      { key: 'importerRepresentativeContactDetails', label: 'Importer Representative contact details', control: 'textarea', rows: 2 }
    ]
  },
  'importer-declaration': {
    title: 'Importer Declaration',
    fields: [
      { key: 'productDescription', label: 'Product Description', control: 'textarea', rows: 2 },
      { key: 'cnCode', label: 'CN code', control: 'input' },
      { key: 'importerDeclarationNetWeightKg', label: 'Net weight in kg', control: 'input' },
      { key: 'netFisheryProductWeightKg', label: 'Net fishery product weight in kg', control: 'input' }
    ]
  },
  'transport-details': {
    title: 'Transport details',
    fields: [
      { key: 'transportName', label: 'Name', control: 'input' },
      { key: 'transportAddress', label: 'Address', control: 'textarea', rows: 3 },
      { key: 'meansOfTransportUponArrival', label: 'Means of transport upon arrival', control: 'input' },
      { key: 'transportDocumentReference', label: 'Transport document reference', control: 'input' },
      { key: 'countryOfExportationPointOfDeparture', label: 'Country of exportation Port/airport/other point of departure', control: 'input' },
      { key: 'pointOfDestination', label: 'Point of destination', control: 'input' },
      { key: 'containerNumbers', label: 'Container Numbers', control: 'input' }
    ]
  },
  'storage-statement-reference-numbers': {
    title: 'Storage statement reference numbers',
    fields: [
      { key: 'storageStatementDocumentNumber', label: 'Document number', control: 'input' }
    ]
  },
  'processing-statement-reference-numbers': {
    title: 'Processing statement reference numbers',
    fields: [
      { key: 'processingStatementReference', label: 'Document number', control: 'input' }
    ]
  }
}

const buildScenarioADocumentPresentation = (document) => {
  const confidenceLabel = document.extractionConfidenceLabel
  const confidenceTagClass = document.extractionConfidenceTagClass
  const processingReferenceValue = document.processingStatementReference || 'Missing'
  const editedHighConfidenceFieldKeys = Array.isArray(document.editedHighConfidenceFieldKeys)
    ? document.editedHighConfidenceFieldKeys
    : []

  const createDetailSection = (key, title, rows) => {
    return createScenarioADetailSection(key, title, confidenceLabel, confidenceTagClass, rows, editedHighConfidenceFieldKeys)
  }

  const allDetailSections = [
    createDetailSection('transport-details-from-cc', 'Transport details from CC', [
      { label: 'Port of Landing', value: document.portOfLanding },
      { label: 'Date of Landing', value: document.dateOfLanding }
    ]),
    createDetailSection('catch-certificate-number', 'Catch certificate number', [
      { label: 'Document number', value: document.documentNumber },
      { label: 'Validating Authority Name', value: document.validatingAuthorityName },
      { label: 'Validating Authority Address', value: document.validatingAuthorityAddress }
    ]),
    createDetailSection('species', 'Species', [
      { label: 'Species', value: document.species },
      { label: 'Product code', value: document.productCode }
    ]),
    createDetailSection('catch-area', 'Catch area', [
      { label: 'Catch Area', value: document.catchArea },
      { label: 'Catch Date from', value: document.catchDateFrom },
      { label: 'Catch Date to', value: document.catchDateTo }
    ]),
    createDetailSection('fishing-gear', 'Fishing gear', [
      { label: 'Fishing License No.', value: document.fishingLicenseNumber },
      { label: 'Fishing Gear', value: document.fishingGear }
    ]),
    createDetailSection('weight-quantity', 'Weight/quantity', [
      { label: 'Estimated weight to be landed in kg', value: document.estimatedWeightToBeLandedKg },
      { label: 'Net catch weight in kg', value: document.netCatchWeightKg },
      { label: 'Verified weight landed in kg', value: document.verifiedWeightLandedKg }
    ]),
    createDetailSection('vessel-id-and-flag-state', 'Vessel ID and flag State', [
      { label: 'Vessel Name', value: document.vesselName },
      { label: 'Flag - home port and registration number', value: document.flagHomePortAndRegistrationNumber },
      { label: 'Call sign', value: document.callSign },
      { label: 'IMO number or other unique identifier', value: document.imoNumberOrOtherUniqueIdentifier }
    ]),
    createDetailSection('exporter-details', 'exporter details', [
      { label: 'Name of Exporter', value: document.nameOfExporter },
      { label: 'Exporter Address', value: document.exporterAddress }
    ]),
    createDetailSection('importer-details', 'Importer details', [
      { label: 'Importer Company', value: document.importerCompany },
      { label: 'Importer Name', value: document.importerName },
      { label: 'Importer address', value: document.importerAddress },
      { label: 'Importer EORI number', value: document.importerEoriNumber },
      { label: 'Importer contact details', value: document.importerContactDetails }
    ]),
    createDetailSection('importer-agent-details', 'Importer agent details', [
      { label: 'Importer Representative Company', value: document.importerRepresentativeCompany },
      { label: 'Importer Representative Name', value: document.importerRepresentativeName },
      { label: 'Importer Representative address', value: document.importerRepresentativeAddress },
      { label: 'Importer Representative EORI number', value: document.importerRepresentativeEoriNumber },
      { label: 'Importer Representative contact details', value: document.importerRepresentativeContactDetails }
    ]),
    createDetailSection('importer-declaration', 'Importer Declaration', [
      { label: 'Product Description', value: document.productDescription },
      { label: 'CN code', value: document.cnCode },
      { label: 'Net weight in kg', value: document.importerDeclarationNetWeightKg },
      { label: 'Net fishery product weight in kg', value: document.netFisheryProductWeightKg }
    ]),
    createDetailSection('transport-details', 'Transport details', [
      { label: 'Name', value: document.transportName },
      { label: 'Address', value: document.transportAddress },
      { label: 'Means of transport upon arrival', value: document.meansOfTransportUponArrival },
      { label: 'Transport document reference', value: document.transportDocumentReference },
      { label: 'Country of exportation Port/airport/other point of departure', value: document.countryOfExportationPointOfDeparture },
      { label: 'Point of destination', value: document.pointOfDestination },
      { label: 'Container Numbers', value: document.containerNumbers }
    ]),
    createDetailSection('storage-statement-reference-numbers', 'Storage statement reference numbers', [
      { label: 'Document number', value: document.storageStatementDocumentNumber }
    ]),
    createDetailSection('processing-statement-reference-numbers', 'Processing statement reference numbers', [
      { label: 'Document number', value: document.processingStatementReference }
    ])
  ]

  let detailSections = allDetailSections
  if (document.documentType === 'Catch Certificate') {
    detailSections = allDetailSections.filter((section) => section.key !== 'storage-statement-reference-numbers' && section.key !== 'processing-statement-reference-numbers')
  } else if (document.documentType === 'Processing Statement') {
    detailSections = allDetailSections.filter((section) => section.key === 'processing-statement-reference-numbers')
  } else if (document.documentType === 'Non-Manipulation Declaration') {
    detailSections = allDetailSections.filter((section) => section.key === 'storage-statement-reference-numbers')
  } else if (document.documentType === 'Additional document') {
    detailSections = []
  }

  return {
    summaryFields: [
      { label: 'Document type', value: document.documentType, confidence: confidenceLabel, confidenceTagClass },
      { label: 'Document number', value: document.documentNumber, confidence: confidenceLabel, confidenceTagClass },
      { label: 'Vessel Name', value: document.vesselName || 'Missing', confidence: document.vesselName ? confidenceLabel : 'Missing', confidenceTagClass: document.vesselName ? confidenceTagClass : 'govuk-tag--red' },
      { label: 'Species', value: document.species || 'Missing', confidence: document.species ? confidenceLabel : 'Missing', confidenceTagClass: document.species ? confidenceTagClass : 'govuk-tag--red' },
      { label: 'Catch Area', value: document.catchArea || 'Missing', confidence: document.catchArea ? confidenceLabel : 'Missing', confidenceTagClass: document.catchArea ? confidenceTagClass : 'govuk-tag--red' },
      { label: 'Net catch weight in kg', value: document.netCatchWeightKg || 'Missing', confidence: document.netCatchWeightKg ? confidenceLabel : 'Missing', confidenceTagClass: document.netCatchWeightKg ? confidenceTagClass : 'govuk-tag--red' },
      { label: 'Importer Company', value: document.importerCompany || 'Missing', confidence: document.importerCompany ? confidenceLabel : 'Missing', confidenceTagClass: document.importerCompany ? confidenceTagClass : 'govuk-tag--red' },
      { label: 'Document number (Processing statement)', value: processingReferenceValue, confidence: document.processingStatementReference ? confidenceLabel : 'Missing', confidenceTagClass: document.processingStatementReference ? confidenceTagClass : 'govuk-tag--red' },
      { label: 'Extraction confidence', value: document.extractionConfidence + '%', confidence: confidenceLabel, confidenceTagClass }
    ],
    detailSections
  }
}

const createScenarioADocument = (index, documentType, confidence, statusKey, seedData) => {
  const metadata = buildScenarioADocumentTypeMetadata(documentType)
  const sequence = index + 1
  const referenceNumber = buildScenarioADocumentReference(metadata.prefix, sequence)
  const reference = 'DOC-' + String(sequence).padStart(3, '0')
  const status = buildScenarioAStatusMeta(statusKey)
  const confidenceLabel = getConfidenceLabel(confidence)
  const confidenceTagClass = getConfidenceTagClass(confidence)
  const vesselName = seedData['scenario-a-vessel-name'] || 'FV Nordic Star'
  const flagState = seedData['scenario-a-flag-state'] || 'Iceland (IS)'
  const species = seedData['scenario-a-species'] || 'Atlantic cod (Gadus morhua)'
  const scientificName = 'Gadus morhua'
  const catchArea = seedData['scenario-a-catch-area'] || 'FAO Area 27, Northeast Atlantic'
  const catchDates = seedData['scenario-a-catch-date'] || '11/01/2026 to 18/01/2026'
  const netWeight = seedData['scenario-a-net-weight'] || '2,450 kg'
  const catchDateFrom = catchDates.split(' to ')[0] || ''
  const catchDateTo = catchDates.split(' to ')[1] || ''
  const importerName = seedData['importer-name'] || 'Nordic Sea Imports Ltd'
  const exporterName = seedData['scenario-a-exporter-name'] || 'Samherji Export Ltd'
  const transportReference = 'SHIP-REF-RKV-GB-' + String(sequence).padStart(4, '0')
  const storageStatementReference = 'CATCH.ST.GB.' + String(new Date().getFullYear()) + '.' + String(2000 + sequence).padStart(4, '0')
  const processingReference = documentType === 'Processing Statement'
    ? buildScenarioADocumentReference(metadata.processingReferencePrefix, 1100 + sequence)
    : 'Not applicable'
  const totalFields = 44
  const fieldsExtractedByStatus = {
    complete: 44,
    'needs-review': 36,
    incomplete: 26,
    'manual-check': 12
  }
  const fieldsExtracted = fieldsExtractedByStatus[statusKey] || 26

  const baseRows = {
    documentType,
    certificateReference: referenceNumber,
    portOfLanding: seedData['scenario-a-port-of-landing'] || 'Hull',
    dateOfLanding: seedData['scenario-a-date-of-landing'] || '25/01/2026',
    validatingAuthorityName: 'Directorate of Fisheries, Iceland',
    validatingAuthorityAddress: 'Skulagata 4, 101 Reykjavik, Iceland',
    vesselName,
    flagState,
    flagHomePortAndRegistrationNumber: 'Iceland - Reykjavik - REY-88412',
    callSign: 'TFNS',
    imoNumberOrOtherUniqueIdentifier: 'IMO 9321487',
    species,
    scientificName,
    productCode: metadata.productCode,
    catchDateFrom,
    catchDateTo,
    catchArea,
    catchDates,
    fishingLicenseNumber: 'IS-FL-88412',
    fishingGear: 'Bottom trawl',
    estimatedWeightToBeLandedKg: netWeight,
    netCatchWeightKg: netWeight,
    verifiedWeightLandedKg: netWeight,
    importerCompany: importerName,
    importerName: 'Alex Reid',
    importerAddress: '1 Dockside Way, Hull, HU1 2AB',
    importerEoriNumber: 'GB123456789000',
    importerContactDetails: '+44 20 7946 0123, imports@nordicsea.example',
    importerRepresentativeCompany: 'Harbor Trade Agents Ltd',
    importerRepresentativeName: 'Mia Johnson',
    importerRepresentativeAddress: '20 Quay Street, Hull, HU1 2LT',
    importerRepresentativeEoriNumber: 'GB987654321000',
    importerRepresentativeContactDetails: '+44 20 7000 9000, agent@harbortrade.example',
    productDescription: 'Frozen cod fillets',
    cnCode: metadata.productCode,
    importerDeclarationNetWeightKg: netWeight,
    netFisheryProductWeightKg: '2,300 kg',
    nameOfExporter: exporterName,
    exporterAddress: 'Harbour Road 12, Reykjavik, Iceland',
    transportName: 'North Sea Cargo Lines',
    transportAddress: 'Dock 5, Reykjavik Port, Iceland',
    meansOfTransportUponArrival: 'Container vessel',
    transportDocumentReference: transportReference,
    countryOfExportationPointOfDeparture: 'Iceland - Reykjavik Port',
    pointOfDestination: 'Hull Port, United Kingdom',
    containerNumbers: 'MSCU1234567',
    storageStatementDocumentNumber: storageStatementReference,
    processingReference,
    transportReference
  }

  if (statusKey === 'incomplete') {
    baseRows.validatingAuthorityAddress = ''
    baseRows.fishingGear = ''
    baseRows.verifiedWeightLandedKg = ''
    baseRows.catchDates = ''
    baseRows.catchDateFrom = ''
    baseRows.catchDateTo = ''
    baseRows.importerRepresentativeContactDetails = ''
    baseRows.transportDocumentReference = ''
    baseRows.containerNumbers = ''
    baseRows.processingReference = documentType === 'Processing Statement' ? '' : 'Not applicable'
    baseRows.transportReference = ''
  }

  if (statusKey === 'manual-check') {
    baseRows.productCode = ''
    baseRows.validatingAuthorityName = ''
    baseRows.validatingAuthorityAddress = ''
    baseRows.catchArea = ''
    baseRows.catchDateFrom = ''
    baseRows.catchDateTo = ''
    baseRows.catchDates = ''
    baseRows.fishingLicenseNumber = ''
    baseRows.fishingGear = ''
    baseRows.estimatedWeightToBeLandedKg = ''
    baseRows.netCatchWeightKg = ''
    baseRows.verifiedWeightLandedKg = ''
    baseRows.callSign = ''
    baseRows.imoNumberOrOtherUniqueIdentifier = ''
    baseRows.nameOfExporter = ''
    baseRows.exporterAddress = ''
    baseRows.importerEoriNumber = ''
    baseRows.importerContactDetails = ''
    baseRows.importerRepresentativeEoriNumber = ''
    baseRows.importerRepresentativeContactDetails = ''
    baseRows.productDescription = ''
    baseRows.cnCode = ''
    baseRows.importerDeclarationNetWeightKg = ''
    baseRows.netFisheryProductWeightKg = ''
    baseRows.transportDocumentReference = ''
    baseRows.countryOfExportationPointOfDeparture = ''
    baseRows.containerNumbers = ''
    baseRows.storageStatementDocumentNumber = ''
    baseRows.processingReference = ''
    baseRows.transportReference = ''
  }

  const baseDocument = {
    id: 'doc-' + sequence,
    reference,
    documentNumber: referenceNumber,
    documentType,
    referenceNumber,
    species,
    scientificName,
    vessel: vesselName,
    vesselName: baseRows.vesselName,
    flagState,
    flagHomePortAndRegistrationNumber: baseRows.flagHomePortAndRegistrationNumber,
    callSign: baseRows.callSign,
    imoNumberOrOtherUniqueIdentifier: baseRows.imoNumberOrOtherUniqueIdentifier,
    catchArea,
    catchDateFrom: baseRows.catchDateFrom,
    catchDateTo: baseRows.catchDateTo,
    portOfLanding: baseRows.portOfLanding,
    dateOfLanding: baseRows.dateOfLanding,
    validatingAuthorityName: baseRows.validatingAuthorityName,
    validatingAuthorityAddress: baseRows.validatingAuthorityAddress,
    fishingLicenseNumber: baseRows.fishingLicenseNumber,
    fishingGear: baseRows.fishingGear,
    extractionConfidence: confidence,
    extractionConfidenceLabel: confidenceLabel,
    extractionConfidenceTagClass: confidenceTagClass,
    fieldsExtracted,
    totalFields,
    fieldsExtractedDisplay: fieldsExtracted + '/' + totalFields,
    statusKey,
    statusLabel: status.label,
    statusTagClass: status.className,
    productCode: baseRows.productCode,
    catchDates: baseRows.catchDates,
    catchNetWeight: baseRows.netCatchWeightKg,
    estimatedWeightToBeLandedKg: baseRows.estimatedWeightToBeLandedKg,
    netCatchWeightKg: baseRows.netCatchWeightKg,
    verifiedWeightLandedKg: baseRows.verifiedWeightLandedKg,
    importerCompany: baseRows.importerCompany,
    importerName: baseRows.importerName,
    importerAddress: baseRows.importerAddress,
    importerEoriNumber: baseRows.importerEoriNumber,
    importerContactDetails: baseRows.importerContactDetails,
    importerRepresentativeCompany: baseRows.importerRepresentativeCompany,
    importerRepresentativeName: baseRows.importerRepresentativeName,
    importerRepresentativeAddress: baseRows.importerRepresentativeAddress,
    importerRepresentativeEoriNumber: baseRows.importerRepresentativeEoriNumber,
    importerRepresentativeContactDetails: baseRows.importerRepresentativeContactDetails,
    productDescription: baseRows.productDescription,
    cnCode: baseRows.cnCode,
    importerDeclarationNetWeightKg: baseRows.importerDeclarationNetWeightKg,
    netFisheryProductWeightKg: baseRows.netFisheryProductWeightKg,
    importerDetails: baseRows.importerCompany,
    nameOfExporter: baseRows.nameOfExporter,
    exporterAddress: baseRows.exporterAddress,
    exporterDetails: baseRows.nameOfExporter,
    processingStatementReference: baseRows.processingReference,
    transportName: baseRows.transportName,
    transportAddress: baseRows.transportAddress,
    meansOfTransportUponArrival: baseRows.meansOfTransportUponArrival,
    transportDocumentReference: baseRows.transportDocumentReference,
    countryOfExportationPointOfDeparture: baseRows.countryOfExportationPointOfDeparture,
    pointOfDestination: baseRows.pointOfDestination,
    containerNumbers: baseRows.containerNumbers,
    storageStatementDocumentNumber: baseRows.storageStatementDocumentNumber,
    shipmentTransportReference: baseRows.transportReference,
    additionalDocumentPlaceholder: 'Placeholder value'
  }

  return {
    ...baseDocument,
    ...buildScenarioADocumentPresentation(baseDocument)
  }
}

const applyScenarioADocumentOverride = (document, override = null) => {
  if (!override || typeof override !== 'object') return document

  const updatedDocument = {
    ...document,
    documentType: Object.prototype.hasOwnProperty.call(override, 'documentType') ? override.documentType : document.documentType,
    documentNumber: Object.prototype.hasOwnProperty.call(override, 'documentNumber') ? override.documentNumber : document.documentNumber,
    referenceNumber: Object.prototype.hasOwnProperty.call(override, 'documentNumber') ? override.documentNumber : document.referenceNumber,
    portOfLanding: Object.prototype.hasOwnProperty.call(override, 'portOfLanding') ? override.portOfLanding : document.portOfLanding,
    dateOfLanding: Object.prototype.hasOwnProperty.call(override, 'dateOfLanding') ? override.dateOfLanding : document.dateOfLanding,
    validatingAuthorityName: Object.prototype.hasOwnProperty.call(override, 'validatingAuthorityName') ? override.validatingAuthorityName : document.validatingAuthorityName,
    validatingAuthorityAddress: Object.prototype.hasOwnProperty.call(override, 'validatingAuthorityAddress') ? override.validatingAuthorityAddress : document.validatingAuthorityAddress,
    vessel: Object.prototype.hasOwnProperty.call(override, 'vessel') ? override.vessel : document.vessel,
    vesselName: Object.prototype.hasOwnProperty.call(override, 'vesselName') ? override.vesselName : document.vesselName,
    flagState: Object.prototype.hasOwnProperty.call(override, 'flagState') ? override.flagState : document.flagState,
    flagHomePortAndRegistrationNumber: Object.prototype.hasOwnProperty.call(override, 'flagHomePortAndRegistrationNumber') ? override.flagHomePortAndRegistrationNumber : document.flagHomePortAndRegistrationNumber,
    callSign: Object.prototype.hasOwnProperty.call(override, 'callSign') ? override.callSign : document.callSign,
    imoNumberOrOtherUniqueIdentifier: Object.prototype.hasOwnProperty.call(override, 'imoNumberOrOtherUniqueIdentifier') ? override.imoNumberOrOtherUniqueIdentifier : document.imoNumberOrOtherUniqueIdentifier,
    species: Object.prototype.hasOwnProperty.call(override, 'species') ? override.species : document.species,
    scientificName: Object.prototype.hasOwnProperty.call(override, 'scientificName') ? override.scientificName : document.scientificName,
    productCode: Object.prototype.hasOwnProperty.call(override, 'productCode') ? override.productCode : document.productCode,
    catchArea: Object.prototype.hasOwnProperty.call(override, 'catchArea') ? override.catchArea : document.catchArea,
    catchDateFrom: Object.prototype.hasOwnProperty.call(override, 'catchDateFrom') ? override.catchDateFrom : document.catchDateFrom,
    catchDateTo: Object.prototype.hasOwnProperty.call(override, 'catchDateTo') ? override.catchDateTo : document.catchDateTo,
    catchDates: Object.prototype.hasOwnProperty.call(override, 'catchDates') ? override.catchDates : document.catchDates,
    catchNetWeight: Object.prototype.hasOwnProperty.call(override, 'catchNetWeight') ? override.catchNetWeight : document.catchNetWeight,
    fishingLicenseNumber: Object.prototype.hasOwnProperty.call(override, 'fishingLicenseNumber') ? override.fishingLicenseNumber : document.fishingLicenseNumber,
    fishingGear: Object.prototype.hasOwnProperty.call(override, 'fishingGear') ? override.fishingGear : document.fishingGear,
    estimatedWeightToBeLandedKg: Object.prototype.hasOwnProperty.call(override, 'estimatedWeightToBeLandedKg') ? override.estimatedWeightToBeLandedKg : document.estimatedWeightToBeLandedKg,
    netCatchWeightKg: Object.prototype.hasOwnProperty.call(override, 'netCatchWeightKg') ? override.netCatchWeightKg : document.netCatchWeightKg,
    verifiedWeightLandedKg: Object.prototype.hasOwnProperty.call(override, 'verifiedWeightLandedKg') ? override.verifiedWeightLandedKg : document.verifiedWeightLandedKg,
    importerCompany: Object.prototype.hasOwnProperty.call(override, 'importerCompany') ? override.importerCompany : document.importerCompany,
    importerName: Object.prototype.hasOwnProperty.call(override, 'importerName') ? override.importerName : document.importerName,
    importerAddress: Object.prototype.hasOwnProperty.call(override, 'importerAddress') ? override.importerAddress : document.importerAddress,
    importerEoriNumber: Object.prototype.hasOwnProperty.call(override, 'importerEoriNumber') ? override.importerEoriNumber : document.importerEoriNumber,
    importerContactDetails: Object.prototype.hasOwnProperty.call(override, 'importerContactDetails') ? override.importerContactDetails : document.importerContactDetails,
    importerRepresentativeCompany: Object.prototype.hasOwnProperty.call(override, 'importerRepresentativeCompany') ? override.importerRepresentativeCompany : document.importerRepresentativeCompany,
    importerRepresentativeName: Object.prototype.hasOwnProperty.call(override, 'importerRepresentativeName') ? override.importerRepresentativeName : document.importerRepresentativeName,
    importerRepresentativeAddress: Object.prototype.hasOwnProperty.call(override, 'importerRepresentativeAddress') ? override.importerRepresentativeAddress : document.importerRepresentativeAddress,
    importerRepresentativeEoriNumber: Object.prototype.hasOwnProperty.call(override, 'importerRepresentativeEoriNumber') ? override.importerRepresentativeEoriNumber : document.importerRepresentativeEoriNumber,
    importerRepresentativeContactDetails: Object.prototype.hasOwnProperty.call(override, 'importerRepresentativeContactDetails') ? override.importerRepresentativeContactDetails : document.importerRepresentativeContactDetails,
    productDescription: Object.prototype.hasOwnProperty.call(override, 'productDescription') ? override.productDescription : document.productDescription,
    cnCode: Object.prototype.hasOwnProperty.call(override, 'cnCode') ? override.cnCode : document.cnCode,
    importerDeclarationNetWeightKg: Object.prototype.hasOwnProperty.call(override, 'importerDeclarationNetWeightKg') ? override.importerDeclarationNetWeightKg : document.importerDeclarationNetWeightKg,
    netFisheryProductWeightKg: Object.prototype.hasOwnProperty.call(override, 'netFisheryProductWeightKg') ? override.netFisheryProductWeightKg : document.netFisheryProductWeightKg,
    nameOfExporter: Object.prototype.hasOwnProperty.call(override, 'nameOfExporter') ? override.nameOfExporter : document.nameOfExporter,
    exporterAddress: Object.prototype.hasOwnProperty.call(override, 'exporterAddress') ? override.exporterAddress : document.exporterAddress,
    transportName: Object.prototype.hasOwnProperty.call(override, 'transportName') ? override.transportName : document.transportName,
    transportAddress: Object.prototype.hasOwnProperty.call(override, 'transportAddress') ? override.transportAddress : document.transportAddress,
    meansOfTransportUponArrival: Object.prototype.hasOwnProperty.call(override, 'meansOfTransportUponArrival') ? override.meansOfTransportUponArrival : document.meansOfTransportUponArrival,
    transportDocumentReference: Object.prototype.hasOwnProperty.call(override, 'transportDocumentReference') ? override.transportDocumentReference : document.transportDocumentReference,
    countryOfExportationPointOfDeparture: Object.prototype.hasOwnProperty.call(override, 'countryOfExportationPointOfDeparture') ? override.countryOfExportationPointOfDeparture : document.countryOfExportationPointOfDeparture,
    pointOfDestination: Object.prototype.hasOwnProperty.call(override, 'pointOfDestination') ? override.pointOfDestination : document.pointOfDestination,
    containerNumbers: Object.prototype.hasOwnProperty.call(override, 'containerNumbers') ? override.containerNumbers : document.containerNumbers,
    storageStatementDocumentNumber: Object.prototype.hasOwnProperty.call(override, 'storageStatementDocumentNumber') ? override.storageStatementDocumentNumber : document.storageStatementDocumentNumber,
    additionalDocumentPlaceholder: Object.prototype.hasOwnProperty.call(override, 'additionalDocumentPlaceholder') ? override.additionalDocumentPlaceholder : document.additionalDocumentPlaceholder,
    importerDetails: Object.prototype.hasOwnProperty.call(override, 'importerDetails') ? override.importerDetails : document.importerDetails,
    exporterDetails: Object.prototype.hasOwnProperty.call(override, 'exporterDetails') ? override.exporterDetails : document.exporterDetails,
    processingStatementReference: Object.prototype.hasOwnProperty.call(override, 'processingStatementReference') ? override.processingStatementReference : document.processingStatementReference,
    shipmentTransportReference: Object.prototype.hasOwnProperty.call(override, 'shipmentTransportReference') ? override.shipmentTransportReference : document.shipmentTransportReference
  }

  if (Object.prototype.hasOwnProperty.call(override, 'vesselName')) {
    updatedDocument.vessel = override.vesselName
  }

  if (Object.prototype.hasOwnProperty.call(override, 'nameOfExporter')) {
    updatedDocument.exporterDetails = override.nameOfExporter
  }

  if (Object.prototype.hasOwnProperty.call(override, 'importerCompany')) {
    updatedDocument.importerDetails = override.importerCompany
  }

  if (Object.prototype.hasOwnProperty.call(override, 'netCatchWeightKg')) {
    updatedDocument.catchNetWeight = override.netCatchWeightKg
  }

  if (Object.prototype.hasOwnProperty.call(override, 'transportDocumentReference')) {
    updatedDocument.shipmentTransportReference = override.transportDocumentReference
  }

  const editedHighConfidenceFieldKeys = Array.isArray(override.__highConfidenceEditedFields)
    ? Array.from(new Set(override.__highConfidenceEditedFields.filter((item) => typeof item === 'string' && item.trim())))
    : []

  updatedDocument.editedHighConfidenceFieldKeys = editedHighConfidenceFieldKeys

  const extractedFieldOverrides = (override.__extractedFieldOverrides && typeof override.__extractedFieldOverrides === 'object')
    ? override.__extractedFieldOverrides
    : {}
  const extractedFieldOverrideEntries = Object.entries(extractedFieldOverrides)
  const hasExtractedSection = Array.isArray(updatedDocument.detailSections) && updatedDocument.detailSections.some((section) => section.key === 'extracted-fields')
  const hasExtractedFieldOverrides = extractedFieldOverrideEntries.length > 0

  if (hasExtractedSection || (hasExtractedFieldOverrides && updatedDocument.documentType !== 'Catch Certificate')) {
    const baseExtractedSection = hasExtractedSection
      ? updatedDocument.detailSections.find((section) => section.key === 'extracted-fields')
      : null

    const fallbackRows = extractedFieldOverrideEntries
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([fieldKey, value]) => ({
        fieldKey,
        label: fieldKey,
        value
      }))
    const baseRows = (baseExtractedSection && Array.isArray(baseExtractedSection.rows)) ? baseExtractedSection.rows : fallbackRows
    const mergedRows = baseRows.map((row, rowIndex) => {
      const fieldKey = row.fieldKey || buildScenarioAExtractedFieldKey(row.label, rowIndex)
      const fieldValue = Object.prototype.hasOwnProperty.call(extractedFieldOverrides, fieldKey)
        ? extractedFieldOverrides[fieldKey]
        : row.value

      return {
        fieldKey,
        label: row.label,
        value: fieldValue
      }
    })
    const sectionTitle = (baseExtractedSection && baseExtractedSection.title) ? baseExtractedSection.title : (updatedDocument.documentType + ' details')
    const confidenceLabel = updatedDocument.extractionConfidenceLabel || getConfidenceLabel(updatedDocument.extractionConfidence)
    const confidenceTagClass = updatedDocument.extractionConfidenceTagClass || getConfidenceTagClass(updatedDocument.extractionConfidence)

    updatedDocument.detailSections = [
      createScenarioADetailSection(
        'extracted-fields',
        sectionTitle,
        confidenceLabel,
        confidenceTagClass,
        mergedRows,
        editedHighConfidenceFieldKeys
      )
    ]

    return updatedDocument
  }

  return {
    ...updatedDocument,
    ...buildScenarioADocumentPresentation(updatedDocument)
  }
}

const buildScenarioADocuments = (seedData) => {
  const manualCheckMissingFields = [
    'Validating Authority Name',
    'Validating Authority Address',
    'Product Code',
    'Catch Area',
    'Catch Date From',
    'Catch Date To',
    'Fishing License No.',
    'Fishing Gear',
    'Estimated Weight To Be Landed In Kg',
    'Net Catch Weight In Kg',
    'Verified Weight Landed In Kg',
    'Flag - Home Port And Registration Number',
    'Call Sign',
    'IMO Number Or Other Unique Identifier',
    'Name Of Exporter',
    'Exporter Address',
    'Importer EORI Number',
    'Importer Contact Details',
    'Importer Representative Company',
    'Importer Representative Name',
    'Importer Representative Address',
    'Importer Representative EORI Number',
    'Importer Representative Contact Details',
    'Product Description',
    'CN Code',
    'Net Weight In Kg',
    'Net Fishery Product Weight In Kg',
    'Transport Document Reference',
    'Country Of Exportation Port/Airport/Other Point Of Departure',
    'Container Numbers'
  ]
  const needsReviewMissingFields = [
    'Validating Authority Address',
    'Catch Area',
    'Catch Date To',
    'Verified Weight Landed In Kg',
    'IMO Number Or Other Unique Identifier',
    'Transport Document Reference'
  ]
  const documentStates = {
    'CC-001': {
      statusKey: 'manual-check',
      confidence: 43,
      missingFields: manualCheckMissingFields
    },
    'CC-002': {
      statusKey: 'manual-check',
      confidence: 41,
      missingFields: manualCheckMissingFields
    },
    'CC-003': {
      statusKey: 'needs-review',
      confidence: 79,
      missingFields: needsReviewMissingFields
    },
    'CC-004': {
      statusKey: 'needs-review',
      confidence: 74,
      missingFields: needsReviewMissingFields
    }
  }

  return prototypeSeedDocuments.map((seedDocument, index) => {
    const state = documentStates[seedDocument.reference] || {
      statusKey: 'complete',
      confidence: 91 + (index % 9),
      missingFields: []
    }
    const missingFields = new Set(state.missingFields)
    const extractedFields = seedDocument.fields.map((field) => ({
      ...field,
      value: missingFields.has(field.label) ? '' : field.value
    }))
    const fieldsExtracted = extractedFields.filter((field) => field.value).length
    const confidenceLabel = getConfidenceLabel(state.confidence)
    const confidenceTagClass = getConfidenceTagClass(state.confidence)
    const document = createScenarioADocument(index, seedDocument.documentType, state.confidence, state.statusKey, seedData)
    const fieldValues = Object.fromEntries(extractedFields.map((field) => [field.label, field.value]))
    const updatedDocument = {
      ...document,
      reference: seedDocument.reference,
      documentNumber: seedDocument.documentNumber,
      referenceNumber: seedDocument.documentNumber,
      fieldsExtracted,
      totalFields: seedDocument.fields.length,
      fieldsExtractedDisplay: fieldsExtracted + '/' + seedDocument.fields.length,
      detailSections: [{
        key: 'extracted-fields',
        title: seedDocument.documentType + ' details',
        rows: extractedFields.map((field, rowIndex) => ({
          fieldKey: buildScenarioAExtractedFieldKey(field.label, rowIndex),
          label: field.label,
          value: field.value,
          isMissing: !field.value,
          fieldConfidenceLabel: confidenceLabel,
          fieldConfidenceTagClass: confidenceTagClass
        }))
      }],
      species: fieldValues.Species || '',
      vesselName: fieldValues['Vessel Name'] || '',
      catchArea: fieldValues['Catch Area'] || '',
      netCatchWeightKg: fieldValues['Net Catch Weight In Kg'] || fieldValues['Weight In'] || '',
      importerCompany: fieldValues['Importer Company'] || '',
      processingStatementReference: fieldValues['Document Number'] || ''
    }

    if (seedDocument.documentType === 'Catch Certificate') {
      return {
        ...updatedDocument,
        ...buildScenarioADocumentPresentation(updatedDocument)
      }
    }

    return updatedDocument
  })
}

const getScenarioADocumentTemplate = (documentType) => {
  const templateByType = {
    'Additional document': 'part1/review/review-extraction-a-document-additional-document',
    'Non-Manipulation Declaration': 'part1/review/review-extraction-a-document-non-manipulation-declaration',
    'Processing Statement': 'part1/review/review-extraction-a-document-processing-statement',
    'Catch Certificate': 'part1/review/review-extraction-a-document-catch-certificate'
  }

  return templateByType[documentType] || 'part1/review/review-extraction-a-document-catch-certificate'
}

const getScenarioADocumentChangeTemplate = (documentType) => {
  const templateByType = {
    'Non-Manipulation Declaration': 'part1/review/review-extraction-a-document-non-manipulation-declaration-change',
    'Processing Statement': 'part1/review/review-extraction-a-document-processing-statement-change',
    'Catch Certificate': 'part1/review/review-extraction-a-document-catch-certificate-change'
  }

  return templateByType[documentType] || 'part1/review/review-extraction-a-document-card-change'
}

const buildScenarioAExtractionSummary = (documents) => {
  const complete = documents.filter((item) => item.statusKey === 'complete').length
  const needsReview = documents.filter((item) => item.statusKey === 'needs-review').length
  const incomplete = documents.filter((item) => item.statusKey === 'incomplete').length
  const manualCheckOnly = documents.filter((item) => item.statusKey === 'manual-check').length
  const manualCheckRequired = manualCheckOnly + incomplete

  return {
    documentsUploaded: documents.length,
    documentsAnalysed: documents.length,
    complete,
    needsReview,
    incomplete,
    manualCheckRequired,
    reviewRequiredTotal: needsReview
  }
}

const applyScenarioAExtractionData = (data) => {
  const generatedDocuments = buildScenarioADocuments(data)
  const documentOverrides = (data['scenario-a-document-overrides'] && typeof data['scenario-a-document-overrides'] === 'object')
    ? data['scenario-a-document-overrides']
    : {}
  const documents = generatedDocuments.map((document) => applyScenarioADocumentOverride(document, documentOverrides[document.id]))
  data['scenario-a-documents'] = documents
  data['scenario-a-summary'] = buildScenarioAExtractionSummary(documents)
  data['scenario-a-representative-document'] = documents[0]
}

const buildScenarioAExtractionData = () => {
  const extractionJsonFile = findSampleExtractionJsonFile()
  if (!extractionJsonFile) return null

  try {
    const raw = fs.readFileSync(path.join(sampleDocumentsPath, extractionJsonFile), 'utf8')
    const parsed = JSON.parse(raw)
    const field = buildExtractionFieldLookup(parsed.fields)
    const importerAddress = splitAddressForDisplay(field['importer.address'])

    return {
      'importer-name': field['importer.name'] || '',
      'importer-eori': field['importer.eori'] || '',
      'importer-phone': field['importer.phone'] || '',
      'importer-email': field['importerRepresentative.email'] || '',
      'importer-address-line-1': importerAddress.line1,
      'importer-address-line-2': importerAddress.line2,
      'importer-town': importerAddress.town,
      'importer-postcode': importerAddress.postcode,
      'scenario-a-port-of-entry': field['memberStateOfficeOfImport'] || '',
      'scenario-a-estimated-arrival': field['arrivalTransport.estimatedArrivalTime'] || '',
      'scenario-a-catch-certificate-reference': field['catchCertificate.reference'] || '',
      'scenario-a-catch-area': [field['product.1.faoArea'], field['product.1.eezOrHighSeas'], field['product.1.rfmo']].filter(Boolean).join(' | '),
      'scenario-a-catch-date': [field['product.1.catchDateFrom'], field['product.1.catchDateTo']].filter(Boolean).join(' to '),
      'scenario-a-flag-state': [field['validatingAuthority.country'], field['validatingAuthority.isoCode'] ? '(' + field['validatingAuthority.isoCode'] + ')' : ''].filter(Boolean).join(' '),
      'scenario-a-vessel-name': field['fishingVessel.name'] || '',
      'scenario-a-vessel-imo': field['fishingVessel.imoNumber'] || '',
      'scenario-a-species': field['product.1.species'] || '',
      'scenario-a-commodity-type': field['importerProduct.cnDescription'] || field['productGroup.1.description'] || '',
      'scenario-a-cn-code': field['product.1.productCode'] || '',
      'scenario-a-net-weight': field['product.1.netCatchWeightKg'] || '',
      'scenario-a-product-description': field['productGroup.1.description'] || '',
      'scenario-a-processing-facility': field['memberStateOfficeOfImport'] || '',
      'scenario-a-processing-country': field['transportDetails.countryOfExportation'] || '',
      'scenario-a-processing-reference': field['processingStatement.reference'] || '',
      'scenario-a-processing-date': field['transportDetails.signatureDate'] || field['flagStateValidation.date'] || '',
      'scenario-a-exporter-name': field['exporter.name'] || '',
      'scenario-a-export-approval-number': field['catchCertificate.documentNumber'] || '',
      'scenario-a-export-country': field['exporter.country'] || '',
      'scenario-a-import-fields': [
        { field: 'Place of departure of product', value: field['transportDetails.countryOfExportation'] || '' },
        { field: 'Date of departure', value: field['transportDetails.signatureDate'] || '' },
        { field: 'Last point of departure before storage country', value: field['transportDetails.placeOfDeparture'] || '' },
        { field: 'Date of arrival to storage (unloading)', value: field['arrivalTransport.estimatedArrivalTime'] || '' },
        { field: 'Place of storage', value: field['importer.country'] || '' }
      ],
      'scenario-a-catch-fields': [
        { field: 'Catch certificate number', value: field['catchCertificate.documentNumber'] || field['catchCertificate.reference'] || '' },
        { field: 'Vessel name(s), flag(s), validation date(s)', value: [field['fishingVessel.name'], field['fishingVessel.flagHomePort'], field['flagStateValidation.date']].filter(Boolean).join(' | ') },
        { field: 'Catch description', value: field['productGroup.1.description'] || '' }
      ],
      'scenario-a-commodity-fields': [
        { field: 'Species', value: field['product.1.species'] || '' },
        { field: 'Product code', value: field['product.1.productCode'] || '' },
        { field: 'Description of fisheries products', value: field['productGroup.1.description'] || '' },
        { field: 'Processed fishery product (CN code + description)', value: field['importerProduct.cnDescription'] || '' }
      ],
      'scenario-a-consignment-fields': [
        { field: 'Document linkage references', value: field['catchCertificate.documentNumber'] || '' },
        { field: 'Net weight entering storage (kg)', value: field['product.1.netCatchWeightKg'] || '' },
        { field: 'Net fishery product weight entering storage (kg)', value: field['product.1.netCatchWeightKg'] || '' },
        { field: 'Net weight departing storage (kg)', value: field['product.1.verifiedWeightLandedKg'] || '' },
        { field: 'Net fishery product weight departing storage (kg)', value: field['product.1.verifiedWeightLandedKg'] || '' },
        { field: 'Total landed weight (kg)', value: field['product.1.verifiedWeightLandedKg'] || '' },
        { field: 'Catch processed (kg)', value: field['product.1.verifiedWeightLandedKg'] || '' },
        { field: 'Processed fishery product (kg)', value: field['product.1.verifiedWeightLandedKg'] || '' }
      ],
      'scenario-a-processing-fields': [
        { field: 'Processing plant', value: field['memberStateOfficeOfImport'] || '' },
        { field: 'Processing plant address', value: field['importer.address'] || '' },
        { field: 'Plant approval number', value: field['processingStatement.reference'] || '' },
        { field: 'Responsible person', value: field['importerRepresentative.name'] || '' },
        { field: 'Date of acceptance', value: field['flagStateValidation.date'] || '' }
      ],
      'scenario-a-export-fields': [
        { field: 'Exporter company', value: field['exporter.name'] || '' },
        { field: 'Exporter address', value: field['exporter.address'] || '' },
        { field: 'Date of submission to competent authority', value: field['exporter.signatureDate'] || '' },
        { field: 'Point of destination', value: field['memberStateOfficeOfImport'] || '' }
      ],
      'scenario-a-nmd-fields': fesDataDictionaryFields.byCategory.nmd.map((item) => ({
        field: item.field,
        value: item.value || ''
      }))
    }
  } catch (error) {
    console.error('Failed to parse Scenario A extraction JSON:', extractionJsonFile, error)
    return null
  }
}

const seedReviewSummaryData = (data) => {
  data['review-catch-certificate-number'] = data['review-catch-certificate-number'] || data['scenario-a-catch-certificate-reference'] || 'CATCH.CC.IS.2026.000148'
  data['review-species'] = data['review-species'] || data['scenario-a-species'] || 'Atlantic cod (Gadus morhua)'
  data['review-catch-area'] = data['review-catch-area'] || data['scenario-a-catch-area'] || 'FAO Area 27, Northeast Atlantic'
  data['review-vessel-id-flag-state'] = data['review-vessel-id-flag-state'] || [data['scenario-a-vessel-name'] || 'FV Nordic Star', data['scenario-a-flag-state'] || 'Iceland (IS)'].filter(Boolean).join(' - ')
  data['review-weight-quantity'] = data['review-weight-quantity'] || data['scenario-a-net-weight'] || '2,450 kg'
  data['review-importer-exporter-agent-details'] = data['review-importer-exporter-agent-details'] || [data['importer-name'] || 'Nordic Sea Imports Ltd', data['scenario-a-exporter-name'] || 'Samherji Export Ltd'].join('; ')
  data['review-processing-storage-reference-numbers'] = data['review-processing-storage-reference-numbers'] || [data['scenario-a-processing-reference'] || 'PS-IS-2026-01149', 'NMD-IS-2026-00372'].join('; ')
  data['review-transport-details'] = data['review-transport-details'] || 'Vessel transport via Reykjavik to ' + (data['destination-port'] || 'Grimsby') + ', ETA ' + [data['arrival-date-day'], data['arrival-date-month'], data['arrival-date-year']].filter(Boolean).join('/')
}

const applyExtractionVariantData = (data) => {
  const variant = data['extraction-variant'] || 'a'

  if (variant === 'a') {
    const scenarioAExtractionData = buildScenarioAExtractionData()
    if (scenarioAExtractionData) {
      Object.assign(data, scenarioAExtractionData)
    }
  }

  seedReviewSummaryData(data)

  if (variant === 'a') {
    applyScenarioAExtractionData(data)
  }
}

const fesDataDictionaryFields = {
  nonManipulation: [
    { section: 'Header', field: 'Document Number', required: 'Yes', value: 'GBR-2026-SD-C23778708' },
    { section: 'Header', field: 'Declaring Authority', required: 'Yes', value: 'Marine Management Organisation' },
    { section: '1. Authority', field: 'Name', required: 'Yes', value: 'Illegal Unreported and Unregulated (IUU) Fishing Team' },
    { section: '1. Authority', field: 'Address', required: 'Yes', value: 'Tyneside House, Skinnerburn Rd, Newcastle upon Tyne, United Kingdom. NE4 7AR' },
    { section: '1. Authority', field: 'Tel.', required: 'Yes', value: '0300 123 1032' },
    { section: '1. Authority', field: 'Email', required: 'Yes', value: 'ukiuuslo@marinemanagement.org.uk' },
    { section: '2. Arrival to place of storage', field: 'Place of departure of the product', required: 'Yes', value: 'Japan' },
    { section: '2. Arrival to place of storage', field: 'Date of departure', required: 'Yes', value: '03/02/2026' },
    { section: '2. Arrival to place of storage', field: 'Last port, airport or other point of departure before arrival to the country of storage', required: 'Yes', value: 'Calais port' },
    { section: '2. Arrival to place of storage', field: 'Details of transport (vessel name and flag / flight number - airway bill / railway bill / freight bill - truck registration number)', required: 'Yes', value: 'Truck: 12345678 - AA1234567' },
    { section: '2. Arrival to place of storage', field: 'Container number(s) (where applicable)', required: 'Conditional', value: 'ABCJ1234567 (plus 9 empty slots on supplied document)' },
    { section: '2. Arrival to place of storage', field: 'Date of arrival to the place of storage (unloading)', required: 'Yes', value: '03/02/2026' },
    { section: '2. Arrival to place of storage', field: 'Place of storage', required: 'Yes', value: 'UK' },
    { section: '3. Consignment details on arrival', field: 'Description of fisheries products', required: 'Yes', value: 'test prodcut' },
    { section: '3. Consignment details on arrival', field: 'Species', required: 'Yes', value: 'Crocodile fish (CBF)' },
    { section: '3. Consignment details on arrival', field: 'Product Code', required: 'Yes', value: '03021900' },
    { section: '3. Consignment details on arrival', field: 'Catch Certificate / Processing Statement / non-manipulation declaration number(s) (if applicable)', required: 'Conditional', value: 'TEST' },
    { section: '3. Consignment details on arrival', field: 'Net weight in kg entering the place of storage', required: 'Yes', value: '300' },
    { section: '3. Consignment details on arrival', field: 'Net fishery product weight in kg entering the place of storage', required: 'Yes', value: '200' },
    { section: '4. Storage facility', field: 'Name', required: 'Yes', value: 'COD fish' },
    { section: '4. Storage facility', field: 'Address', required: 'Yes', value: 'HOUSE OF COMMONS, HOUSES OF PARLIAMENT, LONDON. SW1A 0AA' },
    { section: '4. Storage facility', field: 'Approval number (if applicable)', required: 'Conditional', value: 'UK/ABC/001' },
    { section: '4. Storage facility', field: 'Stored as - Chilled', required: 'Conditional', value: 'Ticked' },
    { section: '4. Storage facility', field: 'Stored as - Frozen', required: 'Conditional', value: 'Not ticked' },
    { section: '4. Storage facility', field: 'Stored as - Other', required: 'Conditional', value: 'Not ticked' },
    { section: '5. Consignment details on departure', field: 'Description of fisheries products', required: 'Yes', value: 'test prodcut' },
    { section: '5. Consignment details on departure', field: 'Species', required: 'Yes', value: 'Crocodile fish (CBF)' },
    { section: '5. Consignment details on departure', field: 'Product Code', required: 'Yes', value: '03021900' },
    { section: '5. Consignment details on departure', field: 'Catch Certificate / Processing Statement / non-manipulation declaration number(s) (if applicable)', required: 'Conditional', value: 'TEST' },
    { section: '5. Consignment details on departure', field: 'Net weight in kg departing the place of storage', required: 'Yes', value: '500.00' },
    { section: '5. Consignment details on departure', field: 'Net fishery product weight in kg departing the place of storage', required: 'Yes', value: '800.00' },
    { section: '6. Departure from place of storage', field: 'Date of departure from the place of storage (reloading)', required: 'Yes', value: '03/02/2026' },
    { section: '6. Departure from place of storage', field: 'Last port, airport or point of departure from the country of storage', required: 'Yes', value: 'Dover Port' },
    { section: '6. Departure from place of storage', field: 'Details of transport (vessel name and flag / flight number - airway bill / railway bill / freight bill - truck registration number)', required: 'Yes', value: 'Train: AB12345C -' },
    { section: '6. Departure from place of storage', field: 'Container number(s) (where applicable)', required: 'Conditional', value: 'ABCJ0123456 (plus 9 empty slots on supplied document)' },
    { section: '6. Departure from place of storage', field: 'Point of destination: Port, airport or other point of destination', required: 'Yes', value: 'Calais port' },
    { section: '7. Exporter', field: 'Company name', required: 'Yes', value: 'GREAR CONSULTANCY LIMITED' },
    { section: '7. Exporter', field: 'Address', required: 'Yes', value: '261, FLAT 1, Test, 261 Plaistow road, London, E13 0FA' },
    { section: '7. Exporter', field: 'Date of submission of this document by exporter to the competent authority', required: 'Yes', value: '03/02/2026' },
    { section: '8. Declaration by competent authority', field: 'Declaration statement', required: 'Yes', value: '(printed declaration text on document)' },
    { section: '8. Declaration by competent authority', field: 'Name and Address (of authority)', required: 'Yes', value: 'Illegal Unreported and Unregulated (IUU) Fishing Team, MMO, Tyneside House, Skinnerburn Rd, Newcastle upon Tyne. NE4 7AR' },
    { section: '8. Declaration by competent authority', field: 'PDF/Validation (QR code)', required: 'Yes', value: '(QR code present on supplied document)' },
    { section: '8. Declaration by competent authority', field: 'Date Issued', required: 'Yes', value: '03/02/2026' }
  ],
  processingStatement: [
    { section: 'Header', field: 'Document Number', required: 'Yes', value: 'GBR-2026-PS-CA2FD613E' },
    { section: '1. Processed Fishery Product', field: 'Processed fishery product (CN code + description)', required: 'Yes', value: '03021180 - Test prod; 03021400 - code fish2' },
    { section: '1. Processed Fishery Product', field: 'Catch certificate (CC) number', required: 'Yes', value: 'TESTDOCUMENT; COD TEST' },
    { section: '1. Processed Fishery Product', field: 'Vessel name(s) and flag(s) and Validation date(s)', required: 'Yes', value: 'See catch certificate' },
    { section: '1. Processed Fishery Product', field: 'Catch description', required: 'Yes', value: 'North Atlantic codling (LPS); Blue crab (CRB)' },
    { section: '1. Processed Fishery Product', field: 'Total landed weight (kg)', required: 'Yes', value: '100.00; 500.00' },
    { section: '1. Processed Fishery Product', field: 'Catch processed (kg)', required: 'Yes', value: '100.00; 500.00' },
    { section: '1. Processed Fishery Product', field: 'Processed fishery product (kg)', required: 'Yes', value: '100.00; 500.00' },
    { section: '2. Processing plant', field: 'Processing plant', required: 'Yes', value: 'UK plant' },
    { section: '2. Processing plant', field: 'Address', required: 'Yes', value: '261, FLAT 1, PLAISTOW ROAD, LONDON. E13 0FA' },
    { section: '2. Processing plant', field: 'Plant approval number', required: 'Yes', value: 'UK/1234/EC' },
    { section: '2. Processing plant', field: 'Responsible person', required: 'Yes', value: 'John Smith' },
    { section: '2. Processing plant', field: 'Date of acceptance (DD -MM-YYYY)', required: 'Yes', value: '03/02/2026' },
    { section: '3. Health certificate', field: 'Health certificate number', required: 'Yes', value: '20/2/123456' },
    { section: '3. Health certificate', field: 'Date', required: 'Yes', value: '03/02/2026' },
    { section: '4. Exporter', field: 'Company', required: 'Yes', value: 'GREAR CONSULTANCY LIMITED' },
    { section: '4. Exporter', field: 'Address', required: 'Yes', value: '261, FLAT 1, Test, 261 Plaistow road, London. E13 0FA' },
    { section: 'Endorsement by competent authority', field: 'Name and Address (of authority)', required: 'Yes', value: 'Illegal Unreported and Unregulated (IUU) Fishing Team, MMO, Tyneside House, Skinnerburn Rd, Newcastle upon Tyne. NE4 7AR' },
    { section: 'Endorsement by competent authority', field: 'PDF/Validation (QR code)', required: 'Yes', value: '(QR code present)' },
    { section: 'Endorsement by competent authority', field: 'Date Issued', required: 'Yes', value: '03/02/2026' }
  ],
  byCategory: {
    commodity: [
      { field: 'Species', source: 'NMD Sections 3 & 5', required: 'Yes', value: 'Crocodile fish (CBF)' },
      { field: 'Product code', source: 'NMD Sections 3 & 5', required: 'Yes', value: '03021900' },
      { field: 'Description of fisheries products', source: 'NMD Sections 3 & 5', required: 'Yes', value: 'test prodcut' },
      { field: 'Processed fishery product (CN code + description)', source: 'PS Section 1', required: 'Yes', value: '03021180 - Test prod; 03021400 - code fish2' }
    ],
    catch: [
      { field: 'Catch certificate number', source: 'PS Section 1', required: 'Yes', value: 'TESTDOCUMENT; COD TEST' },
      { field: 'Vessel name(s), flag(s), validation date(s)', source: 'PS Section 1', required: 'Yes', value: 'See catch certificate' },
      { field: 'Catch description', source: 'PS Section 1', required: 'Yes', value: 'North Atlantic codling (LPS); Blue crab (CRB)' }
    ],
    processing: [
      { field: 'Processing plant', source: 'PS Section 2', required: 'Yes', value: 'UK plant' },
      { field: 'Processing plant address', source: 'PS Section 2', required: 'Yes', value: '261, FLAT 1, PLAISTOW ROAD, LONDON. E13 0FA' },
      { field: 'Plant approval number', source: 'PS Section 2', required: 'Yes', value: 'UK/1234/EC' },
      { field: 'Responsible person', source: 'PS Section 2', required: 'Yes', value: 'John Smith' },
      { field: 'Date of acceptance', source: 'PS Section 2', required: 'Yes', value: '03/02/2026' }
    ],
    export: [
      { field: 'Exporter company', source: 'NMD Section 7 / PS Section 4', required: 'Yes', value: 'GREAR CONSULTANCY LIMITED' },
      { field: 'Exporter address', source: 'NMD Section 7 / PS Section 4', required: 'Yes', value: '261, FLAT 1, Test, 261 Plaistow road, London, E13 0FA' },
      { field: 'Date of submission to competent authority', source: 'NMD Section 7', required: 'Yes', value: '03/02/2026' },
      { field: 'Point of destination', source: 'NMD Section 6', required: 'Yes', value: 'Calais port' }
    ],
    import: [
      { field: 'Place of departure of product', source: 'NMD Section 2', required: 'Yes', value: 'Japan' },
      { field: 'Date of departure', source: 'NMD Section 2', required: 'Yes', value: '03/02/2026' },
      { field: 'Last point of departure before storage country', source: 'NMD Section 2', required: 'Yes', value: 'Calais port' },
      { field: 'Date of arrival to storage (unloading)', source: 'NMD Section 2', required: 'Yes', value: '03/02/2026' },
      { field: 'Place of storage', source: 'NMD Section 2', required: 'Yes', value: 'UK' }
    ],
    consignment: [
      { field: 'Document linkage references', source: 'NMD Sections 3 & 5', required: 'Conditional', value: 'TEST' },
      { field: 'Net weight entering storage (kg)', source: 'NMD Section 3', required: 'Yes', value: '300' },
      { field: 'Net fishery product weight entering storage (kg)', source: 'NMD Section 3', required: 'Yes', value: '200' },
      { field: 'Net weight departing storage (kg)', source: 'NMD Section 5', required: 'Yes', value: '500.00' },
      { field: 'Net fishery product weight departing storage (kg)', source: 'NMD Section 5', required: 'Yes', value: '800.00' },
      { field: 'Total landed weight (kg)', source: 'PS Section 1', required: 'Yes', value: '100.00; 500.00' },
      { field: 'Catch processed (kg)', source: 'PS Section 1', required: 'Yes', value: '100.00; 500.00' },
      { field: 'Processed fishery product (kg)', source: 'PS Section 1', required: 'Yes', value: '100.00; 500.00' }
    ],
    nmd: [
      { field: 'NMD document number', source: 'NMD Header', required: 'Yes', value: 'GBR-2026-SD-C23778708' },
      { field: 'Declaring authority', source: 'NMD Header', required: 'Yes', value: 'Marine Management Organisation' },
      { field: 'Authority name', source: 'NMD Section 1', required: 'Yes', value: 'Illegal Unreported and Unregulated (IUU) Fishing Team' },
      { field: 'Authority address', source: 'NMD Section 1', required: 'Yes', value: 'Tyneside House, Skinnerburn Rd, Newcastle upon Tyne, United Kingdom. NE4 7AR' },
      { field: 'Authority contact', source: 'NMD Section 1', required: 'Yes', value: '0300 123 1032 / ukiuuslo@marinemanagement.org.uk' },
      { field: 'Declaration statement', source: 'NMD Section 8', required: 'Yes', value: '(printed declaration text on document)' },
      { field: 'Authority name/address (declaration)', source: 'NMD Section 8', required: 'Yes', value: 'Illegal Unreported and Unregulated (IUU) Fishing Team, MMO, Tyneside House, Skinnerburn Rd, Newcastle upon Tyne. NE4 7AR' },
      { field: 'Validation (QR code)', source: 'NMD Section 8', required: 'Yes', value: '(QR code present on supplied document)' },
      { field: 'Date issued', source: 'NMD Section 8', required: 'Yes', value: '03/02/2026' }
    ]
  }
}

router.use((req, res, next) => {
  const noBackLink = ['/', '/dashboard', '/confirmation', '/upload-confirmation']
  res.locals.showBackLink = !noBackLink.includes(req.path)
  res.locals.fesDataDictionaryFields = fesDataDictionaryFields
  next()
})

// Clear all entered data when returning to the start page
router.get('/', (req, res) => {
  res.redirect('/dashboard?variant=a')
})

const getDashboardVariant = (value) => {
  const variant = String(value || 'a').toLowerCase()
  return supportedExtractionVariants.has(variant) ? variant : ''
}

router.get('/dashboard', (req, res) => {
  const variant = getDashboardVariant(req.query.variant)
  if (!variant) {
    return res.redirect('/dashboard?variant=a')
  }

  const activeTab = ['submitted', 'historical'].includes(req.query.tab) ? req.query.tab : 'drafts'
  const filters = getDashboardFilters(req.query)
  const draftConsignments = filterAndSortConsignments(importerDashboardConsignments, filters, 'drafts')
  const submittedConsignments = filterAndSortConsignments(importerDashboardConsignments, filters, 'submitted')
  const historicalConsignments = filterAndSortConsignments(importerDashboardConsignments, filters, 'historical')

  req.session.data = structuredClone(sessionDataDefaults)
  res.locals.data = req.session.data
  res.render('part1/entry/dashboard', {
    variant,
    activeTab,
    filters,
    filterOptions: getFilterOptions(importerDashboardConsignments),
    draftConsignments,
    submittedConsignments,
    historicalConsignments,
    draftCount: importerDashboardConsignments.filter((consignment) => consignment.status === 'draft').length,
    submittedCount: importerDashboardConsignments.filter((consignment) => ['submitted', 'under-review', 'action-required'].includes(consignment.status)).length,
    acceptedCount: importerDashboardConsignments.filter((consignment) => consignment.status === 'accepted').length,
    actionRequiredCount: importerDashboardConsignments.filter((consignment) => consignment.status === 'action-required').length
  })
})

router.get('/dashboard/notifications/:reference', (req, res) => {
  const variant = getDashboardVariant(req.query.variant) || 'a'
  const consignment = importerDashboardConsignments.find((item) => item.reference === req.params.reference)
  if (!consignment) {
    return res.redirect('/dashboard?variant=' + variant)
  }

  res.render('part1/dashboard/notification', { variant, consignment })
})

router.get('/dashboard/notifications/:reference/documents/:documentId', (req, res) => {
  const variant = getDashboardVariant(req.query.variant) || 'a'
  const consignment = importerDashboardConsignments.find((item) => item.reference === req.params.reference)
  const document = consignment && consignment.documents.find((item) => item.id === req.params.documentId)
  if (!consignment || !document) {
    return res.redirect('/dashboard?variant=' + variant)
  }

  res.render('part1/dashboard/document', { variant, consignment, document })
})

router.get('/dashboard/assumptions', (req, res) => {
  const variant = getDashboardVariant(req.query.variant) || 'a'
  res.render('part1/dashboard/assumptions', { variant })
})

const part1StaticViews = {
  '/transport-details': 'part1/manual/transport-details',
  '/species-details': 'part1/manual/species-details',
  '/species-list': 'part1/manual/species-list',
  '/processing-statement-required': 'part1/manual/processing-statement-required',
  '/processing-statement': 'part1/manual/processing-statement',
  '/non-manipulation-declaration-required': 'part1/manual/non-manipulation-declaration-required',
  '/non-manipulation-declaration': 'part1/manual/non-manipulation-declaration',
  '/upload-confirmation': 'part1/extraction/upload-confirmation',
  '/extracting': 'part1/extraction/extracting',
  '/processing': 'part1/extraction/processing',
  '/documents-ready': 'part1/extraction/documents-ready',
  '/change-catch-certificate-details': 'part1/extraction/change-catch-certificate-details',
  '/review-extraction-b': 'part1/review/review-extraction-b',
  '/check-answers': 'part1/submission/check-answers',
  '/declaration': 'part1/submission/declaration',
  '/confirmation': 'part1/submission/confirmation'
}

for (const [routePath, viewPath] of Object.entries(part1StaticViews)) {
  router.get(routePath, (req, res) => res.render(viewPath))
}

// -------------------------------------------------------
// Importer details
// -------------------------------------------------------
const importerFields = [
  'importer-name',
  'importer-eori',
  'importer-address-line-1',
  'importer-address-line-2',
  'importer-town',
  'importer-postcode',
  'importer-email',
  'importer-phone'
]

router.get('/importer-details', (req, res) => {
  const data = req.session.data
  if (data['extraction-variant']) {
    for (const field of importerFields) {
      data[field] = ''
    }
  }
  data['extraction-variant'] = ''
  data['destination-port'] = ''
  data['arrival-date-day'] = ''
  data['arrival-date-month'] = ''
  data['arrival-date-year'] = ''
  res.render('part1/manual/importer-details')
})

router.post('/importer-details', (req, res) => {
  const data = req.session.data
  for (const field of importerFields) {
    data[field] = req.body[field] || ''
  }
  res.redirect('/transport-details')
})

// -------------------------------------------------------
// Transport details
// -------------------------------------------------------
router.post('/transport-details', (req, res) => {
  const data = req.session.data
  const transportFields = [
    'transport-type',
    'vessel-name',
    'vessel-flag',
    'bill-of-lading',
    'flight-number',
    'truck-registration',
    'container-number'
  ]
  for (const field of transportFields) {
    data[field] = req.body[field] || ''
  }
  res.redirect('/arrival-details')
})

// -------------------------------------------------------
// Arrival details
// -------------------------------------------------------
router.get('/arrival-details', (req, res) => {
  const data = req.session.data
  data['arrival-details-return-to'] = normalizeReviewExtractionReturnPath(req.query.returnTo)
  res.render('part1/manual/arrival-details')
})

router.post('/arrival-details', (req, res) => {
  const data = req.session.data
  data['destination-port'] = req.body['destination-port'] || ''
  data['arrival-date-day'] = req.body['arrival-date-day'] || ''
  data['arrival-date-month'] = req.body['arrival-date-month'] || ''
  data['arrival-date-year'] = req.body['arrival-date-year'] || ''
  const returnTo = normalizeReviewExtractionReturnPath(data['arrival-details-return-to'])

  if (returnTo) {
    data['arrival-details-return-to'] = ''
    return res.redirect(returnTo)
  }

  const hasVariantFlow = Boolean(data['extraction-variant'])
  if (hasVariantFlow) {
    data['commodity-details-return-to'] = ''
    return res.redirect('/commodity-details')
  }
  return res.redirect('/species-details')
})

// -------------------------------------------------------
// Commodity details (Scenario A and Scenario B extraction journeys)
// -------------------------------------------------------
router.get('/commodity-details', (req, res) => {
  const data = req.session.data
  if (Object.prototype.hasOwnProperty.call(req.query, 'returnTo')) {
    data['commodity-details-return-to'] = normalizeReviewExtractionReturnPath(req.query.returnTo)
  }
  res.render('part1/extraction/commodity-details')
})

router.post('/commodity-details', (req, res) => {
  const data = req.session.data
  const action = req.body.action || 'continue'
  const returnTo = normalizeReviewExtractionReturnPath(data['commodity-details-return-to'])

  if (!Array.isArray(data['commodity-details-list'])) {
    data['commodity-details-list'] = []
  }

  const commodityCode = String(req.body['commodity-entry-code'] || '').trim()
  const species = String(req.body['commodity-entry-species'] || '').trim()
  const weight = String(req.body['commodity-entry-weight'] || '').trim()
  const hasAnyValue = Boolean(commodityCode || species || weight)

  if (hasAnyValue) {
    data['commodity-details-list'].push({
      commodityCode,
      species,
      weight
    })
  }

  data['commodity-entry-code'] = ''
  data['commodity-entry-species'] = ''
  data['commodity-entry-weight'] = ''

  if (action === 'add-another') {
    return res.redirect('/commodity-details')
  }

  if (returnTo) {
    data['commodity-details-return-to'] = ''
    return res.redirect(returnTo)
  }

  res.redirect('/upload-documents')
})

router.get('/remove-commodity', (req, res) => {
  const index = parseInt(req.query.index, 10)
  const data = req.session.data
  if (Array.isArray(data['commodity-details-list']) && !isNaN(index)) {
    data['commodity-details-list'].splice(index, 1)
  }
  res.redirect('/commodity-details')
})

// -------------------------------------------------------
// Species details — save and add to species list
// -------------------------------------------------------
router.post('/species-details', (req, res) => {
  const data = req.session.data
  const body = req.body || {}

  // Build species entry
  let speciesName = body['species-name']
  if (speciesName === 'other' && body['species-name-other']) {
    speciesName = body['species-name-other']
  }

  const newSpecies = {
    name: speciesName,
    productForm: body['product-form'],
    commodityCode: body['commodity-code'],
    netWeight: body['net-weight'],
    grossWeight: body['gross-weight'],
    numberOfPackages: body['number-of-packages'],
    packagingType: body['packaging-type']
  }

  // Initialise list if needed
  if (!Array.isArray(data['species-list'])) {
    data['species-list'] = []
  }

  data['species-list'].push(newSpecies)

  // Clear single-species fields ready for the next entry
  delete data['species-name']
  delete data['species-name-other']
  delete data['product-form']
  delete data['commodity-code']
  delete data['net-weight']
  delete data['gross-weight']
  delete data['number-of-packages']
  delete data['packaging-type']

  res.redirect('/species-list')
})

// -------------------------------------------------------
// Species list — add another or continue
// -------------------------------------------------------
router.post('/species-list', (req, res) => {
  const addAnother = req.body['add-another-species']
  if (addAnother === 'yes') {
    res.redirect('/species-details')
  } else {
    if (req.session.data['extraction-variant'] === 'c') {
      res.redirect('/check-answers')
    } else {
      res.redirect('/catch-certificates')
    }
  }
})

// -------------------------------------------------------
// Remove a species from the list
// -------------------------------------------------------
router.get('/remove-species', (req, res) => {
  const index = parseInt(req.query.index, 10)
  const data = req.session.data
  if (Array.isArray(data['species-list']) && !isNaN(index)) {
    data['species-list'].splice(index, 1)
  }
  res.redirect('/species-list')
})

// -------------------------------------------------------
// Catch Certificates
// -------------------------------------------------------
router.get('/catch-certificates', (req, res) => {
  const data = req.session.data
  const returnTo = req.query.returnTo

  if (typeof returnTo === 'string') {
    const normalizedReturnTo = returnTo.startsWith('/') ? returnTo : '/' + returnTo
    data['catch-certificates-return-to'] = reviewExtractionReturnPaths.has(normalizedReturnTo) ? normalizedReturnTo : ''
  }

  res.render('part1/manual/catch-certificates')
})

router.post('/catch-certificates', (req, res) => {
  const data = req.session.data
  const body = req.body || {}
  const action = body.action

  if (!Array.isArray(data['catch-certificates'])) {
    data['catch-certificates'] = []
  }

  const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : null)
  const hasSelectedFile = Boolean(uploadedFile || body['catch-certificate-selected'] === 'true')

  if (hasSelectedFile) {
    const ref = buildGeneratedDocumentReference('CATCH.CC.UPLOAD', data['catch-certificates'].length + 1)
    data['catch-certificates'].push({
      filename: ref + '.pdf',
      reference: ref
    })
  }

  const wantsAnother = action === 'upload-another' || body['upload-another'] === 'true'

  // Do not progress until at least one certificate entry has been saved
  if (data['catch-certificates'].length === 0) {
    return res.redirect('/catch-certificates')
  }

  if (wantsAnother) {
    res.redirect('/catch-certificates')
  } else {
    const returnTo = data['catch-certificates-return-to']
    if (reviewExtractionReturnPaths.has(returnTo)) {
      data['catch-certificates-return-to'] = ''
      return res.redirect(returnTo)
    }
    res.redirect('/processing-statement-required')
  }
})

router.get('/remove-catch-certificate', (req, res) => {
  const index = parseInt(req.query.index, 10)
  const data = req.session.data
  if (Array.isArray(data['catch-certificates']) && !isNaN(index)) {
    data['catch-certificates'].splice(index, 1)
  }
  res.redirect('/catch-certificates')
})

// -------------------------------------------------------
// Processing Statement required?
// -------------------------------------------------------
router.post('/processing-statement-required', (req, res) => {
  const data = req.session.data
  data['has-processing-statement'] = req.body['has-processing-statement']

  if (data['has-processing-statement'] === 'yes') {
    return res.redirect('/processing-statement')
  }

  data['processing-statement'] = []
  res.redirect('/non-manipulation-declaration-required')
})

router.post('/processing-statement', (req, res) => {
  const data = req.session.data
  const body = req.body || {}
  const action = body.action

  if (!Array.isArray(data['processing-statement'])) {
    data['processing-statement'] = []
  }

  const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : null)
  const hasSelectedFile = Boolean(uploadedFile || body['processing-statement-selected'] === 'true')

  if (hasSelectedFile) {
    const ref = buildGeneratedDocumentReference('CATCH.PS.UPLOAD', data['processing-statement'].length + 1)
    data['processing-statement'].push({
      filename: ref + '.pdf',
      reference: ref
    })
  }

  const wantsAnother = action === 'upload-another' || body['upload-another'] === 'true'
  if (data['processing-statement'].length === 0) {
    return res.redirect('/processing-statement')
  }

  if (wantsAnother) {
    res.redirect('/processing-statement')
  } else {
    res.redirect('/non-manipulation-declaration-required')
  }
})

router.get('/remove-processing-statement', (req, res) => {
  const index = parseInt(req.query.index, 10)
  const data = req.session.data
  if (Array.isArray(data['processing-statement']) && !isNaN(index)) {
    data['processing-statement'].splice(index, 1)
  }
  res.redirect('/processing-statement')
})

// -------------------------------------------------------
// Non-Manipulation Declaration required?
// -------------------------------------------------------
router.post('/non-manipulation-declaration-required', (req, res) => {
  const data = req.session.data
  data['has-nmd'] = req.body['has-nmd']

  if (data['has-nmd'] === 'yes') {
    return res.redirect('/non-manipulation-declaration')
  }

  data['non-manipulation-documents'] = []
  res.redirect(getDocumentsCompleteRedirect(data))
})

router.post('/non-manipulation-declaration', (req, res) => {
  const data = req.session.data
  const body = req.body || {}
  const action = body.action

  if (!Array.isArray(data['non-manipulation-documents'])) {
    data['non-manipulation-documents'] = []
  }

  const uploadedFile = req.file || (Array.isArray(req.files) ? req.files[0] : null)
  const hasSelectedFile = Boolean(uploadedFile || body['nmd-selected'] === 'true')

  if (hasSelectedFile) {
    const ref = buildGeneratedDocumentReference('CATCH.NMD.UPLOAD', data['non-manipulation-documents'].length + 1)
    data['non-manipulation-documents'].push({
      filename: ref + '.pdf',
      reference: ref
    })
  }

  const wantsAnother = action === 'upload-another' || body['upload-another'] === 'true'
  if (data['non-manipulation-documents'].length === 0) {
    return res.redirect('/non-manipulation-declaration')
  }

  if (wantsAnother) {
    res.redirect('/non-manipulation-declaration')
  } else {
    res.redirect(getDocumentsCompleteRedirect(data))
  }
})

router.get('/remove-nmd', (req, res) => {
  const index = parseInt(req.query.index, 10)
  const data = req.session.data
  if (Array.isArray(data['non-manipulation-documents']) && !isNaN(index)) {
    data['non-manipulation-documents'].splice(index, 1)
  }
  res.redirect('/non-manipulation-declaration')
})

// -------------------------------------------------------
// Check answers — submit
// -------------------------------------------------------
router.post('/check-answers', (req, res) => {
  // Generate a reference number
  const refNumber = 'IMP-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000)
  req.session.data['reference-number'] = refNumber
  req.session.data['submission-kind'] = 'import'
  res.redirect('/confirmation')
})

// =======================================================
// Document Upload & Extraction Journey
// =======================================================

// -------------------------------------------------------
// Upload guidance — store extraction variant from query param
// -------------------------------------------------------
router.get('/upload-guidance', (req, res) => {
  const variant = String(req.query.variant || 'a').toLowerCase()
  if (!supportedExtractionVariants.has(variant)) {
    return res.redirect('/')
  }

  const data = req.session.data
  data['extraction-variant'] = variant
  data['destination-port'] = ''
  data['arrival-date-day'] = ''
  data['arrival-date-month'] = ''
  data['arrival-date-year'] = ''
  data['commodity-details-list'] = []
  data['commodity-entry-code'] = ''
  data['commodity-entry-species'] = ''
  data['commodity-entry-weight'] = ''
  data['uploaded-documents'] = []
  data['catch-cert-uploaded-files'] = []
  res.render('part1/extraction/upload-guidance')
})

// -------------------------------------------------------
// Sign in
// -------------------------------------------------------
router.get('/sign-in', (req, res) => {
  res.render('part1/entry/sign-in')
})

router.post('/sign-in', (req, res) => {
  res.redirect('/arrival-details')
})

// -------------------------------------------------------
// Single document upload page for extraction prototype
// -------------------------------------------------------
router.get('/upload-documents', (req, res) => {
  res.render('part1/extraction/upload-documents')
})

router.post('/upload-documents', (req, res) => {
  const data = req.session.data
  const files = getUploadedFilesFromRequest(req, 'fileUpload1')
  const inputFileNameValue = String(req.body.fileUpload1 || '').trim()
  const inputFileName = inputFileNameValue ? path.basename(inputFileNameValue.replace(/\\/g, '/')) : ''
  const submittedFileNames = req.body['uploaded-document-name']
  const retainedFileNames = (Array.isArray(submittedFileNames) ? submittedFileNames : [submittedFileNames])
    .map((name) => String(name || '').trim())
    .filter(Boolean)
  const uploadedFileNames = files.map((file, index) => (
    file.originalname || file.filename || ('uploaded-document-' + (index + 1) + '.pdf')
  ))
  const documentFileNames = [...new Set([
    ...retainedFileNames,
    ...uploadedFileNames,
    ...(inputFileName ? [inputFileName] : [])
  ])]
  const uploadValidationError = 'You need to upload at least one document'

  data['uploaded-documents'] = documentFileNames.map((filename) => ({ filename }))
  data['catch-cert-uploaded-files'] = documentFileNames

  if (!documentFileNames.length) {
    return res.render('part1/extraction/upload-documents', {
      hasErrors: true,
      errorList: [{ text: uploadValidationError, href: '#file-upload-1' }],
      errorMap: { 'file-upload-1': uploadValidationError }
    })
  }

  applyExtractionVariantData(data)
  return res.redirect('/extracting')
})

// -------------------------------------------------------
// Processing — route to the correct review variant
// -------------------------------------------------------
router.post('/processing', (req, res) => {
  const data = req.session.data
  applyExtractionVariantData(data)
  res.redirect('/extracting')
})

// -------------------------------------------------------
// Change catch certificate details
// -------------------------------------------------------
router.post('/change-catch-certificate-details', (req, res) => {
  const data = req.session.data
  const scenarioPrefix = 'scenario-a'

  data[scenarioPrefix + '-catch-certificate-reference'] = data['catch-certificate-reference'] || ''

  const catchFieldKey = scenarioPrefix + '-catch-fields'
  let updatedCatchFields = data[catchFieldKey]
  updatedCatchFields = upsertSummaryField(updatedCatchFields, 'Catch certificate number', data['catch-certificate-number'])
  updatedCatchFields = upsertSummaryField(updatedCatchFields, 'Vessel name(s), flag(s), validation date(s)', data['vessel-validation-summary'])
  updatedCatchFields = upsertSummaryField(updatedCatchFields, 'Catch description', data['catch-description'])
  data[catchFieldKey] = updatedCatchFields

  return res.redirect('/review-extraction-a')
})

router.get('/change-extracted-details', (req, res) => {
  const returnTo = req.query.returnTo
  const normalizedReturnTo = typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : '/review-extraction-a'
  req.session.data['change-extracted-details-return-to'] = normalizedReturnTo
  res.render('part1/extraction/change-extracted-details')
})

router.post('/change-extracted-details', (req, res) => {
  const data = req.session.data
  seedReviewSummaryData(data)
  const returnTo = data['change-extracted-details-return-to'] || '/review-extraction-a'
  delete data['change-extracted-details-return-to']
  res.redirect(returnTo)
})

router.get('/review-extraction-a', (req, res) => {
  const data = req.session.data
  data['extraction-variant'] = 'a'
  applyExtractionVariantData(data)

  const documents = Array.isArray(data['scenario-a-documents']) ? data['scenario-a-documents'] : []
  const totalDocuments = documents.length
  const documentsPerPage = 10
  const tableStatusPriority = {
    'manual-check': 1,
    incomplete: 2,
    'needs-review': 3,
    complete: 4
  }
  const sortedTableDocuments = [...documents].sort((left, right) => {
    const priorityDifference = (tableStatusPriority[left.statusKey] || 99) - (tableStatusPriority[right.statusKey] || 99)
    if (priorityDifference !== 0) return priorityDifference

    const confidenceDifference = left.extractionConfidence - right.extractionConfidence
    if (confidenceDifference !== 0) return confidenceDifference

    return left.reference.localeCompare(right.reference)
  })
  const totalTablePages = Math.max(1, Math.ceil(totalDocuments / documentsPerPage))
  const requestedTablePage = parseInt(req.query.tablePage, 10)
  const tablePage = Number.isNaN(requestedTablePage)
    ? 1
    : Math.min(Math.max(requestedTablePage, 1), totalTablePages)
  const tableStart = (tablePage - 1) * documentsPerPage
  const tableDocuments = sortedTableDocuments.slice(tableStart, tableStart + documentsPerPage)
  const fallbackPortOfEntry = 'Grimsby'
  const fallbackExpectedArrivalDate = '12/12/2026'
  const arrivalDay = String(data['arrival-date-day'] || '').trim()
  const arrivalMonth = String(data['arrival-date-month'] || '').trim()
  const arrivalYear = String(data['arrival-date-year'] || '').trim()
  const hasEnteredArrivalDate = Boolean(arrivalDay && arrivalMonth && arrivalYear)
  const expectedDateOfArrival = hasEnteredArrivalDate
    ? [arrivalDay.padStart(2, '0'), arrivalMonth.padStart(2, '0'), arrivalYear].join('/')
    : fallbackExpectedArrivalDate
  const portOfEntry = data['destination-port'] || fallbackPortOfEntry
  const commodityDetails = Array.isArray(data['commodity-details-list']) ? data['commodity-details-list'] : []

  const buildReviewExtractionAUrl = (summaryPage) => {
    const query = []
    if (summaryPage > 1) query.push('tablePage=' + summaryPage)
    return basePath + '/review-extraction-a' + (query.length ? '?' + query.join('&') : '')
  }

  const tablePaginationItems = []
  for (let pageNumber = 1; pageNumber <= totalTablePages; pageNumber++) {
    tablePaginationItems.push({
      number: pageNumber,
      current: pageNumber === tablePage,
      href: buildReviewExtractionAUrl(pageNumber) + '#document-summary'
    })
  }

  res.render('part1/review/review-extraction-a', {
    extractionSummary: data['scenario-a-summary'],
    totalDocuments,
    tableDocuments,
    tablePage,
    totalTablePages,
    showTablePagination: totalDocuments > documentsPerPage,
    tablePaginationItems,
    tablePreviousUrl: tablePage > 1 ? buildReviewExtractionAUrl(tablePage - 1) + '#document-summary' : '',
    tableNextUrl: tablePage < totalTablePages ? buildReviewExtractionAUrl(tablePage + 1) + '#document-summary' : '',
    commodityDetails,
    arrivalDetails: {
      portOfEntry,
      expectedDateOfArrival
    }
  })
})

router.get('/review-extraction-a/dashboard', (req, res) => {
  const requestedTablePage = parseInt(req.query.tablePage, 10)
  const tablePage = Number.isNaN(requestedTablePage) ? 1 : Math.max(requestedTablePage, 1)
  const query = tablePage > 1 ? '?tablePage=' + tablePage : ''
  return res.redirect('/review-extraction-a' + query + '#document-summary')
})

router.get('/review-extraction-a/document/:documentId', (req, res) => {
  const data = req.session.data
  data['extraction-variant'] = 'a'
  applyExtractionVariantData(data)

  const documents = Array.isArray(data['scenario-a-documents']) ? data['scenario-a-documents'] : []
  const document = documents.find((item) => item.id === req.params.documentId)

  if (!document) {
    return res.redirect('/review-extraction-a#document-summary')
  }

  const documentIndex = documents.findIndex((item) => item.id === document.id) + 1
  const requestedTablePage = parseInt(req.query.tablePage, 10)
  const tablePage = Number.isNaN(requestedTablePage) ? 1 : Math.max(requestedTablePage, 1)
  const reviewPageUrl = basePath + '/review-extraction-a' + (tablePage > 1 ? '?tablePage=' + tablePage : '') + '#document-summary'

  const documentTemplate = getScenarioADocumentTemplate(document.documentType)

  res.render(documentTemplate, {
    document,
    documentIndex,
    totalDocuments: documents.length,
    tablePage,
    reviewPageUrl,
    showBackLink: true,
    backLinkHref: reviewPageUrl
  })
})

router.get('/review-extraction-a/document/:documentId/change', (req, res) => {
  const data = req.session.data
  data['extraction-variant'] = 'a'
  applyExtractionVariantData(data)

  const documents = Array.isArray(data['scenario-a-documents']) ? data['scenario-a-documents'] : []
  const document = documents.find((item) => item.id === req.params.documentId)
  if (!document) {
    return res.redirect('/review-extraction-a#document-summary')
  }

  const requestedTablePage = parseInt(req.query.tablePage, 10)
  const tablePage = Number.isNaN(requestedTablePage) ? 1 : Math.max(requestedTablePage, 1)

  res.render('part1/review/review-extraction-a-document-change', {
    document,
    tablePage
  })
})

router.get('/review-extraction-a/document/:documentId/change/:sectionKey', (req, res) => {
  const data = req.session.data
  data['extraction-variant'] = 'a'
  applyExtractionVariantData(data)

  const documents = Array.isArray(data['scenario-a-documents']) ? data['scenario-a-documents'] : []
  const document = documents.find((item) => item.id === req.params.documentId)
  if (!document) {
    return res.redirect('/review-extraction-a#document-summary')
  }

  const requestedTablePage = parseInt(req.query.tablePage, 10)
  const tablePage = Number.isNaN(requestedTablePage) ? 1 : Math.max(requestedTablePage, 1)

  if (req.params.sectionKey === 'extracted-fields') {
    const extractedSection = Array.isArray(document.detailSections)
      ? document.detailSections.find((section) => section.key === 'extracted-fields')
      : null

    if (!extractedSection || !Array.isArray(extractedSection.rows)) {
      const tablePageQuery = tablePage > 1 ? '?tablePage=' + tablePage : ''
      return res.redirect('/review-extraction-a/document/' + document.id + tablePageQuery)
    }

    const sectionFields = extractedSection.rows.map((row, rowIndex) => {
      const fieldKey = row.fieldKey || buildScenarioAExtractedFieldKey(row.label, rowIndex)
      const fieldControl = getScenarioAExtractedFieldControl(row.label, row.value)

      return {
        key: fieldKey,
        label: row.label,
        value: row.value || '',
        control: fieldControl.control,
        rows: fieldControl.rows
      }
    })

    return res.render(getScenarioADocumentChangeTemplate(document.documentType), {
      document,
      sectionKey: req.params.sectionKey,
      sectionTitle: extractedSection.title,
      sectionFields,
      tablePage
    })
  }

  const sectionConfig = scenarioASectionEditConfigs[req.params.sectionKey]
  if (!sectionConfig) {
    const tablePageQuery = req.query.tablePage ? '?tablePage=' + encodeURIComponent(req.query.tablePage) : ''
    return res.redirect('/review-extraction-a/document/' + document.id + tablePageQuery)
  }
  const sectionFields = sectionConfig.fields.map((field) => ({
    ...field,
    value: Object.prototype.hasOwnProperty.call(document, field.key) ? document[field.key] : ''
  }))

  res.render('part1/review/review-extraction-a-document-card-change', {
    document,
    sectionKey: req.params.sectionKey,
    sectionTitle: sectionConfig.title,
    sectionFields,
    tablePage
  })
})

router.post('/review-extraction-a/document/:documentId/change/:sectionKey', (req, res) => {
  const data = req.session.data
  data['extraction-variant'] = 'a'
  applyExtractionVariantData(data)

  const documents = Array.isArray(data['scenario-a-documents']) ? data['scenario-a-documents'] : []
  const document = documents.find((item) => item.id === req.params.documentId)
  if (!document) {
    return res.redirect('/review-extraction-a#document-summary')
  }

  const requestedTablePage = parseInt(req.query.tablePage, 10)
  const tablePage = Number.isNaN(requestedTablePage) ? 1 : Math.max(requestedTablePage, 1)

  if (req.params.sectionKey === 'extracted-fields') {
    const extractedSection = Array.isArray(document.detailSections)
      ? document.detailSections.find((section) => section.key === 'extracted-fields')
      : null

    if (!extractedSection || !Array.isArray(extractedSection.rows)) {
      const tablePageQuery = tablePage > 1 ? '?tablePage=' + tablePage : ''
      return res.redirect('/review-extraction-a/document/' + document.id + tablePageQuery)
    }

    if (!data['scenario-a-document-overrides'] || typeof data['scenario-a-document-overrides'] !== 'object') {
      data['scenario-a-document-overrides'] = {}
    }

    const existingOverride = (data['scenario-a-document-overrides'][document.id] && typeof data['scenario-a-document-overrides'][document.id] === 'object')
      ? data['scenario-a-document-overrides'][document.id]
      : {}
    const existingHighConfidenceEditedFields = Array.isArray(existingOverride.__highConfidenceEditedFields)
      ? existingOverride.__highConfidenceEditedFields
      : []
    const normalizeValue = (value) => String(value || '').trim()
    const extractedFieldOverrides = (existingOverride.__extractedFieldOverrides && typeof existingOverride.__extractedFieldOverrides === 'object')
      ? { ...existingOverride.__extractedFieldOverrides }
      : {}
    const newlyPromotedFieldKeys = []

    for (const [rowIndex, row] of extractedSection.rows.entries()) {
      const fieldKey = row.fieldKey || buildScenarioAExtractedFieldKey(row.label, rowIndex)
      const fieldValue = normalizeValue(req.body[fieldKey])
      extractedFieldOverrides[fieldKey] = fieldValue

      if (fieldValue) {
        newlyPromotedFieldKeys.push(fieldKey)
      }
    }

    const highConfidenceEditedFields = Array.from(new Set([...existingHighConfidenceEditedFields, ...newlyPromotedFieldKeys]))

    data['scenario-a-document-overrides'][document.id] = {
      ...existingOverride,
      __extractedFieldOverrides: extractedFieldOverrides,
      __highConfidenceEditedFields: highConfidenceEditedFields
    }

    const tablePageQuery = tablePage > 1 ? '?tablePage=' + tablePage : ''
    return res.redirect('/review-extraction-a/document/' + document.id + tablePageQuery)
  }

  const sectionConfig = scenarioASectionEditConfigs[req.params.sectionKey]
  if (!sectionConfig) {
    const tablePageQuery = req.query.tablePage ? '?tablePage=' + encodeURIComponent(req.query.tablePage) : ''
    return res.redirect('/review-extraction-a/document/' + document.id + tablePageQuery)
  }
  const normalizeValue = (value) => String(value || '').trim()
  const sectionOverride = {}

  for (const field of sectionConfig.fields) {
    sectionOverride[field.key] = normalizeValue(req.body[field.key])
  }

  if (!data['scenario-a-document-overrides'] || typeof data['scenario-a-document-overrides'] !== 'object') {
    data['scenario-a-document-overrides'] = {}
  }

  const existingOverride = (data['scenario-a-document-overrides'][document.id] && typeof data['scenario-a-document-overrides'][document.id] === 'object')
    ? data['scenario-a-document-overrides'][document.id]
    : {}
  const existingHighConfidenceEditedFields = Array.isArray(existingOverride.__highConfidenceEditedFields)
    ? existingOverride.__highConfidenceEditedFields
    : []
  const newlyPromotedFieldKeys = sectionConfig.fields
    .filter((field) => sectionOverride[field.key])
    .map((field) => field.key)
  const highConfidenceEditedFields = Array.from(new Set([...existingHighConfidenceEditedFields, ...newlyPromotedFieldKeys]))

  data['scenario-a-document-overrides'][document.id] = {
    ...existingOverride,
    ...sectionOverride,
    __highConfidenceEditedFields: highConfidenceEditedFields
  }

  const tablePageQuery = tablePage > 1 ? '?tablePage=' + tablePage : ''
  return res.redirect('/review-extraction-a/document/' + document.id + tablePageQuery)
})

router.post('/review-extraction-a/document/:documentId/change', (req, res) => {
  const data = req.session.data
  data['extraction-variant'] = 'a'
  applyExtractionVariantData(data)

  const documents = Array.isArray(data['scenario-a-documents']) ? data['scenario-a-documents'] : []
  const document = documents.find((item) => item.id === req.params.documentId)
  if (!document) {
    return res.redirect('/review-extraction-a#document-summary')
  }

  const requestedTablePage = parseInt(req.query.tablePage, 10)
  const tablePage = Number.isNaN(requestedTablePage) ? 1 : Math.max(requestedTablePage, 1)

  const normalizeValue = (value) => String(value || '').trim()
  const override = {
    documentType: normalizeValue(req.body.documentType),
    documentNumber: normalizeValue(req.body.documentNumber),
    vessel: normalizeValue(req.body.vessel),
    flagState: normalizeValue(req.body.flagState),
    species: normalizeValue(req.body.species),
    scientificName: normalizeValue(req.body.scientificName),
    productCode: normalizeValue(req.body.productCode),
    catchArea: normalizeValue(req.body.catchArea),
    catchDates: normalizeValue(req.body.catchDates),
    catchNetWeight: normalizeValue(req.body.catchNetWeight),
    importerDetails: normalizeValue(req.body.importerDetails),
    exporterDetails: normalizeValue(req.body.exporterDetails),
    processingStatementReference: normalizeValue(req.body.processingStatementReference),
    shipmentTransportReference: normalizeValue(req.body.shipmentTransportReference)
  }

  if (!data['scenario-a-document-overrides'] || typeof data['scenario-a-document-overrides'] !== 'object') {
    data['scenario-a-document-overrides'] = {}
  }
  const existingOverride = (data['scenario-a-document-overrides'][document.id] && typeof data['scenario-a-document-overrides'][document.id] === 'object')
    ? data['scenario-a-document-overrides'][document.id]
    : {}
  const existingHighConfidenceEditedFields = Array.isArray(existingOverride.__highConfidenceEditedFields)
    ? existingOverride.__highConfidenceEditedFields
    : []
  data['scenario-a-document-overrides'][document.id] = {
    ...existingOverride,
    ...override,
    __highConfidenceEditedFields: existingHighConfidenceEditedFields
  }

  const tablePageQuery = tablePage > 1 ? '?tablePage=' + tablePage : ''
  return res.redirect('/review-extraction-a/document/' + document.id + tablePageQuery)
})

// -------------------------------------------------------
// Review extraction — Scenario A (multiple documents)
// -------------------------------------------------------
router.post('/review-extraction-a', (req, res) => {
  res.redirect('/declaration')
})

// -------------------------------------------------------
// Review extraction — Scenario B (extraction failed)
// -------------------------------------------------------
router.post('/review-extraction-b', (req, res) => {
  res.redirect('/upload-documents')
})

router.post('/declaration', (req, res) => {
  const data = req.session.data
  data['declaration-confirmed'] = req.body['declaration-confirmed'] || ''

  if (!data['reference-number']) {
    data['reference-number'] = 'IUU-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000)
  }

  res.redirect('/confirmation')
})
