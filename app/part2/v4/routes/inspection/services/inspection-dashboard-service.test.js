const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
  buildDashboardFilters,
  filterConsignments,
  sortConsignments,
  getSummaryCards,
  getActiveFilterChips,
  buildInspectionDashboardViewModel
} = require('./inspection-dashboard-service')
const { mockConsignmentSummariesApi } = require('../mock-api/consignment-summaries-api')
const { getInspectionNotificationByReference, buildCommodityWeightComparison } = require('../notifications')
const createDocumentNavigationService = require('../document-navigation-service')
const registerInspectionRoutes = require('../index')
const getBackLinkHref = require('../back-link-service')
const additionalDocuments = require('../../../data/additional-documents')

const fixedToday = new Date(Date.UTC(2026, 0, 1))

test('shows inspection actions in the agreed order without the intervention outcome', () => {
  const formPath = path.join(__dirname, '..', '..', '..', 'views', 'inspection', 'components', 'inspection-action-form.njk')
  const form = fs.readFileSync(formPath, 'utf8')
  const actionOptions = form.match(/name: "inspection-action",[\s\S]*?items: \[([\s\S]*?)\n\s{10}\]/)[1]
  const outcomeOptions = form.match(/name: "documentary-check-outcome",[\s\S]*?items: \[([\s\S]*?)\n\s{4}\]/)[1]

  assert.deepEqual(
    [...actionOptions.matchAll(/\{ value: "([^"]+)", text: "([^"]+)"/g)].map(([, value, text]) => [value, text]),
    [
      ['issue-decision', 'Issue a decision'],
      ['document-under-assessment', 'Move to document under assessment'],
      ['add-note', 'Add note'],
      ['request-information', 'Request more information'],
      ['referred-to-mmo', 'Request advice from MMO'],
      ['physical-inspection', 'Move to physical inspection'],
      ['appeal-review', 'Move to appeal review'],
      ['refer-to-enforcement', 'Refer to enforcement'],
      ['archive-notification', 'Archive notification']
    ]
  )
  assert.deepEqual(
    [...outcomeOptions.matchAll(/\{ value: "([^"]+)", text: "([^"]+)"/g)].map(([, value, text]) => [value, text]),
    [
      ['satisfactory', 'Satisfactory'],
      ['satisfactory-following-intervention', 'Satisfactory following intervention'],
      ['not-satisfactory', 'Not satisfactory']
    ]
  )
})

test('builds hierarchical back links instead of returning to the referring page', () => {
  const buildRequest = (path) => ({ path })

  assert.equal(getBackLinkHref(buildRequest('/inspection/GB-IUU-2026-11021'), '/part2/v4', '/part2/v4/inspections?tab=active&search-reference=11021'), '/part2/v4/inspections?tab=active&search-reference=11021')
  assert.equal(getBackLinkHref(buildRequest('/inspection/GB-IUU-2026-11021'), '/part2/v4'), '/part2/v4/inspections')
  assert.equal(getBackLinkHref(buildRequest('/inspection/GB-IUU-2026-11021/documents/catch-certificate/CC-11021-01'), '/part2/v4'), '/part2/v4/inspection/GB-IUU-2026-11021')
  assert.equal(getBackLinkHref(buildRequest('/inspection/GB-IUU-2026-11021/history'), '/part2/v4'), '/part2/v4/inspection/GB-IUU-2026-11021')
  assert.equal(getBackLinkHref(buildRequest('/inspection/GB-IUU-2026-11021/documentary-check-saved'), '/part2/v4'), '/part2/v4/inspection/GB-IUU-2026-11021')
  assert.equal(getBackLinkHref(buildRequest('/inspections/completed'), '/part2/v4'), '/part2/v4/inspections?tab=completed#completed')
  assert.equal(getBackLinkHref(buildRequest('/inspections'), '/part2/v4'), '/')
})

const getInspectionRouteHandlers = () => {
  const handlers = new Map()
  registerInspectionRoutes({
    get: (route, handler) => handlers.set(`GET ${route}`, handler),
    post: (route, handler) => handlers.set(`POST ${route}`, handler)
  }, '/part2/v4')
  return handlers
}

test('Add note requires notes and saves a scoped history entry without changing status', () => {
  const handlers = getInspectionRouteHandlers()
  const reference = 'GB-IUU-2026-11021'
  const status = { statusCode: 'COMPLETED', statusLabel: 'Completed', completedAt: '2026-10-28T10:00:00Z' }
  const req = {
    params: { reference },
    body: { 'inspection-action': 'add-note', 'inspection-action-notes': '   ' },
    session: { data: {
      'documentary-dashboard-reference': reference,
      'documentary-dashboard-status': status,
      'inspection-officer-name': 'Jamie Smith',
      'documentary-check-outcome': 'satisfactory'
    } }
  }
  let context
  handlers.get('POST /inspection/:reference/action')(req, { render: (view, values) => { context = values } })
  assert.equal(context.errorMap['inspection-action-notes'], 'Enter notes about this action')
  assert.equal(req.session.data['notification-history-events'], undefined)
  req.body['inspection-action-notes'] = '  Follow-up note.\nSecond line.  '
  let destination
  handlers.get('POST /inspection/:reference/action')(req, { redirect: (url) => { destination = url } })
  assert.equal(destination, `/inspection/${reference}`)
  assert.deepEqual(req.session.data['documentary-dashboard-status'], status)
  assert.equal(req.session.data['documentary-check-outcome'], 'satisfactory')
  const events = req.session.data['notification-history-events']
  assert.deepEqual(Object.keys(events), [reference])
  assert.equal(events[reference][0].label.text, 'Note')
  assert.equal(events[reference][0].byline.text, 'Jamie Smith, PHA Inspector')
  assert.equal(events[reference][0].text, 'Follow-up note.\nSecond line.')
  assert.ok(Number.isFinite(Date.parse(events[reference][0].datetime.timestamp)))
})

test('overview action validation retains notes without changing statuses', () => {
  const handlers = getInspectionRouteHandlers()
  for (const action of ['', 'unknown']) {
    const req = {
      params: { reference: 'GB-IUU-2026-11021' },
      body: { 'inspection-action': action, 'inspection-action-notes': 'Review note' },
      session: { data: {} }
    }
    let context
    handlers.get('POST /inspection/:reference/action')(req, { render: (view, values) => { context = values } })
    assert.equal(context.hasErrors, true)
    assert.equal(context.actionData.notes, 'Review note')
    assert.equal(context.actionData.action, '')
    assert.equal(req.session.data['documentary-dashboard-status'], undefined)
  }
})

test('overview actions save their agreed status or continue to the existing decision form', () => {
  const handlers = getInspectionRouteHandlers()
  for (const [action, expectedStatus, expectedPath] of [
    ['issue-decision', 'COMPLETED', 'overview'],
    ['request-information', 'REQUEST_ADDITIONAL_INFORMATION', 'overview'],
    ['referred-to-mmo', 'REFERRED_TO_MMO', 'overview'],
    ['refer-to-enforcement', 'REFERRED_TO_ENFORCEMENT', 'overview'],
    ['physical-inspection', 'REQUIRES_PHYSICAL_INSPECTION', 'overview'],
    ['document-under-assessment', 'IN_PROGRESS', 'documentary-check-saved']
  ]) {
    const req = {
      params: { reference: 'GB-IUU-2026-11021' },
      body: {
        'inspection-action': action,
        'inspection-action-notes': ' Notes for 11021 ',
        'documentary-check-outcome': action === 'issue-decision' ? 'satisfactory' : '',
        'inspection-decision-declaration': 'confirmed',
        'inspection-information-declaration': 'confirmed',
        'inspection-enforcement-declaration': 'confirmed'
      },
      session: { data: {} }
    }
    let destination
    handlers.get('POST /inspection/:reference/action')(req, {
      render: () => {},
      redirect: (url) => { destination = url }
    })
    assert.equal(req.session.data['documentary-dashboard-status']?.statusCode, expectedStatus)
    assert.equal(destination, expectedPath === 'overview'
      ? '/inspection/GB-IUU-2026-11021'
      : `/inspection/GB-IUU-2026-11021/${expectedPath}`)
    assert.equal(req.session.data['inspection-actions']['GB-IUU-2026-11021'].notes, 'Notes for 11021')
    req.params.reference = 'GB-IUU-2026-11002'
    let overviewContext
    handlers.get('GET /inspection/:reference')(req, { render: (view, values) => { overviewContext = values } }, () => {})
    assert.equal(overviewContext.hasErrors, false)
    assert.deepEqual(overviewContext.actionData, {})
    if (action === 'issue-decision') {
      assert.equal(req.session.data['inspection-action-success'].statusLabel, 'Completed')
      assert.equal(req.session.data['inspection-action-success'].historyLinkText, 'View the note and certificate in Notification history')
    }
  }
})

test('Request more information requires notes and returns with a success banner', () => {
  const handlers = getInspectionRouteHandlers()
  const reference = 'GB-IUU-2026-11021'
  const req = {
    params: { reference },
    body: { 'inspection-action': 'request-information', 'inspection-action-notes': '   ' },
    session: { data: {} }
  }
  let errorContext
  handlers.get('POST /inspection/:reference/action')(req, {
    render: (view, values) => { errorContext = values }
  })
  assert.equal(errorContext.errorMap['inspection-action-notes'], 'Enter notes about this action')
  assert.equal(req.session.data['documentary-dashboard-status'], undefined)
  assert.equal(req.session.data['notification-history-events'], undefined)

  req.body['inspection-action-notes'] = 'Please provide an updated catch certificate.'
  req.body['inspection-information-declaration'] = 'confirmed'
  let destination
  handlers.get('POST /inspection/:reference/action')(req, { redirect: (url) => { destination = url } })
  assert.equal(destination, `/inspection/${reference}`)
  assert.equal(req.session.data['documentary-dashboard-status'].statusCode, 'REQUEST_ADDITIONAL_INFORMATION')

  req.method = 'GET'
  let successContext
  handlers.get('GET /inspection/:reference')(req, {
    render: (view, values) => { successContext = values }
  }, () => {})
  assert.equal(successContext.inspectionActionSuccess.message, 'The notification has been returned to the importer.')
  assert.equal(successContext.inspectionActionSuccess.statusLabel, 'Request Additional Information from Importer')
  assert.equal(successContext.recentChange.label.text, 'More information requested')
  assert.equal(successContext.recentChange.text, 'Please provide an updated catch certificate.')
  assert.equal(req.session.data['inspection-action-success'], undefined)
})

test('Request more information requires a fresh declaration and retains it on validation errors', () => {
  const handlers = getInspectionRouteHandlers()
  const reference = 'GB-IUU-2026-11021'
  const req = {
    params: { reference },
    body: {
      'inspection-action': 'request-information',
      'inspection-action-notes': 'Please confirm the arrival details.',
      'inspection-decision-declaration': 'confirmed'
    },
    session: { data: {} }
  }
  let context
  const render = (view, values) => { context = values }
  handlers.get('POST /inspection/:reference/action')(req, { render })
  assert.ok(context.errorMap['inspection-information-declaration'])
  assert.equal(context.actionData.notes, 'Please confirm the arrival details.')
  assert.equal(req.session.data['documentary-dashboard-status'], undefined)
  assert.equal(req.session.data['notification-history-events'], undefined)

  req.body['inspection-information-declaration'] = ['confirmed', '_unchecked']
  req.body['inspection-action-notes'] = ''
  handlers.get('POST /inspection/:reference/action')(req, { render })
  assert.equal(context.actionData.informationConfirmed, true)
  assert.ok(context.errorMap['inspection-action-notes'])
  req.body['inspection-action-notes'] = 'Please confirm the arrival details.'
  handlers.get('POST /inspection/:reference/action')(req, { redirect: () => {} })
  assert.equal(req.session.data['inspection-actions'][reference].informationConfirmed, false)
  const historyCount = req.session.data['notification-history-events'][reference].length
  delete req.body['inspection-information-declaration']
  handlers.get('POST /inspection/:reference/action')(req, { render })
  assert.ok(context.errorMap['inspection-information-declaration'])
  assert.equal(req.session.data['notification-history-events'][reference].length, historyCount)
})

test('Issue a decision requires a fresh declaration before saving any outcome', () => {
  const handlers = getInspectionRouteHandlers()
  for (const outcome of ['satisfactory', 'satisfactory-following-intervention', 'not-satisfactory']) {
    const req = {
      params: { reference: 'GB-IUU-2026-11021' },
      body: {
        'inspection-action': 'issue-decision',
        'inspection-action-notes': 'Decision notes',
        'documentary-check-outcome': outcome
      },
      session: { data: {} }
    }
    let context
    const render = (view, values) => { context = values }
    handlers.get('POST /inspection/:reference/action')(req, { render })
    assert.ok(context.errorMap['inspection-decision-declaration'])
    assert.equal(context.actionData.notes, 'Decision notes')
    assert.equal(context.actionData.outcome, outcome)
    assert.equal(req.session.data['documentary-dashboard-status'], undefined)
    assert.equal(req.session.data['notification-history-events'], undefined)
    req.body['inspection-decision-declaration'] = 'confirmed'
    req.body['inspection-action-notes'] = ''
    handlers.get('POST /inspection/:reference/action')(req, { render })
    assert.equal(context.actionData.decisionConfirmed, true)
    req.body['inspection-action-notes'] = 'Decision notes'
    handlers.get('POST /inspection/:reference/action')(req, { redirect: () => {} })
    assert.equal(req.session.data['inspection-actions'][req.params.reference].decisionConfirmed, false)
    delete req.body['inspection-decision-declaration']
    handlers.get('POST /inspection/:reference/action')(req, { render })
    assert.ok(context.errorMap['inspection-decision-declaration'])
  }
})

test('Refer to enforcement requires its own fresh declaration and retains it on validation errors', () => {
  const handlers = getInspectionRouteHandlers()
  const req = {
    params: { reference: 'GB-IUU-2026-11021' },
    body: {
      'inspection-action': 'refer-to-enforcement',
      'inspection-action-notes': 'Refer for investigation.',
      'inspection-decision-declaration': 'confirmed'
    },
    session: { data: {} }
  }
  let context
  const render = (view, values) => { context = values }
  handlers.get('POST /inspection/:reference/action')(req, { render })
  assert.ok(context.errorMap['inspection-enforcement-declaration'])
  assert.equal(context.actionData.notes, 'Refer for investigation.')
  assert.equal(req.session.data['documentary-dashboard-status'], undefined)
  assert.equal(req.session.data['notification-history-events'], undefined)
  req.body['inspection-enforcement-declaration'] = 'confirmed'
  req.body['inspection-action-notes'] = ''
  handlers.get('POST /inspection/:reference/action')(req, { render })
  assert.equal(context.actionData.enforcementConfirmed, true)
  assert.ok(context.errorMap['inspection-action-notes'])
  req.body['inspection-action-notes'] = 'Refer for investigation.'
  handlers.get('POST /inspection/:reference/action')(req, { redirect: () => {} })
  assert.equal(req.session.data['documentary-dashboard-status'].statusCode, 'REFERRED_TO_ENFORCEMENT')
  assert.equal(req.session.data['inspection-actions'][req.params.reference].enforcementConfirmed, false)
  const historyCount = req.session.data['notification-history-events'][req.params.reference].length
  delete req.body['inspection-enforcement-declaration']
  handlers.get('POST /inspection/:reference/action')(req, { render })
  assert.ok(context.errorMap['inspection-enforcement-declaration'])
  assert.equal(req.session.data['notification-history-events'][req.params.reference].length, historyCount)
})

test('declarations accept Prototype Kit checkbox arrays and reject unchecked submissions', () => {
  const handlers = getInspectionRouteHandlers()
  for (const [action, field, expectedStatus] of [
    ['issue-decision', 'inspection-decision-declaration', 'COMPLETED'],
    ['request-information', 'inspection-information-declaration', 'REQUEST_ADDITIONAL_INFORMATION'],
    ['refer-to-enforcement', 'inspection-enforcement-declaration', 'REFERRED_TO_ENFORCEMENT']
  ]) {
    for (const [value, confirmed] of [
      ['confirmed', true],
      [['confirmed', '_unchecked'], true],
      [['_unchecked', 'confirmed'], true],
      ['_unchecked', false],
      [['_unchecked'], false],
      [[], false],
      [undefined, false]
    ]) {
      const req = {
        params: { reference: 'GB-IUU-2026-11021' },
        body: {
          'inspection-action': action,
          'inspection-action-notes': 'Good to go!',
          'documentary-check-outcome': 'satisfactory',
          [field]: value
        },
        session: { data: {} }
      }
      let context
      let destination
      handlers.get('POST /inspection/:reference/action')(req, {
        render: (view, values) => { context = values },
        redirect: (url) => { destination = url }
      })
      if (confirmed) {
        assert.equal(destination, '/inspection/GB-IUU-2026-11021')
        assert.equal(req.session.data['documentary-dashboard-status'].statusCode, expectedStatus)
      } else {
        assert.ok(context.errorMap[field])
        assert.equal(destination, undefined)
        assert.equal(req.session.data['documentary-dashboard-status'], undefined)
        assert.equal(req.session.data['notification-history-events'], undefined)
      }
    }
  }
})

test('Issue a decision requires an outcome before it can be saved', () => {
  const handlers = getInspectionRouteHandlers()
  const req = {
    params: { reference: 'GB-IUU-2026-11021' },
    body: { 'inspection-action': 'issue-decision', 'inspection-action-notes': 'Decision notes' },
    session: { data: {} }
  }
  let context
  handlers.get('POST /inspection/:reference/action')(req, { render: (view, values) => { context = values } })

  assert.equal(context.errorMap['documentary-check-outcome'], 'Select the documentary check outcome')
  assert.equal(req.session.data['documentary-dashboard-status'], undefined)
  assert.equal(req.session.data['notification-history-events'], undefined)
})

test('MMO, enforcement and physical actions require notes and save with status and history', () => {
  const handlers = getInspectionRouteHandlers()
  for (const [action, expectedStatus, expectedMessage, expectedHistoryTitle] of [
    ['referred-to-mmo', 'REFERRED_TO_MMO', 'The notification has been referred to the MMO.', 'Referred to MMO'],
    ['refer-to-enforcement', 'REFERRED_TO_ENFORCEMENT', 'The notification has been referred to enforcement.', 'Referred to enforcement'],
    ['physical-inspection', 'REQUIRES_PHYSICAL_INSPECTION', 'The notification has been moved to physical inspection.', 'Moved to physical inspection'],
    ['appeal-review', 'APPEAL_UNDER_REVIEW', 'The notification has been moved to appeal review.', 'Appeal under review']
  ]) {
    const req = {
      params: { reference: 'GB-IUU-2026-11021' },
      body: { 'inspection-action': action, 'inspection-action-notes': '   ' },
      session: { data: {} }
    }
    let destination
    handlers.get('POST /inspection/:reference/action')(req, {
      render: () => {},
      redirect: (url) => { destination = url }
    })
    assert.equal(destination, undefined)
    assert.equal(req.session.data['documentary-dashboard-status'], undefined)
    assert.equal(req.session.data['notification-history-events'], undefined)

    req.body['inspection-action-notes'] = 'Action details for importer or team.'
    if (action === 'refer-to-enforcement') req.body['inspection-enforcement-declaration'] = 'confirmed'
    handlers.get('POST /inspection/:reference/action')(req, { redirect: (url) => { destination = url } })
    assert.equal(destination, '/inspection/GB-IUU-2026-11021')
    assert.equal(req.session.data['documentary-dashboard-status'].statusCode, expectedStatus)
    assert.equal(req.session.data['notification-history-events']['GB-IUU-2026-11021'][0].label.text, expectedHistoryTitle)
    assert.equal(req.session.data['notification-history-events']['GB-IUU-2026-11021'][0].text, 'Action details for importer or team.')

    req.method = 'GET'
    let overviewContext
    handlers.get('GET /inspection/:reference')(req, {
      render: (view, values) => { overviewContext = values }
    }, () => {})
    assert.equal(overviewContext.inspectionActionSuccess.message, expectedMessage)
    assert.equal(overviewContext.inspectionActionSuccess.statusLabel, req.session.data['documentary-dashboard-status'].statusLabel)
    assert.equal(overviewContext.inspectionNotification.statusTagText, req.session.data['documentary-dashboard-status'].statusLabel)
  }
})

test('notification history is scoped to its notification and ordered newest first', () => {
  const handlers = getInspectionRouteHandlers()
  for (const reference of ['GB-IUU-2026-11002', 'GB-IUU-2026-11003', 'GB-IUU-2026-11021']) {
    const req = { params: { reference }, session: { data: {} } }
    let historyContext
    handlers.get('GET /inspection/:reference/history')(req, {
      render: (view, values) => { historyContext = values }
    })

    assert.equal(historyContext.inspectionNotification.reference, reference)
    assert.equal(historyContext.notificationHistory.length, reference === 'GB-IUU-2026-11021' ? 5 : 4)
    if (reference === 'GB-IUU-2026-11021') {
      assert.deepEqual(historyContext.notificationHistory.map((event) => event.label.text), [
        'Referred to MMO',
        'Change of Arrival details',
        'More information requested',
        'Moved to document under review',
        'Document requires check'
      ])
      assert.equal(historyContext.notificationHistory[1].text, 'Current destination port Felixstowe, 30/10/26, 8:45am\n\nPrevious destination port Dover, 28/10/26, 9:20am')
      assert.equal(historyContext.notificationHistory[1].html, '<p>Current destination port Felixstowe, 30/10/26, 8:45am</p><p>Previous destination port Dover, 28/10/26, 9:20am</p>')
      assert.equal(historyContext.notificationHistory[1].byline.text, 'New England Seafood International Ltd')
      assert.equal(historyContext.notificationHistory[1].datetime.timestamp, '2026-09-22T10:14:00.000Z')
      assert.equal(historyContext.notificationHistory[1].classes, undefined)
      assert.equal(historyContext.notificationHistory[0].byline.text, 'Alex Morgan, PHA Inspector')
    }
    assert.deepEqual(
      historyContext.notificationHistory.map((event) => Date.parse(event.datetime.timestamp)),
      [...historyContext.notificationHistory.map((event) => Date.parse(event.datetime.timestamp))].sort((first, second) => second - first)
    )

    let overviewContext
    handlers.get('GET /inspection/:reference')({
      params: { reference },
      session: { data: {} }
    }, { render: (view, values) => { overviewContext = values } }, () => {})
    assert.equal(overviewContext.recentChange, historyContext.notificationHistory[0])
  }

})

test('every catch certificate links to page 4 of the same original sample document', () => {
  const handlers = getInspectionRouteHandlers()
  const documents = require('../../../data/inspection-documents')
  const certificates = documents.filter((document) => document.type === 'catch-certificate')
  assert.ok(certificates.length > 1)
  for (const certificate of certificates) {
    let context
    handlers.get('GET /documents/:type/:id')({ params: { type: certificate.type, id: certificate.id } }, {
      render: (view, values) => { context = values }
    })
    assert.equal(context.document.originalFileUrl, `/part2/v4/documents/file/${encodeURIComponent(certificate.id)}#page=4`)
    let sourcePath
    handlers.get('GET /documents/file/:id')({ params: { id: certificate.id } }, {
      sendFile: (filePath) => { sourcePath = filePath }
    })
    assert.equal(path.basename(sourcePath), 'CATCH.CC.FR.2026.0000148 for FRA.2025.CSP.000518.pdf')
    assert.ok(fs.readFileSync(sourcePath).subarray(0, 5).equals(Buffer.from('%PDF-')))
  }
})

test('document viewers set Back to their owning notification overview', () => {
  const handlers = getInspectionRouteHandlers()
  for (const [type, id] of [
    ['catch-certificate', 'CC-IS-2026-11021-01'],
    ['additional', 'SPE-IS-2026-11021-01']
  ]) {
    let context
    handlers.get('GET /documents/:type/:id')({ params: { type, id } }, {
      render: (view, values) => { context = values }
    })
    assert.equal(context.backLinkHref, '/part2/v4/inspection/GB-IUU-2026-11021')
  }
})

test('adds each saved documentary outcome and its notes to that notification history', () => {
  const handlers = getInspectionRouteHandlers()
  const outcomes = [
    ['satisfactory', '', 'IUU control check outcome Satisfactory', 'COMPLETED'],
    ['satisfactory-following-intervention', '', 'IUU control check outcome Satisfactory following intervention', 'COMPLETED'],
    ['requires-intervention', 'referred-to-mmo', 'IUU control check outcome Requires intervention', 'REFERRED_TO_MMO'],
    ['not-satisfactory', '', 'IUU control check outcome Not satisfactory', 'REJECTED']
  ]

  for (const [outcome, intervention, expectedTitle, expectedStatus] of outcomes) {
    const reference = 'GB-IUU-2026-11021'
    const req = {
      params: { reference },
      body: {
        'inspection-action': 'issue-decision',
        'inspection-action-notes': `Notes for ${outcome}`,
        'documentary-check-outcome': outcome,
        'documentary-intervention': intervention,
        'inspection-decision-declaration': 'confirmed',
      },
      session: { data: { 'inspection-officer-name': 'Alex Morgan' } }
    }
    let destination
    handlers.get('POST /inspection/:reference/action')(req, { redirect: (url) => { destination = url } })
    assert.equal(destination, `/inspection/${reference}`)
    assert.equal(req.session.data['documentary-dashboard-status'].statusCode, expectedStatus)

    let historyContext
    handlers.get('GET /inspection/:reference/history')(req, {
      render: (view, values) => { historyContext = values }
    })
    assert.equal(historyContext.notificationHistory[0].label.text, expectedTitle)
    assert.equal(historyContext.notificationHistory[0].text, `Notes for ${outcome}`)
    assert.equal(historyContext.notificationHistory[0].byline.text, 'Alex Morgan, PHA Inspector')
    const isSatisfactory = ['satisfactory', 'satisfactory-following-intervention'].includes(outcome)
    assert.equal(Boolean(historyContext.notificationHistory[0].html), isSatisfactory)
    if (isSatisfactory) {
      assert.match(historyContext.notificationHistory[0].html, /\/completion-certificate\?completed=[^"]+">View completion certificate<\/a>/)
      assert.ok(historyContext.notificationHistory[0].html.includes(`<p>Notes for ${outcome}</p>`))
    }

    req.method = 'GET'
    let overviewContext
    handlers.get('GET /inspection/:reference')({
      method: 'GET',
      params: { reference },
      session: req.session
    }, { render: (view, values) => { overviewContext = values } }, () => {})
    assert.equal(overviewContext.recentChange.label.text, expectedTitle)
    assert.equal(overviewContext.recentChange.text, `Notes for ${outcome}`)
    assert.equal(overviewContext.inspectionActionSuccess.statusLabel, req.session.data['documentary-dashboard-status'].statusLabel)

    req.params.reference = 'GB-IUU-2026-11002'
    let otherHistory
    handlers.get('GET /inspection/:reference/history')(req, {
      render: (view, values) => { otherHistory = values }
    })
    assert.equal(otherHistory.notificationHistory.length, 4)
  }

  const invalidReq = {
    params: { reference: 'GB-IUU-2026-11021' },
    body: { 'inspection-action': 'issue-decision', 'inspection-action-notes': 'Not saved', 'documentary-check-outcome': '' },
    session: { data: {} }
  }
  handlers.get('POST /inspection/:reference/action')(invalidReq, { render: () => {} })
  assert.equal(invalidReq.session.data['notification-history-events'], undefined)
})

test('completion certificates retain their saved decision and are scoped to their consignment', () => {
  const handlers = getInspectionRouteHandlers()
  const reference = 'GB-IUU-2026-11021'
  const req = {
    params: { reference },
    body: {
      'inspection-action': 'issue-decision',
      'documentary-check-outcome': 'satisfactory-following-intervention',
      'inspection-decision-declaration': 'confirmed',
      'inspection-action-notes': 'Completed after clarification.'
    },
    session: { data: { 'inspection-officer-name': 'Jamie Smith' } }
  }
  handlers.get('POST /inspection/:reference/action')(req, { redirect: () => {} })
  const event = req.session.data['notification-history-events'][reference][0]
  req.query = { completed: event.datetime.timestamp }
  req.body = {
    'inspection-action': 'request-information',
    'inspection-action-notes': 'Later action.',
    'inspection-information-declaration': 'confirmed'
  }
  handlers.get('POST /inspection/:reference/action')(req, { redirect: () => {} })
  req.session.data['inspection-officer-name'] = 'Different inspector'
  let context
  let viewName
  handlers.get('GET /inspection/:reference/completion-certificate')(req, {
    render: (view, values) => { viewName = view; context = values }
  })
  assert.equal(viewName, 'part2/inspection/journey/documentary-check-confirmation')
  assert.equal(context.completedBy, 'Jamie Smith, PHA Inspector')
  assert.equal(context.outcomeLabel, 'Satisfactory following intervention')
  assert.equal(context.dashboardStatus.statusCode, 'COMPLETED')
  assert.equal(context.comments, 'Completed after clarification.')
  assert.equal(context.inspectionNotification.reference, reference)
  assert.equal(context.inspectionNotification.declaredWeight, '8,170 kg')
  assert.equal(context.inspectionNotification.productDescription, '12 species across 5 commodities')
  assert.ok(context.completedDate)
  assert.notEqual(context, event.certificate)
  context._locals = { data: req.session.data }
  assert.doesNotThrow(() => JSON.stringify(req.session.data))
  assert.match(event.html, /View completion certificate/)

  for (const [otherReference, completed] of [
    ['GB-IUU-2026-11002', event.datetime.timestamp],
    [reference, 'missing']
  ]) {
    let status
    handlers.get('GET /inspection/:reference/completion-certificate')({
      params: { reference: otherReference },
      query: { completed },
      session: req.session
    }, {
      status: (code) => { status = code; return { render: () => {} } }
    })
    assert.equal(status, 404)
  }
})

test('groups comparison species by code and retains all source weight values', () => {
  const notification = getInspectionNotificationByReference('GB-IUU-2026-11021', fixedToday)
  const comparison = buildCommodityWeightComparison(notification)
  assert.equal(comparison.commodityCount, 5)
  assert.equal(comparison.speciesCount, 12)
  assert.equal(comparison.totalWeight, '8,170 kg')
  assert.equal(comparison.initialGroup.species.length, 2)
  assert.equal(comparison.remainingGroups.length, 4)
  assert.equal(comparison.initialGroup.species[0].scientificName, 'Scomber scombrus')
  assert.equal(comparison.initialGroup.subtotals.notificationWeight, '2,000 kg')
  assert.equal(comparison.initialGroup.subtotals.catchCertificateWeight, '2,000 kg')
  assert.deepEqual(comparison.remainingGroups.map((group) => group.subtotals.notificationWeight), [
    '2,000 kg', '1,370 kg', '1,750 kg', '1,050 kg'
  ])
  const rows = [comparison.initialGroup, ...comparison.remainingGroups].flatMap((group) => group.species)
  for (const [index, row] of rows.entries()) {
    for (const field of ['notificationWeight', 'catchCertificateWeight', 'processingStatementWeight', 'nonManipulationDeclarationWeight']) {
      assert.equal(row[field], notification.commodityWeightComparisons[index][field])
    }
  }
  const mismatch = buildCommodityWeightComparison(getInspectionNotificationByReference('GB-IUU-2026-11002', fixedToday))
  assert.equal(mismatch.remainingGroups[0].species[0].notificationWeight, 'Not declared')
  assert.equal(mismatch.initialGroup.species[0].processingStatementWeight, 'Not provided')
  assert.equal(mismatch.remainingGroups[0].subtotals.notificationWeight, 'Not declared')
  assert.equal(mismatch.initialGroup.subtotals.processingStatementWeight, 'Not provided')
  const single = buildCommodityWeightComparison(getInspectionNotificationByReference('GB-IUU-2026-11001', fixedToday))
  assert.equal(single.remainingGroups.length, 0)
})

test('combined search matches partial references or importer names regardless of case', () => {
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(fixedToday)
  for (const search of ['11001', 'gb-iuu-2026-11001', '  NEW ENGLAND  ', 'frinsa', 'nonexistent importer', '']) {
    const filtered = filterConsignments(consignments, buildDashboardFilters({ search }))
    const term = search.trim().toLowerCase()
    assert.deepEqual(filtered, consignments.filter((item) => item.reference.toLowerCase().includes(term) || item.importer.toLowerCase().includes(term)))
  }
  assert.equal(buildDashboardFilters({ 'search-reference': '11021' }).search, '11021')
  assert.equal(buildDashboardFilters({ 'search-importer-name': 'Frinsa' }).search, 'Frinsa')
})

test('combined search works with status filters on both tabs and offers real autocomplete values', () => {
  const viewModel = buildInspectionDashboardViewModel({ search: 'seafood', 'filter-status': 'COMPLETED', tab: 'completed' }, fixedToday)
  assert.equal(viewModel.active.rows.length, 0)
  assert.ok(viewModel.completed.rows.length > 0)
  assert.ok(viewModel.completed.rows.every((row) => row.importer.toLowerCase().includes('seafood')))
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(fixedToday)
  assert.deepEqual(new Set(viewModel.filterOptions.referenceOptions), new Set(consignments.map((item) => item.reference)))
  assert.deepEqual(new Set(viewModel.filterOptions.importerNameOptions), new Set(consignments.map((item) => item.importer)))
  assert.equal(viewModel.filterOptions.importerNameOptions.length, new Set(viewModel.filterOptions.importerNameOptions).size)
})

test('filters consignments by importer, status, origin, arrival range and risk indicator', () => {
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(fixedToday)
  const filters = buildDashboardFilters({
    'filter-importer': 'New England Seafood International Ltd',
    'filter-status': 'REQUIRES_DOCUMENT_CHECK',
    'filter-origin': 'France',
    'filter-arrival-from': '2025-12-31',
    'filter-arrival-to': '2025-12-31',
    'filter-risk-indicator': 'WEIGHT_MISMATCH'
  })

  const filtered = filterConsignments(consignments, filters)
  assert.equal(filtered.length, 1)
  assert.equal(filtered[0].reference, 'GB-IUU-2026-11002')
})

test('sorts consignments by estimated arrival', () => {
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(fixedToday)
  const defaultFilters = buildDashboardFilters()
  const ascending = sortConsignments(consignments, buildDashboardFilters({
    'sort-by': 'estimated-arrival',
    'sort-order': 'asc'
  }))
  const descending = sortConsignments(consignments, buildDashboardFilters({
    'sort-by': 'estimated-arrival',
    'sort-order': 'desc'
  }))
  const unsupportedSortFilters = buildDashboardFilters({ 'sort-by': 'days-until-arrival' })
  const sortOptions = buildInspectionDashboardViewModel({}, fixedToday).filterOptions.sortOptions
  const sortOrderOptions = buildInspectionDashboardViewModel({}, fixedToday).filterOptions.sortOrderOptions

  assert.equal(defaultFilters.sortBy, 'estimated-arrival')
  assert.equal(defaultFilters.sortOrder, 'asc')
  assert.equal(unsupportedSortFilters.sortBy, 'estimated-arrival')
  assert.equal(sortOptions.some((option) => option.value === 'days-until-arrival'), false)
  assert.deepEqual(sortOrderOptions.map((option) => option.text), ['Ascending', 'Descending'])
  assert.equal(ascending[0].reference, 'GB-IUU-2026-11002')
  assert.equal(descending[0].estimatedArrival.toISOString().slice(0, 10), '2026-04-16')
})

test('sorts consignments by importer, status and consignment reference', () => {
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(fixedToday)

  const byImporter = sortConsignments(consignments, buildDashboardFilters({ 'sort-by': 'importer' }))
  const byStatus = sortConsignments(consignments, buildDashboardFilters({ 'sort-by': 'status' }))
  const byReference = sortConsignments(consignments, buildDashboardFilters({ 'sort-by': 'reference' }))

  assert.equal(byImporter[0].importer, 'Atlantic Seafoods Ltd')
  assert.equal(byStatus[0].status, 'COMPLETED')
  assert.equal(byReference[0].reference, 'GB-IUU-2026-10482')
})

test('builds Active from every non-completed status and keeps Completed separate', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)

  assert.ok(viewModel.active.rows.every((row) => row.statusLabel !== 'Completed'))
  assert.ok(viewModel.active.rows.some((row) => row.statusLabel === 'In progress'))
  assert.ok(viewModel.active.rows.some((row) => row.statusLabel === 'Requires document check'))
  assert.ok(viewModel.completed.rows.every((row) => row.statusLabel === 'Completed'))
  assert.equal(viewModel.filterOptions.referenceOptions.length, 42)
  assert.ok(viewModel.filterOptions.referenceOptions.includes('GB-IUU-2026-11001'))
  assert.ok(viewModel.filterOptions.importerNameOptions.includes('Frinsa UK'))
  assert.equal(viewModel.activeCount, 38)
  assert.equal(viewModel.completedCount, 4)
  assert.equal(buildDashboardFilters().tab, 'active')
  assert.equal(buildDashboardFilters({ tab: 'completed' }).tab, 'completed')
  assert.equal(buildDashboardFilters({ tab: 'for-review' }).tab, 'active')
  assert.equal(buildDashboardFilters({ tab: 'in-progress' }).tab, 'active')
})

test('Completed today quick filter opens the Completed tab and only matches today completions', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday, {}, '/part2/v4')
  const completedTodayCard = viewModel.summaryCards.find((card) => card.key === 'completed-today')
  const cardQuery = new URL(completedTodayCard.href, 'http://localhost').searchParams
  const completedToday = buildInspectionDashboardViewModel({
    tab: 'completed',
    'quick-filter': 'completed-today'
  }, fixedToday)

  assert.equal(cardQuery.get('tab'), 'completed')
  assert.ok(completedTodayCard.href.endsWith('#completed'))
  assert.deepEqual(completedToday.completed.rows.map((row) => row.reference), ['GB-IUU-2026-11006'])
})

