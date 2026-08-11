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
const reviewExtractionReturnPaths = new Set(['/review-extraction-a', '/review-extraction-b'])

const reviewExtractionFieldDefinitions = [
  { section: 'Transport details from CC', fieldName: 'Port of Landing', key: 'review-port-of-landing' },
  { section: 'Transport details from CC', fieldName: 'Date of Landing', key: 'review-date-of-landing' },
  { section: 'Catch certificate number', fieldName: 'Document number', key: 'review-cc-document-number' },
  { section: 'Catch certificate number', fieldName: 'Validating Authority Name', key: 'review-validating-authority-name' },
  { section: 'Catch certificate number', fieldName: 'Validating Authority Address', key: 'review-validating-authority-address' },
  { section: 'Species', fieldName: 'Species', key: 'review-species' },
  { section: 'Species', fieldName: 'Product code', key: 'review-product-code' },
  { section: 'Catch area', fieldName: 'Catch Area', key: 'review-catch-area' },
  { section: 'Catch area', fieldName: 'Catch Date from', key: 'review-catch-date-from' },
  { section: 'Catch area', fieldName: 'Catch Date to', key: 'review-catch-date-to' },
  { section: 'Fishing gear', fieldName: 'Fishing License No.', key: 'review-fishing-license-number' },
  { section: 'Fishing gear', fieldName: 'Fishing Gear', key: 'review-fishing-gear' },
  { section: 'Weight/quantity', fieldName: 'Estimated weight to be landed in kg', key: 'review-estimated-weight-to-be-landed-kg' },
  { section: 'Weight/quantity', fieldName: 'Net catch weight in kg', key: 'review-net-catch-weight-kg' },
  { section: 'Weight/quantity', fieldName: 'Verified weight landed in kg', key: 'review-verified-weight-landed-kg' },
  { section: 'Vessel ID and flag State', fieldName: 'Vessel Name', key: 'review-vessel-name' },
  { section: 'Vessel ID and flag State', fieldName: 'Flag - home port and registration number', key: 'review-vessel-flag-home-port-registration-number' },
  { section: 'Vessel ID and flag State', fieldName: 'Call sign', key: 'review-vessel-call-sign' },
  { section: 'Vessel ID and flag State', fieldName: 'IMO number or other unique identifier', key: 'review-vessel-imo-or-other-identifier' },
  { section: 'exporter details', fieldName: 'Name of Exporter', key: 'review-name-of-exporter' },
  { section: 'exporter details', fieldName: 'Exporter Address', key: 'review-exporter-address' },
  { section: 'Importer details', fieldName: 'Importer Company', key: 'review-importer-company' },
  { section: 'Importer details', fieldName: 'Importer Name', key: 'review-importer-name' },
  { section: 'Importer details', fieldName: 'Importer address', key: 'review-importer-address' },
  { section: 'Importer details', fieldName: 'Importer EORI number', key: 'review-importer-eori-number' },
  { section: 'Importer details', fieldName: 'Importer contact details', key: 'review-importer-contact-details' },
  { section: 'Importer agent details', fieldName: 'Importer Representative Company', key: 'review-importer-representative-company' },
  { section: 'Importer agent details', fieldName: 'Importer Representative Name', key: 'review-importer-representative-name' },
  { section: 'Importer agent details', fieldName: 'Importer Representative address', key: 'review-importer-representative-address' },
  { section: 'Importer agent details', fieldName: 'Importer Representative EORI number', key: 'review-importer-representative-eori-number' },
  { section: 'Importer agent details', fieldName: 'Importer Representative contact details', key: 'review-importer-representative-contact-details' },
  { section: 'Importer Declaration', fieldName: 'Product Description', key: 'review-importer-declaration-product-description' },
  { section: 'Importer Declaration', fieldName: 'CN code', key: 'review-importer-declaration-cn-code' },
  { section: 'Importer Declaration', fieldName: 'Net weight in kg', key: 'review-importer-declaration-net-weight-kg' },
  { section: 'Importer Declaration', fieldName: 'Net fishery product weight in kg', key: 'review-importer-declaration-net-fishery-product-weight-kg' },
  { section: 'Transport details', fieldName: 'Name', key: 'review-transport-name' },
  { section: 'Transport details', fieldName: 'Address', key: 'review-transport-address' },
  { section: 'Transport details', fieldName: 'Means of transport upon arrival', key: 'review-means-of-transport-upon-arrival' },
  { section: 'Transport details', fieldName: 'Transport document reference', key: 'review-transport-document-reference' },
  { section: 'Transport details', fieldName: 'Country of exportation Port/airport/other point of departure', key: 'review-country-of-exportation-port-airport-other-point-of-departure' },
  { section: 'Transport details', fieldName: 'Point of destination', key: 'review-point-of-destination' },
  { section: 'Transport details', fieldName: 'Container Numbers', key: 'review-container-numbers' },
  { section: 'Storage statement reference numbers', fieldName: 'Document number', key: 'review-nmd-document-number' },
  { section: 'Processing statement reference numbers', fieldName: 'Document number', key: 'review-ps-document-number' }
]

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

