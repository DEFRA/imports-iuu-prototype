const getBackLinkHref = (req, basePath, dashboardReturnTo) => {
  const localPath = req.path.startsWith(basePath)
    ? req.path.slice(basePath.length) || '/'
    : req.path
  const notificationMatch = localPath.match(/^\/inspection\/([^/]+)(?:\/.*)?$/)
  if (notificationMatch) {
    const notificationOverview = `${basePath}/inspection/${notificationMatch[1]}`
    if (localPath !== `/inspection/${notificationMatch[1]}`) {
      return notificationOverview
    }

    try {
      const returnUrl = new URL(dashboardReturnTo, 'http://localhost')
      if (returnUrl.pathname === `${basePath}/inspections`) {
        return `${returnUrl.pathname}${returnUrl.search}`
      }
    } catch {}

    return `${basePath}/inspections`
  }

  if (localPath === '/inspections/completed') {
    return `${basePath}/inspections?tab=completed#completed`
  }

  return localPath === '/' || localPath === '/inspections'
    ? '/'
    : `${basePath}/inspections`
}

module.exports = getBackLinkHref