test('preserves the many-species notification and individual weights in Inspector results', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)
  const consignment = viewModel.active.rows.find((row) => row.reference === 'GB-IUU-2026-11021')

  assert.equal(consignment.commoditySpeciesSummary.speciesCount, 12)
  assert.equal(consignment.commoditySpeciesSummary.commodityCount, 5)
  assert.equal(consignment.commoditySpeciesSummary.totalWeightDisplay, '8,170 kg')
  assert.equal(consignment.commoditySpeciesSummary.initialGroup.commodityCode, '03024400')
  assert.deepEqual(consignment.commoditySpeciesSummary.initialGroup.species.map((species) => species.species), [
    'Atlantic mackerel',
    'Pacific chub mackerel'
  ])
  assert.equal(consignment.commoditySpeciesSummary.remainingGroups.length, 4)
  assert.equal(consignment.commoditySpeciesSummary.remainingGroups[0].commodityCode, '03025419')
  assert.equal(consignment.commoditySpeciesSummary.remainingGroups.flatMap((group) => group.species).length, 10)
  assert.equal(consignment.daysUntilArrival, 2)
  const inspectionNotification = getInspectionNotificationByReference('GB-IUU-2026-11021', fixedToday)
  assert.equal(inspectionNotification.commodityWeightComparisons.every((item) => item.nonManipulationDeclarationWeight !== 'Not required'), true)
})

