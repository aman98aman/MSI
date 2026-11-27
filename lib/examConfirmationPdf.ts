import { jsPDF } from 'jspdf';

export interface RegistrationConfirmationPdfData {
  uid: string;
  fullName: string;
  mobile: string;
  email: string;
  examTitle: string;
  examCode?: string;
  courseOrStream: string;
  assignedBatch: string;
  registeredAt: string;
  examDate: string;
  durationMinutes?: number;
  participationMode: string;
  venueText?: string;
  instructions?: string;
  contactPhones?: string;
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateRegistrationConfirmationPdf(
  data: RegistrationConfirmationPdfData
): Promise<{ blobUrl: string; dataUri: string; fileName: string }> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner (Navy)
  doc.setFillColor(7, 27, 55); // #071B37
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Gold accent strip
  doc.setFillColor(239, 201, 136); // #EFC988
  doc.rect(0, 42, pageWidth, 2, 'F');

  // Official MSI Logo
  const logoDataUrl = await loadImageAsDataUrl('/images/msi-crest.png');
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', 14, 7, 26, 26);
    } catch {}
  }

  // Header Text
  doc.setTextColor(239, 201, 136);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('MSI GROUP OF INSTITUTES', 46, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('CANDIDATE REGISTRATION CONFIRMATION', 46, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(210, 220, 235);
  doc.text('Official Examination Admit & Confirmation Slip • Chandigarh Tricity', 46, 32);

  // Status Pill
  doc.setFillColor(22, 163, 74); // emerald-600
  doc.roundedRect(14, 51, 62, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('STATUS: SUCCESSFULLY REGISTERED', 17, 56.5);

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const regDateStr = data.registeredAt
    ? new Date(data.registeredAt).toLocaleString('en-IN')
    : new Date().toLocaleString('en-IN');
  doc.text(`Issued: ${regDateStr}`, pageWidth - 14, 56.5, { align: 'right' });

  // Prominent Candidate UID Box
  doc.setFillColor(246, 248, 252);
  doc.setDrawColor(137, 25, 14);
  doc.setLineWidth(0.6);
  doc.roundedRect(14, 65, pageWidth - 28, 24, 3, 3, 'FD');

  doc.setTextColor(137, 25, 14); // #89190E
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('UNIQUE CANDIDATE UID (REQUIRED FOR EXAM LOGIN)', pageWidth / 2, 73, { align: 'center' });

  doc.setTextColor(7, 27, 55);
  doc.setFont('courier', 'bold');
  doc.setFontSize(18);
  doc.text(data.uid || 'PENDING', pageWidth / 2, 83, { align: 'center' });

  // Details Table
  let y = 98;
  const rowH = 9.5;
  const details: Array<[string, string]> = [
    ['Candidate Full Name', data.fullName],
    ['Registered Mobile Number', data.mobile],
    ['Email Address', data.email],
    ['Examination Title', data.examTitle],
    ['Selected Course / Category', data.courseOrStream],
    ['Assigned Batch', data.assignedBatch],
    ['Registration Date & Time', regDateStr],
    ['Examination Date', data.examDate || 'As per schedule'],
    ['Examination Mode', (data.participationMode || 'Online').toUpperCase()],
    ['Registration Status', 'SUCCESSFULLY REGISTERED'],
  ];

  if (data.durationMinutes) {
    details.push(['Exam Duration', `${data.durationMinutes} Minutes`]);
  }
  if (data.venueText) {
    details.push(['Venue', data.venueText]);
  }

  details.forEach(([label, value], idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, rowH, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(14, y + rowH, pageWidth - 14, y + rowH);

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(label, 18, y + 6.3);

    doc.setTextColor(7, 27, 55);
    doc.setFont('helvetica', idx === 9 ? 'bold' : 'normal');
    if (idx === 9) doc.setTextColor(22, 163, 74);
    const wrapped = doc.splitTextToSize(String(value || '—'), pageWidth - 88);
    doc.text(wrapped[0] || '—', 76, y + 6.3);
    y += rowH;
  });

  // Important Examination Instructions
  y += 8;
  doc.setFillColor(255, 249, 239);
  doc.setDrawColor(239, 201, 136);
  doc.setLineWidth(0.4);
  const defaultInstructions = [
    '1. Keep your Unique Candidate UID and registered 10-digit mobile number safe for Exam Login.',
    '2. Log in at least 10 minutes before the scheduled start time on a stable internet connection.',
    '3. Fullscreen mode is mandatory during the online CBT; tab switching or exiting fullscreen is monitored.',
    '4. You must accept the Declaration & Consent form before starting your examination.',
  ];
  const instLines = data.instructions
    ? doc.splitTextToSize(data.instructions, pageWidth - 36).slice(0, 6)
    : defaultInstructions;
  const boxHeight = Math.max(34, 14 + instLines.length * 5.2);
  doc.roundedRect(14, y, pageWidth - 28, boxHeight, 3, 3, 'FD');

  doc.setTextColor(137, 25, 14);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('IMPORTANT EXAMINATION INSTRUCTIONS', 18, y + 8);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  let instY = y + 14;
  instLines.forEach((line: string) => {
    doc.text(line, 18, instY);
    instY += 5.2;
  });

  // Official Footer
  const footerY = 274;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);
  doc.setTextColor(7, 27, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('MSI Group of Institutes • Monga City Centre, Kharar (Chandigarh Tricity)', pageWidth / 2, footerY + 1, {
    align: 'center',
  });
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Helpline: ${data.contactPhones || '+91 79863 13013 / +91 96342 99858'} • Web: https://www.msiinstitutes.com`,
    pageWidth / 2,
    footerY + 6,
    { align: 'center' }
  );

  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const dataUri = doc.output('datauristring');
  const fileName = `MSI-Registration-${data.uid || 'Confirmation'}.pdf`;

  return { blobUrl, dataUri, fileName };
}
