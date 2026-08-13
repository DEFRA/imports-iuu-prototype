//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const fs = require('fs')
const path = require('path')
const router = govukPrototypeKit.requests.setupRouter()

const getMissingValues = (requiredValues, actualValues) => {
  const actualSet = new Set(actualValues)
  return requiredValues.filter((value) => !actualSet.has(value))
}

const sampleDocumentsPath = path.join(__dirname, '..', 'sample-documents')
const supportedExtractionVariants = new Set(['a', 'b'])
const reviewExtractionReturnPaths = new Set(['/review-extraction-a'])

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

const createScenarioADetailSection = (title, confidenceLabel, confidenceTagClass, rows) => {
  return {
    title,
    confidenceLabel,
    confidenceTagClass,
    rows: rows.map((row) => ({
      label: row.label,
      value: row.value || '',
      isMissing: !row.value,
      fieldConfidenceLabel: row.fieldConfidenceLabel || confidenceLabel,
      fieldConfidenceTagClass: row.fieldConfidenceTagClass || confidenceTagClass
    }))
  }
}

const buildScenarioADocumentPresentation = (document) => {
  const confidenceLabel = document.extractionConfidenceLabel
  const confidenceTagClass = document.extractionConfidenceTagClass
  const vesselAndFlag = [document.vessel, document.flagState].filter(Boolean).join(' - ')
  const importerExporterValue = [document.importerDetails, document.exporterDetails].filter(Boolean).join('; ')
  const hasBothCommercialParties = Boolean(document.importerDetails && document.exporterDetails)
  const processingReferenceValue = document.processingStatementReference || 'Missing'
  const processingConfidenceLabel = processingReferenceValue === 'Not applicable'
    ? 'N/A'
    : (document.processingStatementReference ? confidenceLabel : 'Missing')
  const processingConfidenceTagClass = processingReferenceValue === 'Not applicable'
    ? 'govuk-tag--grey'
    : (document.processingStatementReference ? confidenceTagClass : 'govuk-tag--red')

  return {
    summaryFields: [
      { label: 'Document type', value: document.documentType, confidence: confidenceLabel, confidenceTagClass },
      { label: 'Document/certificate reference', value: document.documentNumber, confidence: confidenceLabel, confidenceTagClass },
      { label: 'Vessel name and flag state', value: vesselAndFlag || 'Missing', confidence: vesselAndFlag ? confidenceLabel : 'Missing', confidenceTagClass: vesselAndFlag ? confidenceTagClass : 'govuk-tag--red' },
      { label: 'Species', value: document.species || 'Missing', confidence: document.species ? confidenceLabel : 'Missing', confidenceTagClass: document.species ? confidenceTagClass : 'govuk-tag--red' },
      { label: 'FAO catch area', value: document.catchArea || 'Missing', confidence: document.catchArea ? confidenceLabel : 'Missing', confidenceTagClass: document.catchArea ? confidenceTagClass : 'govuk-tag--red' },
      { label: 'Catch/net weight', value: document.catchNetWeight || 'Missing', confidence: document.catchNetWeight ? confidenceLabel : 'Missing', confidenceTagClass: document.catchNetWeight ? confidenceTagClass : 'govuk-tag--red' },
      { label: 'Importer/exporter details', value: importerExporterValue || 'Missing', confidence: hasBothCommercialParties ? confidenceLabel : 'Needs review', confidenceTagClass: hasBothCommercialParties ? confidenceTagClass : 'govuk-tag--yellow' },
      { label: 'Processing statement reference (where applicable)', value: processingReferenceValue, confidence: processingConfidenceLabel, confidenceTagClass: processingConfidenceTagClass },
      { label: 'Shipment/transport reference', value: document.shipmentTransportReference || 'Missing', confidence: document.shipmentTransportReference ? confidenceLabel : 'Missing', confidenceTagClass: document.shipmentTransportReference ? confidenceTagClass : 'govuk-tag--red' },
      { label: 'Extraction confidence', value: document.extractionConfidence + '%', confidence: confidenceLabel, confidenceTagClass }
    ],
    detailSections: [
      createScenarioADetailSection('Document information', confidenceLabel, confidenceTagClass, [
        { label: 'Document type', value: document.documentType },
        { label: 'Document/certificate reference', value: document.documentNumber }
      ]),
      createScenarioADetailSection('Vessel information', confidenceLabel, confidenceTagClass, [
        { label: 'Vessel name', value: document.vessel },
        { label: 'Flag state', value: document.flagState }
      ]),
      createScenarioADetailSection('Species information', confidenceLabel, confidenceTagClass, [
        { label: 'Species', value: document.species },
        { label: 'Scientific name', value: document.scientificName }
      ]),
      createScenarioADetailSection('Commodity information', confidenceLabel, confidenceTagClass, [
        { label: 'Product code / CN code', value: document.productCode }
      ]),
      createScenarioADetailSection('Catch information', confidenceLabel, confidenceTagClass, [
        { label: 'FAO catch area', value: document.catchArea },
        { label: 'Catch dates', value: document.catchDates }
      ]),
      createScenarioADetailSection('Weight information', confidenceLabel, confidenceTagClass, [
        { label: 'Catch weight / net weight', value: document.catchNetWeight }
      ]),
      createScenarioADetailSection('Commercial parties', confidenceLabel, confidenceTagClass, [
        { label: 'Importer details', value: document.importerDetails },
        { label: 'Exporter details', value: document.exporterDetails }
      ]),
      createScenarioADetailSection('Processing information', confidenceLabel, confidenceTagClass, [
        { label: 'Processing statement reference', value: processingReferenceValue === 'Not applicable' ? 'Not applicable' : document.processingStatementReference }
      ]),
      createScenarioADetailSection('Consignment information', confidenceLabel, confidenceTagClass, [
        { label: 'Shipment / transport reference', value: document.shipmentTransportReference }
      ])
    ]
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
  const importerName = seedData['importer-name'] || 'Nordic Sea Imports Ltd'
  const exporterName = seedData['scenario-a-exporter-name'] || 'Samherji Export Ltd'
  const transportReference = 'SHIP-REF-RKV-GB-' + String(sequence).padStart(4, '0')
  const processingReference = documentType === 'Processing Statement'
    ? buildScenarioADocumentReference(metadata.processingReferencePrefix, 1100 + sequence)
    : 'Not applicable'
  const totalFields = 10
  const fieldsExtractedByStatus = {
    complete: 10,
    'needs-review': 8,
    incomplete: 6,
    'manual-check': 3
  }
  const fieldsExtracted = fieldsExtractedByStatus[statusKey] || 6

  const baseRows = {
    documentType,
    certificateReference: referenceNumber,
    vesselName,
    flagState,
    species,
    scientificName,
    productCode: metadata.productCode,
    catchArea,
    catchDates,
    netWeight,
    importerName,
    exporterName,
    processingReference,
    transportReference
  }

  if (statusKey === 'incomplete') {
    baseRows.catchDates = ''
    baseRows.processingReference = documentType === 'Processing Statement' ? '' : 'Not applicable'
    baseRows.transportReference = ''
  }

  if (statusKey === 'manual-check') {
    baseRows.productCode = ''
    baseRows.catchArea = ''
    baseRows.catchDates = ''
    baseRows.netWeight = ''
    baseRows.exporterName = ''
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
    flagState,
    catchArea,
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
    catchNetWeight: baseRows.netWeight,
    importerDetails: baseRows.importerName,
    exporterDetails: baseRows.exporterName,
    processingStatementReference: baseRows.processingReference,
    shipmentTransportReference: baseRows.transportReference
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
    documentNumber: Object.prototype.hasOwnProperty.call(override, 'documentNumber') ? override.documentNumber : document.documentNumber,
    referenceNumber: Object.prototype.hasOwnProperty.call(override, 'documentNumber') ? override.documentNumber : document.referenceNumber,
    vessel: Object.prototype.hasOwnProperty.call(override, 'vessel') ? override.vessel : document.vessel,
    flagState: Object.prototype.hasOwnProperty.call(override, 'flagState') ? override.flagState : document.flagState,
    species: Object.prototype.hasOwnProperty.call(override, 'species') ? override.species : document.species,
    scientificName: Object.prototype.hasOwnProperty.call(override, 'scientificName') ? override.scientificName : document.scientificName,
    productCode: Object.prototype.hasOwnProperty.call(override, 'productCode') ? override.productCode : document.productCode,
    catchArea: Object.prototype.hasOwnProperty.call(override, 'catchArea') ? override.catchArea : document.catchArea,
    catchDates: Object.prototype.hasOwnProperty.call(override, 'catchDates') ? override.catchDates : document.catchDates,
    catchNetWeight: Object.prototype.hasOwnProperty.call(override, 'catchNetWeight') ? override.catchNetWeight : document.catchNetWeight,
    importerDetails: Object.prototype.hasOwnProperty.call(override, 'importerDetails') ? override.importerDetails : document.importerDetails,
    exporterDetails: Object.prototype.hasOwnProperty.call(override, 'exporterDetails') ? override.exporterDetails : document.exporterDetails,
    processingStatementReference: Object.prototype.hasOwnProperty.call(override, 'processingStatementReference') ? override.processingStatementReference : document.processingStatementReference,
    shipmentTransportReference: Object.prototype.hasOwnProperty.call(override, 'shipmentTransportReference') ? override.shipmentTransportReference : document.shipmentTransportReference
  }

  return {
    ...updatedDocument,
    ...buildScenarioADocumentPresentation(updatedDocument)
  }
}

const buildScenarioADocuments = (seedData) => {
  const documents = []
  const statuses = [
    ...Array.from({ length: 16 }, () => 'complete'),
    ...Array.from({ length: 2 }, () => 'needs-review'),
    'incomplete',
    'manual-check'
  ]
  const documentTypes = [
    ...Array.from({ length: 12 }, () => 'Catch Certificate'),
    ...Array.from({ length: 4 }, () => 'Processing Statement'),
    ...Array.from({ length: 2 }, () => 'Non-Manipulation Declaration'),
    ...Array.from({ length: 2 }, () => 'Additional document')
  ]
  const confidenceByStatus = {
    complete: [99, 98, 98, 97, 97, 96, 96, 96, 95, 95, 94, 94, 93, 93, 92, 91],
    'needs-review': [79, 74],
    incomplete: [59],
    'manual-check': [43]
  }
  const counters = { complete: 0, 'needs-review': 0, incomplete: 0, 'manual-check': 0 }

  for (let i = 0; i < documentTypes.length; i++) {
    const status = statuses[i]
    const statusIndex = counters[status]
    counters[status] = statusIndex + 1
    const confidence = confidenceByStatus[status][statusIndex]
    documents.push(createScenarioADocument(i, documentTypes[i], confidence, status, seedData))
  }
  return documents
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
  const noBackLink = ['/', '/confirmation', '/upload-confirmation']
  res.locals.showBackLink = !noBackLink.includes(req.path)
  res.locals.fesDataDictionaryFields = fesDataDictionaryFields
  next()
})

