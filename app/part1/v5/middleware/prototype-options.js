/**
 * Prototype options middleware
 * Manages prototype control options in session
 */

const { prototypeOptions } = require('../lib/prototype-options')

const prototypeOptionsMiddleware = (req, res, next) => {
  // Initialize prototype options in session if not present
  if (!req.session.data.prototypeOptions) {
    req.session.data.prototypeOptions = {}
  }

  // Set defaults for each option group
  for (const [key, group] of Object.entries(prototypeOptions)) {
    if (!req.session.data.prototypeOptions[key]) {
      req.session.data.prototypeOptions[key] = group.options[0].id
    }
  }

  // Make options available to all templates
  res.locals.prototypeOptions = prototypeOptions
  res.locals.selectedOptions = req.session.data.prototypeOptions

  next()
}

module.exports = prototypeOptionsMiddleware