test('provides all required linked evidence for the 11021 detail page', () => {
  const notification = getInspectionNotificationByReference('GB-IUU-2026-11021', fixedToday)
  const documentNavigationService = createDocumentNavigationService('/part2/v4')
  const groups = documentNavigationService.getReferenceGroups(notification.reference)

  assert.equal(notification.hasJourneyLink, true)
  assert.deepEqual(notification.documents.map((group) => [group.type, group.count]), [
    ['Catch certificates', 5],
    ['Processing statements', 3],
    ['Non-manipulation declarations', 2],
    ['Additional documents', 2]
  ])
  assert.equal(groups.find((group) => group.type === 'catch-certificate').links.length, 5)
  assert.equal(groups.find((group) => group.type === 'processing-statement').links.length, 3)
  assert.equal(groups.find((group) => group.type === 'nmd').links.length, 2)
  assert.equal(groups.find((group) => group.type === 'additional').links.length, 2)
  assert.equal(notification.commodityWeightComparisons.length, 12)
  assert.equal(notification.commodityWeightComparisons.every((item) => item.catchCertificateReferences.length === 1), true)
})

test('orders 11021 evidence pagination by evidence group and handles sequence boundaries', () => {
  const documentNavigationService = createDocumentNavigationService('/part2/v4')
  const sequence = documentNavigationService.getDocumentSequence('GB-IUU-2026-11021')

  assert.equal(sequence.length, 12)
  assert.equal(sequence[0].typeLabel, 'Catch certificate')
  assert.equal(sequence[4].typeLabel, 'Catch certificate')
  assert.equal(sequence[5].typeLabel, 'Processing statement')
  assert.equal(sequence[8].typeLabel, 'Non-manipulation declaration')
  assert.equal(sequence[10].typeLabel, 'Additional document')

  const firstPagination = documentNavigationService.getDocumentPagination('GB-IUU-2026-11021', sequence[0].href)
  const lastPagination = documentNavigationService.getDocumentPagination('GB-IUU-2026-11021', sequence.at(-1).href)
  const typeBoundaryPagination = documentNavigationService.getDocumentPagination('GB-IUU-2026-11021', sequence[4].href)

  assert.equal(firstPagination.previous, null)
  assert.equal(firstPagination.next.labelText, 'Catch certificate: CC-IS-2026-11021-02')
  assert.equal(typeBoundaryPagination.next.labelText, 'Processing statement: PS-IS-2026-11021-01')
  assert.equal(lastPagination.next, null)
  assert.equal(lastPagination.previous.labelText, 'Additional document: SPE-IS-2026-11021-01')
})

