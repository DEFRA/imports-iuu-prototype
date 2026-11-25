const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { createRequire } = require('node:module')
const defaults = require('../data/session-data-defaults')
const nunjucks = createRequire(require.resolve('govuk-prototype-kit'))('nunjucks')

const loadReviewRoutes = () => {
  const handlers = new Map()
  const router = {
    use: () => {},
    get: (route, handler) => handlers.set(`GET ${route}`, handler),
    post: (route, handler) => handlers.set(`POST ${route}`, handler)
  }
  const filename = path.join(__dirname, 'index.js')
  const localRequire = createRequire(filename)
  const routeRequire = (name) => name === 'govuk-prototype-kit'
    ? { requests: { setupRouter: () => router, serveDirectory: () => {} }, views: { addFilter: () => {} } }
    : localRequire(name)
  routeRequire.resolve = localRequire.resolve.bind(localRequire)
  const module = { exports: {} }
  const load = vm.compileFunction(fs.readFileSync(filename, 'utf8'), ['require', 'module', 'exports', '__filename', '__dirname'])
  load(routeRequire, module, module.exports, filename, __dirname)
  return handlers
}

const handlers = loadReviewRoutes()
const editRoute = '/review-extraction-a/document/:documentId/edit-group/:groupKey'

class LayoutLoader extends nunjucks.Loader {
  getSource (name) {
    assert.equal(name, 'app/part1/v5/views/layouts/main.html')
    return { src: '{% block content %}{% endblock %}', path: name }
  }
}

const reviewTemplate = fs.readFileSync(path.join(__dirname, '../views/review/review-extraction-a.html'), 'utf8')
const renderReview = (model) => new nunjucks.Environment(new LayoutLoader()).renderString(reviewTemplate, model)

test('review summarises saved consignment answers and shows CHED only when applicable', () => {
  const data = {
    ...structuredClone(defaults),
    'destination-port': 'Dover',
    'arrival-date-day': '7',
    'arrival-date-month': '2',
    'arrival-date-year': '2027',
    'arrival-time-hour': '0',
    'arrival-time-minute': '5',
    'country-of-export': 'Japan',
    'country-of-export-region': 'europe',
    'ched-number': 'CHEDP.GB.2027.1234567'
  }
  const read = () => {
    let model
    handlers.get('GET /review-extraction-a')({ session: { data }, query: {} }, {
      render: (template, result) => { model = result }
    })
    return { model, html: renderReview({ ...model, basePath: '/part1/v5' }) }
  }
  const { model, html } = read()
  assert.deepEqual(model.consignmentDetails, {
    portOfEntry: 'Dover',
    expectedDateOfArrival: '07/02/2027',
    expectedArrivalTime: '00:05',
    countryOfExport: 'Japan',
    requiresChed: true,
    chedReference: 'CHEDP.GB.2027.1234567'
  })
  for (const value of ['Consignment details', 'Dover', '07/02/2027', '00:05', 'Japan', 'CHEDP.GB.2027.1234567']) {
    assert.ok(html.includes(value))
  }
  assert.match(html, /07\/02\/2027 at 00:05/)
  assert.doesNotMatch(html, /Expected arrival time<\/dt>/)
  assert.match(html, /\/arrival-details\?returnTo=\/review-extraction-a/)
  assert.match(html, /Change<span class="govuk-visually-hidden"> consignment details<\/span>/)
  data['country-of-export'] = 'France'
  data['country-of-export-region'] = 'row'
  assert.doesNotMatch(read().html, /CHED reference|CHEDP.GB.2027.1234567/)

  data['country-of-export'] = 'Japan'
  data['ched-number'] = ''
  assert.match(read().html, /CHED reference<\/dt>\s*<dd class="govuk-summary-list__value">Not provided/)
})

test('review marks missing consignment answers as not provided instead of showing examples', () => {
  const data = structuredClone(defaults)
  data['arrival-date-day'] = '7'
  data['arrival-time-hour'] = '9'
  let model
  handlers.get('GET /review-extraction-a')({ session: { data }, query: {} }, {
    render: (template, result) => { model = result }
  })
  const html = renderReview(model)
  const card = html.slice(html.indexOf('Consignment details'), html.indexOf('Commodity details'))
  assert.equal((card.match(/>\s*Not provided\s*</g) || []).length, 3)
  assert.doesNotMatch(card, /Grimsby|12\/12\/2026|CHED reference/)
})

