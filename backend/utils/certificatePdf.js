'use strict';

const PDFDocument = require('pdfkit');
const QRCode     = require('qrcode');

/* ── Hospital branding — override via environment variables ─────────────── */
const H = {
  name    : process.env.HOSPITAL_NAME    || 'City General Hospital',
  address : process.env.HOSPITAL_ADDRESS || '123 Healthcare Avenue, Medical District',
  city    : process.env.HOSPITAL_CITY    || 'Bangalore, Karnataka - 560001',
  phone   : process.env.HOSPITAL_PHONE   || '+91 80 1234 5678',
  email   : process.env.HOSPITAL_EMAIL   || 'info@citygeneralhospital.com',
  regNo   : process.env.HOSPITAL_REG_NO  || 'KA-MED-REG-2020-001',
};

const COLORS = {
  primary  : '#1a3a6c',   // dark navy for headings
  accent   : '#2563eb',   // blue for lines
  text     : '#1f2937',
  muted    : '#6b7280',
  light    : '#f1f5f9',
};

/* ── Date formatter ──────────────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

/* ── Horizontal rule ─────────────────────────────────────────────────────── */
function hrule(doc, y, color = COLORS.accent) {
  doc.save()
     .strokeColor(color)
     .lineWidth(0.8)
     .moveTo(50, y)
     .lineTo(545, y)
     .stroke()
     .restore();
}

/* ── Double horizontal rule ─────────────────────────────────────────────── */
function dhrule(doc, y, color = COLORS.primary) {
  hrule(doc, y, color);
  hrule(doc, y + 3, color);
}

/* ── Section label + value row ──────────────────────────────────────────── */
function labelRow(doc, label, value, y) {
  doc.fontSize(10).fillColor(COLORS.muted).text(label, 70, y, { width: 130 });
  doc.fontSize(10).fillColor(COLORS.text) .text(value || '—', 205, y, { width: 320 });
  return y + 18;
}

/* ════════════════════════════════════════════════════════════════════════════
   Main PDF generator
   cert   — row from MEDICAL_CERTIFICATE
   patient — row from patient table
   doctor  — row from doctor table (with specialization)
   ════════════════════════════════════════════════════════════════════════════ */
