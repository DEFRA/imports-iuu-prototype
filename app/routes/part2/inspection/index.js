const {
  buildInspectionNotifications,
  getInspectionNotificationByReference,
  inspectionReference
} = require('./notifications')

const inspectionViewPathLookup = {
  inspections: 'dashboard/inspections',
  'inspections-completed': 'dashboard/inspections-completed',
  'consignment-overview': 'case/consignment-overview',
  'source-documents': 'case/source-documents',
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

const renderInspectionPage = (res, viewName, errors = []) => {
  res.render(inspectionView(viewName), buildInspectionErrorContext(errors))
}

const renderInspectionNotImplementedPage = (res) => {
  res.render(inspectionView('inspection-not-implemented'))
}

const registerInspectionRoutes = (router) => {
  router.get('/prototype-selector', (req, res) => {
    res.redirect('/')
  })

  router.get('/inspections', (req, res) => {
    req.session.data['inspection-officer-name'] = req.session.data['inspection-officer-name'] || 'Alex Morgan'
    req.session.data['inspection-officer-org'] = req.session.data['inspection-officer-org'] || 'Port of Felixstowe Port Health Authority'
    const inspectionNotifications = buildInspectionNotifications()
    res.render(inspectionView('inspections'), {
      inspectionNotifications,
      toInspectCount: inspectionNotifications.length
    })
  })

  router.get('/inspections/completed', (req, res) => {
    res.render(inspectionView('inspections-completed'))
  })

  router.get('/inspection/:reference', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    const inspectionNotification = getInspectionNotificationByReference(inspectionReference)
    res.render(inspectionView('consignment-overview'), { inspectionNotification })
  })

  router.get('/inspection/:reference/documents', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    res.render(inspectionView('source-documents'))
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
    res.render(inspectionView('check-documents'))
  })

  router.post('/inspection/:reference/check-documents', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    const data = req.session.data
    const result = data['documents-check-result']
    const details = data['documents-discrepancy-details']
    const errors = []
    if (!result) errors.push({ name: 'documents-check-result', text: 'Select the documentary check result' })
    if ((result === 'minor-discrepancy' || result === 'not-acceptable') && !details) {
      errors.push({ name: 'documents-discrepancy-details', text: 'Describe the discrepancy' })
    }
    if (errors.length) return renderInspectionPage(res, 'check-documents', errors)
    res.redirect(`/inspection/${inspectionReference}/identity-checks`)
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
    res.render(inspectionView('check-record'))
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
      ])
    }
    res.redirect(`/inspection/${inspectionReference}/confirmation`)
  })

  router.get('/inspection/:reference/confirmation', (req, res) => {
    if (req.params.reference !== inspectionReference) {
      return renderInspectionNotImplementedPage(res)
    }
    res.render(inspectionView('inspection-confirmation'))
  })
}

module.exports = registerInspectionRoutes