const isNonManipulationDocumentFile = (filename) => {
  const upperFilename = filename.toUpperCase()
  return upperFilename.includes('NON-MANIPULATION') || /(^|[\s._-])NMD([\s._-]|$)/i.test(filename) || /-N\.[^.]+$/i.test(filename)
}

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

const getSampleExtractionFieldLookup = () => {
  const extractionJsonFile = findSampleExtractionJsonFile()
  if (!extractionJsonFile) return {}

  try {
    const raw = fs.readFileSync(path.join(sampleDocumentsPath, extractionJsonFile), 'utf8')
    const parsed = JSON.parse(raw)
    return buildExtractionFieldLookup(parsed.fields)
  } catch (error) {
    console.error('Failed to parse extraction JSON for review fields:', extractionJsonFile, error)
    return {}
  }
}

const extractDocumentReference = (filename) => {
  const withoutExtension = filename.replace(/\.[^/.]+$/, '')
  const psReferenceMatch = withoutExtension.match(/CATCH\.PS\.[A-Z]{2}\.\d{4}\.\d+/i)
  if (psReferenceMatch && psReferenceMatch[0]) return psReferenceMatch[0]
  return withoutExtension.split(' - ')[0].trim()
}

const extractCnCodeFromDescription = (description) => {
  if (!description) return ''
  const matches = String(description).match(/\b\d{8}\b/g)
  if (matches && matches.length) return matches[matches.length - 1]
  return ''
}

const extractCommodityWeight = (commodityValue, label) => {
  if (!commodityValue) return ''
  const match = String(commodityValue).match(new RegExp(label + '\\s+([\\d.]+\\s*kg)', 'i'))
  return match && match[1] ? match[1] : ''
}