test('combined arrival row keeps a saved date or time when the other is missing', () => {
  const withDate = renderReview({ consignmentDetails: { expectedDateOfArrival: '07/02/2027' } })
  const withTime = renderReview({ consignmentDetails: { expectedArrivalTime: '09:30' } })
  assert.match(withDate, /07\/02\/2027 \(time not provided\)/)
  assert.match(withTime, /Date not provided \(09:30\)/)
})

test('review groups documents, shows confidence-coloured counts and links review actions', () => {
  const html = renderReview({
    basePath: '/part1/v5',
    consignmentDetails: {},
    tablePage: 1,
    totalDocuments: 2,
    tableDocuments: [{}, {}],
    tableDocumentGroups: [{
      name: 'catch_certificates.pdf',
      documents: [{
        id: 'doc-2',
        reference: 'CC-002',
        documentNumber: 'FRA 2026 CSP 000101',
        documentType: 'Catch Certificate',
        fieldsExtractedDisplay: '12/44',
        extractionConfidenceTagClass: 'govuk-tag--red',
        extractionConfidenceLabel: 'Low'
      }, {
        id: 'doc-3',
        reference: 'CC-003',
        documentNumber: '608-BFAR12-TPJ-2026-1101-CCC',
        documentType: 'Catch Certificate',
        fieldsExtractedDisplay: '36/44',
        extractionConfidenceTagClass: 'govuk-tag--yellow',
        extractionConfidenceLabel: 'Medium'
      }]
    }]
  })
  assert.match(html, /<th scope="rowgroup" rowspan="2" class="govuk-table__header govuk-!-font-weight-regular">\s*catch_certificates.pdf\s*<\/th>/)
  assert.match(html, /<th scope="row" class="govuk-table__header govuk-!-font-weight-regular">\s*FRA 2026 CSP 000101\s*<\/th>/)
  assert.match(html, /<strong class="govuk-tag govuk-tag--red">12\/44<span class="govuk-visually-hidden"> \(Low extraction confidence\)<\/span><\/strong>/)
  assert.match(html, /<strong class="govuk-tag govuk-tag--yellow">36\/44<span class="govuk-visually-hidden"> \(Medium extraction confidence\)<\/span><\/strong>/)
  assert.match(html, /<th scope="col" class="govuk-table__header">Reference<\/th>/)
  assert.match(html, /href="\/part1\/v5\/review-extraction-a\/document\/doc-2\?tablePage=1">Review<span class="govuk-visually-hidden"> FRA 2026 CSP 000101<\/span><\/a>/)
  assert.match(html, /href="\/part1\/v5\/review-extraction-a\/document\/doc-3\?tablePage=1">Review<span class="govuk-visually-hidden"> 608-BFAR12-TPJ-2026-1101-CCC<\/span><\/a>/)
  assert.doesNotMatch(html, /Extraction confidence/)
})

test('long file names are shown in full as plain table text', () => {
  const name = 'Seafood_shipment_catch_certificates_processing_statements_and_transit_documents_2027.pdf'
  const html = renderReview({
    tableDocumentGroups: [{ name, documents: [{ documentNumber: 'PS-FR-2026-0001' }] }]
  })
  assert.match(html, new RegExp(`<th scope="rowgroup"[^>]*>\\s*${name.replace(/\./g, '\\.')}\\s*</th>`))
  assert.doesNotMatch(html, /<details|<summary|review-extraction-filename|Show full file name/)
})

