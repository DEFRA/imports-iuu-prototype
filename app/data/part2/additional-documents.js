/**
 * @typedef {'pdf'|'image'} PreviewType
 * @typedef {{ id: string, category: string, name: string, uploadDate: string, fileType: string, fileSize: string, previewType: PreviewType, sourceFile?: string, previewUrl?: string }} AdditionalDocument
 */

/** @type {AdditionalDocument[]} */
module.exports = [
  { id: 'BOL-2026-55190', category: 'Bill of Lading', name: 'Bill of Lading - MSCU 7391842.pdf', uploadDate: '17 July 2026', fileType: 'PDF', fileSize: '684 KB', previewType: 'pdf', sourceFile: 'IUU packing list.pdf' },
  { id: 'INV-2026-88421', category: 'Commercial Invoice', name: 'Commercial Invoice 88421.pdf', uploadDate: '17 July 2026', fileType: 'PDF', fileSize: '412 KB', previewType: 'pdf', sourceFile: 'CL-2026-44-000079-N.pdf' },
  { id: 'TRN-2026-10982', category: 'Transport Document', name: 'Container Transport Document.pdf', uploadDate: '18 July 2026', fileType: 'PDF', fileSize: '1.2 MB', previewType: 'pdf', sourceFile: 'FRA-2025-CSP-000472.pdf' },
  { id: 'SUP-2026-00418', category: 'Supporting Evidence', name: 'Container Seal Photograph.png', uploadDate: '18 July 2026', fileType: 'PNG image', fileSize: '936 KB', previewType: 'image', previewUrl: 'https://placehold.co/1200x1600/f3f2f1/0b0c0c.png?text=Container+seal+SN448901' }
]