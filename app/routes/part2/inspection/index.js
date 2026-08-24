const {
  getInspectionNotificationByReference,
  inspectionReference
} = require('./notifications')
const { buildInspectionDashboardViewModel } = require('./services/inspection-dashboard-service')
const { mockConsignmentSummariesApi } = require('./mock-api/consignment-summaries-api')
const inspectionOverviewFallbackReference = 'GB-IUU-2026-11002'
const path = require('path')
const documentNavigationService = require('./document-navigation-service')
const sampleDocumentsPath = path.join(__dirname, '..', '..', '..', '..', 'sample-documents')

const inspectionViewPathLookup = {
  inspections: 'dashboard/inspections',
  'inspections-completed': 'dashboard/inspections-completed',
  'consignment-overview': 'case/consignment-overview',
  'consignment-overview-11002': 'case/consignment-overview-11002',
  'source-documents': 'case/source-documents',
  'document-details': 'case/document-details',
  'additional-document-viewer': 'case/additional-document-viewer',
  'confirm-details': 'journey/confirm-details',
  'check-documents': 'journey/check-documents',
  'documentary-check-confirmation': 'journey/documentary-check-confirmation',
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

const formatDashboardDate = (date) => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
}).format(date)

const formatCommodityCode = (code) => String(code)
  .replace(/^(\d{4})(\d{2})(\d{2})$/, '$1 $2 $3')
  .replace(/^(\d{4})(\d{2})$/, '$1 $2')

const buildInspectionOverviewNotification = (reference) => {
  const matchedNotification = getInspectionNotificationByReference(reference)
  if (matchedNotification) return matchedNotification

  if (reference === inspectionOverviewFallbackReference) {
    const dashboardConsignment = mockConsignmentSummariesApi
      .listConsignmentSummaries()
      .find((consignment) => consignment.reference === reference)
    if (!dashboardConsignment) return null
    return {
      reference: dashboardConsignment.reference,
      importer: dashboardConsignment.importer,
      exportingCountry: dashboardConsignment.originCountry,
      port: dashboardConsignment.port,
      containerNumber: dashboardConsignment.containerNumber,
      vesselName: dashboardConsignment.vesselName,
      arrivalDateDisplay: formatDashboardDate(dashboardConsignment.estimatedArrival),
      arrivalTime: dashboardConsignment.arrivalTime,
      commodities: [{
        description: dashboardConsignment.species,
        commodityCode: dashboardConsignment.commodityCodes.map(formatCommodityCode).join(', '),
        declaredQuantity: new Intl.NumberFormat('en-GB').format(dashboardConsignment.declaredWeightKg) + ' kg'
      }],
      warningText: dashboardConsignment.warningText,
      riskFlags: [
        { status: 'Issue', label: 'Weight Mismatch', details: 'Mismatch with declared weight and supplied evidence' },
        { status: 'Issue', label: 'Missing Evidence', details: 'Missing Evidence' }
      ],
      commodityWeightComparisons: [{
        description: dashboardConsignment.species,
        commodityCode: dashboardConsignment.commodityCodes.map(formatCommodityCode).join(', '),
        notificationWeight: '360,000 kg',
        catchCertificateWeight: '360,000 kg',
        processingStatementWeight: '296,000 kg',
        nonManipulationDeclarationWeight: 'Not supplied'
      }],
      documentEvidenceSummary: [
        { title: 'Catch certificates', status: 'Received', statusClass: 'govuk-tag--green', panelClass: 'document-evidence-summary__panel--received', details: '4 documents supplied.' },
        { title: 'Processing statement', status: 'Review needed', statusClass: 'govuk-tag--yellow', panelClass: 'document-evidence-summary__panel--review', details: '1 document supplied. 1 catch certificate is not referenced.' },
        { title: 'Non-manipulation declaration', status: 'Not applicable', statusClass: 'govuk-tag--grey', panelClass: 'document-evidence-summary__panel--received', details: 'No NMD expected for this scenario.' },
        { title: 'Notification to document comparison', status: 'Possible mismatch', statusClass: 'govuk-tag--yellow', panelClass: 'document-evidence-summary__panel--review', details: 'Weight and evidence reconciliation require review.' }
      ],
      assessmentSummary: dashboardConsignment.assessmentSummary,
      documentCounts: {
        'catch-certificate': dashboardConsignment.catchCertificateCount,
        'processing-statement': dashboardConsignment.processingStatementCount,
        nmd: dashboardConsignment.nmdCount,
        additional: dashboardConsignment.additionalDocumentCount
      }
    }
  }

  return null
}

