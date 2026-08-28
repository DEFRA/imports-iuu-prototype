const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.get('/', (req, res) => {
  res.render('index')
})

require('./part1/v1/routes')
require('./part1/v2/routes')
require('./part2/v1/routes')
require('./part2/v2/routes')