const findCommodityLinkedToDocument = (field, documentNumber) => {
  if (!field || !documentNumber) return ''
  const keys = Object.keys(field).filter((key) => key.startsWith('catchCertificateCommodity.')).sort()
  return keys.map((key) => field[key]).find((value) => String(value).includes(documentNumber)) || ''
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

const buildScenarioBExtractionData = () => {
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
      'scenario-b-port-of-entry': field['memberStateOfficeOfImport'] || '',
      'scenario-b-estimated-arrival': field['arrivalTransport.estimatedArrivalTime'] || '',
      'scenario-b-catch-certificate-reference': field['catchCertificate.reference'] || '',
      'scenario-b-catch-area': [field['product.1.faoArea'], field['product.1.eezOrHighSeas'], field['product.1.rfmo']].filter(Boolean).join(' | '),
      // Intentionally blank in Scenario B to represent partial extraction
      'scenario-b-catch-date': '',
      'scenario-b-flag-state': [field['validatingAuthority.country'], field['validatingAuthority.isoCode'] ? '(' + field['validatingAuthority.isoCode'] + ')' : ''].filter(Boolean).join(' '),
      'scenario-b-vessel-name': field['fishingVessel.name'] || '',
      'scenario-b-vessel-imo': field['fishingVessel.imoNumber'] || '',
      'scenario-b-species': field['product.1.species'] || '',
      'scenario-b-commodity-type': field['importerProduct.cnDescription'] || field['productGroup.1.description'] || '',
      'scenario-b-cn-code': field['product.1.productCode'] || '',
      // Intentionally blank in Scenario B to represent partial extraction
      'scenario-b-net-weight': '',
      'scenario-b-product-description': field['productGroup.1.description'] || '',
      'scenario-b-processing-facility': field['memberStateOfficeOfImport'] || '',
      'scenario-b-processing-country': field['transportDetails.countryOfExportation'] || '',
      // Intentionally blank in Scenario B to represent partial extraction
      'scenario-b-processing-reference': '',
      'scenario-b-processing-date': field['transportDetails.signatureDate'] || field['flagStateValidation.date'] || '',
      'scenario-b-exporter-name': field['exporter.name'] || '',
      // Intentionally blank in Scenario B to represent partial extraction
      'scenario-b-export-approval-number': '',
      'scenario-b-export-country': field['exporter.country'] || '',
      'scenario-b-import-fields': [
        { field: 'Place of departure of product', value: field['transportDetails.countryOfExportation'] || '', extracted: true },
        { field: 'Date of departure', value: field['transportDetails.signatureDate'] || '', extracted: true },
        { field: 'Last point of departure before storage country', value: field['transportDetails.placeOfDeparture'] || '', extracted: true },
        { field: 'Date of arrival to storage (unloading)', value: '', extracted: false },
        { field: 'Place of storage', value: field['importer.country'] || '', extracted: true }
      ],
      'scenario-b-catch-fields': [
        { field: 'Catch certificate number', value: field['catchCertificate.documentNumber'] || '', extracted: true },
        { field: 'Vessel name(s), flag(s), validation date(s)', value: [field['fishingVessel.name'], field['fishingVessel.flagHomePort'], field['flagStateValidation.date']].filter(Boolean).join(' | '), extracted: true },
        { field: 'Catch description', value: field['productGroup.1.description'] || '', extracted: true }
      ],
      'scenario-b-commodity-fields': [
        { field: 'Species', value: field['product.1.species'] || '', extracted: true },
        { field: 'Product code', value: field['product.1.productCode'] || '', extracted: true },
        { field: 'Description of fisheries products', value: field['productGroup.1.description'] || '', extracted: true },
        { field: 'Processed fishery product (CN code + description)', value: field['importerProduct.cnDescription'] || '', extracted: true }
      ],
      'scenario-b-consignment-fields': [
        { field: 'Document linkage references', value: field['catchCertificate.documentNumber'] || '', extracted: true },
        { field: 'Net weight entering storage (kg)', value: '', extracted: false },
        { field: 'Net fishery product weight entering storage (kg)', value: '', extracted: false },
        { field: 'Net weight departing storage (kg)', value: '', extracted: false },
        { field: 'Net fishery product weight departing storage (kg)', value: '', extracted: false },
        { field: 'Total landed weight (kg)', value: field['product.1.verifiedWeightLandedKg'] || '', extracted: true },
        { field: 'Catch processed (kg)', value: '', extracted: false },
        { field: 'Processed fishery product (kg)', value: '', extracted: false }
      ],
      'scenario-b-processing-fields': [
        { field: 'Processing plant', value: '', extracted: false },
        { field: 'Processing plant address', value: '', extracted: false },
        { field: 'Plant approval number', value: '', extracted: false },
        { field: 'Responsible person', value: '', extracted: false },
        { field: 'Date of acceptance', value: field['flagStateValidation.date'] || '', extracted: true }
      ],
      'scenario-b-export-fields': [
        { field: 'Exporter company', value: field['exporter.name'] || '', extracted: true },
        { field: 'Exporter address', value: field['exporter.address'] || '', extracted: true },
        { field: 'Date of submission to competent authority', value: field['exporter.signatureDate'] || '', extracted: true },
        { field: 'Point of destination', value: field['memberStateOfficeOfImport'] || '', extracted: true }
      ],
      'scenario-b-nmd-fields': fesDataDictionaryFields.byCategory.nmd.map((item) => ({ field: item.field, value: '', extracted: false }))
    }

  } catch (error) {
    console.error('Failed to parse Scenario B extraction JSON:', extractionJsonFile, error)
    return null
  }
}