test('normalizes other Inspector notifications to distinct one-to-one Goods entries', () => {
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(fixedToday)
  const normalized = consignments.filter((item) => item.reference !== 'GB-IUU-2026-11021')
  const tuples = normalized.map((item) => [
    item.commoditySpecies[0].commodityCode,
    item.commoditySpecies[0].species,
    item.commoditySpecies[0].weight
  ].join('|'))
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)
  const allRows = [...viewModel.active.rows, ...viewModel.completed.rows]

  assert.equal(normalized.length, 41)
  assert.equal(normalized.every((item) => item.commodityCodes.length === 1 && item.commoditySpecies.length === 1), true)
  assert.equal(new Set(tuples).size, normalized.length)
  assert.equal(allRows.every((row) => row.commoditySpeciesSummary), true)
  assert.equal(consignments.find((item) => item.reference === 'GB-IUU-2026-11021').commoditySpecies.length, 12)
})

test('the many-species example awaits inspection and is near the top of the closest-arrival list', () => {
  const urgent = buildInspectionDashboardViewModel({ 'quick-filter': 'awaiting-inspection' }, fixedToday)
  const row = urgent.active.rows.find((consignment) => consignment.reference === 'GB-IUU-2026-11021')

  assert.ok(row)
  assert.equal(row.daysUntilArrival, 2)
  assert.equal(urgent.active.rows.slice(0, 3).some((consignment) => consignment.reference === row.reference), true)
})

