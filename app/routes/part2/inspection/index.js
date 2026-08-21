const {
  getInspectionNotificationByReference,
  inspectionReference
} = require('./notifications')
const { buildInspectionDashboardViewModel } = require('./services/inspection-dashboard-service')
const inspectionOverviewFallbackReference = 'GB-IUU-2026-11001'
const path = require('path')
const documentNavigationService = require('./document-navigation-service')
const sampleDocumentsPath = path.join(__dirname, '..', '..', '..', '..', 'sample-documents')

const inspectionViewPathLookup = {
  inspections: 'dashboard/inspections',
  'inspections-completed': 'dashboard/inspections-completed',
  'consignment-overview': 'case/consignment-overview',
  'source-documents': 'case/source-documents',
  'document-details': 'case/document-details',
  'additional-document-viewer': 'case/additional-document-viewer',
  'confirm-details': 'journey/confirm-details',
  'check-documents': 'journey/check-documents',
  'identity-checks': 'journey/identity-checks',
  'physical-checks': 'journey/physical-checks',
  findings: 'journey/findings',
  outcome: 'journey/outcome',
  'check-record': 'journey/check-record',
  'inspection-confirmation': 'journey/inspection-confirmation',
  'inspection-not-implemented': 'support/inspection-not-implemented',
  'prototype-assumptions': 'support/prototype-assumptions'
}

const inspectionView = (viewName) => {
  const inspectionViewPath = inspectionViewPathLookup[viewName]

  if (!inspectionViewPath) {
    throw new Error(`Unknown inspection view name: ${viewName}`)
  }

  return `part2/inspection/${inspectionViewPath}`
}

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

const renderInspectionPage = (res, viewName, errors = [], context = {}) => {
  res.render(inspectionView(viewName), {
    ...buildInspectionErrorContext(errors),
    ...context
  })
}

const renderInspectionNotImplementedPage = (res) => {
  res.render(inspectionView('inspection-not-implemented'))
}

const buildInspectionOverviewNotification = (reference) => {
  const matchedNotification = getInspectionNotificationByReference(reference)
  if (matchedNotification) return matchedNotification

  if (reference === inspectionOverviewFallbackReference) {
    const inspectionNotification = getInspectionNotificationByReference(inspectionReference)
    if (!inspectionNotification) return null
    return {
      ...inspectionNotification,
      reference
    }
  }

  return null
}