// Clear all entered data when returning to the start page
router.get('/', (req, res, next) => {
  req.session.data = {}
  next()
})

// -------------------------------------------------------
// Importer details
// -------------------------------------------------------
router.post('/importer-details', (req, res) => {
  res.redirect('/transport-details')
})

// -------------------------------------------------------
// Transport details
// -------------------------------------------------------
router.post('/transport-details', (req, res) => {
  res.redirect('/arrival-details')
})

// -------------------------------------------------------
// Arrival details
// -------------------------------------------------------
router.post('/arrival-details', (req, res) => {
  const data = req.session.data
  const hasVariantFlow = Boolean(data['extraction-variant'])
  if (hasVariantFlow) {
    return res.redirect('/upload-documents')
  }
  return res.redirect('/species-details')
})

// -------------------------------------------------------
// Species details — save and add to species list
// -------------------------------------------------------
router.post('/species-details', (req, res) => {
  const data = req.session.data

  // Build species entry
  let speciesName = data['species-name']
  if (speciesName === 'other' && data['species-name-other']) {
    speciesName = data['species-name-other']
  }

  const newSpecies = {
    name: speciesName,
    productForm: data['product-form'],
    commodityCode: data['commodity-code'],
    netWeight: data['net-weight'],
    grossWeight: data['gross-weight'],
    numberOfPackages: data['number-of-packages'],
    packagingType: data['packaging-type']
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
  const addAnother = req.session.data['add-another-species']
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

  res.render('catch-certificates')
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
router.get('/upload-guidance', (req, res, next) => {
  const variant = String(req.query.variant || 'a').toLowerCase()
  if (!supportedExtractionVariants.has(variant)) {
    return res.redirect('/')
  }

  req.session.data['extraction-variant'] = variant
  next()
})

// -------------------------------------------------------
// Sign in
// -------------------------------------------------------
router.get('/sign-in', (req, res) => {
  res.redirect('/arrival-details')
})

router.post('/sign-in', (req, res) => {
  res.redirect('/arrival-details')
})

// -------------------------------------------------------
// Single document upload page for extraction prototype
// -------------------------------------------------------
router.get('/upload-documents', (req, res) => {
  res.render('upload-documents')
})

router.post('/upload-documents', (req, res) => {
  const data = req.session.data
  const files = getUploadedFilesFromRequest(req, 'documents')
  const selectedViaClient = req.body['documents-selected'] === 'true'
  const clientFileNamesRaw = req.body['documents-file-names'] || ''
  const clientFileNames = String(clientFileNamesRaw)
    .split('|')
    .map((name) => name.trim())
    .filter(Boolean)
  const existingUploads = Array.isArray(data['uploaded-documents']) ? data['uploaded-documents'] : []

  if (files.length > 0) {
    data['uploaded-documents'] = files.map((file, index) => ({
      filename: file.originalname || file.filename || ('uploaded-document-' + (index + 1) + '.pdf')
    }))
  } else if (clientFileNames.length > 0) {
    data['uploaded-documents'] = clientFileNames.map((filename) => ({ filename }))
  } else if (existingUploads.length > 0) {
    data['uploaded-documents'] = existingUploads
  } else {
    data['uploaded-documents'] = [{ filename: 'uploaded-document-1.pdf' }]
  }

  data['catch-cert-uploaded-files'] = data['uploaded-documents'].map((item) => item.filename)
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
  res.render('change-extracted-details')
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

  const buildReviewExtractionAUrl = (summaryPage) => {
    const query = []
    if (summaryPage > 1) query.push('tablePage=' + summaryPage)
    return '/review-extraction-a' + (query.length ? '?' + query.join('&') : '')
  }

  const tablePaginationItems = []
  for (let pageNumber = 1; pageNumber <= totalTablePages; pageNumber++) {
    tablePaginationItems.push({
      number: pageNumber,
      current: pageNumber === tablePage,
      href: buildReviewExtractionAUrl(pageNumber) + '#document-summary'
    })
  }

  res.render('review-extraction-a', {
    totalDocuments,
    tableDocuments,
    tablePage,
    totalTablePages,
    showTablePagination: totalDocuments > documentsPerPage,
    tablePaginationItems,
    tablePreviousUrl: tablePage > 1 ? buildReviewExtractionAUrl(tablePage - 1) + '#document-summary' : '',
    tableNextUrl: tablePage < totalTablePages ? buildReviewExtractionAUrl(tablePage + 1) + '#document-summary' : '',
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
  const reviewPageUrl = '/review-extraction-a' + (tablePage > 1 ? '?tablePage=' + tablePage : '') + '#document-summary'

  res.render('review-extraction-a-document', {
    document,
    documentIndex,
    totalDocuments: documents.length,
    tablePage,
    reviewPageUrl,
    showBackLink: false
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

  res.render('review-extraction-a-document-change', {
    document,
    tablePage
  })
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
  data['scenario-a-document-overrides'][document.id] = override

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

// =======================================================
// Inspection journey prototype (separate journey)
// =======================================================

const inspectionReference = 'GB-IUU-2026-10482'

const buildInspectionErrorContext = (errors) => {
  const errorMap = {}
  const errorList = (errors || []).map((error) => {
    errorMap[error.name] = error.text
    return { text: error.text, href: '#' + error.name }
  })
  return {
    hasErrors: errorList.length > 0,
    errorList,
    errorMap
  }
}

const renderInspectionPage = (res, view, errors = []) => {
  res.render(view, buildInspectionErrorContext(errors))
}

router.get('/prototype-selector', (req, res) => {
  res.redirect('/')
})

router.get('/inspections', (req, res) => {
  req.session.data['inspection-officer-name'] = req.session.data['inspection-officer-name'] || 'Alex Morgan'
  req.session.data['inspection-officer-org'] = req.session.data['inspection-officer-org'] || 'Port of Felixstowe Port Health Authority'
  res.render('inspection/inspections')
})

router.get('/inspections/completed', (req, res) => {
  res.render('inspection/inspections-completed')
})

router.get('/inspection/:reference', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  res.render('inspection/consignment-overview')
})

router.get('/inspection/:reference/documents', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  res.render('inspection/source-documents')
})

router.get('/inspection-assumptions', (req, res) => {
  res.render('inspection/prototype-assumptions')
})

router.get('/inspection/:reference/confirm-details', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  const data = req.session.data
  data['inspection-location'] = data['inspection-location'] || 'Port of Felixstowe - inspection bay 2'
  data['inspection-date-day'] = data['inspection-date-day'] || '3'
  data['inspection-date-month'] = data['inspection-date-month'] || '8'
  data['inspection-date-year'] = data['inspection-date-year'] || '2026'
  data['inspection-lead-officer'] = data['inspection-lead-officer'] || 'Alex Morgan'
  res.render('inspection/confirm-details')
})

router.post('/inspection/:reference/confirm-details', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  const data = req.session.data
  const errors = []
  if (!data['inspection-location']) errors.push({ name: 'inspection-location', text: 'Enter the inspection location' })
  if (!data['inspection-date-day'] || !data['inspection-date-month'] || !data['inspection-date-year']) {
    errors.push({ name: 'inspection-date-day', text: 'Enter the inspection date' })
  }
  if (!data['inspection-lead-officer']) errors.push({ name: 'inspection-lead-officer', text: 'Enter the lead inspecting officer' })
  if (errors.length) return renderInspectionPage(res, 'inspection/confirm-details', errors)
  res.redirect(`/inspection/${inspectionReference}/check-documents`)
})

router.get('/inspection/:reference/check-documents', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  res.render('inspection/check-documents')
})

router.post('/inspection/:reference/check-documents', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  const data = req.session.data
  const result = data['documents-check-result']
  const details = data['documents-discrepancy-details']
  const errors = []
  if (!result) errors.push({ name: 'documents-check-result', text: 'Select the documentary check result' })
  if ((result === 'minor-discrepancy' || result === 'not-acceptable') && !details) {
    errors.push({ name: 'documents-discrepancy-details', text: 'Describe the discrepancy' })
  }
  if (errors.length) return renderInspectionPage(res, 'inspection/check-documents', errors)
  res.redirect(`/inspection/${inspectionReference}/identity-checks`)
})

router.get('/inspection/:reference/identity-checks', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  res.render('inspection/identity-checks')
})

router.post('/inspection/:reference/identity-checks', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  const data = req.session.data
  const result = data['identity-check-result']
  const sealFound = data['seal-number-found']
  const details = data['identity-discrepancy-details']
  const errors = []
  if (!result) errors.push({ name: 'identity-check-result', text: 'Select whether the consignment matched the declared identity' })
  if (!sealFound) errors.push({ name: 'seal-number-found', text: 'Enter the seal number found' })
  if ((result === 'partly-matches' || result === 'no-match') && !details) {
    errors.push({ name: 'identity-discrepancy-details', text: 'Describe the identity discrepancy' })
  }
  if (errors.length) return renderInspectionPage(res, 'inspection/identity-checks', errors)
  res.redirect(`/inspection/${inspectionReference}/physical-checks`)
})

router.get('/inspection/:reference/physical-checks', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  res.render('inspection/physical-checks')
})