test('builds the agreed Inspector quick-filter cards from dashboard criteria', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday, {}, '/part2/v4')
  const cardsByKey = Object.fromEntries(viewModel.summaryCards.map((card) => [card.key, card]))
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(fixedToday)

  assert.deepEqual(viewModel.summaryCards.map((card) => card.label), [
    'Awaiting inspection', 'In progress', 'Completed today', 'Mismatches flagged'
  ])
  assert.equal(cardsByKey['awaiting-inspection'].count, consignments.filter((item) => item.status === 'REQUIRES_DOCUMENT_CHECK').length)
  assert.equal(cardsByKey['in-progress'].count, consignments.filter((item) => item.status === 'IN_PROGRESS').length)
  assert.equal(cardsByKey['mismatches-flagged'].count, consignments.filter((item) => item.status !== 'COMPLETED' && item.riskFlags.some((flag) => ['COMMODITY_MISMATCH', 'WEIGHT_MISMATCH'].includes(flag))).length)
  assert.equal(cardsByKey['completed-today'].count, viewModel.completedTodayCount)
  assert.equal(cardsByKey['awaiting-inspection'].modifier, 'action')
  assert.equal(cardsByKey['mismatches-flagged'].modifier, 'action')
  assert.equal(cardsByKey['completed-today'].modifier, '')
  assert.equal(viewModel.completedTodayCount, 1)

  const withMmoQuery = new URL(cardsByKey['in-progress'].href, 'http://localhost').searchParams
  assert.equal(withMmoQuery.get('tab'), 'active')
  assert.deepEqual(withMmoQuery.getAll('quick-filter'), ['in-progress'])
})

