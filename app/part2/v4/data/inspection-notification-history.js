const historyByReference = {
  'GB-IUU-2026-11002': [
    {
      label: { text: 'Inspector status changed to Requires document check' },
      byline: { text: 'Port Health Authority' },
      datetime: { timestamp: '2026-10-27T14:01:00.000Z', type: 'datetime' },
      text: 'The notification is ready for an inspector to review the supporting documents.'
    },
    {
      label: { text: 'Documentary review started' },
      byline: { text: 'Alex Morgan, PHA Inspector' },
      datetime: { timestamp: '2026-10-27T11:32:00.000Z', type: 'datetime' },
      text: 'The catch certificate and processing statement are being checked against the notification.'
    },
    {
      label: { text: 'Supporting documents received' },
      byline: { text: 'Importer' },
      datetime: { timestamp: '2026-10-26T16:18:00.000Z', type: 'datetime' },
      text: 'Catch certificate and processing statement uploaded.'
    },
    {
      label: { text: 'Notification submitted' },
      byline: { text: 'Importer' },
      datetime: { timestamp: '2026-10-26T15:52:00.000Z', type: 'datetime' },
      text: 'The import notification was submitted for review.'
    }
  ],
  'GB-IUU-2026-11003': [
    {
      label: { text: 'Inspector status changed to Requires document check' },
      byline: { text: 'Port Health Authority' },
      datetime: { timestamp: '2026-10-27T13:42:00.000Z', type: 'datetime' },
      text: 'The notification has been added to the document-check queue.'
    },
    {
      label: { text: 'Notification assigned to an inspector' },
      byline: { text: 'Port Health Authority' },
      datetime: { timestamp: '2026-10-27T10:15:00.000Z', type: 'datetime' },
      text: 'Alex Morgan is responsible for reviewing this notification.'
    },
    {
      label: { text: 'Supporting documents received' },
      byline: { text: 'Importer' },
      datetime: { timestamp: '2026-10-26T12:06:00.000Z', type: 'datetime' },
      text: 'The catch certificate was uploaded.'
    },
    {
      label: { text: 'Notification submitted' },
      byline: { text: 'Importer' },
      datetime: { timestamp: '2026-10-26T11:48:00.000Z', type: 'datetime' },
      text: 'The import notification was submitted for review.'
    }
  ],
  'GB-IUU-2026-11021': [
    {
      label: { text: 'Referred to MMO' },
      byline: { text: 'Alex Morgan, PHA Inspector' },
      datetime: { timestamp: '2026-09-22T10:14:00.000Z', type: 'datetime' },
      text: 'Referred the notification to the MMO for advice on the supporting documents.'
    },
    {
      label: { text: 'Change of Arrival details' },
      byline: { text: 'New England Seafood International Ltd' },
      datetime: { timestamp: '2026-09-22T10:14:00.000Z', type: 'datetime' },
      text: 'Current destination port Felixstowe, 30/10/26, 8:45am\n\nPrevious destination port Dover, 28/10/26, 9:20am',
      html: '<p>Current destination port Felixstowe, 30/10/26, 8:45am</p><p>Previous destination port Dover, 28/10/26, 9:20am</p>'
    },
    {
      label: { text: 'More information requested' },
      byline: { text: 'Alex Morgan, PHA Inspector' },
      datetime: { timestamp: '2026-09-21T14:32:00.000Z', type: 'datetime' },
      text: 'Asked the importer to clarify the commodity details and provide an updated catch certificate.'
    },
    {
      label: { text: 'Moved to document under review' },
      byline: { text: 'Alex Morgan, PHA Inspector' },
      datetime: { timestamp: '2026-09-20T09:16:00.000Z', type: 'datetime' },
      text: 'Started reviewing the notification and supporting documents.'
    },
    {
      label: { text: 'Document requires check' },
      byline: { text: 'Import system' },
      datetime: { timestamp: '2026-09-19T08:42:00.000Z', type: 'datetime' },
      text: 'The notification first entered the system and was added to the document check queue.'
    }
  ]
}

const getNotificationHistory = (reference, recentEvents = []) => [
  ...recentEvents,
  ...(historyByReference[reference] || [])
]

module.exports = { getNotificationHistory }