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

test('uses both restored drafts and every dashboard case from part 2', () => {
  assert.deepEqual(consignments.map((item) => item.reference), [
    'Draft notification 001',
    'Draft notification 002',
    'GB-IUU-2026-11002',
    'GB-IUU-2026-11001',
    'GB-IUU-2026-11003',
    'GB-IUU-2026-11004',
    'GB-IUU-2026-11005',
    'GB-IUU-2026-11006',
    'GB-IUU-2026-11007',
    'GB-IUU-2026-11008',
    'GB-IUU-2026-11009',
    'GB-IUU-2026-11010',
    'GB-IUU-2026-11011',
    'GB-IUU-2026-10482',
    'GB-IUU-2026-11013',
    'GB-IUU-2026-11014',
    'GB-IUU-2026-11015',
    'GB-IUU-2026-11016',
    'GB-IUU-2026-11017',
    'GB-IUU-2026-11018',
    'GB-IUU-2026-11019',
    'GB-IUU-2026-11020'
  ])
  assert.deepEqual(consignments.filter((item) => item.status !== 'draft').map((item) => [
    item.reference,
    item.arrivalOffsetDays
  ]), [
    ['GB-IUU-2026-11002', -1],
    ['GB-IUU-2026-11001', 4],
    ['GB-IUU-2026-11003', 11],
    ['GB-IUU-2026-11004', 5],
    ['GB-IUU-2026-11005', 6],
    ['GB-IUU-2026-11006', 7],
    ['GB-IUU-2026-11007', 9],
    ['GB-IUU-2026-11008', 10],
    ['GB-IUU-2026-11009', 12],
    ['GB-IUU-2026-11010', 14],
    ['GB-IUU-2026-11011', 15],
    ['GB-IUU-2026-10482', 17],
    ['GB-IUU-2026-11013', 19],
    ['GB-IUU-2026-11014', 21],
    ['GB-IUU-2026-11015', 24],
    ['GB-IUU-2026-11016', 27],
    ['GB-IUU-2026-11017', 31],
    ['GB-IUU-2026-11018', 34],
    ['GB-IUU-2026-11019', 39],
    ['GB-IUU-2026-11020', 45]
  ])
  assert.deepEqual(consignments.filter((item) => item.status === 'draft').map((item) => [
    item.reference,
    item.arrivalOffsetDays
  ]), [
    ['Draft notification 001', 3],
    ['Draft notification 002', 6]
  ])
  assert.equal(consignments.every((item) => Number.isInteger(item.arrivalOffsetDays)), true)
  const notification11003 = consignments.find((item) => item.reference === 'GB-IUU-2026-11003')
  const today = new Date()
  const startOfToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const millisecondsPerDay = 24 * 60 * 60 * 1000
  assert.equal(notification11003.arrivalOffsetDays, 11)
  assert.equal((new Date(notification11003.arrivalAt).getTime() - startOfToday) / millisecondsPerDay, 11)
  assert.equal(consignments.every((item) => (
    item.documents.every((document) => (
      document.sections.every((section) => section.fields.every((field) => field.value || field.references))
    ))
  )), true)
  assert.equal(consignments.every((item) => item.port && item.exporter && item.submittedDisplay), true)
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

  for (const consignment of consignments.filter((item) => item.status !== 'draft' && item.isAvailable !== false)) {
    assert.deepEqual(consignment.importedSpecies, expectedSpecies[consignment.reference])
  }

  const mismatchConsignment = consignments.find((item) => item.reference === 'GB-IUU-2026-11002')
  assert.equal(mismatchConsignment.speciesSummary, 'Skipjack tuna and Yellowfin tuna')
  assert.equal(mismatchConsignment.weight, '118,000 kg')
  assert.equal(mismatchConsignment.catchCertificateWeight, '152,000 kg')
})