test('combines multiple Inspector quick filters with AND across Active and Completed', () => {
  const viewModel = buildInspectionDashboardViewModel({
    tab: 'active',
    'quick-filter': ['in-progress', 'mismatches-flagged']
  }, fixedToday, {}, '/part2/v4')

  assert.deepEqual(viewModel.dashboardFilters.quickFilters, ['in-progress', 'mismatches-flagged'])
  assert.ok(viewModel.active.rows.every((row) => row.statusLabel === 'In progress' && row.riskFlags.some((flag) => ['COMMODITY_MISMATCH', 'WEIGHT_MISMATCH'].includes(flag.code))))
  assert.ok(viewModel.active.filteredTotalCount > 0)

  const noMatchesViewModel = buildInspectionDashboardViewModel({
    'quick-filter': ['in-progress', 'completed-today']
  }, fixedToday, {}, '/part2/v4')
  assert.equal(noMatchesViewModel.active.filteredTotalCount, 0)
  assert.equal(noMatchesViewModel.completed.filteredTotalCount, 0)
  assert.equal(viewModel.dashboardFilters.tab, 'active')
})

test('quick-filter counts match results and target the appropriate tab', () => {
  for (const tab of ['active', 'completed']) {
    const viewModel = buildInspectionDashboardViewModel({ tab }, fixedToday)
    for (const card of viewModel.summaryCards) {
      const url = new URL(card.href, 'http://localhost')
      const filtered = buildInspectionDashboardViewModel(Object.fromEntries(url.searchParams), fixedToday)
      const targetTab = url.searchParams.get('tab')
      assert.equal(card.count, filtered[targetTab].filteredTotalCount)
      if (['awaiting-inspection', 'in-progress'].includes(card.key)) assert.equal(targetTab, 'active')
      if (card.key === 'completed-today') assert.equal(targetTab, 'completed')
      if (card.key === 'mismatches-flagged') {
        assert.equal(targetTab, tab)
        assert.ok(filtered[tab].rows.every((row) => row.riskFlags.some((flag) => ['COMMODITY_MISMATCH', 'WEIGHT_MISMATCH'].includes(flag.code))))
      }
    }
  }
})

