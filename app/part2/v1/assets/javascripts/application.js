//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  const wireInspectionDashboardRealtimeFilters = () => {
    const sortControls = Array.from(document.querySelectorAll('[data-inspection-sort-control]'))
    for (const control of sortControls) {
      control.addEventListener('change', () => {
        const form = control.closest('form')
        if (form) form.requestSubmit()
      })
    }

    const realtimeFilterForms = Array.from(document.querySelectorAll('[data-inspection-realtime-filter-form]'))
    if (!realtimeFilterForms.length) return

    for (const form of realtimeFilterForms) {
      let debounceTimeout

      const submitFilters = () => {
        if (!form.checkValidity()) return
        form.requestSubmit()
      }

      const immediateControls = form.querySelectorAll('select, input[type="date"]')
      for (const control of immediateControls) {
        control.addEventListener('change', submitFilters)
      }

      const textControls = form.querySelectorAll('input[type="search"], input[type="text"]')
      for (const control of textControls) {
        control.addEventListener('input', () => {
          window.clearTimeout(debounceTimeout)
          debounceTimeout = window.setTimeout(submitFilters, 300)
        })
      }
    }
  }

  const wireInspectionDashboardRowSelection = () => {
    const rows = Array.from(document.querySelectorAll('[data-row-href]'))
    if (!rows.length) return

    const isInteractiveElement = (element) => Boolean(element.closest('a, button, input, select, textarea, label'))

    const navigateToRowTarget = (row) => {
      const targetPath = row.getAttribute('data-row-href')
      if (!targetPath) return
      window.location.assign(targetPath)
    }

    for (const row of rows) {
      row.addEventListener('click', (event) => {
        if (isInteractiveElement(event.target)) return
        navigateToRowTarget(row)
      })

      row.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        navigateToRowTarget(row)
      })
    }
  }

  wireInspectionDashboardRealtimeFilters()
  wireInspectionDashboardRowSelection()
})
