const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const consignments = require('../data/importer-dashboard-consignments')
const {
  buildDraftSessionData,
  filterAndSortConsignments,
  getDashboardFilters,
  getFilterOptions
} = require('./importer-dashboard-service')

test('uses the implemented New England Seafood dashboard cases from part 2', () => {
  assert.deepEqual(consignments.map((item) => item.reference), [
    'GB-IUU-2026-11002',
    'GB-IUU-2026-11001',
    'GB-IUU-2026-11003'
  ])
  assert.deepEqual(consignments.map((item) => item.arrivalDisplay), [
    '3 September 2026 at 09:00',
    '8 September 2026',
    '18 December 2026'
  ])
  assert.equal(consignments.every((item) => (
    item.documents.every((document) => (
      document.sections.every((section) => section.fields.every((field) => field.value || field.references))
    ))
  )), true)
})

test('preserves all species and weights from the part 2 evidence comparisons', () => {
  const expectedSpecies = {
    'GB-IUU-2026-11002': [
      {
        species: 'Skipjack tuna',
        scientificName: 'Katsuwonus pelamis',
        declarationStatus: 'Declared',
        commodityCode: '030343',
        notificationWeight: '118,000 kg',
        catchCertificateWeight: '118,000 kg'
      },
      {
        species: 'Yellowfin tuna',
        scientificName: 'Thunnus albacares',
        declarationStatus: 'Not declared',
        commodityCode: '030342',
        notificationWeight: 'Not declared',
        catchCertificateWeight: '34,000 kg'
      }
    ],
    'GB-IUU-2026-11001': [
      {
        species: 'Skipjack Tuna',
        scientificName: 'Katsuwonus pelamis',
        declarationStatus: 'Declared',
        commodityCode: '030343',
        notificationWeight: '175,564 kg',
        catchCertificateWeight: '175,564 kg'
      }
    ],
    'GB-IUU-2026-11003': [
      {
        species: 'Skipjack Tuna',
        scientificName: 'Katsuwonus pelamis',
        declarationStatus: 'Declared',
        commodityCode: '030343',
        notificationWeight: '360,000 kg',
        catchCertificateWeight: '360,000 kg'
      }
    ]
  }

  for (const consignment of consignments) {
    assert.deepEqual(consignment.importedSpecies, expectedSpecies[consignment.reference])
  }

  const mismatchConsignment = consignments.find((item) => item.reference === 'GB-IUU-2026-11002')
  assert.equal(mismatchConsignment.speciesSummary, 'Skipjack tuna and Yellowfin tuna')
  assert.equal(mismatchConsignment.weight, '118,000 kg')
  assert.equal(mismatchConsignment.catchCertificateWeight, '152,000 kg')
})

test('searches current submissions by reference', () => {
  const filters = getDashboardFilters({ search: '11003' })
  const results = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.deepEqual(results.map((item) => item.reference), ['GB-IUU-2026-11003'])
})

test('builds the saved review state for a draft notification', () => {
  const draftData = buildDraftSessionData({
    reference: 'Draft notification 001',
    arrivalAt: '2026-09-10T13:00:00Z',
    arrivalDisplay: '10 September 2026 at 14:00',
    port: 'Grimsby',
    origin: 'France',
    exporter: 'SAPMER S.A.',
    species: 'Skipjack tuna',
    commodityCode: '030343',
    weight: '4,200 kg'
  })

  assert.deepEqual(draftData['commodity-details-list'], [{
    commodityCode: '030343',
    species: 'Skipjack tuna',
    weight: '4200'
  }])
  assert.equal(draftData['dashboard-draft-reference'], 'Draft notification 001')
  assert.equal(draftData['destination-port'], 'Grimsby')
  assert.equal(draftData['arrival-date-day'], '10')
  assert.equal(draftData['arrival-date-month'], '09')
  assert.equal(draftData['arrival-date-year'], '2026')
  assert.equal(draftData['arrival-time-hour'], '14')
  assert.equal(draftData['arrival-time-minute'], '00')
  assert.equal(draftData['country-of-origin'], 'France')
  assert.equal(draftData['scenario-a-exporter-name'], 'SAPMER S.A.')
  assert.equal(draftData['review-importer-exporter-agent-details'], 'New England Seafood International Ltd; SAPMER S.A.')
})

test('filters current submissions by status and origin', () => {
  const filters = getDashboardFilters({ status: 'under-review', origin: 'France' })
  const results = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.deepEqual(results.map((item) => item.reference), ['GB-IUU-2026-11002'])
})