test('Completed today uses the saved completion date and excludes later status changes', () => {
  const reference = 'GB-IUU-2026-11021'
  const query = { 'quick-filter': 'completed-today', search: reference, tab: 'completed' }
  for (const [statusCode, completedAt, expected] of [
    ['COMPLETED', '2026-01-01T10:00:00Z', 1],
    ['COMPLETED', '2025-12-31T10:00:00Z', 0],
    ['COMPLETED', undefined, 0],
    ['IN_PROGRESS', '2026-01-01T10:00:00Z', 0]
  ]) {
    const overrides = { [reference]: { statusCode, completedAt } }
    const viewModel = buildInspectionDashboardViewModel(query, fixedToday, overrides)
    assert.equal(viewModel.completed.filteredTotalCount, expected)
    const nextDay = buildInspectionDashboardViewModel(query, new Date('2026-01-02T12:00:00Z'), overrides)
    assert.equal(nextDay.completed.filteredTotalCount, 0)
  }
})

test('Inspector quick-filter cards and tags remove only their own filter', () => {
  const filters = buildDashboardFilters({
    tab: 'active',
    'quick-filter': ['awaiting-inspection', 'mismatches-flagged'],
    'search-reference': '11002',
    'filter-risk-indicator': 'WEIGHT_MISMATCH',
    'sort-by': 'importer'
  })
  const consignments = mockConsignmentSummariesApi.listConsignmentSummaries(fixedToday)
  const cards = getSummaryCards(consignments, filters, '/part2/v4')
  const evidenceCard = cards.find((card) => card.key === 'mismatches-flagged')
  const cardQuery = new URL(evidenceCard.href, 'http://localhost').searchParams

  assert.equal(evidenceCard.active, true)
  assert.equal(evidenceCard.href.endsWith('#active'), true)
  assert.deepEqual(cardQuery.getAll('quick-filter'), ['awaiting-inspection'])
  assert.equal(cardQuery.get('search'), '11002')
  assert.equal(cardQuery.get('filter-risk-indicator'), 'WEIGHT_MISMATCH')
  assert.equal(cardQuery.get('sort-by'), 'importer')

  const chips = getActiveFilterChips(filters, '/part2/v4', 'active')
  const referenceChip = chips.find((chip) => chip.label === 'Search: 11002')
  const chipQuery = new URL(referenceChip.href, 'http://localhost').searchParams
  assert.equal(referenceChip.href.endsWith('#active'), true)
  assert.equal(chipQuery.get('search'), null)
  assert.deepEqual(chipQuery.getAll('quick-filter'), ['awaiting-inspection', 'mismatches-flagged'])
  assert.equal(chipQuery.get('filter-risk-indicator'), 'WEIGHT_MISMATCH')
  assert.equal(chipQuery.get('sort-by'), 'importer')
})