router.post('/inspection/:reference/physical-checks', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  const data = req.session.data
  const result = data['physical-check-result']
  const notCompletedReason = data['physical-not-completed-reason']
  const errors = []
  if (!result) errors.push({ name: 'physical-check-result', text: 'Select the result of the physical checks' })
  if (result === 'not-completed' && !notCompletedReason) {
    errors.push({ name: 'physical-not-completed-reason', text: 'Enter why physical checks were not completed' })
  }
  if (errors.length) return renderInspectionPage(res, 'inspection/physical-checks', errors)
  res.redirect(`/inspection/${inspectionReference}/findings`)
})

router.get('/inspection/:reference/findings', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  res.render('inspection/findings')
})

router.post('/inspection/:reference/findings', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  const data = req.session.data
  const finding = data['inspection-finding']
  const notes = data['inspection-finding-notes']
  const evidence = data['inspection-evidence-considered']
  const errors = []
  if (!finding) errors.push({ name: 'inspection-finding', text: 'Select what the inspection found' })
  if (!notes) errors.push({ name: 'inspection-finding-notes', text: 'Enter inspection notes' })
  if (!evidence) errors.push({ name: 'inspection-evidence-considered', text: 'Summarise evidence considered' })
  if (errors.length) return renderInspectionPage(res, 'inspection/findings', errors)
  res.redirect(`/inspection/${inspectionReference}/outcome`)
})

