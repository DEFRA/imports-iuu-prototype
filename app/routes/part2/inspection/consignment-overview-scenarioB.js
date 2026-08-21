const { getInspectionNotificationByReference } = require('./notifications')
const { mockConsignmentSummariesApi } = require('./mock-api/consignment-summaries-api')
const documentNavigationService = require('./document-navigation-service')

const scenarioBReference = 'GB-IUU-2026-11002'

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
  if (reference !== scenarioBReference) return null

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

const registerConsignmentOverviewRoute = (router) => {
  router.get('/inspection/:reference', (req, res) => {
    const inspectionNotification = buildInspectionOverviewNotification(req.params.reference)
    if (!inspectionNotification) {
      return res.render('part2/inspection/support/inspection-not-implemented')
    }
    res.render('part2/inspection/case/consignment-overview', {
      inspectionNotification,
      documentReferenceGroups: documentNavigationService.getReferenceGroups(req.params.reference).map((group) => ({
        ...group,
        count: inspectionNotification.documentCounts?.[group.type] ?? group.links.length,
        links: inspectionNotification.documentCounts
          ? group.links.slice(0, inspectionNotification.documentCounts[group.type])
          : group.links
      })),
      documentLinksByReference: documentNavigationService.getDocumentLinksByReference()
    })
  })
}

module.exports = {
  buildInspectionOverviewNotification,
  formatDashboardDate,
  registerConsignmentOverviewRoute
}