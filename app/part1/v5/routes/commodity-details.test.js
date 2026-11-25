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
  ? { requests: { setupRouter: () => router, serveDirectory: () => {} } }
  : localRequire(name)
const routeModule = { exports: {} }
const load = vm.compileFunction(fs.readFileSync(filename, 'utf8'), ['require', 'module', 'exports', '__filename', '__dirname'])
load(routeRequire, routeModule, routeModule.exports, filename, __dirname)

const entry = {
  'commodity-entry-code': '03021900',
  'commodity-entry-species': 'Atlantic Cod',
  'commodity-entry-weight': '12.5'
}

const submit = (data, body) => {
  const result = {}
  const response = {
    status: (status) => {
      result.status = status
      return response
    },
    render: (template, model) => {
      result.template = template
      result.model = model
    },
    redirect: (location) => { result.location = location }
  }
  handlers.get('POST /commodity-details')({ session: { data }, body }, response)
  return result
}

test('adding commodities saves them and clears the entry fields before continuing', () => {
  const data = {}
  assert.equal(submit(data, { ...entry, action: 'add-another' }).location, '/commodity-details')
  assert.equal(data['commodity-details-list'].length, 1)
  assert.equal(data['commodity-details-list'][0].commodityCode, entry['commodity-entry-code'])
  assert.equal(data['commodity-details-list'][0].species, entry['commodity-entry-species'])
  assert.equal(data['commodity-details-list'][0].weight, entry['commodity-entry-weight'])
  for (const key of Object.keys(entry)) assert.equal(data[key], '')

  assert.equal(submit(data, { ...entry, 'commodity-entry-species': 'Haddock', action: 'add-another' }).location, '/commodity-details')
  assert.equal(data['commodity-details-list'].length, 2)
  assert.equal(submit(data, { action: 'continue' }).location, '/upload-documents')
})

test('continuing with a completed entry requires it to be added or removed', () => {
  for (const saved of [[], [{ commodityCode: '03036390', species: 'Haddock', weight: '10' }]]) {
    const data = { 'commodity-details-list': saved.slice() }
    const result = submit(data, { ...entry, action: 'continue' })
    assert.equal(result.status, 400)
    assert.equal(result.model.errors['add-commodity'], 'Add or remove your commodity before continuing.')
    assert.equal(result.model.errorList[0].id, 'add-commodity')
    assert.equal(data['commodity-details-list'].length, saved.length)
    for (const key of Object.keys(entry)) assert.equal(data[key], entry[key])
  }
})

test('existing required-field and weight validation still applies', () => {
  for (const action of ['continue', 'add-another']) {
    const data = {}
    const result = submit(data, { action })
    assert.equal(result.status, 400)
    assert.equal(result.model.errors['commodity-entry-code'], 'Enter a commodity code.')
    assert.equal(result.model.errors['commodity-entry-species'], 'Enter a species.')
    assert.equal(result.model.errors['commodity-entry-weight'], 'Enter a weight.')
    assert.equal(data['commodity-details-list'].length, 0)
  }

  const data = { 'commodity-details-list': [{ commodityCode: '1', species: 'Cod', weight: '1' }] }
  const partial = submit(data, { 'commodity-entry-code': '03021900', action: 'continue' })
  assert.equal(partial.model.errors['commodity-entry-species'], 'Enter a species.')
  assert.equal(partial.model.errors['commodity-entry-weight'], 'Enter a weight.')
  const invalidWeight = submit(data, { ...entry, 'commodity-entry-weight': '0', action: 'continue' })
  assert.equal(invalidWeight.model.errors['commodity-entry-weight'], 'Enter a weight greater than 0 kg, using up to 2 decimal places.')
  assert.equal(data['commodity-details-list'].length, 1)
})

test('continuing with saved commodities returns to the review page when requested', () => {
  const data = {
    'commodity-details-list': [{ commodityCode: '03021900', species: 'Atlantic Cod', weight: '12.5' }],
    'commodity-details-return-to': '/review-extraction-a'
  }
  assert.equal(submit(data, { action: 'continue' }).location, '/review-extraction-a')
  assert.equal(data['commodity-details-return-to'], '')
})