const registerInspectionRoutes = (router) => {
  router.get('/prototype-selector', (req, res) => {
    res.redirect('/')
  })

  router.get('/inspections', (req, res) => {
    req.session.data['inspection-officer-name'] = req.session.data['inspection-officer-name'] || 'Alex Morgan'
    req.session.data['inspection-officer-org'] = req.session.data['inspection-officer-org'] || 'Port of Felixstowe Port Health Authority'
    const documentaryDashboardStatus = req.session.data['documentary-dashboard-status']
    const statusOverrides = documentaryDashboardStatus
      ? { [inspectionReference]: documentaryDashboardStatus }
      : {}
    const dashboardViewModel = buildInspectionDashboardViewModel(req.query, new Date(), statusOverrides)
    res.render(inspectionView('inspections'), dashboardViewModel)
  })

  router.get('/inspections/completed', (req, res) => {
    res.render(inspectionView('inspections-completed'))
  })

  router.get('/inspection/:reference', (req, res) => {
    const inspectionNotification = buildInspectionOverviewNotification(req.params.reference)
    if (!inspectionNotification) {
      return renderInspectionNotImplementedPage(res)
    }
    res.render(inspectionView('consignment-overview'), {
      inspectionNotification,
      documentReferenceGroups: documentNavigationService.getReferenceGroups(),
      documentLinksByReference: documentNavigationService.getDocumentLinksByReference()
    })
  })

  router.get('/inspection/:reference/documents', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    const inspectionNotification = getInspectionNotificationByReference(inspectionReference)
    res.render(inspectionView('source-documents'), {
      inspectionReference,
      documentReferenceGroups: documentNavigationService.getReferenceGroups(),
      documentLinksByReference: documentNavigationService.getDocumentLinksByReference(),
      commodityWeightComparisons: inspectionNotification.commodityWeightComparisons
    })
  })

  router.get('/documents/:type/:id', (req, res) => {
    if (req.params.type === 'additional') {
      const selectedDocument = documentNavigationService.getAdditionalDocument(req.params.id)
      if (!selectedDocument) return res.status(404).render(inspectionView('inspection-not-implemented'))
      return res.render(inspectionView('additional-document-viewer'), {
        inspectionReference,
        additionalDocuments: documentNavigationService.getAdditionalDocuments(),
        selectedDocument
      })
    }
    const document = documentNavigationService.getDocument(req.params.type, req.params.id)
    if (!document) return res.status(404).render(inspectionView('inspection-not-implemented'))
    res.render(inspectionView('document-details'), {
      document,
      documentLinksByReference: documentNavigationService.getDocumentLinksByReference()
    })
  })

  router.get('/documents/additional/file/:id', (req, res) => {
    const document = documentNavigationService.getAdditionalDocument(req.params.id)
    if (!document || document.previewType !== 'pdf' || !document.sourceFile) return res.sendStatus(404)
    const filePath = path.join(sampleDocumentsPath, document.sourceFile)
    if (req.query.download === '1') return res.download(filePath, document.name)
    res.sendFile(filePath)
  })

  router.get('/inspection-assumptions', (req, res) => {
    res.render(inspectionView('prototype-assumptions'))
  })

  router.get('/inspection/:reference/confirm-details', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    const inspectionNotification = getInspectionNotificationByReference(inspectionReference)
    const data = req.session.data
    data['inspection-location'] = data['inspection-location'] || 'Port of Felixstowe - inspection bay 2'
    data['inspection-date-day'] = data['inspection-date-day'] || String(inspectionNotification.arrivalDate.getUTCDate())
    data['inspection-date-month'] = data['inspection-date-month'] || String(inspectionNotification.arrivalDate.getUTCMonth() + 1)
    data['inspection-date-year'] = data['inspection-date-year'] || String(inspectionNotification.arrivalDate.getUTCFullYear())
    data['inspection-lead-officer'] = data['inspection-lead-officer'] || 'Alex Morgan'
    res.render(inspectionView('confirm-details'))
  })

  router.post('/inspection/:reference/confirm-details', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    const data = req.session.data
    const errors = []
    if (!data['inspection-location']) errors.push({ name: 'inspection-location', text: 'Enter the inspection location' })
    if (!data['inspection-date-day'] || !data['inspection-date-month'] || !data['inspection-date-year']) {
      errors.push({ name: 'inspection-date-day', text: 'Enter the inspection date' })
    }
    if (!data['inspection-lead-officer']) errors.push({ name: 'inspection-lead-officer', text: 'Enter the lead inspecting officer' })
    if (errors.length) return renderInspectionPage(res, 'confirm-details', errors)
    res.redirect(`/inspection/${inspectionReference}/check-documents`)
  })

  router.get('/inspection/:reference/check-documents', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    res.render(inspectionView('check-documents'), { inspectionReference })
  })

  router.post('/inspection/:reference/check-documents', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    const data = req.session.data
    const outcome = data['documentary-check-outcome']
    const comments = data['documentary-check-comments']
    const intervention = data['documentary-intervention']
    const errors = []
    if (!outcome) errors.push({ name: 'documentary-check-outcome', text: 'Select the documentary check outcome' })
    if (outcome === 'satisfactory' && !comments) errors.push({ name: 'documentary-check-comments', text: 'Enter comments' })
    if (outcome === 'requires-intervention' && !intervention) errors.push({ name: 'documentary-intervention', text: 'Select an intervention' })
    if (errors.length) {
      return renderInspectionPage(res, 'check-documents', errors, { inspectionReference })
    }
    const dashboardStatuses = {
      satisfactory: { statusCode: 'COMPLETED', statusLabel: 'Satisfactory', statusTagClass: 'govuk-tag--green' },
      'satisfactory-following-intervention': { statusCode: 'COMPLETED', statusLabel: 'Satisfactory following intervention', statusTagClass: 'govuk-tag--green' },
      'not-satisfactory': { statusCode: 'REQUIRES_DOCUMENT_CHECK', statusLabel: 'Not satisfactory', statusTagClass: 'govuk-tag--red' }
    }
    const interventionStatuses = {
      'request-information': { statusCode: 'REQUEST_ADDITIONAL_INFORMATION' },
      'referred-to-mmo': { statusCode: 'REFERRED_TO_MMO' }
    }
    data['documentary-dashboard-status'] = outcome === 'requires-intervention'
      ? interventionStatuses[intervention]
      : dashboardStatuses[outcome]
    res.redirect('/inspections')
  })

  router.get('/inspection/:reference/identity-checks', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    res.render(inspectionView('identity-checks'))
  })

  router.post('/inspection/:reference/identity-checks', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
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
    if (errors.length) return renderInspectionPage(res, 'identity-checks', errors)
    res.redirect(`/inspection/${inspectionReference}/physical-checks`)
  })

  router.get('/inspection/:reference/physical-checks', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    res.render(inspectionView('physical-checks'))
  })

  router.post('/inspection/:reference/physical-checks', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    const data = req.session.data
    const result = data['physical-check-result']
    const notCompletedReason = data['physical-not-completed-reason']
    const errors = []
    if (!result) errors.push({ name: 'physical-check-result', text: 'Select the result of the physical checks' })
    if (result === 'not-completed' && !notCompletedReason) {
      errors.push({ name: 'physical-not-completed-reason', text: 'Enter why physical checks were not completed' })
    }
    if (errors.length) return renderInspectionPage(res, 'physical-checks', errors)
    res.redirect(`/inspection/${inspectionReference}/findings`)
  })

  router.get('/inspection/:reference/findings', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    res.render(inspectionView('findings'))
  })

  router.post('/inspection/:reference/findings', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    const data = req.session.data
    const finding = data['inspection-finding']
    const notes = data['inspection-finding-notes']
    const evidence = data['inspection-evidence-considered']
    const errors = []
    if (!finding) errors.push({ name: 'inspection-finding', text: 'Select what the inspection found' })
    if (!notes) errors.push({ name: 'inspection-finding-notes', text: 'Enter inspection notes' })
    if (!evidence) errors.push({ name: 'inspection-evidence-considered', text: 'Summarise evidence considered' })
    if (errors.length) return renderInspectionPage(res, 'findings', errors)
    res.redirect(`/inspection/${inspectionReference}/outcome`)
  })

  router.get('/inspection/:reference/outcome', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    res.render(inspectionView('outcome'))
  })

  router.post('/inspection/:reference/outcome', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
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
    if (errors.length) return renderInspectionPage(res, 'outcome', errors)
    res.redirect(`/inspection/${inspectionReference}/check-record`)
  })

  router.get('/inspection/:reference/check-record', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    res.render(inspectionView('check-record'), { inspectionReference })
  })

  router.post('/inspection/:reference/check-record', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    const data = req.session.data
    if (data['inspection-record-confirmed'] !== 'yes') {
      delete data['inspection-record-confirmed']
      return renderInspectionPage(res, 'check-record', [
        { name: 'inspection-record-confirmed', text: 'Confirm that the inspection record is complete and accurate to the best of your knowledge' }
      ], { inspectionReference })
    }
    res.redirect(`/inspection/${inspectionReference}/confirmation`)
  })

  router.get('/inspection/:reference/confirmation', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    res.render(inspectionView('inspection-confirmation'), { inspectionReference })
  })
}

module.exports = registerInspectionRoutes