const buildOverviewEvidenceSections = (inspectionNotification, documentReferenceGroups, documentLinksByReference) => {
  const sectionDefinitions = [
    { type: 'catch-certificate', heading: 'Catch certificate', notificationType: 'Catch certificates' },
    { type: 'processing-statement', heading: 'Processing statement', notificationType: 'Processing statements' },
    { type: 'nmd', heading: 'Non manipulation document', notificationType: 'Non-manipulation declarations' },
    { type: 'additional', heading: 'Additional documents', notificationType: 'Additional documents' }
  ]

  return sectionDefinitions.map((sectionDefinition) => {
    const group = documentReferenceGroups.find((item) => item.type === sectionDefinition.type) || { count: 0, links: [] }
    const notificationDocument = (inspectionNotification.documents || [])
      .find((item) => item.type === sectionDefinition.notificationType) || { count: 0, references: [] }
    const linkedReferences = group.links || []
    const knownReferences = new Set(linkedReferences.map((reference) => reference.text))
    const additionalReferences = (notificationDocument.references || [])
      .filter((reference) => !knownReferences.has(reference))
      .map((reference) => documentLinksByReference[reference] || {
        text: reference
      })

    return {
      type: sectionDefinition.type,
      heading: sectionDefinition.heading,
      count: typeof group.count === 'number' ? group.count : (notificationDocument.count || 0),
      references: [...linkedReferences, ...additionalReferences]
    }
  })
}

