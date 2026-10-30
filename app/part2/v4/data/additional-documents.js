/**
 * @typedef {'pdf'|'image'} PreviewType
 * @typedef {{ id: string, category: string, name: string, uploadDate: string, fileType: string, fileSize: string, previewType: PreviewType, sourceFile?: string, previewUrl?: string }} AdditionalDocument
 */

/** @type {AdditionalDocument[]} */
module.exports = [
  { id: 'BOL-2026-55190', consignmentReference: 'GB-IUU-2026-10482', category: 'Bill of Lading', name: 'Bill of Lading - MSCU 7391842.pdf', uploadDate: '17 July 2026', fileType: 'PDF', fileSize: '3 KB', previewType: 'pdf', sourceFile: 'IUU packing list.pdf' },
  { id: 'INV-2026-88421', consignmentReference: 'GB-IUU-2026-10482', category: 'Commercial Invoice', name: 'Commercial Invoice 88421.pdf', uploadDate: '17 July 2026', fileType: 'PDF', fileSize: '412 KB', previewType: 'pdf', sourceFile: 'CL-2026-44-000079-N.pdf' },
  { id: 'TRN-2026-10982', consignmentReference: 'GB-IUU-2026-10482', category: 'Transport Document', name: 'Container Transport Document.pdf', uploadDate: '18 July 2026', fileType: 'PDF', fileSize: '1.2 MB', previewType: 'pdf', sourceFile: 'FRA-2025-CSP-000472.pdf' },
  { id: 'SUP-2026-00418', consignmentReference: 'GB-IUU-2026-10482', category: 'Supporting Evidence', name: 'Container Seal Photograph.png', uploadDate: '18 July 2026', fileType: 'PNG image', fileSize: '936 KB', previewType: 'image', previewUrl: 'https://placehold.co/1200x1600/f3f2f1/0b0c0c.png?text=Container+seal+SN448901' },
  { id: 'SPE-IS-2026-11021-01', consignmentReference: 'GB-IUU-2026-11021', category: 'Species and Weights Schedule', name: 'Species and Weights Schedule.png', uploadDate: '18 October 2026', fileType: 'PNG image', fileSize: '124 KB', previewType: 'image', previewUrl: 'https://placehold.co/1200x1600/f3f2f1/0b0c0c.png?text=Species+and+weights+schedule' },
  { id: 'TRN-IS-2026-11021-01', consignmentReference: 'GB-IUU-2026-11021', category: 'Transport Document', name: 'North Star Transport Document.png', uploadDate: '18 October 2026', fileType: 'PNG image', fileSize: '98 KB', previewType: 'image', previewUrl: 'https://placehold.co/1200x1600/f3f2f1/0b0c0c.png?text=North+Star+transport+document' }
]