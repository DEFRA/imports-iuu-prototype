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

const listSampleDocumentFiles = () => {
  if (!fs.existsSync(sampleDocumentsPath)) {
    return []
  }

  return fs.readdirSync(sampleDocumentsPath)
    .filter((filename) => !filename.startsWith('.'))
    .sort()
}

const isCatchCertificateFile = (filename) => filename.toUpperCase().includes('CATCH.CC')

const isProcessingStatementFile = (filename) => filename.toUpperCase().includes('CATCH.PS')

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
  res.redirect('/species-details')
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
    res.redirect('/catch-certificates')
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
router.post('/catch-certificates', (req, res) => {
  const data = req.session.data
  const body = req.body || {}
  const action = body.action
  const getField = (name) => body[name] !== undefined ? body[name] : data[name]

  if (!Array.isArray(data['catch-certificates'])) {
    data['catch-certificates'] = []
  }

  // Simulate a file upload by using the reference number as the filename
  const ref = getField('catch-certificate-ref')
  let certificateSaved = false

  if (ref) {
    data['catch-certificates'].push({
      filename: ref + '.pdf',
      reference: ref,
      tripId: getField('catch-certificate-trip-id'),
      vesselName: getField('cc-vessel-name'),
      vesselFlag: getField('cc-vessel-flag'),
      vesselIMO: getField('cc-vessel-imo'),
      species: getField('catch-certificate-species'),
      declaredVolume: getField('cc-declared-volume')
    })
    certificateSaved = true
  }

  if (certificateSaved) {
    // Clear upload fields only after successful save
    delete data['catch-certificate-ref']
    delete data['catch-certificate-trip-id']
    delete data['cc-vessel-name']
    delete data['cc-vessel-flag']
    delete data['cc-vessel-imo']
    delete data['catch-certificate-species']
    delete data['cc-declared-volume']
  }

  const wantsAnother = action === 'upload-another' || body['upload-another'] === 'true'

  // Do not progress until at least one certificate entry has been saved
  if (!certificateSaved) {
    return res.redirect('/catch-certificates')
  }

  if (wantsAnother) {
    res.redirect('/catch-certificates')
  } else {
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
  const getField = (name) => body[name] !== undefined ? body[name] : data[name]

  if (!Array.isArray(data['processing-statement'])) {
    data['processing-statement'] = []
  }

  const ref = getField('processing-statement-ref')
  let statementSaved = false

  if (ref) {
    const selectedCertificate = (data['catch-certificates'] || []).find((cc) => cc.reference === getField('ps-cc-reference'))
    const landedWeight = getField('ps-landed-weight') || (selectedCertificate ? selectedCertificate.declaredVolume : '')

    data['processing-statement'].push({
      filename: ref + '.pdf',
      reference: ref,
      ccReference: getField('ps-cc-reference'),
      plantName: getField('processing-plant-name'),
      plantApproval: getField('processing-plant-approval'),
      landedWeight,
      productWeight: getField('ps-product-weight')
    })
    statementSaved = true
  }

  if (statementSaved) {
    delete data['processing-statement-ref']
    delete data['ps-cc-reference']
    delete data['processing-plant-name']
    delete data['processing-plant-approval']
    delete data['ps-landed-weight']
    delete data['ps-product-weight']
  }

  const wantsAnother = action === 'upload-another' || body['upload-another'] === 'true'
  if (!statementSaved) {
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
  res.redirect('/check-answers')
})

router.post('/non-manipulation-declaration', (req, res) => {
  const data = req.session.data
  const body = req.body || {}
  const action = body.action
  const getField = (name) => body[name] !== undefined ? body[name] : data[name]

  if (!Array.isArray(data['non-manipulation-documents'])) {
    data['non-manipulation-documents'] = []
  }

  const ref = getField('nmd-ref')
  let nmdSaved = false

  if (ref) {
    const selectedCertificate = (data['catch-certificates'] || []).find((cc) => cc.reference === getField('nmd-cc-reference'))
    const weightIn = getField('nmd-weight-in') || (selectedCertificate ? selectedCertificate.declaredVolume : '')
    const weightOut = getField('nmd-weight-out') || weightIn

    data['non-manipulation-documents'].push({
      filename: ref + '.pdf',
      reference: ref,
      ccReference: getField('nmd-cc-reference'),
      storageCountry: getField('nmd-storage-country'),
      facilityName: getField('nmd-facility-name'),
      facilityApproval: getField('nmd-facility-approval'),
      storageConditions: getField('storage-conditions'),
      weightIn,
      weightOut,
      arrivalDate: [getField('nmd-arrival-day'), getField('nmd-arrival-month'), getField('nmd-arrival-year')].filter(Boolean).join('/'),
      arrivalTime: [getField('nmd-arrival-hour'), getField('nmd-arrival-minute')].filter(Boolean).join(':'),
      departureDate: [getField('nmd-departure-day'), getField('nmd-departure-month'), getField('nmd-departure-year')].filter(Boolean).join('/'),
      departureTime: [getField('nmd-departure-hour'), getField('nmd-departure-minute')].filter(Boolean).join(':')
    })
    nmdSaved = true
  }

  if (nmdSaved) {
    delete data['nmd-ref']
    delete data['nmd-cc-reference']
    delete data['nmd-storage-country']
    delete data['nmd-facility-name']
    delete data['nmd-facility-approval']
    delete data['storage-conditions']
    delete data['nmd-weight-in']
    delete data['nmd-weight-out']
    delete data['nmd-arrival-day']
    delete data['nmd-arrival-month']
    delete data['nmd-arrival-year']
    delete data['nmd-arrival-hour']
    delete data['nmd-arrival-minute']
    delete data['nmd-departure-day']
    delete data['nmd-departure-month']
    delete data['nmd-departure-year']
    delete data['nmd-departure-hour']
    delete data['nmd-departure-minute']
  }

  const wantsAnother = action === 'upload-another' || body['upload-another'] === 'true'
  if (!nmdSaved) {
    return res.redirect('/non-manipulation-declaration')
  }

  if (wantsAnother) {
    res.redirect('/non-manipulation-declaration')
  } else {
    res.redirect('/check-answers')
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
router.post('/sign-in', (req, res) => {
  res.redirect('/upload-documents')
})

// -------------------------------------------------------
// Upload documents — handle remove actions and continue
// -------------------------------------------------------
router.get('/upload-documents', (req, res, next) => {
  const data = req.session.data
  const remove = req.query.remove
  const removeCertIndex = parseInt(req.query['remove-cert'], 10)

  if (!isNaN(removeCertIndex) && Array.isArray(data['catch-cert-uploaded-files'])) {
    data['catch-cert-uploaded-files'].splice(removeCertIndex, 1)
    if (data['catch-cert-uploaded-files'].length === 0) {
      delete data['catch-cert-uploaded']
      delete data['catch-cert-filename']
      delete data['catch-cert-uploaded-files']
    } else {
      data['catch-cert-filename'] = data['catch-cert-uploaded-files'][0]
    }
  } else if (remove === 'catch-cert') {
    delete data['catch-cert-uploaded']
    delete data['catch-cert-filename']
    delete data['catch-cert-uploaded-files']
  } else if (remove === 'processing-statement') {
    delete data['processing-statement-uploaded']
    delete data['processing-statement-filename']
  } else if (remove === 'nmd') {
    delete data['nmd-uploaded']
    delete data['nmd-filename']
  }
  next()
})

router.post('/upload-documents', (req, res) => {
  const data = req.session.data
  const variant = data['extraction-variant'] || 'a'
  const existingCerts = Array.isArray(data['catch-cert-uploaded-files']) ? data['catch-cert-uploaded-files'] : []

  // ── "Continue" — simulate all three documents and proceed ─────────────────
  const sampleDocumentFiles = listSampleDocumentFiles()
  const defaultProcessingStatementFile = sampleDocumentFiles.find((filename) => filename.startsWith('CATCH.PS.PT.2026.0001149')) ||
    sampleDocumentFiles.find(isProcessingStatementFile)

  // Simulate file upload state — mark each document as uploaded
  // (actual file upload is not processed server-side in this prototype)
  if (existingCerts.length === 0) {
    if (variant === 'd') {
      data['catch-cert-uploaded-files'] = [...scenarioDCatchCertificateFiles]
    } else {
      data['catch-cert-uploaded-files'] = [...simulatedCatchCertPool]
    }
    data['catch-cert-uploaded'] = true
    data['catch-cert-filename'] = data['catch-cert-uploaded-files'][0]
  }

  if (!data['processing-statement-uploaded']) {
    data['processing-statement-uploaded'] = true
    data['processing-statement-filename'] = variant === 'd'
      ? 'CATCH.PS.PT.2026.0001149 (Exp. 0125-26-GB).pdf'
      : 'processing-statement-PS-IS-2025-00847.pdf'
  }
  if (!data['nmd-uploaded']) {
    data['nmd-uploaded'] = true
    data['nmd-filename'] = 'non-manipulation-declaration-NMD-IS-2025-0419.pdf'
  }

  res.redirect('/processing')
})

// -------------------------------------------------------
// Processing — route to the correct review variant
// -------------------------------------------------------
router.post('/processing', (req, res) => {
  const variant = req.session.data['extraction-variant'] || 'a'
  const data = req.session.data

  if (variant === 'd') {
    const catchCertificateFiles = data['catch-cert-uploaded-files'] || scenarioDCatchCertificateFiles
    const processingStatementFile = data['processing-statement-filename'] || 'CATCH.PS.PT.2026.0001149 (Exp. 0125-26-GB).pdf'

    const catchCertificateReferenceEntries = buildCatchCertificateReferenceEntries(catchCertificateFiles)
    data['validation-catch-certificate-files'] = catchCertificateFiles
    data['validation-processing-statement-file'] = processingStatementFile
    data['uploaded-catch-certificate-references'] = catchCertificateReferenceEntries.map((entry) => entry.reference)
    data['processing-statement-catch-certificate-references'] = scenarioDProcessingStatementReferences
    data['missing-catch-certificate-references'] = getMissingValues(
      data['uploaded-catch-certificate-references'],
      data['processing-statement-catch-certificate-references']
    )
    data['missing-catch-certificate-reference-entries'] = catchCertificateReferenceEntries
      .filter((entry) => data['missing-catch-certificate-references'].includes(entry.reference))
    data['catch-certificate-validation-results'] = catchCertificateReferenceEntries.map((entry) => ({
      filename: entry.filename,
      reference: entry.reference,
      status: data['processing-statement-catch-certificate-references'].includes(entry.reference) ? 'Matched' : 'Missing'
    }))
  }

  res.redirect('/review-extraction-' + variant)
})

// -------------------------------------------------------
// Review extraction — Variant A (high confidence)
// -------------------------------------------------------
router.post('/review-extraction-a', (req, res) => {
  res.redirect('/upload-confirmation')
})

// -------------------------------------------------------
// Review extraction — Variant B (partial)
// -------------------------------------------------------
router.post('/review-extraction-b', (req, res) => {
  res.redirect('/upload-confirmation')
})

// -------------------------------------------------------
// Review extraction — Variant C (failed)
// -------------------------------------------------------
router.post('/review-extraction-c', (req, res) => {
  res.redirect('/upload-confirmation')
})

// -------------------------------------------------------
// Review extraction — Variant D (cross-document validation failed)
// -------------------------------------------------------
router.post('/review-extraction-d', (req, res) => {
  res.redirect('/upload-documents')
})