test('sorts submissions by arrival date by default', () => {
  const filters = getDashboardFilters()
  const results = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.equal(filters.sortBy, 'arrival')
  assert.equal(filters.sortOrder, 'asc')
  assert.deepEqual(results.map((item) => item.reference), [
    'GB-IUU-2026-11002',
    'GB-IUU-2026-11001',
    'GB-IUU-2026-11003'
  ])
})

test('sorts submissions by status priority when selected', () => {
  const filters = getDashboardFilters({
    'sort-by': 'status',
    'sort-order': 'desc'
  })
  const results = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.deepEqual(results.map((item) => item.reference), [
    'GB-IUU-2026-11003',
    'GB-IUU-2026-11002',
    'GB-IUU-2026-11001'
  ])
})

test('provides distinct sorted origin filter options', () => {
  const options = getFilterOptions(consignments)

  assert.deepEqual(options.sortOptions.map((option) => option.value), [
    'status',
    'submitted',
    'arrival',
    'reference'
  ])
  assert.equal(options.sortOptions[0].text, 'Status')
  assert.deepEqual(options.draftStatusOptions.map((option) => option.value), ['', 'draft'])
  assert.deepEqual(options.submittedStatusOptions.map((option) => option.value), [
    '',
    'submitted',
    'under-review',
    'action-required'
  ])
  assert.deepEqual(options.historicalStatusOptions.map((option) => option.value), [
    '',
    'accepted',
    'rejected'
  ])
  assert.deepEqual(options.originOptions.map((option) => option.value), [
    '',
    'France',
    'Spain, France, Seychelles and Chile'
  ])
})

test('maps supporting documents as full per-type counts', () => {
  const filters = getDashboardFilters()
  const submitted = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.deepEqual(submitted[0].documentsProvidedLines, ['Catch certificate (1)'])
  assert.deepEqual(submitted[1].documentsProvidedLines, ['Catch certificate (1)'])
  assert.deepEqual(submitted[2].documentsProvidedLines, [
    'Catch certificates (4)',
    'Processing statement (1)'
  ])
})

test('keeps evidence references within their consignment', () => {
  for (const consignment of consignments) {
    const documentReferences = new Set(consignment.documents.map((document) => document.reference))

    for (const evidenceSection of consignment.evidenceSections) {
      for (const reference of evidenceSection.references) {
        assert.equal(documentReferences.has(reference), true, `${reference} is not part of ${consignment.reference}`)
      }
    }

    for (const document of consignment.documents) {
      for (const section of document.sections) {
        for (const field of section.fields) {
          for (const reference of field.references || []) {
            assert.equal(documentReferences.has(reference), true, `${reference} is not part of ${consignment.reference}`)
          }
        }
      }
    }
  }
})

test('reconciles the multi-document case and identifies its missing evidence', () => {
  const consignment = consignments.find((item) => item.reference === 'GB-IUU-2026-11003')
  const catchCertificates = consignment.documents.filter((document) => document.typeSlug === 'catch-certificate')
  const processingStatement = consignment.documents.find((document) => document.typeSlug === 'processing-statement')
  const processingDetails = processingStatement.sections.find((section) => section.title === 'Processing details')
  const referencedCertificates = processingDetails.fields.find((field) => field.label === 'Catch certificate references').references
  const missingEvidence = processingStatement.sections.find((section) => section.title === 'Missing evidence')

  assert.equal(consignment.weight, '360,000 kg')
  assert.deepEqual(catchCertificates.map((document) => document.species[0].weight), [
    '118,000 kg',
    '78,000 kg',
    '64,000 kg',
    '100,000 kg'
  ])
  assert.deepEqual(referencedCertificates, [
    'ESP/SGCI/AI/2026/101',
    'FRA 2026 CSP 000101',
    'CL-2026-44-000079-N'
  ])
  assert.deepEqual(missingEvidence.fields, [
    { label: 'Catch certificate not referenced', references: ['SYC/SFA/10/2026-SW0454'] },
    { label: 'Unrepresented certified weight', value: '64,000 kg' }
  ])
})

test('only offers locally available PDFs that match their document references', () => {
  const sourceDocuments = consignments.flatMap((consignment) => (
    consignment.documents.filter((document) => document.sourceFile)
  ))
  const dashboardDocumentsPath = path.join(__dirname, '..', 'data', 'dashboard-sample-documents')

  assert.deepEqual(sourceDocuments.map((document) => document.reference), [
    'CL-2026-44-000079-N',
    'CATCH.PS.PT.2026.0001149'
  ])

  for (const document of sourceDocuments) {
    assert.equal(fs.existsSync(path.join(dashboardDocumentsPath, document.sourceFile)), true)
  }
})
