//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  for (const radios of document.querySelectorAll('.inspection-action-options')) {
    const additionalItems = Array.from(radios.children).filter((item) => item.classList.contains('govuk-radios__item')).slice(3)
    const extra = document.createElement('div')
    extra.id = 'inspection-additional-actions'
    const divider = document.createElement('hr')
    divider.className = 'govuk-section-break govuk-section-break--m govuk-section-break--visible'
    extra.append(divider, ...additionalItems)
    const more = document.createElement('button')
    more.type = 'button'
    more.className = 'govuk-link inspection-action-options__toggle'
    more.textContent = 'Show more options'
    more.setAttribute('aria-controls', extra.id)
    const less = document.createElement('button')
    less.type = 'button'
    less.className = more.className
    less.textContent = 'Show less'
    less.setAttribute('aria-controls', extra.id)
    extra.append(less)
    radios.append(more, extra)
    const setExpanded = (expanded) => {
      extra.hidden = !expanded
      more.hidden = expanded
      more.setAttribute('aria-expanded', String(expanded))
      less.setAttribute('aria-expanded', String(expanded))
    }
    setExpanded(additionalItems.some((item) => item.querySelector('input:checked')))
    more.addEventListener('click', () => {
      setExpanded(true)
      additionalItems[0].querySelector('input').focus()
    })
    less.addEventListener('click', () => {
      const selected = extra.querySelector('input:checked')
      if (selected) {
        selected.checked = false
        selected.dispatchEvent(new Event('change', { bubbles: true }))
      }
      setExpanded(false)
      more.focus()
    })
  }

  const updateSummaryCardsForTab = () => {
    const tab = window.location.hash === '#completed'
      ? 'completed'
      : (window.location.hash === '#active' ? 'active' : new URLSearchParams(window.location.search).get('tab') || 'active')
    for (const variant of document.querySelectorAll(`[data-summary-tab="${tab}"]`)) {
      const card = variant.closest('.inspection-dashboard__summary-card')
      card.querySelector('.inspection-dashboard__summary-value').textContent = variant.dataset.count
      card.querySelector('a').href = variant.dataset.href
    }
  }
  window.addEventListener('hashchange', updateSummaryCardsForTab)
  updateSummaryCardsForTab()

  for (const declaration of document.querySelectorAll('[data-action-declaration], [data-action-content]')) {
    const form = declaration.closest('form')
    const updateDeclaration = () => {
      const actions = (declaration.dataset.actionDeclaration || declaration.dataset.actionContent).split(' ')
      declaration.hidden = !actions.includes(form.querySelector('input[name="inspection-action"]:checked')?.value)
      for (const fileInput of declaration.querySelectorAll('input[type="file"]')) {
        fileInput.disabled = declaration.hidden
      }
    }
    for (const radio of form.querySelectorAll('input[name="inspection-action"]')) {
      radio.addEventListener('change', updateDeclaration)
    }
    updateDeclaration()
  }

  for (const search of document.querySelectorAll('[data-inspection-search]')) {
    const input = search.querySelector('input')
    const clear = search.querySelector('.inspection-search__clear')
    const list = search.querySelector('[role="listbox"]')
    const status = document.querySelector(`[data-search-status-for="${input.id}"]`)
    const options = [...new Set(Array.from(search.querySelectorAll('[data-search-options] span'), (option) => option.textContent))]
    let matches = []
    let selectedIndex = -1

    input.setAttribute('role', 'combobox')
    input.setAttribute('aria-autocomplete', 'list')
    input.setAttribute('aria-controls', list.id)
    input.setAttribute('aria-expanded', 'false')

    const close = () => {
      list.hidden = true
      selectedIndex = -1
      input.setAttribute('aria-expanded', 'false')
      input.removeAttribute('aria-activedescendant')
      status.textContent = ''
    }

    const select = (index) => {
      input.value = matches[index]
      clear.hidden = false
      close()
      input.focus()
      input.form.requestSubmit()
    }

    const render = () => {
      const query = input.value.trim().toLowerCase()
      clear.hidden = input.value.length === 0
      close()
      list.replaceChildren()
      if (!query) return
      matches = options.filter((option) => option.toLowerCase().includes(query))
      for (const [index, value] of matches.entries()) {
        const option = document.createElement('li')
        option.id = `${list.id}-${index}`
        option.setAttribute('role', 'option')
        option.setAttribute('aria-selected', 'false')
        const icon = search.querySelector('svg').cloneNode(true)
        const text = document.createElement('span')
        const matchIndex = value.toLowerCase().indexOf(query)
        const before = document.createElement('strong')
        const after = document.createElement('strong')
        before.textContent = value.slice(0, matchIndex)
        after.textContent = value.slice(matchIndex + query.length)
        text.append(before, document.createTextNode(value.slice(matchIndex, matchIndex + query.length)), after)
        option.append(icon, text)
        option.addEventListener('mousedown', (event) => event.preventDefault())
        option.addEventListener('click', () => select(index))
        list.append(option)
      }
      list.hidden = matches.length === 0
      input.setAttribute('aria-expanded', String(matches.length > 0))
      status.textContent = matches.length
        ? `${matches.length} suggestions available. Use the up and down arrow keys to navigate.`
        : 'No suggestions found. You can still search using the text entered.'
    }

    input.addEventListener('input', render)
    input.addEventListener('focus', render)
    input.addEventListener('blur', close)
    input.addEventListener('keydown', (event) => {
      if (event.isComposing) return
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        if (list.hidden) render()
        if (!matches.length || list.hidden) return
        selectedIndex = selectedIndex < 0
          ? (event.key === 'ArrowDown' ? 0 : matches.length - 1)
          : (selectedIndex + (event.key === 'ArrowDown' ? 1 : -1) + matches.length) % matches.length
        for (const [index, option] of Array.from(list.children).entries()) {
          option.setAttribute('aria-selected', String(index === selectedIndex))
        }
        const selected = list.children[selectedIndex]
        input.setAttribute('aria-activedescendant', selected.id)
        selected.scrollIntoView({ block: 'nearest' })
      } else if (event.key === 'Enter' && selectedIndex >= 0 && !list.hidden) {
        event.preventDefault()
        select(selectedIndex)
      }
    })
    clear.addEventListener('click', () => {
      input.value = ''
      input.focus()
      render()
    })
    clear.hidden = input.value.length === 0
  }

  const dashboardScrollStorageKey = 'inspection-dashboard-scroll-y'

  const rememberInspectionDashboardScroll = () => {
    window.sessionStorage.setItem(dashboardScrollStorageKey, String(window.scrollY))
  }

  const restoreInspectionDashboardScroll = () => {
    const storedScrollY = window.sessionStorage.getItem(dashboardScrollStorageKey)
    if (storedScrollY === null) return

    window.sessionStorage.removeItem(dashboardScrollStorageKey)
    const scrollY = Number.parseInt(storedScrollY, 10)
    if (!Number.isFinite(scrollY)) return

    window.requestAnimationFrame(() => window.scrollTo(0, scrollY))
  }

  const wireInspectionDashboardScrollPreservation = () => {
    const dashboardPath = window.location.pathname
    if (!dashboardPath.endsWith('/inspections')) return

    const forms = Array.from(document.querySelectorAll('form[action]'))
    for (const form of forms) {
      const actionPath = new URL(form.action, window.location.href).pathname
      if (actionPath === dashboardPath) {
        form.addEventListener('submit', rememberInspectionDashboardScroll)
      }
    }

    const links = Array.from(document.querySelectorAll('a[href]'))
    for (const link of links) {
      link.addEventListener('click', () => {
        const target = new URL(link.href, window.location.href)
        if (target.pathname === dashboardPath && target.search !== window.location.search) {
          rememberInspectionDashboardScroll()
        }
      })
    }
  }

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

    const isInteractiveElement = (element) => Boolean(element.closest('a, button, input, select, textarea, label, summary'))

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

  const wireInspectionDashboardGoodsToggle = () => {
    const toggles = Array.from(document.querySelectorAll('[data-goods-toggle]'))
    for (const toggle of toggles) {
      toggle.addEventListener('click', () => {
        const rows = document.getElementById(toggle.getAttribute('aria-controls'))
        if (!rows) return

        const expanded = toggle.getAttribute('aria-expanded') === 'true'
        rows.hidden = expanded
        toggle.setAttribute('aria-expanded', String(!expanded))
        toggle.textContent = expanded ? 'Show more' : 'Show less'
      })
    }
  }

  restoreInspectionDashboardScroll()
  wireInspectionDashboardScrollPreservation()
  wireInspectionDashboardRealtimeFilters()
  wireInspectionDashboardRowSelection()
  wireInspectionDashboardGoodsToggle()
})