test('review groups example documents before paginating without losing records', () => {
  const req = { session: { data: structuredClone(defaults) }, query: {} }
  const render = () => {
    let result
    handlers.get('GET /review-extraction-a')(req, { render: (template, model) => { result = model } })
    return result
  }
  const first = render()
  const example = first.tableDocumentGroups.find((group) => group.documents.length > 1)
  assert.deepEqual(Array.from(example.documents, (document) => document.reference).sort(), ['CC-002', 'CC-005', 'PS-002'])
  assert.equal(example.documents[0].extractionConfidenceLabel, 'Low')
  assert.equal(example.documents[0].fieldsExtractedDisplay, '15/42')
  const processingStatement = example.documents.find((document) => document.reference === 'PS-002')
  assert.equal(processingStatement.fieldsExtractedDisplay, '8/8')
  assert.equal(processingStatement.extractionConfidenceTagClass, 'govuk-tag--green')
  assert.ok(example.name.endsWith('.pdf'))
  assert.equal(new Set(example.documents.map((document) => document.documentNumber)).size, 3)
  assert.equal(first.tableDocuments.length, 10)
  assert.equal(first.tableDocumentGroups.filter((group) => group.documents.length > 1).length, 2)
  req.query.tablePage = '2'
  const second = render()
  assert.equal(second.tableDocuments.length, 8)
  assert.equal(new Set([...first.tableDocuments, ...second.tableDocuments].map((document) => document.id)).size, first.totalDocuments)
  assert.ok([...first.tableDocumentGroups, ...second.tableDocumentGroups].every((group) => group.name.endsWith('.pdf')))
  const allDocuments = [...first.tableDocuments, ...second.tableDocuments]
  for (const series of ['FRA 2026 CSP', 'ESP/SGCI/AI/2026/', '608-BFAR12-TPJ-2026-110']) {
    const related = allDocuments.filter((document) => document.documentNumber.startsWith(series))
    assert.ok(related.length > 1)
    assert.equal(new Set(related.map((document) => document.sourceFileName)).size, 1, series)
  }
  const standaloneFiles = allDocuments.filter((document) =>
    allDocuments.filter((other) => other.sourceFileName === document.sourceFileName).length === 1)
  assert.equal(standaloneFiles.length, 9)
  assert.equal(first.tableDocuments.filter((document) =>
    standaloneFiles.some((standalone) => standalone.id === document.id)).length, 3)
  assert.equal(new Set(allDocuments.map((document) => document.documentNumber)).size, allDocuments.length)
  for (const document of allDocuments) {
    const numberField = document.detailSections.flatMap((section) => section.rows).find((row) => row.label.toLowerCase() === 'document number')
    assert.equal(numberField.value, document.documentNumber)
  }
  const statement = allDocuments.find((document) => document.reference === 'PS-004')
  const certificate = allDocuments.find((document) => document.reference === 'CC-011')
  const catchReference = statement.detailSections.flatMap((section) => section.rows).find((row) => row.label === 'Catch Certificate Reference')
  assert.equal(catchReference.value, certificate.documentNumber)
})

const createReview = () => {
  const req = {
    session: { data: structuredClone(defaults) },
    params: { documentId: 'doc-2', groupKey: 'catch-details' },
    query: {}
  }
  const readRows = () => {
    let rows
    handlers.get(`GET ${editRoute}`)(req, {
      render: (template, model) => { rows = model.sections.flatMap((section) => section.rows) }
    })
    return rows
  }
  const save = (values) => {
    req.body = Object.fromEntries(readRows().flatMap((row) => row.fieldControl === 'date'
      ? Object.entries(row.dateParts).map(([part, value]) => [`${row.fieldKey}-${part}`, value])
      : [[row.fieldKey, row.inputValue]]))
    Object.assign(req.body, values)
    handlers.get(`POST ${editRoute}`)(req, { redirect: () => {} })
  }
  const extractedCount = () => {
    let model
    handlers.get('GET /review-extraction-a')(req, { render: (template, result) => { model = result } })
    return model.tableDocuments.find((document) => document.id === req.params.documentId).fieldsExtractedDisplay
  }
  return { readRows, save, extractedCount }
}

test('updated-from status retains the extracted value after saving and editing again', () => {
  const { readRows, save } = createReview()
  const original = readRows().find((row) => row.fieldKey === 'productCode').value
  save({ productCode: '03036398' })
  let row = readRows().find((row) => row.fieldKey === 'productCode')
  assert.equal(row.fieldStatusLabel, `Updated from: ${original}`)
  assert.equal(row.originalValue, original)
  save({ productCode: '03036399' })
  row = readRows().find((row) => row.fieldKey === 'productCode')
  assert.equal(row.fieldStatusLabel, `Updated from: ${original}`)
})

test('newly populated fields retain the manually-added status without changing the extracted count', () => {
  const { readRows, save, extractedCount } = createReview()
  const originalCount = extractedCount()
  assert.equal(readRows().find((row) => row.fieldKey === 'catchArea').value, '')
  save({ catchArea: 'FAO 27' })
  const row = readRows().find((row) => row.fieldKey === 'catchArea')
  assert.equal(row.fieldStatusLabel, 'Manually added')
  assert.equal(extractedCount(), originalCount)
})
