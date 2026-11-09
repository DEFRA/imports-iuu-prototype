//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  const sortControls = Array.from(document.querySelectorAll('[data-importer-sort-control]'))
  for (const control of sortControls) {
    control.addEventListener('change', () => {
      const form = control.closest('form')
      if (form) form.requestSubmit()
    })
  }

  const referenceToggles = Array.from(document.querySelectorAll('[data-reference-toggle]'))
  for (const toggle of referenceToggles) {
    const references = document.getElementById(toggle.getAttribute('aria-controls'))
    if (!references) continue

    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true'
      references.hidden = expanded
      toggle.setAttribute('aria-expanded', String(!expanded))
      toggle.textContent = expanded ? 'Show more' : 'Show less'
    })
  }

  const buildGeneratedDocumentReference = (prefix, count) => {
    const year = new Date().getFullYear()
    const paddedCount = String(count).padStart(4, '0')
    return prefix + '.' + year + '.' + paddedCount
  }

  const uploadIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false" style="vertical-align:middle; margin-right:0.25rem"><circle cx="10" cy="10" r="10" fill="#00703c"></circle><path d="M5 10l3.5 3.5L15 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>'

  const wireInstantUploadPreview = ({ inputId, sectionId, listId, pendingId, referencePrefix, selectedFlagId }) => {
    const fileInput = document.getElementById(inputId)
    const uploadedSection = document.getElementById(sectionId)
    const uploadedList = document.getElementById(listId)
    const selectedFlagInput = selectedFlagId ? document.getElementById(selectedFlagId) : null

    if (!fileInput || !uploadedSection || !uploadedList) {
      return
    }

    fileInput.addEventListener('change', () => {
      const existingPreview = document.getElementById(pendingId)
      if (existingPreview) {
        existingPreview.remove()
      }

      const selectedFile = fileInput.files && fileInput.files[0]
      if (selectedFile) {
        if (selectedFlagInput) selectedFlagInput.value = 'true'
        uploadedSection.style.display = ''

        const serverItemsCount = uploadedList.querySelectorAll('li[data-uploaded-source="server"]').length
        const generatedReference = buildGeneratedDocumentReference(referencePrefix, serverItemsCount + 1)

        const previewItem = document.createElement('li')
        previewItem.id = pendingId
        previewItem.style.display = 'flex'
        previewItem.style.alignItems = 'center'
        previewItem.style.gap = '1rem'
        previewItem.style.padding = '0.5rem 0'
        previewItem.style.borderBottom = '1px solid #b1b4b6'

        const previewText = document.createElement('span')
        previewText.className = 'govuk-body'
        previewText.style.flex = '1'
        previewText.style.marginBottom = '0'
        previewText.innerHTML = uploadIconSvg

        const filename = document.createElement('strong')
        filename.textContent = generatedReference + '.pdf'
        previewText.appendChild(filename)

        previewItem.appendChild(previewText)
        uploadedList.appendChild(previewItem)
      } else {
        if (selectedFlagInput) selectedFlagInput.value = 'false'
        if (!uploadedList.querySelector('li[data-uploaded-source="server"]')) {
          uploadedSection.style.display = 'none'
        }
      }
    })
  }

  wireInstantUploadPreview({
    inputId: 'catch-certificate-file',
    sectionId: 'certificates-uploaded-section',
    listId: 'certificates-uploaded-list',
    pendingId: 'pending-certificate-upload',
    referencePrefix: 'CATCH.CC.UPLOAD',
    selectedFlagId: 'catch-certificate-selected'
  })

  wireInstantUploadPreview({
    inputId: 'processing-statement-file',
    sectionId: 'processing-documents-uploaded-section',
    listId: 'processing-documents-uploaded-list',
    pendingId: 'pending-processing-statement-upload',
    referencePrefix: 'CATCH.PS.UPLOAD',
    selectedFlagId: 'processing-statement-selected'
  })

  wireInstantUploadPreview({
    inputId: 'nmd-file',
    sectionId: 'nmd-documents-uploaded-section',
    listId: 'nmd-documents-uploaded-list',
    pendingId: 'pending-nmd-upload',
    referencePrefix: 'CATCH.NMD.UPLOAD',
    selectedFlagId: 'nmd-selected'
  })

  for (const countrySearch of document.querySelectorAll('[data-module="app-country-search"]')) {
    const countryOptions = JSON.parse(countrySearch.querySelector('.app-country-search__data').textContent)
    const countriesByValue = new Map(countryOptions.map((country) => [country.value, country]))
    const input = countrySearch.querySelector('.app-commodity-search__input')
    const searchBox = countrySearch.querySelector('.app-commodity-search')
    const button = countrySearch.querySelector('.app-commodity-search__button')
    const results = countrySearch.querySelector('.app-commodity-search__results')
    const status = countrySearch.querySelector('.app-country-search__status')
    const valueInput = countrySearch.querySelector('.app-country-search__value')
    const regionCodePrefix = document.querySelector('#region-of-origin-code-prefix')
    const form = countrySearch.closest('form')
    const chedConditional = form.querySelector('#conditional-ched-number')
    let selectedCountry = valueInput.value

    const announce = (message) => {
      status.textContent = message
    }

    const setExpanded = (isExpanded) => {
      searchBox.setAttribute('aria-expanded', isExpanded ? 'true' : 'false')
      input.setAttribute('aria-expanded', isExpanded ? 'true' : 'false')
      button.setAttribute('aria-expanded', isExpanded ? 'true' : 'false')
      button.setAttribute('aria-label', isExpanded ? 'Hide country options' : 'Show country options')
      button.querySelector('.govuk-visually-hidden').textContent = isExpanded ? 'Hide country options' : 'Show country options'
      searchBox.classList.toggle('app-commodity-search--open', isExpanded)
    }

    const closeResults = () => {
      results.hidden = true
      results.replaceChildren()
      activeIndex = -1
      input.removeAttribute('aria-activedescendant')
      setExpanded(false)
    }

    const updateRegionCodePrefix = (country) => {
      const selectedCountry = countriesByValue.get(country)
      if (regionCodePrefix) {
        regionCodePrefix.textContent = selectedCountry ? selectedCountry.regionCodePrefix : ''
      }
    }

    const updateChedConditional = (country) => {
      if (!chedConditional) {
        return
      }
      const selectedCountry = countriesByValue.get(country)
      chedConditional.hidden = !(selectedCountry && !selectedCountry.isEuropean)
    }

    const updateValue = (country) => {
      selectedCountry = country
      input.value = country
      valueInput.value = country
      updateRegionCodePrefix(country)
      updateChedConditional(country)

      countrySearch.dispatchEvent(new CustomEvent('app-country-search:change', {
        bubbles: true,
        detail: { country }
      }))
    }

    const selectCountry = (country) => {
      updateValue(country)
      closeResults()
      announce('Selected ' + country)
    }

    const countryMatches = (option, query) => {
      return option.label.toLowerCase().includes(query) ||
        (option.parent && option.parent.toLowerCase().includes(query))
    }

    const sortCountryResults = (options) => {
      return [...options].sort((left, right) => {
        return left.label.localeCompare(right.label, 'en', { sensitivity: 'base' }) ||
          (left.parent || '').localeCompare(right.parent || '', 'en', { sensitivity: 'base' })
      })
    }

    const appendHighlightedLabel = (element, label, query) => {
      if (!query) {
        element.textContent = label
        return
      }

      const matchIndex = label.toLowerCase().indexOf(query)

      if (matchIndex === -1) {
        element.textContent = label
        return
      }

      element.append(
        document.createTextNode(label.slice(0, matchIndex)),
        Object.assign(document.createElement('strong'), {
          className: 'app-commodity-search__match',
          textContent: label.slice(matchIndex, matchIndex + query.length)
        }),
        document.createTextNode(label.slice(matchIndex + query.length))
      )
    }

    let activeIndex = -1

    const renderResults = (showAll = false) => {
      const trimmedQuery = input.value.trim()
      const query = showAll ? '' : trimmedQuery.toLowerCase()

      const matches = sortCountryResults(
        countryOptions.filter((option) => !query || countryMatches(option, query))
      )
      results.replaceChildren()
      activeIndex = -1
      input.removeAttribute('aria-activedescendant')

      if (!matches.length) {
        const row = document.createElement('li')
        const message = document.createElement('span')

        row.className = 'app-commodity-search__row app-commodity-search__row--message'
        row.setAttribute('role', 'option')
        row.setAttribute('aria-disabled', 'true')
        message.className = 'app-commodity-search__no-results'
        message.textContent = 'No results found'
        row.append(message)
        results.append(row)
        results.hidden = false
        setExpanded(true)
        announce('No results found')
        return
      }

      matches.forEach((option, index) => {
        const row = document.createElement('li')
        const isSelected = selectedCountry === option.value

        row.className = 'app-commodity-search__row' +
          (index % 2 === 1 ? ' app-commodity-search__row--alt' : '')
        row.id = results.id + '-option-' + index
        row.setAttribute('role', 'option')
        row.setAttribute('aria-selected', isSelected ? 'true' : 'false')
        row.dataset.countryValue = option.value
        row.className += ' app-country-search__option' +
          (isSelected ? ' app-country-search__option--selected' : '')
        appendHighlightedLabel(row, option.label, query)
        row.addEventListener('click', () => selectCountry(option.value))
        results.append(row)
      })

      results.hidden = false
      setExpanded(true)
      announce(matches.length + ' result' + (matches.length === 1 ? '' : 's') + ' available')
    }

    const setActiveOption = (index) => {
      const options = [...results.querySelectorAll('[data-country-value]')]
      if (!options.length) {
        return
      }

      activeIndex = (index + options.length) % options.length
      options.forEach((option, optionIndex) => {
        option.classList.toggle('app-country-search__option--active', optionIndex === activeIndex)
      })
      input.setAttribute('aria-activedescendant', options[activeIndex].id)
      options[activeIndex].scrollIntoView({ block: 'nearest' })
    }

    results.addEventListener('mousedown', (event) => {
      event.preventDefault()
    })

    input.addEventListener('input', () => {
      if (input.value !== selectedCountry) {
        selectedCountry = ''
        valueInput.value = ''
        updateRegionCodePrefix('')

        countrySearch.dispatchEvent(new CustomEvent('app-country-search:change', {
          bubbles: true,
          detail: { country: '' }
        }))
      }

      renderResults()
    })

    input.addEventListener('focus', () => {
      if (selectedCountry && input.value === selectedCountry) {
        input.select()
      }
      renderResults(true)
    })

    input.addEventListener('click', () => {
      if (results.hidden) {
        renderResults(true)
      }
    })

    input.addEventListener('blur', () => {
      window.setTimeout(() => {
        if (!countrySearch.contains(document.activeElement)) {
          closeResults()
        }

        if (selectedCountry && input.value !== selectedCountry) {
          input.value = selectedCountry
        }
      }, 200)
    })

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeResults()
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (results.hidden) {
          renderResults(true)
        }
        setActiveOption(activeIndex < 0 ? 0 : activeIndex + 1)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (results.hidden) {
          renderResults(true)
        }
        setActiveOption(activeIndex < 0 ? results.querySelectorAll('[data-country-value]').length - 1 : activeIndex - 1)
      } else if (event.key === 'Enter' && !results.hidden && activeIndex >= 0) {
        event.preventDefault()
        const activeOption = results.querySelectorAll('[data-country-value]')[activeIndex]
        selectCountry(activeOption.dataset.countryValue)
      }
    })

    button.addEventListener('mousedown', (event) => {
      event.preventDefault()
    })

    button.addEventListener('click', (event) => {
      event.preventDefault()
      if (results.hidden) {
        renderResults(true)
        input.focus()
      } else {
        closeResults()
      }
    })

    form.addEventListener('submit', () => {
      if (selectedCountry) {
        updateValue(selectedCountry)
        return
      }

      const typedCountry = input.value.trim().toLowerCase()
      const exactMatch = countryOptions.find((option) => {
        return option.value.toLowerCase() === typedCountry ||
          option.label.toLowerCase() === typedCountry
      })

      if (exactMatch) {
        updateValue(exactMatch.value)
      }
    })

    updateRegionCodePrefix(selectedCountry)
    updateChedConditional(selectedCountry)
  }

  const commoditySearch = document.querySelector('[data-module="app-commodity-search"]')

  if (commoditySearch) {
    const minimumSearchLength = 3
    const commodityOptions = JSON.parse(commoditySearch.querySelector('.app-commodity-search__data').textContent)
    const initialSelections = JSON.parse(commoditySearch.querySelector('.app-commodity-search__initial').textContent)
    const speciesById = new Map()

    commodityOptions.forEach((commodity) => {
      commodity.species.forEach((species) => {
        speciesById.set(species.id, { commodity, species })
      })
    })

    const selectedIds = new Set(initialSelections.filter((selectionId) => speciesById.has(selectionId)))
    const input = commoditySearch.querySelector('.app-commodity-search__input')
    const searchBox = commoditySearch.querySelector('.app-commodity-search')
    const button = commoditySearch.querySelector('.app-commodity-search__button')
    const results = commoditySearch.querySelector('.app-commodity-search__results')
    const status = commoditySearch.querySelector('.app-commodity-search__status')
    const selectedPanel = commoditySearch.querySelector('.app-commodity-search__selected')
    const selectedHeading = commoditySearch.querySelector('.app-commodity-search__selected-heading')
    const selectedList = commoditySearch.querySelector('.app-commodity-search__selected-list')
    const selectedInputs = commoditySearch.querySelector('.app-commodity-search__selected-inputs')
    const clearAllButton = commoditySearch.querySelector('.app-commodity-search__selected-clear')

    const escapeHtml = (value) => {
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    }

    const textMatchesQuery = (text, query) => {
      const queryWords = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
      const textWords = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

      if (!queryWords.length) return false

      if (queryWords.length === 1) {
        return textWords.some((word) => word.startsWith(queryWords[0]))
      }

      return textWords.some((_, index) => {
        return queryWords.every((queryWord, offset) => {
          const textWord = textWords[index + offset]
          return textWord && textWord.startsWith(queryWord)
        })
      })
    }

    const highlightMatch = (text, query) => {
      const escapedText = escapeHtml(text)
      const queryWords = query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

      if (!queryWords.length) return escapedText

      return escapedText.replace(/[a-z0-9]+/gi, (word) => {
        return queryWords.some((queryWord) => word.toLowerCase().startsWith(queryWord))
          ? '<strong class="app-commodity-search__match">' + word + '</strong>'
          : word
      })
    }

    const formatCommodity = (commodity) => {
      return commodity.name + ' (' + commodity.code + ')'
    }

    const formatSpecies = (species) => {
      return species.commonName + ' (' + species.label + ')'
    }

    const speciesMatchesQuery = (species, query) => {
      return textMatchesQuery(species.commonName, query) ||
        textMatchesQuery(species.label, query) ||
        species.faoCode.toLowerCase().startsWith(query)
    }

    const commodityMatchesQuery = (commodity, query) => {
      return commodity.code.toLowerCase().startsWith(query) ||
        commodity.tariffCommodityCodes.some((code) => code.startsWith(query)) ||
        textMatchesQuery(commodity.name, query)
    }

    const getMatches = (query) => {
      const normalisedQuery = query.trim().toLowerCase()

      if (normalisedQuery.length < minimumSearchLength) return []

      return commodityOptions
        .map((commodity) => ({
          commodity,
          species: commodityMatchesQuery(commodity, normalisedQuery)
            ? commodity.species
            : commodity.species.filter((species) => {
                return speciesMatchesQuery(species, normalisedQuery)
              })
        }))
        .filter((group) => group.species.length > 0)
    }

    const setExpanded = (isExpanded) => {
      searchBox.setAttribute('aria-expanded', isExpanded ? 'true' : 'false')
    }

    const announce = (message) => {
      status.textContent = message
    }

    const closeResults = () => {
      results.hidden = true
      results.replaceChildren()
      setExpanded(false)
    }

    const updateSelectedInputs = () => {
      selectedInputs.replaceChildren()

      selectedIds.forEach((selectionId) => {
        const hiddenInput = document.createElement('input')
        hiddenInput.type = 'hidden'
        hiddenInput.name = 'selected-commodities'
        hiddenInput.value = selectionId
        selectedInputs.append(hiddenInput)
      })
    }

    const renderSelectedPanel = () => {
      const selectedGroups = commodityOptions
        .map((commodity) => ({
          commodity,
          species: commodity.species.filter((species) => selectedIds.has(species.id))
        }))
        .filter((group) => group.species.length > 0)
      const hasSelections = selectedIds.size > 0

      selectedPanel.hidden = !hasSelections
      selectedHeading.textContent = hasSelections
        ? selectedIds.size + ' selected'
        : ''
      selectedList.replaceChildren()

      selectedGroups.forEach(({ commodity, species }) => {
        const entry = document.createElement('li')
        const entryLabel = document.createElement('p')
        const entryName = document.createElement('strong')
        const chips = document.createElement('div')

        entry.className = 'app-commodity-search__selected-entry'
        entryLabel.className = 'app-commodity-search__selected-entry-label'
        entryName.className = 'app-commodity-search__selected-entry-name'
        entryName.textContent = formatCommodity(commodity)
        entryLabel.append(entryName, ':')
        chips.className = 'app-commodity-search__selected-chips'

        species.forEach((speciesItem) => {
          const item = document.createElement('div')
          const label = document.createElement('span')
          const removeButton = document.createElement('button')

          item.className = 'app-commodity-search__selected-item'
          label.className = 'app-commodity-search__selected-label'
          label.textContent = speciesItem.label
          removeButton.className = 'app-commodity-search__selected-remove'
          removeButton.type = 'button'
          removeButton.dataset.selectionId = speciesItem.id
          removeButton.setAttribute('aria-label', 'Remove ' + speciesItem.label)
          removeButton.innerHTML = '<span class="govuk-visually-hidden">Remove ' +
            escapeHtml(speciesItem.label) + '</span>'
          item.append(label, removeButton)
          chips.append(item)
        })

        entry.append(entryLabel, chips)
        selectedList.append(entry)
      })

      updateSelectedInputs()
    }

    const renderResults = (query) => {
      const trimmedQuery = query.trim()

      if (trimmedQuery.length < minimumSearchLength) {
        closeResults()
        return
      }

      const matches = getMatches(trimmedQuery)
      results.replaceChildren()

      if (!matches.length) {
        const row = document.createElement('li')
        const message = document.createElement('span')
        row.className = 'app-commodity-search__row app-commodity-search__row--message'
        message.className = 'app-commodity-search__no-results'
        message.textContent = 'No results found'
        row.append(message)
        results.append(row)
        results.hidden = false
        setExpanded(true)
        announce('No results found')
        return
      }

      let rowIndex = 0
      let speciesRowCount = 0

      matches.forEach(({ commodity, species }) => {
        const headerRow = document.createElement('li')
        const headerLabel = document.createElement('span')

        headerRow.className = 'app-commodity-search__row app-commodity-search__row--commodity-header' +
          (rowIndex % 2 === 1 ? ' app-commodity-search__row--alt' : '')
        headerLabel.className = 'app-commodity-search__row-label app-commodity-search__row-label--heading'
        headerLabel.innerHTML = highlightMatch(formatCommodity(commodity), trimmedQuery)
        headerRow.append(headerLabel)
        results.append(headerRow)
        rowIndex += 1

        species.forEach((speciesItem) => {
          const row = document.createElement('li')
          const checkboxContainer = document.createElement('div')
          const checkboxItem = document.createElement('div')
          const checkbox = document.createElement('input')
          const label = document.createElement('label')
          const checkboxId = 'commodity-species-' + speciesItem.id.replace(/[^a-z0-9-]/gi, '-')

          row.className = 'app-commodity-search__row app-commodity-search__row--species' +
            (rowIndex % 2 === 1 ? ' app-commodity-search__row--alt' : '')
          checkboxContainer.className = 'govuk-checkboxes app-commodity-search__checkbox-item'
          checkboxItem.className = 'govuk-checkboxes__item'
          checkbox.className = 'govuk-checkboxes__input app-commodity-search__checkbox-input'
          checkbox.id = checkboxId
          checkbox.type = 'checkbox'
          checkbox.value = speciesItem.id
          checkbox.checked = selectedIds.has(speciesItem.id)
          label.className = 'govuk-label govuk-checkboxes__label app-commodity-search__row-label'
          label.htmlFor = checkboxId
          label.innerHTML = highlightMatch(formatSpecies(speciesItem), trimmedQuery)
          checkboxItem.append(checkbox, label)
          checkboxContainer.append(checkboxItem)
          row.append(checkboxContainer)
          results.append(row)
          rowIndex += 1
          speciesRowCount += 1
        })
      })

      results.hidden = false
      setExpanded(true)
      announce(speciesRowCount + ' result' + (speciesRowCount === 1 ? '' : 's') + ' available')
    }

    results.addEventListener('change', (event) => {
      const checkbox = event.target.closest('.app-commodity-search__checkbox-input')
      if (!checkbox) return

      if (checkbox.checked) {
        selectedIds.add(checkbox.value)
      } else {
        selectedIds.delete(checkbox.value)
      }

      renderSelectedPanel()
      renderResults(input.value)
      announce(selectedIds.size + ' ' + (selectedIds.size === 1 ? 'option' : 'options') + ' selected')
    })

    selectedList.addEventListener('click', (event) => {
      const removeButton = event.target.closest('.app-commodity-search__selected-remove')
      if (!removeButton) return

      event.preventDefault()
      selectedIds.delete(removeButton.dataset.selectionId)
      renderSelectedPanel()
      closeResults()
      announce(selectedIds.size
        ? selectedIds.size + ' ' + (selectedIds.size === 1 ? 'option' : 'options') + ' selected'
        : '')
    })

    clearAllButton.addEventListener('click', (event) => {
      event.preventDefault()
      selectedIds.clear()
      renderSelectedPanel()
      closeResults()
      announce('')
    })

    input.addEventListener('input', () => renderResults(input.value))
    input.addEventListener('focus', () => {
      if (input.value.trim().length >= minimumSearchLength) {
        renderResults(input.value)
      }
    })
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeResults()
    })

    button.addEventListener('click', (event) => {
      event.preventDefault()
      if (input.value.trim().length >= minimumSearchLength) {
        renderResults(input.value)
        input.focus()
      }
    })

    document.addEventListener('pointerdown', (event) => {
      if (!commoditySearch.contains(event.target)) closeResults()
    })

    renderSelectedPanel()
    if (input.value.trim().length >= minimumSearchLength) {
      renderResults(input.value)
    }
  }

  for (const search of document.querySelectorAll('[data-importer-search]')) {
    const input = search.querySelector('input')
    const clear = search.querySelector('.importer-search__clear')
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
          : (event.key === 'ArrowDown'
              ? (selectedIndex < matches.length - 1 ? selectedIndex + 1 : 0)
              : (selectedIndex > 0 ? selectedIndex - 1 : matches.length - 1))
        const selected = list.children[selectedIndex]
        selected.setAttribute('aria-selected', 'true')
        input.setAttribute('aria-activedescendant', selected.id)
        selected.scrollIntoView({ block: 'nearest' })
        for (const [index, option] of Array.from(list.children).entries()) {
          if (index !== selectedIndex) option.setAttribute('aria-selected', 'false')
        }
      } else if (event.key === 'Enter') {
        event.preventDefault()
        if (selectedIndex >= 0) {
          select(selectedIndex)
        } else if (matches.length > 0) {
          select(0)
        } else {
          input.form.requestSubmit()
        }
      } else if (event.key === 'Tab') {
        close()
      }
    })
    clear.addEventListener('click', () => {
      input.value = ''
      clear.hidden = true
      input.focus()
      render()
    })
  }

  for (const multiSelect of document.querySelectorAll('[data-dashboard-multiselect]')) {
    const options = JSON.parse(multiSelect.querySelector('.app-dashboard-multiselect__options').textContent)
    const initialSelectedValues = JSON.parse(multiSelect.querySelector('.app-dashboard-multiselect__selected').textContent)
    const filterName = multiSelect.dataset.filterName
    const filterLabel = multiSelect.dataset.filterLabel
    const form = multiSelect.closest('form')
    const input = multiSelect.querySelector('.app-commodity-search__input')
    const searchBox = multiSelect.querySelector('.app-commodity-search')
    const toggle = multiSelect.querySelector('.app-commodity-search__button')
    const results = multiSelect.querySelector('.app-commodity-search__results')
    const status = multiSelect.querySelector('.app-country-search__status')
    const selectedInputs = multiSelect.querySelector('.app-dashboard-multiselect__inputs')
    const optionsByValue = new Map(options.map((option) => [option.value, option]))
    const selectedValues = new Set(initialSelectedValues)
    const defaultPlaceholder = input.placeholder

    const announce = (message) => {
      status.textContent = message
    }

    const setExpanded = (isExpanded) => {
      searchBox.setAttribute('aria-expanded', String(isExpanded))
      input.setAttribute('aria-expanded', String(isExpanded))
      toggle.setAttribute('aria-expanded', String(isExpanded))
      toggle.setAttribute('aria-label', `${isExpanded ? 'Hide' : 'Show'} ${filterLabel.toLowerCase()} options`)
      toggle.querySelector('.govuk-visually-hidden').textContent = `${isExpanded ? 'Hide' : 'Show'} ${filterLabel.toLowerCase()} options`
      searchBox.classList.toggle('app-commodity-search--open', isExpanded)
    }

    const closeResults = () => {
      results.hidden = true
      setExpanded(false)
    }

    const updateSelectedInputs = () => {
      selectedInputs.replaceChildren()
      selectedValues.forEach((value) => {
        const hiddenInput = document.createElement('input')
        hiddenInput.type = 'hidden'
        hiddenInput.name = filterName
        hiddenInput.value = value
        selectedInputs.append(hiddenInput)
      })
    }

    const renderSelected = () => {
      const selectedCount = selectedValues.size
      if (selectedCount === 1) {
        const [value] = selectedValues
        const option = optionsByValue.get(value)
        input.placeholder = option?.description ? `${option.label} - ${option.description}` : (option?.label || value)
      } else if (selectedCount > 1) {
        const selectedLabel = filterName === 'species' ? 'species' : 'commodities'
        input.placeholder = `${selectedCount} ${selectedLabel} selected`
      } else {
        input.placeholder = defaultPlaceholder
      }

      updateSelectedInputs()
    }

    const renderResults = (showAll = false) => {
      const query = input.value.trim().toLowerCase()
      const matches = options.filter((option) => {
        if (!query) return showAll
        return [option.label, ...(option.searchTerms || [])]
          .some((value) => value.toLowerCase().includes(query))
      })
      results.replaceChildren()

      if (!matches.length) {
        const row = document.createElement('li')
        row.className = 'app-commodity-search__row app-commodity-search__row--message'
        const message = document.createElement('span')
        message.className = 'app-commodity-search__no-results'
        message.textContent = query ? 'No results found' : 'No options available'
        row.append(message)
        results.append(row)
        results.hidden = false
        setExpanded(true)
        announce(message.textContent)
        return
      }

      matches.forEach((option, index) => {
        const row = document.createElement('li')
        const checkboxContainer = document.createElement('div')
        const checkboxItem = document.createElement('div')
        const checkbox = document.createElement('input')
        const label = document.createElement('label')
        const checkboxId = `${results.id}-option-${index}`

        row.className = 'app-commodity-search__row app-commodity-search__row--species' +
          (index % 2 === 1 ? ' app-commodity-search__row--alt' : '')
        checkboxContainer.className = 'govuk-checkboxes app-commodity-search__checkbox-item'
        checkboxItem.className = 'govuk-checkboxes__item'
        checkbox.className = 'govuk-checkboxes__input'
        checkbox.id = checkboxId
        checkbox.type = 'checkbox'
        checkbox.name = filterName
        checkbox.value = option.value
        checkbox.checked = selectedValues.has(option.value)
        label.className = 'govuk-label govuk-checkboxes__label app-commodity-search__row-label'
        label.htmlFor = checkboxId
        const code = document.createElement('span')
        code.className = 'app-commodity-search__commodity-code'
        code.textContent = option.label
        label.classList.add('app-commodity-search__commodity-option')
        label.append(code)
        if (option.description) {
          const description = document.createElement('span')
          description.className = 'app-commodity-search__commodity-description'
          description.textContent = option.description
          label.append(description)
        }
        checkboxItem.append(checkbox, label)
        checkboxContainer.append(checkboxItem)
        row.append(checkboxContainer)
        results.append(row)
      })

      results.hidden = false
      setExpanded(true)
      announce(`${matches.length} ${matches.length === 1 ? 'option' : 'options'} available`)
    }

    const renderCurrentResults = () => renderResults(input.value.trim().length === 0)

    results.addEventListener('change', (event) => {
      const checkbox = event.target.closest('input[type="checkbox"]')
      if (!checkbox) return

      if (checkbox.checked) {
        selectedValues.add(checkbox.value)
      } else {
        selectedValues.delete(checkbox.value)
      }
      input.value = ''
      renderSelected()
      renderCurrentResults()
      announce(`${selectedValues.size} ${selectedValues.size === 1 ? 'option' : 'options'} selected`)
    })

    input.addEventListener('focus', renderCurrentResults)
    input.addEventListener('input', renderCurrentResults)
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeResults()
    })
    toggle.addEventListener('mousedown', (event) => event.preventDefault())
    toggle.addEventListener('click', () => {
      if (results.hidden) {
        renderCurrentResults()
        input.focus()
      } else {
        closeResults()
      }
    })
    form.addEventListener('submit', () => {
      results.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => checkbox.remove())
    })
    document.addEventListener('pointerdown', (event) => {
      if (!multiSelect.contains(event.target)) closeResults()
    })

    renderSelected()
  }

})