const seedReviewSummaryData = (data) => {
  const field = getSampleExtractionFieldLookup()
  const sampleFiles = listSampleDocumentFiles()
  const processingFiles = sampleFiles.filter(isProcessingStatementFile)
  const nonManipulationFiles = sampleFiles.filter(isNonManipulationDocumentFile)
  const linkedCommodity = findCommodityLinkedToDocument(field, field['catchCertificate.documentNumber'])
  const importerRepresentativePhones = [field['importerRepresentative.phone1'], field['importerRepresentative.phone2']].filter(Boolean).join('; ')
  const importerRepresentativeContactDetails = [importerRepresentativePhones, field['importerRepresentative.email']].filter(Boolean).join(' | ')

  const initialValues = {
    'review-port-of-landing': field['memberStateOfficeOfImport'] || '',
    'review-date-of-landing': field['arrivalTransport.estimatedArrivalTime'] || '',
    'review-cc-document-number': field['catchCertificate.documentNumber'] || '',
    'review-validating-authority-name': field['validatingAuthority.name'] || '',
    'review-validating-authority-address': field['validatingAuthority.address'] || '',
    'review-species': field['product.1.species'] || '',
    'review-product-code': field['product.1.productCode'] || '',
    'review-catch-area': [field['product.1.faoArea'], field['product.1.eezOrHighSeas'], field['product.1.rfmo']].filter(Boolean).join(' | '),
    'review-catch-date-from': field['product.1.catchDateFrom'] || '',
    'review-catch-date-to': field['product.1.catchDateTo'] || '',
    'review-fishing-license-number': field['fishingVessel.fishingLicences'] || '',
    'review-fishing-gear': '',
    'review-estimated-weight-to-be-landed-kg': field['product.1.estimatedWeightKg'] || '',
    'review-net-catch-weight-kg': field['product.1.netCatchWeightKg'] || '',
    'review-verified-weight-landed-kg': field['product.1.verifiedWeightLandedKg'] || '',
    'review-vessel-name': field['fishingVessel.name'] || '',
    'review-vessel-flag-home-port-registration-number': [field['fishingVessel.flagHomePort'], field['fishingVessel.registrationNumber']].filter(Boolean).join(' | '),
    'review-vessel-call-sign': field['fishingVessel.callSign'] || '',
    'review-vessel-imo-or-other-identifier': field['fishingVessel.imoNumber'] || '',
    'review-name-of-exporter': field['exporter.name'] || '',
    'review-exporter-address': field['exporter.address'] || '',
    'review-importer-company': field['importer.name'] || '',
    'review-importer-name': field['importer.name'] || '',
    'review-importer-address': field['importer.address'] || '',
    'review-importer-eori-number': field['importer.eori'] || '',
    'review-importer-contact-details': [field['importer.phone'], field['importerRepresentative.email']].filter(Boolean).join(' | '),
    'review-importer-representative-company': field['importerRepresentative.name'] || '',
    'review-importer-representative-name': field['importerRepresentative.name'] || '',
    'review-importer-representative-address': field['importerRepresentative.address'] || '',
    'review-importer-representative-eori-number': field['importerRepresentative.eori'] || '',
    'review-importer-representative-contact-details': importerRepresentativeContactDetails,
    'review-importer-declaration-product-description': field['importerProduct.cnDescription'] || '',
    'review-importer-declaration-cn-code': extractCnCodeFromDescription(field['importerProduct.cnDescription']) || field['product.1.productCode'] || '',
    'review-importer-declaration-net-weight-kg': extractCommodityWeight(linkedCommodity, 'net weight') || field['product.1.netCatchWeightKg'] || '',
    'review-importer-declaration-net-fishery-product-weight-kg': extractCommodityWeight(linkedCommodity, 'net fishery product weight') || field['product.1.netCatchWeightKg'] || '',
    'review-transport-name': field['transportDetails.exporter'] || field['exporter.name'] || '',
    'review-transport-address': field['exporter.address'] || '',
    'review-means-of-transport-upon-arrival': [field['arrivalTransport.mode'], field['arrivalTransport.identification']].filter(Boolean).join(' | '),
    'review-transport-document-reference': field['arrivalTransport.transportDocumentReference'] || field['transportDetails.documentNumber'] || '',
    'review-country-of-exportation-port-airport-other-point-of-departure': [field['transportDetails.countryOfExportation'], field['transportDetails.placeOfDeparture']].filter(Boolean).join(' | '),
    'review-point-of-destination': field['memberStateOfficeOfImport'] || '',
    'review-container-numbers': field['arrivalTransport.containerNumbers'] || '',
    'review-nmd-document-number': nonManipulationFiles.map(extractDocumentReference).join('; '),
    'review-ps-document-number': processingFiles.map(extractDocumentReference).join('; ')
  }

  for (const definition of reviewExtractionFieldDefinitions) {
    const key = definition.key
    data[key] = data[key] || initialValues[key] || ''
  }
}