async function generateCertificatePdf(cert, patient, doctor, res, inline = false) {

  /* QR code data (certificate number + verification hint) */
  let qrDataUrl = null;
  try {
    qrDataUrl = await QRCode.toDataURL(
      `Certificate: ${cert.CERTIFICATE_NO} | Patient: ${patient.name} | Date: ${cert.CERTIFICATE_DATE}`,
      { width: 80, margin: 1 }
    );
  } catch (_) { /* QR is optional */ }

  const disposition = inline ? 'inline' : 'attachment';
  const filename    = `${cert.CERTIFICATE_NO}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');

  const doc = new PDFDocument({ size: 'A4', margin: 0, info: {
    Title  : `${cert.CERTIFICATE_TYPE === 'SICK_LEAVE' ? 'Sick Leave' : 'Fitness'} Certificate - ${cert.CERTIFICATE_NO}`,
    Author : doctor.name,
  }});
  doc.pipe(res);

  const isSickLeave = cert.CERTIFICATE_TYPE === 'SICK_LEAVE';
  const W = 595.28;   // A4 width in pts
  const L = 50;       // left margin
  const R = 545;      // right margin

  /* ── Light background header band ────────────────────────────────────── */
  doc.rect(0, 0, W, 110).fill(COLORS.light);

  /* ── Hospital Name ────────────────────────────────────────────────────── */
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text(H.name, L, 22, { align: 'center', width: R - L });

  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(COLORS.muted)
     .text(H.address, L, 47, { align: 'center', width: R - L });

  doc.text(`${H.city}`, L, 59, { align: 'center', width: R - L });

  doc.text(`Phone: ${H.phone}   |   Email: ${H.email}   |   Reg No: ${H.regNo}`,
           L, 71, { align: 'center', width: R - L });

  /* ── Double rule under header ─────────────────────────────────────────── */
  dhrule(doc, 92);

  /* ── Certificate title ────────────────────────────────────────────────── */
  const certTitle = isSickLeave
    ? 'MEDICAL / SICK LEAVE CERTIFICATE'
    : 'FITNESS CERTIFICATE';

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(COLORS.primary)
     .text(certTitle, L, 106, { align: 'center', width: R - L });

  hrule(doc, 128);

  /* ── Certificate No + Date row ────────────────────────────────────────── */
  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.primary)
     .text(`Certificate No:`, L, 138);
  doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
     .text(cert.CERTIFICATE_NO, 140, 138);

  doc.fontSize(9).font('Helvetica-Bold').fillColor(COLORS.primary)
     .text('Date:', 380, 138);
  doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
     .text(fmtDate(cert.CERTIFICATE_DATE), 410, 138);

  /* ── Intro line ───────────────────────────────────────────────────────── */
  let y = 168;

  doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
     .text('This is to certify that:', L, y);

  y += 22;
  hrule(doc, y, '#e5e7eb');
  y += 10;

  /* ── Patient details ──────────────────────────────────────────────────── */
  const ageGender = [
    patient.age ? `${patient.age} Years` : null,
    patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : null,
  ].filter(Boolean).join(' / ');

  y = labelRow(doc, 'Patient Name  :', patient.name || '—', y);
  y = labelRow(doc, 'Age / Gender   :', ageGender || '—', y);
  y = labelRow(doc, 'Patient ID       :', `PT-${String(patient.patient_id).padStart(6, '0')}`, y);

  if (cert.REG_ID)       y = labelRow(doc, 'Registration No :', `REG-${cert.REG_ID}`, y);
  if (cert.ADMISSION_ID) y = labelRow(doc, 'Admission No    :', `ADM-${cert.ADMISSION_ID}`, y);

  y += 5;
  hrule(doc, y, '#e5e7eb');
  y += 14;

  /* ── Examined text ────────────────────────────────────────────────────── */
  const examinedText = isSickLeave
    ? 'was examined and treated at our hospital.'
    : 'was examined at our hospital.';

  doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
     .text(examinedText, L, y, { width: R - L });

  y += 28;

  /* ── Diagnosis ────────────────────────────────────────────────────────── */
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLORS.primary)
     .text('Diagnosis:', L, y);
  y += 18;

  const diagText = cert.DIAGNOSIS || 'As per clinical examination';
  doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
     .text(diagText, L + 20, y, { width: R - L - 20 });

  y += doc.heightOfString(diagText, { width: R - L - 20 }) + 14;

  /* ── Body content (differs by certificate type) ───────────────────────── */
  if (isSickLeave) {
    /* Sick leave body */
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
       .text(
         'The patient has been advised complete rest and is medically unfit to attend ' +
         'work / school / college from:',
         L, y, { width: R - L }
       );
    y += 36;

    /* From — To dates in a highlighted box */
    doc.rect(L, y, R - L, 36).fill('#eff6ff');
    doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.primary)
       .text(fmtDate(cert.FROM_DATE), L + 10, y + 8);
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.muted)
       .text('to', 0, y + 11, { align: 'center', width: W });
    doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.primary)
       .text(fmtDate(cert.TO_DATE), 0, y + 8, { align: 'right', width: R - 10 });
    y += 46;

    if (cert.TOTAL_DAYS) {
      doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
         .text(`(Total ${cert.TOTAL_DAYS} day${cert.TOTAL_DAYS !== 1 ? 's' : ''})`,
                L, y, { align: 'center', width: R - L });
      y += 24;
    }

    const resumeDate = cert.FIT_TO_JOIN_DATE
      ? fmtDate(cert.FIT_TO_JOIN_DATE)
      : (cert.TO_DATE
          ? fmtDate(new Date(new Date(cert.TO_DATE).getTime() + 86400000))
          : '—');

    doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
       .text('The patient is expected to resume normal activities from:', L, y, { width: R - L });
    y += 20;
    doc.fontSize(12).font('Helvetica-Bold').fillColor(COLORS.primary)
       .text(resumeDate, L, y, { align: 'center', width: R - L });
    y += 28;

    doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
       .text(
         'This certificate is issued on the request of the patient for official purposes.',
         L, y, { width: R - L }
       );
    y += 26;

  } else {
    /* Fitness body */
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
       .text(
         'After clinical examination and review of medical records, the patient is found ' +
         'to be medically fit to resume normal duties from:',
         L, y, { width: R - L }
       );
    y += 42;

    const fitDate = fmtDate(cert.FIT_TO_JOIN_DATE || cert.TO_DATE);
    doc.rect(L, y, R - L, 36).fill('#f0fdf4');
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#16a34a')
       .text(fitDate, L, y + 10, { align: 'center', width: R - L });
    y += 50;

    doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
       .text(
         'This certificate is issued for submission wherever required.',
         L, y, { width: R - L }
       );
    y += 26;
  }

  /* ── Remarks (if any) ─────────────────────────────────────────────────── */
  if (cert.REMARKS && cert.REMARKS.trim()) {
    y += 6;
    doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary)
       .text('Remarks:', L, y);
    y += 16;
    doc.fontSize(10).font('Helvetica').fillColor(COLORS.text)
       .text(cert.REMARKS, L + 20, y, { width: R - L - 20 });
    y += doc.heightOfString(cert.REMARKS, { width: R - L - 20 }) + 10;
  }

  /* ── Signature area ────────────────────────────────────────────────────── */
  y = Math.max(y + 20, 620);

  hrule(doc, y, '#e5e7eb');
  y += 16;

  doc.fontSize(9).font('Helvetica').fillColor(COLORS.muted)
     .text(`Place: ${H.city.split(',')[0].trim()}`, L, y);
  doc.text(`Date: ${fmtDate(cert.CERTIFICATE_DATE)}`, L, y + 14);

  /* QR code (top-right of signature area) */
  if (qrDataUrl) {
    try {
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      doc.image(qrBuffer, R - 75, y - 5, { width: 70, height: 70 });
    } catch (_) {}
  }

  y += 50;

  /* Doctor info */
  doc.fontSize(10).font('Helvetica-Bold').fillColor(COLORS.primary)
     .text(`Dr. ${doctor.name}`, L, y);
  y += 16;
  if (doctor.qualification) {
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.text)
       .text(doctor.qualification, L, y);
    y += 14;
  }
  if (doctor.specialization) {
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.muted)
       .text(doctor.specialization, L, y);
    y += 14;
  }
  if (doctor.medical_license_number) {
    doc.fontSize(9).font('Helvetica').fillColor(COLORS.muted)
       .text(`Reg. No: ${doctor.medical_license_number}`, L, y);
    y += 14;
  }

  doc.fontSize(9).font('Helvetica').fillColor(COLORS.muted)
     .text('Signature: ____________________________', L, y + 10);

  /* Hospital Seal placeholder */
  doc.rect(R - 110, y - 10, 100, 65)
     .dash(3, { space: 3 })
     .strokeColor(COLORS.muted)
     .lineWidth(0.8)
     .stroke();
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted)
     .text('Hospital Seal', R - 110, y + 24, { width: 100, align: 'center' });

  /* ── Footer ──────────────────────────────────────────────────────────── */
  const footerY = 790;
  dhrule(doc, footerY, COLORS.primary);
  doc.fontSize(8).font('Helvetica').fillColor(COLORS.muted)
     .text(
       '★  COMPUTER GENERATED CERTIFICATE  ★   This certificate is system generated and is valid without physical signature.',
       L, footerY + 6, { align: 'center', width: R - L }
     );
  doc.text(
    `Generated: ${new Date(cert.GENERATED_DATE).toLocaleString('en-IN')}   |   ${H.name}   |   ${cert.CERTIFICATE_NO}`,
    L, footerY + 18, { align: 'center', width: R - L }
  );

  doc.end();
}

module.exports = { generateCertificatePdf };
