/**
 * Prototype options middleware
 * Manages prototype control options in session
 */

const { prototypeOptions } = require('../lib/prototype-options')

const prototypeOptionsMiddleware = (req, res, next) => {
  // Store prototype options in a separate session property that won't be reset
  if (!req.session.prototypeOptions) {
    req.session.prototypeOptions = {}
  }

  // Set defaults for each option group
  for (const [key, group] of Object.entries(prototypeOptions)) {
    if (!req.session.prototypeOptions[key]) {
      req.session.prototypeOptions[key] = group.options[0].id
    }
  }

  // Make options available to all templates
  res.locals.prototypeOptions = prototypeOptions
  res.locals.selectedOptions = req.session.prototypeOptions

  next()
}

module.exports = prototypeOptionsMiddleware
