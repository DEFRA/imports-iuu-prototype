const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.get('/', (req, res) => {
  res.render('index')
})

router.get('/archive', (req, res) => {
  res.render('archive')
})

require('./part1/v1/routes')
require('./part1/v2/routes')
require('./part1/v3/routes')
require('./part1/v4/routes')
require('./part2/v1/routes')
require('./part2/v2/routes')
require('./part2/v3/routes')