const registerInspectionRoutes = (router) => {
  router.get('/prototype-selector', (req, res) => {
    res.redirect('/')
  })

  router.get('/inspections', (req, res) => {
    req.session.data['inspection-officer-name'] = req.session.data['inspection-officer-name'] || 'Alex Morgan'
    req.session.data['inspection-officer-org'] = req.session.data['inspection-officer-org'] || 'Port of Felixstowe Port Health Authority'
    const documentaryDashboardStatus = req.session.data['documentary-dashboard-status']
    const documentaryDashboardReference = req.session.data['documentary-dashboard-reference'] || inspectionReference
    const statusOverrides = documentaryDashboardStatus
      ? { [documentaryDashboardReference]: documentaryDashboardStatus }
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
    const overviewViewName = req.params.reference === inspectionOverviewFallbackReference
      ? 'consignment-overview-11002'
      : 'consignment-overview'
    const documentLinksByReference = documentNavigationService.getDocumentLinksByReference()
    const documentReferenceGroups = documentNavigationService.getReferenceGroups(req.params.reference).map((group) => ({
      ...group,
      count: inspectionNotification.documentCounts?.[group.type] ?? group.links.length,
      links: inspectionNotification.documentCounts
        ? group.links.slice(0, inspectionNotification.documentCounts[group.type])
        : group.links
    }))
    res.render(inspectionView(overviewViewName), {
      inspectionNotification,
      documentReferenceGroups,
      documentLinksByReference,
      overviewEvidenceSections: buildOverviewEvidenceSections(
        inspectionNotification,
        documentReferenceGroups,
        documentLinksByReference
      )
    })
  })

  router.get('/inspection/:reference/documents', (req, res) => {
    const inspectionNotification = buildInspectionOverviewNotification(req.params.reference)
    if (!inspectionNotification) {
      return renderInspectionNotImplementedPage(res)
    }
    res.render(inspectionView('source-documents'), {
      inspectionReference: req.params.reference,
      documentReferenceGroups: documentNavigationService.getReferenceGroups(req.params.reference),
      documentLinksByReference: documentNavigationService.getDocumentLinksByReference(),
      commodityWeightComparisons: inspectionNotification.commodityWeightComparisons,
      assessmentSummary: inspectionNotification.assessmentSummary
    })
  })

  router.get('/documents/file/:id', (req, res) => {
    const document = documentNavigationService.getDocumentById(req.params.id)
    if (!document?.sourceFile) return res.sendStatus(404)
    res.sendFile(path.join(sampleDocumentsPath, document.sourceFile))
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
      document: {
        ...document,
        originalFileUrl: document.sourceFile
          ? `/documents/file/${encodeURIComponent(document.id)}`
          : undefined
      },
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
    const inspectionNotification = buildInspectionOverviewNotification(req.params.reference)
    if (!inspectionNotification) {
      return renderInspectionNotImplementedPage(res)
    }
    res.render(inspectionView('check-documents'), {
      inspectionReference: req.params.reference,
      inspectionNotification,
      documentReferenceGroups: documentNavigationService.getReferenceGroups(req.params.reference),
      documentLinksByReference: documentNavigationService.getDocumentLinksByReference()
    })
  })

  router.post('/inspection/:reference/check-documents', (req, res) => {
    if (!buildInspectionOverviewNotification(req.params.reference)) {
      return renderInspectionNotImplementedPage(res)
    }
    const data = req.session.data
    const outcome = data['documentary-check-outcome']
    const intervention = data['documentary-intervention']
    const errors = []
    if (!outcome) errors.push({ name: 'documentary-check-outcome', text: 'Select the documentary check outcome' })
    if (outcome === 'requires-intervention' && !intervention) errors.push({ name: 'documentary-intervention', text: 'Select an intervention action' })
    if (errors.length) {
      const inspectionNotification = buildInspectionOverviewNotification(req.params.reference)
      return renderInspectionPage(res, 'check-documents', errors, {
        inspectionReference: req.params.reference,
        inspectionNotification,
        documentReferenceGroups: documentNavigationService.getReferenceGroups(req.params.reference),
        documentLinksByReference: documentNavigationService.getDocumentLinksByReference()
      })
    }
    const dashboardStatuses = {
      satisfactory: { statusCode: 'COMPLETED', statusLabel: 'Satisfactory', statusTagClass: 'govuk-tag--green' },
      'satisfactory-following-intervention': { statusCode: 'COMPLETED', statusLabel: 'Satisfactory following intervention', statusTagClass: 'govuk-tag--green' },
      'not-satisfactory': { statusCode: 'REQUIRES_DOCUMENT_CHECK', statusLabel: 'Not satisfactory', statusTagClass: 'govuk-tag--red' }
    }
    const interventionStatuses = {
      'request-information': { statusCode: 'REQUEST_ADDITIONAL_INFORMATION', statusLabel: 'Request Additional Information from Importer', statusTagClass: 'govuk-tag--yellow' },
      'referred-to-mmo': { statusCode: 'REFERRED_TO_MMO', statusLabel: 'Referred To MMO', statusTagClass: 'govuk-tag--purple' }
    }
    data['documentary-dashboard-status'] = outcome === 'requires-intervention'
      ? interventionStatuses[intervention]
      : dashboardStatuses[outcome]
    data['documentary-dashboard-reference'] = req.params.reference
    res.redirect(`/inspection/${req.params.reference}/documentary-check-saved`)
  })

  router.get('/inspection/:reference/documentary-check-saved', (req, res) => {
    const inspectionNotification = buildInspectionOverviewNotification(req.params.reference)
    const data = req.session.data
    if (!inspectionNotification || data['documentary-dashboard-reference'] !== req.params.reference || !data['documentary-dashboard-status']) {
      return res.redirect(`/inspection/${req.params.reference}/check-documents`)
    }
    const outcomeLabels = {
      satisfactory: 'Satisfactory',
      'satisfactory-following-intervention': 'Satisfactory following intervention',
      'requires-intervention': 'Requires intervention',
      'not-satisfactory': 'Not satisfactory'
    }
    const interventionLabels = {
      'request-information': 'Request additional information from importer',
      'referred-to-mmo': 'Refer to MMO'
    }
    res.render(inspectionView('documentary-check-confirmation'), {
      inspectionNotification,
      completedDate: formatDashboardDate(new Date()),
      outcomeLabel: outcomeLabels[data['documentary-check-outcome']],
      interventionLabel: interventionLabels[data['documentary-intervention']],
      dashboardStatus: data['documentary-dashboard-status']
    })
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
