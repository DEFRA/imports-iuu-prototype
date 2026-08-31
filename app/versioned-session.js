const versionSessionKeys = ['part1-v1', 'part1-v2', 'part2-v1', 'part2-v2']
const initializedKey = '__versioned-session-initialized'

const setupVersionedSession = (req, res, sessionKey, defaults = {}) => {
  const sharedData = req.session.data && typeof req.session.data === 'object'
    ? req.session.data
    : {}

  if (!sharedData[initializedKey]) {
    for (const key of versionSessionKeys) {
      delete req.session[key]
    }
  }
  sharedData[initializedKey] = true

  if (!req.session[sessionKey]) {
    req.session[sessionKey] = structuredClone(defaults)
  }

  Object.defineProperty(req.session, 'data', {
    configurable: true,
    get: () => req.session[sessionKey],
    set: (value) => { req.session[sessionKey] = value }
  })
  res.locals.data = req.session[sessionKey]

  const end = res.end
  res.end = function (...args) {
    Object.defineProperty(req.session, 'data', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: sharedData
    })
    return end.apply(this, args)
  }
}

module.exports = setupVersionedSession