const buildReviewExtractionConfidence = (variant) => {
  if (variant === 'b') return { value: '74%', tagLabel: 'Medium', tagClass: 'govuk-tag--yellow' }
  if (variant === 'c') return { value: '41%', tagLabel: 'Low', tagClass: 'govuk-tag--red' }
  return { value: '97%', tagLabel: 'High', tagClass: 'govuk-tag--green' }
}

const buildReviewExtractionTag = (variant, value) => {
  if (variant === 'c') return { label: 'Low', className: 'govuk-tag--red' }
  if (variant === 'b') {
    if (!value) return { label: 'Not extracted', className: 'govuk-tag--grey' }
    return { label: 'Medium', className: 'govuk-tag--yellow' }
  }
  return { label: 'High', className: 'govuk-tag--green' }
}

const buildReviewExtractionSections = (data) => {
  const variant = data['extraction-variant'] || 'a'
  const sections = []

  for (const definition of reviewExtractionFieldDefinitions) {
    const existingSection = sections.find((section) => section.name === definition.section)
    const value = data[definition.key] || ''
    const tag = buildReviewExtractionTag(variant, value)
    const row = {
      section: definition.section,
      fieldName: definition.fieldName,
      key: definition.key,
      value,
      tagLabel: tag.label,
      tagClass: tag.className
    }

    if (existingSection) {
      existingSection.rows.push(row)
    } else {
      sections.push({ name: definition.section, rows: [row] })
    }
  }

  return sections
}

const buildReviewExtractionStats = (sections) => {
  const stats = {
    totalFields: 0,
    extractedFields: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    notExtractedCount: 0
  }

  for (const section of sections) {
    for (const row of section.rows || []) {
      stats.totalFields += 1
      if (row.value) stats.extractedFields += 1
      if (row.tagLabel === 'High') stats.highCount += 1
      if (row.tagLabel === 'Medium') stats.mediumCount += 1
      if (row.tagLabel === 'Low') stats.lowCount += 1
      if (row.tagLabel === 'Not extracted') stats.notExtractedCount += 1
    }
  }

  return stats
}

const applyReviewExtractionViewModel = (data) => {
  const variant = data['extraction-variant'] || 'a'
  const confidence = buildReviewExtractionConfidence(variant)
  const sections = buildReviewExtractionSections(data)
  const stats = buildReviewExtractionStats(sections)
  data['review-extraction-confidence-value'] = confidence.value
  data['review-extraction-confidence-tag-label'] = confidence.tagLabel
  data['review-extraction-confidence-tag-class'] = confidence.tagClass
  data['review-extraction-sections'] = sections
  data['review-extraction-total-fields'] = stats.totalFields
  data['review-extraction-extracted-fields'] = stats.extractedFields
  data['review-extraction-not-extracted-fields'] = stats.notExtractedCount
  data['review-extraction-low-confidence-fields'] = stats.lowCount
  data['review-extraction-medium-confidence-fields'] = stats.mediumCount
}

const applyExtractionVariantData = (data) => {
  const variant = data['extraction-variant'] || 'a'

  if (variant === 'a' || variant === 'c') {
    const scenarioAExtractionData = buildScenarioAExtractionData()
    if (scenarioAExtractionData) {
      Object.assign(data, scenarioAExtractionData)
    }
  }

  if (variant === 'b') {
    const scenarioBExtractionData = buildScenarioBExtractionData()
    if (scenarioBExtractionData) {
      Object.assign(data, scenarioBExtractionData)
    }
  }

  seedReviewSummaryData(data)
  applyReviewExtractionViewModel(data)
}

