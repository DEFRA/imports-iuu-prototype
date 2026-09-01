//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
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

})
