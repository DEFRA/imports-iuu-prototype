const govukPrototypeKit = require('govuk-prototype-kit')
const path = require('path')
const registerInspectionRoutes = require('./inspection')

const basePath = '/part2/v1'
const viewsPath = path.join(__dirname, '..', 'views')
const router = govukPrototypeKit.requests.setupRouter(basePath)
govukPrototypeKit.requests.serveDirectory(basePath + '/assets', path.join(__dirname, '..', 'assets'))

router.use((req, res, next) => {
  const sessionKey = 'part2-v1'
  const sharedData = req.session.data && typeof req.session.data === 'object' ? req.session.data : {}
  if (!sharedData['__versioned-session-initialized']) {
    for (const key of Object.keys(req.session)) {
      if (/^part\d+-v\d+$/.test(key)) {
        delete req.session[key]
      }
    }
  }
  sharedData['__versioned-session-initialized'] = true

  if (!req.session[sessionKey]) {
    req.session[sessionKey] = {}
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

  res.locals.basePath = basePath
  res.locals.showBackLink = true
  res.locals.backLinkHref = req.path === '/' || req.path === '/inspections'
    ? '/'
    : undefined

  const render = res.render.bind(res)
  res.render = (view, ...args) => {
    const localView = view.startsWith('part2/')
      ? path.join(viewsPath, view.slice('part2/'.length) + '.html')
      : view
    return render(localView, ...args)
  }

  const redirect = res.redirect.bind(res)
  res.redirect = (statusOrPath, pathOrUndefined) => {
    if (typeof statusOrPath === 'number') {
      const redirectPath = pathOrUndefined.startsWith('/') ? basePath + pathOrUndefined : pathOrUndefined
      return redirect(statusOrPath, redirectPath)
    }
    const redirectPath = statusOrPath.startsWith('/') ? basePath + statusOrPath : statusOrPath
    return redirect(redirectPath)
  }

  next()
})

router.get('/', (req, res) => res.redirect('/inspections'))

registerInspectionRoutes(router)