test('does not show sort controls as active-filter chips', () => {
  const filters = buildDashboardFilters({
    'sort-by': 'importer',
    'sort-order': 'desc'
  })

  assert.deepEqual(getActiveFilterChips(filters, '/part2/v4', 'active'), [])
})

test('sorts all dashboard tabs by closest estimated arrival on initial load', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)

  for (const tab of [viewModel.active, viewModel.completed]) {
    const arrivalDates = tab.rows.map((row) => row.estimatedArrivalIsoDate)
    const sortedArrivalDates = [...arrivalDates].sort()
    assert.deepEqual(arrivalDates, sortedArrivalDates)
  }
})

test('exposes every screenshot status in the dashboard status filter', () => {
  const statuses = buildInspectionDashboardViewModel({}, fixedToday).filterOptions.statusOptions.map((option) => option.value)
  assert.deepEqual(statuses.slice(1), [
    'REQUIRES_DOCUMENT_CHECK',
    'IN_PROGRESS',
    'REQUEST_ADDITIONAL_INFORMATION',
    'REFERRED_TO_MMO',
    'COMPLETED',
    'REQUIRES_PHYSICAL_INSPECTION',
    'APPEAL_UNDER_REVIEW',
    'REFERRED_TO_ENFORCEMENT',
    'REJECTED',
    'CLOSED'
  ])
})

test('groups at least two notifications under each estimated arrival date heading', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)

  for (const tab of [viewModel.active, viewModel.completed]) {
    const groups = new Map()
    let previousArrivalDate
    for (const row of tab.rows) {
      if (row.estimatedArrivalIsoDate !== previousArrivalDate) {
        assert.equal(typeof row.arrivalDateHeading, 'string')
        previousArrivalDate = row.estimatedArrivalIsoDate
      } else {
        assert.equal(row.arrivalDateHeading, undefined)
      }
      groups.set(row.estimatedArrivalIsoDate, (groups.get(row.estimatedArrivalIsoDate) || 0) + 1)
    }
    assert.ok([...groups.values()].every((count) => count >= 2))
  }

  const descending = buildInspectionDashboardViewModel({ 'sort-order': 'desc' }, fixedToday)
  assert.deepEqual(
    descending.active.rows.filter((row) => row.arrivalDateHeading).map((row) => row.estimatedArrivalIsoDate),
    [...new Set(descending.active.rows.map((row) => row.estimatedArrivalIsoDate))]
  )
})

test('does not add arrival date headings when sorting by another field', () => {
  const viewModel = buildInspectionDashboardViewModel({ 'sort-by': 'importer' }, fixedToday)

  for (const tab of [viewModel.active, viewModel.completed]) {
    assert.ok(tab.rows.every((row) => row.arrivalDateHeading === undefined))
  }
})

test('lists every matching reference in each dashboard tab', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)

  assert.equal(viewModel.active.rows.length, viewModel.active.filteredTotalCount)
  assert.equal(viewModel.active.pagination.pageCount, 1)
  assert.equal(viewModel.active.filteredStart, 1)
  assert.equal(viewModel.active.filteredEnd, viewModel.active.filteredTotalCount)
  assert.equal(viewModel.completed.rows.length, viewModel.completed.filteredTotalCount)
  assert.equal(viewModel.completed.pagination.pageCount, 1)
})

test('maps document counts as separate display lines', () => {
  const viewModel = buildInspectionDashboardViewModel({}, fixedToday)
  const consignment = viewModel.active.rows.find((row) => row.reference === 'GB-IUU-2026-11002')
  assert.deepEqual(consignment.documentsProvidedLines, ['Catch certificate (1)'])

  const documentLabels = viewModel.active.rows.flatMap((row) => row.documentsProvidedLines)
  assert.ok(documentLabels.some((label) => label.startsWith('Processing statement')))
  assert.ok(documentLabels.some((label) => label.startsWith('Non-manipulation declaration')))
})

test('serves a fictional sample bill of lading', () => {
  const billOfLading = additionalDocuments.find((document) => document.id === 'BOL-2026-55190')
  const sourcePath = path.join(__dirname, '..', '..', '..', 'data', 'sample-documents', billOfLading.sourceFile)
  const sourcePdf = fs.readFileSync(sourcePath)

  assert.equal(sourcePdf.includes(Buffer.from('SAMPLE')), true)
  assert.equal(sourcePdf.includes(Buffer.from('Fictional document for user research only')), true)
})

test('labels past arrival dates as overdue', () => {
  const viewModel = buildInspectionDashboardViewModel({}, new Date(Date.UTC(2026, 7, 26)))
  const overdueRows = viewModel.active.rows
    .filter((row) => row.daysUntilArrival < 0)

  assert.ok(overdueRows.length > 0)
  assert.ok(overdueRows.every((row) => row.arrivalTimingLabel.startsWith('Overdue by ')))
})

test('keeps seeded arrival offsets static as the current date changes', () => {
  const firstDate = new Date(Date.UTC(2026, 0, 1))
  const secondDate = new Date(Date.UTC(2026, 1, 1))
  const firstSummaries = mockConsignmentSummariesApi.listConsignmentSummaries(firstDate)
  const secondSummaries = mockConsignmentSummariesApi.listConsignmentSummaries(secondDate)

  for (const firstSummary of firstSummaries) {
    const secondSummary = secondSummaries.find((summary) => summary.reference === firstSummary.reference)
    assert.equal(secondSummary.daysUntilArrival, firstSummary.daysUntilArrival)
    assert.equal(secondSummary.estimatedArrival.getTime() - firstSummary.estimatedArrival.getTime(), 31 * 24 * 60 * 60 * 1000)
  }

  assert.equal(firstSummaries.find((summary) => summary.reference === 'GB-IUU-2026-11002').daysUntilArrival, -1)
  assert.equal(firstSummaries.find((summary) => summary.reference === 'GB-IUU-2026-11003').daysUntilArrival, 105)
  assert.equal(firstSummaries.find((summary) => summary.reference === 'GB-IUU-2026-11001').daysUntilArrival, 4)
})
