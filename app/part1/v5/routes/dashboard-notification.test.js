const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')

const handlers = new Map()
const router = {
  use: () => {},
  get: (route, handler) => handlers.set(`GET ${route}`, handler),
  post: (route, handler) => handlers.set(`POST ${route}`, handler)
}
const filename = path.join(__dirname, 'index.js')
const localRequire = createRequire(filename)
const routeRequire = (name) => name === 'govuk-prototype-kit'
  ? {
      requests: { setupRouter: () => router, serveDirectory: () => {} },
      views: { addFilter: () => {} }
    }
  : localRequire(name)
routeRequire.resolve = localRequire.resolve.bind(localRequire)
const routeModule = { exports: {} }
const load = vm.compileFunction(fs.readFileSync(filename, 'utf8'), ['require', 'module', 'exports', '__filename', '__dirname'])
load(routeRequire, routeModule, routeModule.exports, filename, __dirname)

const invoke = (route, req) => {
  const result = {}
  const response = {
    render: (template, model) => {
      result.template = template
      result.model = model
    },
    redirect: (location) => { result.location = location }
  }
  handlers.get(`GET ${route}`)(req, response)
  return result
}

test('draft details use the shared notification view and show missing information', () => {
  const result = invoke('/dashboard/drafts/:reference', {
    params: { reference: 'Draft notification 002' },
    query: { variant: 'b' },
    session: { data: {} }
  })

  assert.equal(result.template, 'part1/dashboard/notification')
  assert.equal(result.model.consignment.status, 'draft')
  assert.equal(result.model.consignment.statusLabel, 'Draft')
  assert.equal(result.model.consignment.isDraft, true)
  assert.equal(result.model.consignment.transport, 'Not provided')
  assert.equal(result.model.consignment.catchArea, 'Not provided')
  assert.equal(result.model.consignment.importedSpecies[0].declarationStatus, 'Not provided')
  assert.equal(result.model.consignment.importedSpecies[0].catchCertificateWeight, 'Not provided')
  assert.equal(result.model.consignment.timeline[0].text, 'Draft saved')
  assert.equal(result.model.recentChange.label.text, 'Draft saved')
  assert.equal(result.model.recentChange.byline.text, 'Importer')
  assert.equal(result.model.recentChange.datetime.timestamp, '2026-08-31T15:20:00.000Z')
  assert.equal(result.model.consignment.historyUrl, '/part1/v5/dashboard/drafts/Draft%20notification%20002/history?variant=b')
  assert.equal(result.model.consignment.continueUrl, '/part1/v5/dashboard/drafts/Draft%20notification%20002/continue?variant=b')
  assert.equal(result.model.dashboardUrl, '/part1/v5/dashboard?variant=b&tab=drafts#drafts')
})

test('notification history reuses the saved timeline in newest-first order', () => {
  const result = invoke('/dashboard/notifications/:reference/history', {
    params: { reference: 'GB-IUU-2026-11002' },
    query: { variant: 'a' },
    session: { data: {} }
  })

  assert.equal(result.template, 'part1/dashboard/notification-history')
  assert.equal(result.model.consignment.reference, 'GB-IUU-2026-11002')
  assert.equal(result.model.returnUrl, '/part1/v5/dashboard/notifications/GB-IUU-2026-11002?variant=a')
  assert.equal(result.model.notificationHistory[0].label.text, 'Sent to Grimsby Port Health Authority')
  assert.equal(result.model.notificationHistory[0].datetime.timestamp, '2026-08-28T09:01:00.000Z')
  assert.equal(result.model.notificationHistory.at(-1).label.text, 'Notification submitted')
})

test('draft history uses the same notification history view', () => {
  const result = invoke('/dashboard/drafts/:reference/history', {
    params: { reference: 'Draft notification 001' },
    query: { variant: 'b' },
    session: { data: {} }
  })

  assert.equal(result.template, 'part1/dashboard/notification-history')
  assert.equal(result.model.notificationHistory[0].label.text, 'Draft saved')
  assert.equal(result.model.returnUrl, '/part1/v5/dashboard/drafts/Draft%20notification%20001?variant=b')
})

test('continuing a draft restores its saved fields and opens the review journey', () => {
  const userCreatedConsignments = [{ reference: 'user-created' }]
  const req = {
    params: { reference: 'Draft notification 002' },
    query: { variant: 'a' },
    session: { data: { userCreatedConsignments } }
  }

  const result = invoke('/dashboard/drafts/:reference/continue', req)

  assert.equal(result.location, '/review-extraction-a')
  assert.equal(req.session.data['dashboard-draft-reference'], 'Draft notification 002')
  assert.deepEqual(req.session.data['commodity-details-list'], [{
    commodityCode: '03021400',
    species: 'Atlantic salmon',
    weight: '4200'
  }])
  assert.equal(req.session.data['destination-port'], 'Felixstowe')
  assert.equal(req.session.data['scenario-a-exporter-name'], 'Fjord Seafoods AS')
  assert.equal(req.session.data.userCreatedConsignments, userCreatedConsignments)
})

test('unknown draft references return to the dashboard', () => {
  const result = invoke('/dashboard/drafts/:reference', {
    params: { reference: 'unknown' },
    query: { variant: 'b' },
    session: { data: {} }
  })

  assert.equal(result.location, '/dashboard?variant=b')
})

test('document confirmation requires the current checkbox before submission', () => {
  for (const body of [{}, { 'documents-confirmed': 'invalid' }, {
    'catch-certificates-confirmed': 'confirmed',
    'processing-statements-confirmed': 'confirmed',
    'non-manipulation-declarations-confirmed': 'confirmed'
  }]) {
    const data = { 'documents-confirmed': 'confirmed', 'declaration-confirmed': 'confirmed' }
    const result = {}
    const response = {
      status: (status) => { result.status = status; return response },
      render: (template, model) => { result.template = template; result.model = model },
      redirect: (location) => { result.location = location }
    }

    handlers.get('POST /declaration')({ session: { data }, body }, response)
    assert.equal(result.status, 400)
    assert.equal(result.template, 'part1/submission/declaration')
    assert.equal(result.model.errorList[0].id, 'documents-confirmed')
    assert.equal(result.model.errorList[0].message, 'Confirm the declaration above')
    assert.equal(data['documents-confirmed'], '')
    assert.equal(data['declaration-confirmed'], '')
    assert.equal(data.userCreatedConsignments, undefined)
  }
})

test('document confirmation submits when the checkbox is selected', () => {
  for (const confirmation of ['confirmed', ['confirmed']]) {
    const data = {}
    let location
    handlers.get('POST /declaration')({
      session: { data },
      body: { 'documents-confirmed': confirmation }
    }, { redirect: (value) => { location = value } })
    assert.equal(location, '/confirmation')
    assert.equal(data['documents-confirmed'], 'confirmed')
    assert.equal(data['declaration-confirmed'], 'confirmed')
    assert.equal(data.userCreatedConsignments.length, 1)
  }
})
