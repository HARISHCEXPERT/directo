// AI filler orchestration.
// 1. Scan form fields
// 2. Send to backend (with product + directory context)
// 3. Receive AI-generated mapping
// 4. Fill each field

;(function () {

  async function aiFillForm({ directorySlug, directoryName }) {
    const fields = window.__directoScanForm()
    if (!fields || fields.length === 0) {
      window.__directoFill.directoToast('No form fields detected on this page', 'error')
      return { filled: 0, total: 0 }
    }

    // Trim each field's option list (already trimmed by scanner, this is belt+suspenders)
    const payloadFields = fields.map(f => ({
      ...f,
      options: f.options ? f.options.slice(0, 50) : undefined,
    }))

    let res
    try {
      res = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'AI_FILL',
          payload: {
            fields: payloadFields,
            url: location.href,
            directorySlug,
            directoryName,
          },
        }, (r) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
          else resolve(r)
        })
      })
    } catch (e) {
      window.__directoFill.directoToast(`AI fill error: ${e.message}`, 'error')
      return { filled: 0, total: fields.length, error: e.message }
    }

    if (!res?.ok) {
      window.__directoFill.directoToast(res?.error || 'AI fill failed', 'error')
      return { filled: 0, total: fields.length, error: res?.error }
    }

    const mapping = res.mapping || {}
    let filled = 0
    for (const field of fields) {
      const value = mapping[field.id]
      if (value == null || value === '') continue
      const ok = window.__directoFillField(field, value)
      if (ok) filled++
    }

    return { filled, total: fields.length, model: res.model, costUsd: res.costUsd }
  }

  window.__directoAIFill = aiFillForm
})()
