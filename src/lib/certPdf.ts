import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function downloadCertificatePdf(node: HTMLElement, fileName: string) {
  const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' })
  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width, canvas.height] })
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
  pdf.save(`${fileName}.pdf`)
}