const scenarioDCatchCertificateFiles = [
  'ESP.SGCI.AI.2025.944.pdf',
  'FRA-2025-CSP-000472.pdf',
  'FRA-2025-CSP-000518.pdf',
  'CL-2026-44-000079-N.pdf',
  'SYC-SFA-10-2025-SW0454.pdf'
]

// Simulated Catch Certificate filenames for non-D variants.
// Format follows EU Reg 1005/2008 / UK retained law: CATCH.CC.<flag-state ISO-3>.<year>.<seq>
const simulatedCatchCertPool = [
  'CATCH.CC.IS.2025.0847.pdf',  // Iceland
  'CATCH.CC.NO.2025.1193.pdf',  // Norway
  'CATCH.CC.FO.2025.3381.pdf',  // Faroe Islands
  'CATCH.CC.MA.2026.0042.pdf',  // Morocco
  'CATCH.CC.MR.2026.0284.pdf'   // Mauritania
]

const scenarioDProcessingStatementReferences = [
  'ESP.SGCI.AI.2025.944',
  'FRA-2025-CSP-000472',
  'FRA-2025-CSP-000518',
  'CL-2026-44-000079-N'
]

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
  req.session.data['submission-kind'] = req.session.data['extraction-variant'] === 'c' ? 'iuu' : 'import'
  res.redirect('/confirmation')
})

// =======================================================
// Document Upload & Extraction Journey
// =======================================================

// -------------------------------------------------------
// Upload guidance — store extraction variant from query param
// -------------------------------------------------------
router.get('/upload-guidance', (req, res, next) => {
  if (req.query.variant) {
    req.session.data['extraction-variant'] = req.query.variant
  }
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
  const variant = data['extraction-variant'] || 'a'
  const scenarioPrefix = variant === 'b' ? 'scenario-b' : 'scenario-a'

  data[scenarioPrefix + '-catch-certificate-reference'] = data['catch-certificate-reference'] || ''

  const catchFieldKey = scenarioPrefix + '-catch-fields'
  let updatedCatchFields = data[catchFieldKey]
  updatedCatchFields = upsertSummaryField(updatedCatchFields, 'Catch certificate number', data['catch-certificate-number'])
  updatedCatchFields = upsertSummaryField(updatedCatchFields, 'Vessel name(s), flag(s), validation date(s)', data['vessel-validation-summary'])
  updatedCatchFields = upsertSummaryField(updatedCatchFields, 'Catch description', data['catch-description'])
  data[catchFieldKey] = updatedCatchFields

  if (variant === 'b') {
    return res.redirect('/review-extraction-b')
  }

  return res.redirect('/review-extraction-a')
})

router.get('/change-extracted-details', (req, res) => {
  const returnTo = req.query.returnTo
  const normalizedReturnTo = typeof returnTo === 'string' && returnTo.startsWith('/') ? returnTo : '/review-extraction-a'
  req.session.data['change-extracted-details-return-to'] = normalizedReturnTo
  seedReviewSummaryData(req.session.data)
  applyReviewExtractionViewModel(req.session.data)
  res.render('change-extracted-details')
})

router.post('/change-extracted-details', (req, res) => {
  const data = req.session.data
  seedReviewSummaryData(data)
  applyReviewExtractionViewModel(data)
  const returnTo = data['change-extracted-details-return-to'] || '/review-extraction-a'
  delete data['change-extracted-details-return-to']
  res.redirect(returnTo)
})

// -------------------------------------------------------
// Review extraction — Variant A (high confidence)
// -------------------------------------------------------
router.post('/review-extraction-a', (req, res) => {
  res.redirect('/declaration')
})

// -------------------------------------------------------
// Review extraction — Variant B (partial)
// -------------------------------------------------------
router.post('/review-extraction-b', (req, res) => {
  res.redirect('/declaration')
})

// -------------------------------------------------------
// Review extraction — Variant C (failed)
// -------------------------------------------------------
router.post('/review-extraction-c', (req, res) => {
  res.redirect('/declaration')
})

// -------------------------------------------------------
// Review extraction — Variant D (cross-document validation failed)
// -------------------------------------------------------
router.post('/review-extraction-d', (req, res) => {
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
