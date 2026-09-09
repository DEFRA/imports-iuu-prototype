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

  const countrySearch = document.querySelector('[data-module="app-country-search"]')

  if (countrySearch) {
    const minimumSearchLength = 3
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
    let selectedCountry = valueInput.value

    const announce = (message) => {
      status.textContent = message
    }

    const setExpanded = (isExpanded) => {
      searchBox.setAttribute('aria-expanded', isExpanded ? 'true' : 'false')
      searchBox.classList.toggle('app-commodity-search--open', isExpanded)
    }

    const closeResults = () => {
      results.hidden = true
      results.replaceChildren()
      setExpanded(false)
    }

    const updateRegionCodePrefix = (country) => {
      const selectedCountry = countriesByValue.get(country)
      regionCodePrefix.textContent = selectedCountry ? selectedCountry.regionCodePrefix : ''
    }

    const updateValue = (country) => {
      selectedCountry = country
      input.value = country
      valueInput.value = country
      updateRegionCodePrefix(country)

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

    const sortCountryResults = (options, query) => {
      const getSortKey = (option) => {
        if (!option.parent) {
          return { tier: 0, group: '', label: option.label }
        }

        return {
          tier: option.parent.toLowerCase().includes(query) ? 1 : 2,
          group: option.parent,
          label: option.label
        }
      }

      return [...options].sort((left, right) => {
        const leftKey = getSortKey(left)
        const rightKey = getSortKey(right)

        return leftKey.tier - rightKey.tier ||
          leftKey.group.localeCompare(rightKey.group) ||
          leftKey.label.localeCompare(rightKey.label)
      })
    }

    const appendHighlightedLabel = (element, label, query) => {
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

    const renderResults = () => {
      const trimmedQuery = input.value.trim()
      const query = trimmedQuery.toLowerCase()

      if (query.length < minimumSearchLength) {
        closeResults()
        return
      }

      const matches = sortCountryResults(
        countryOptions.filter((option) => countryMatches(option, query)),
        query
      )
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

      matches.forEach((option, index) => {
        const row = document.createElement('li')
        const optionButton = document.createElement('button')
        const isSelected = selectedCountry === option.value

        row.className = 'app-commodity-search__row' +
          (index % 2 === 1 ? ' app-commodity-search__row--alt' : '')
        optionButton.type = 'button'
        optionButton.className = 'app-country-search__option' +
          (isSelected ? ' app-country-search__option--selected' : '')
        appendHighlightedLabel(optionButton, option.label, trimmedQuery.toLowerCase())
        optionButton.addEventListener('click', () => selectCountry(option.value))
        row.append(optionButton)
        results.append(row)
      })

      results.hidden = false
      setExpanded(true)
      announce(matches.length + ' result' + (matches.length === 1 ? '' : 's') + ' available')
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
      if (input.value.trim().length >= minimumSearchLength) {
        renderResults()
      }
    })

    input.addEventListener('blur', () => {
      window.setTimeout(() => {
        closeResults()

        if (selectedCountry && input.value !== selectedCountry) {
          input.value = selectedCountry
        }
      }, 200)
    })

    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeResults()
      }
    })

    button.addEventListener('click', (event) => {
      event.preventDefault()
      renderResults()
      input.focus()
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
  }

})