router.get('/inspection/:reference/outcome', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  res.render('inspection/outcome')
})

router.post('/inspection/:reference/outcome', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  const data = req.session.data
  const outcome = data['inspection-outcome']
  const errors = []
  if (!outcome) errors.push({ name: 'inspection-outcome', text: 'Select what should happen to this consignment' })
  if (outcome === 'hold') {
    if (!data['hold-reason']) errors.push({ name: 'hold-reason', text: 'Enter the reason for the hold' })
    if (!data['hold-required-action']) errors.push({ name: 'hold-required-action', text: 'Enter what evidence or action is required' })
    if (!data['hold-responsible-organisation']) errors.push({ name: 'hold-responsible-organisation', text: 'Enter the responsible organisation or authority' })
  }
  if (outcome === 'refuse') {
    if (!data['refusal-reason']) errors.push({ name: 'refusal-reason', text: 'Enter the reason for refusal' })
    if (!data['refusal-non-compliance']) errors.push({ name: 'refusal-non-compliance', text: 'Enter the relevant non-compliance' })
    if (!data['refusal-required-action']) errors.push({ name: 'refusal-required-action', text: 'Enter required action' })
    if (!data['refusal-reexport-considered']) errors.push({ name: 'refusal-reexport-considered', text: 'Select whether re-export or another outcome needs to be considered' })
  }
  if (errors.length) return renderInspectionPage(res, 'inspection/outcome', errors)
  res.redirect(`/inspection/${inspectionReference}/check-record`)
})

router.get('/inspection/:reference/check-record', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  res.render('inspection/check-record')
})

router.post('/inspection/:reference/check-record', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  const data = req.session.data
  if (data['inspection-record-confirmed'] !== 'yes') {
    // Clear it so a back-and-resubmit without ticking can't pass on stale session state
    delete data['inspection-record-confirmed']
    return renderInspectionPage(res, 'inspection/check-record', [
      { name: 'inspection-record-confirmed', text: 'Confirm that the inspection record is complete and accurate to the best of your knowledge' }
    ])
  }
  res.redirect(`/inspection/${inspectionReference}/confirmation`)
})

router.get('/inspection/:reference/confirmation', (req, res) => {
  if (req.params.reference !== inspectionReference) {
    return res.render('inspection/inspection-not-implemented')
  }
  res.render('inspection/inspection-confirmation')
})