test('copies every unavailable dashboard row from part 2', () => {
  const unavailable = consignments.filter((item) => item.isAvailable === false)

  assert.deepEqual(unavailable.map((item) => [
    item.reference,
    item.arrivalOffsetDays,
    item.importer,
    item.origin,
    item.species,
    item.commodityCodes.join(', '),
    item.weight,
    item.statusLabel,
    Object.values(item.documentCounts).join(',')
  ]), [
    ['GB-IUU-2026-11004', 5, 'Atlantic Tuna Imports Ltd', 'Spain', 'Bluefin tuna loins', '03048720', '9,700 kg', 'Submitted', '2,1,1,1'],
    ['GB-IUU-2026-11005', 6, 'Harbour Catch Imports', 'Ecuador', 'Skipjack tuna (SKJ)', '16041416', '4,200 kg', 'Under review', '2,2,0,3'],
    ['GB-IUU-2026-11006', 7, 'Ocean Harvest Imports', 'Iceland', 'Haddock fillets', '03047400', '5,600 kg', 'Accepted', '1,1,1,0'],
    ['GB-IUU-2026-11007', 9, 'Atlantic Seafoods Ltd', 'Mauritius', 'Swordfish steaks', '03038955', '8,800 kg', 'Submitted', '2,1,0,1'],
    ['GB-IUU-2026-11008', 10, 'New England Seafood International', 'Morocco', 'Octopus', '03049999, 03038910', '7,100 kg', 'Submitted', '2,2,1,2'],
    ['GB-IUU-2026-11009', 12, 'Frinsa UK', 'India', 'Prawns', '16052110', '3,900 kg', 'Submitted', '1,1,0,1'],
    ['GB-IUU-2026-11010', 14, 'Atlantic Tuna Imports Ltd', 'Ghana', 'Fresh tuna', '03023210', '2,400 kg', 'Submitted', '1,0,1,2'],
    ['GB-IUU-2026-11011', 15, 'Harbour Catch Imports', 'Vietnam', 'Crab meat', '03061792', '5,200 kg', 'Under review', '3,2,0,1'],
    ['GB-IUU-2026-10482', 17, 'Atlantic Seafoods Ltd', 'Senegal', 'Frozen yellowfin tuna', '03034320', '24,800 kg', 'Submitted', '1,1,1,1'],
    ['GB-IUU-2026-11013', 19, 'New England Seafood International', 'Namibia', 'Hake', '03036611, 03025500', '11,200 kg', 'Submitted', '2,2,1,0'],
    ['GB-IUU-2026-11014', 21, 'Frinsa UK', 'Portugal', 'Prepared sardines', '16042050', '3,400 kg', 'Rejected', '1,1,0,0'],
    ['GB-IUU-2026-11015', 24, 'Atlantic Tuna Imports Ltd', 'Thailand', 'Canned tuna', '16041418', '9,100 kg', 'Submitted', '3,2,0,4'],
    ['GB-IUU-2026-11016', 27, 'Ocean Harvest Imports', 'Indonesia', 'Mackerel', '03035400', '7,600 kg', 'Under review', '2,1,1,2'],
    ['GB-IUU-2026-11017', 31, 'Atlantic Seafoods Ltd', 'Peru', 'Anchovy fillets', '03044990', '2,800 kg', 'Submitted', '2,1,0,1'],
    ['GB-IUU-2026-11018', 34, 'New England Seafood International', 'Canada', 'Pollock', '03036700', '6,700 kg', 'Submitted', '2,2,1,1'],
    ['GB-IUU-2026-11019', 39, 'Frinsa UK', 'Chile', 'Salmon portions', '03048100', '5,300 kg', 'Submitted', '1,1,1,2'],
    ['GB-IUU-2026-11020', 45, 'Atlantic Tuna Imports Ltd', 'South Korea', 'Albacore tuna', '03048790, 03049410', '14,900 kg', 'Submitted', '4,3,1,4']
  ])

  assert.equal(unavailable.filter((item) => item.status === 'submitted').length, 12)
  assert.equal(unavailable.filter((item) => item.status === 'under-review').length, 3)
  assert.equal(unavailable.filter((item) => item.status === 'accepted').length, 1)
  assert.equal(unavailable.filter((item) => item.status === 'rejected').length, 1)
  assert.equal(unavailable.every((item) => (
    item.port !== 'Not provided' &&
    item.exporter !== 'Not provided' &&
    item.submittedDisplay !== 'Not provided' &&
    new Date(item.submittedAt) < new Date(item.arrivalAt)
  )), true)
  assert.deepEqual(
    unavailable
      .filter((item) => ['accepted', 'rejected'].includes(item.status))
      .map((item) => [item.reference, item.port, item.exporter, item.submittedDisplay]),
    [
      ['GB-IUU-2026-11006', 'Grimsby', 'Arctic Fish Export ehf.', '2 September 2026 at 14:15'],
      ['GB-IUU-2026-11014', 'Dover', 'Ramirez & Filhos, S.A.', '3 September 2026 at 09:40']
    ]
  )
  assert.equal(
    unavailable.find((item) => item.status === 'rejected').statusMessage,
    'The catch certificate could not be validated with the issuing authority.'
  )
})

