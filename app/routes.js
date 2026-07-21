//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.use((req, res, next) => {
  res.locals.showBackLink = req.path !== '/' && req.path !== '/confirmation'
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
