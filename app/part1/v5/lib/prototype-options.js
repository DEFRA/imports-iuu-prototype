/**
 * Prototype options configuration
 * Define all available A/B/C/D style options here
 */

const prototypeOptions = {
  fieldConfidenceStyle: {
    label: 'Low Confidence Field Styling',
    options: [
      {
        id: 'default',
        label: 'Default (Hint text only)',
        description: 'Current subtle approach'
      },
      {
        id: 'left-border',
        label: 'Left Border + Tint',
        description: 'Amber border on left with background tint'
      },
      {
        id: 'icon-badge',
        label: 'Warning Icon Badge',
        description: 'Orange warning icon next to label'
      },
      {
        id: 'highlight-banner',
        label: 'Highlight Banner',
        description: 'Yellow highlight + banner above field'
      }
    ]
  },
  missingFieldStyle: {
    label: 'Missing Field Styling',
    options: [
      {
        id: 'default',
        label: 'Default (Hint text only)',
        description: 'Current subtle approach'
      },
      {
        id: 'alert-box',
        label: 'Alert Box',
        description: 'Red alert box with icon'
      },
      {
        id: 'red-border',
        label: 'Red Left Border + Icon',
        description: 'Bold red border with alert icon'
      },
      {
        id: 'callout-summary',
        label: 'Callout Summary',
        description: 'List at top of section'
      }
    ]
  }
}

const getOptionLabel = (key, value) => {
  const option = prototypeOptions[key]?.options?.find(o => o.id === value)
  return option?.label || value
}

module.exports = {
  prototypeOptions,
  getOptionLabel
}