test('does not show warning messages for under review consignments', () => {
  const underReviewConsignments = consignments.filter((item) => item.status === 'under-review')

  assert.equal(underReviewConsignments.length, 4)
  assert.equal(underReviewConsignments.every((item) => !item.statusMessage), true)
})

test('uses a generic missing evidence warning for the action required consignment', () => {
  const actionRequiredConsignment = consignments.find((item) => item.status === 'action-required')

  assert.equal(
    actionRequiredConsignment.statusMessage,
    'There is missing evidence. The Port Health Authority has requested that you provide additional or more up-to-date documents.'
  )
})

test('searches current submissions by reference', () => {
  const filters = getDashboardFilters({ search: '11003' })
  const results = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.deepEqual(results.map((item) => item.reference), ['GB-IUU-2026-11003'])
})

test('lists and searches restored draft notifications separately', () => {
  const filters = getDashboardFilters({ search: '002' })
  const results = filterAndSortConsignments(consignments, filters, 'drafts')

  assert.deepEqual(results.map((item) => item.reference), ['Draft notification 002'])
})

test('builds the saved review state for a draft notification', () => {
  const draft = consignments.find((item) => item.reference === 'Draft notification 002')
  const draftData = buildDraftSessionData(draft)
  const [arrivalYear, arrivalMonth, arrivalDay] = draft.arrivalAt.split('T')[0].split('-')

  assert.deepEqual(draftData['commodity-details-list'], [{
    commodityCode: '03021400',
    species: 'Atlantic salmon',
    weight: '4200'
  }])
  assert.equal(draftData['dashboard-draft-reference'], 'Draft notification 002')
  assert.equal(draftData['destination-port'], 'Felixstowe')
  assert.equal(draftData['arrival-date-day'], arrivalDay)
  assert.equal(draftData['arrival-date-month'], arrivalMonth)
  assert.equal(draftData['arrival-date-year'], arrivalYear)
  assert.equal(draftData['arrival-time-hour'], '14')
  assert.equal(draftData['arrival-time-minute'], '00')
  assert.equal(draftData['country-of-origin'], 'Norway')
  assert.equal(draftData['scenario-a-exporter-name'], 'Fjord Seafoods AS')
  assert.equal(draftData['review-importer-exporter-agent-details'], 'New England Seafood International Ltd; Fjord Seafoods AS')
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
  assert.deepEqual(results.slice(0, 4).map((item) => item.reference), [
    'GB-IUU-2026-11002',
    'GB-IUU-2026-11001',
    'GB-IUU-2026-11004',
    'GB-IUU-2026-11005'
  ])
  assert.equal(results.length, 18)
  assert.equal(results[6].reference, 'GB-IUU-2026-11003')
  assert.equal(results.at(-1).reference, 'GB-IUU-2026-11020')
})

test('sorts submissions by status priority when selected', () => {
  const filters = getDashboardFilters({
    'sort-by': 'status',
    'sort-order': 'desc'
  })
  const results = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.equal(results[0].status, 'action-required')
  assert.equal(results[0].reference, 'GB-IUU-2026-11003')
  assert.equal(results.length, 18)
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
  assert.equal(options.originOptions.length, 21)
  assert.equal(options.originOptions[0].value, '')
  assert.equal(options.originOptions.some((option) => option.value === 'South Korea'), true)
  assert.equal(options.originOptions.some((option) => option.value === 'Spain, France, Seychelles and Chile'), true)
})

test('maps supporting documents as full per-type counts', () => {
  const filters = getDashboardFilters()
  const submitted = filterAndSortConsignments(consignments, filters, 'submitted')

  assert.deepEqual(submitted[0].documentsProvidedLines, ['Catch certificate (1)'])
  assert.deepEqual(submitted[1].documentsProvidedLines, ['Catch certificate (1)'])
  assert.deepEqual(submitted[2].documentsProvidedLines, [
    'Catch certificates (2)',
    'Processing statement (1)',
    'Non-manipulation declaration (1)',
    'Additional document (1)'
  ])
  const multiDocumentCase = submitted.find((item) => item.reference === 'GB-IUU-2026-11003')
  assert.deepEqual(multiDocumentCase.documentsProvidedLines, [
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
