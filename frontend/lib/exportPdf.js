import { fmtDate } from './date';

/**
 * Generate and download a full health-summary PDF for the current user.
 * Dynamically imports jsPDF so it only loads client-side.
 *
 * @param {object} opts
 * @param {object} opts.user            – { full_name, email, date_of_birth, gender, blood_type }
 * @param {object|null} opts.assessment – latest risk_assessment row
 * @param {Array}  opts.medications     – all active medications
 * @param {Array}  opts.appointments    – upcoming appointments
 * @param {Array}  opts.records         – recent health records
 */
export async function exportHealthPdf({ user, assessment, medications, appointments, records }) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const BRAND   = [59, 130, 246];   // brand-500 blue
  const NAVY    = [15, 35, 65];     // dark navy
  const LIGHT   = [226, 232, 240];  // slate-200
  const W       = 210;
  const MARGIN  = 14;
  const CONTENT = W - MARGIN * 2;

  // ── Header banner ─────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 28, 'F');
  doc.setFillColor(...BRAND);
  doc.rect(0, 26, W, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('Dr. Jigree', MARGIN, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Health Portfolio — Personal Health Summary', MARGIN, 19);

  const exportDate = new Date().toLocaleString();
  doc.text(`Generated: ${exportDate}`, W - MARGIN, 19, { align: 'right' });

  // ── Patient info ──────────────────────────────────────────────────────────
  let y = 36;

  doc.setFillColor(30, 58, 95);
  doc.roundedRect(MARGIN, y, CONTENT, 24, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(user.full_name || 'Unknown', MARGIN + 4, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  const infoLine = [
    user.email,
    user.date_of_birth ? `DOB: ${fmtDate(user.date_of_birth)}` : null,
    user.gender ? `Gender: ${user.gender}` : null,
    user.blood_type ? `Blood type: ${user.blood_type}` : null,
  ].filter(Boolean).join('   |   ');
  doc.text(infoLine, MARGIN + 4, y + 16);

  y += 30;

  // ── Helper: section heading ───────────────────────────────────────────────
  const heading = (title) => {
    doc.setFillColor(...BRAND);
    doc.rect(MARGIN, y, 3, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(title, MARGIN + 6, y + 5.5);
    y += 12;
  };

  // ── Risk Assessment ───────────────────────────────────────────────────────
  heading('Risk Assessment');

  if (assessment) {
    const riskPct  = assessment.risk_score != null ? (assessment.risk_score * 100).toFixed(1) + '%' : '—';
    const riskColor = assessment.risk_label === 'High'
      ? [239, 68, 68]
      : assessment.risk_label === 'Moderate'
        ? [245, 158, 11]
        : [34, 197, 94];

    // Risk level badge
    doc.setFillColor(...riskColor);
    doc.roundedRect(MARGIN, y, 38, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`${assessment.risk_label} Risk`, MARGIN + 19, y + 6.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(`Score: ${riskPct}`, MARGIN + 42, y + 6.5);
    doc.text(`Assessed: ${fmtDate(assessment.assessed_at)}`, MARGIN + 80, y + 6.5);
    y += 14;

    // Key vitals row
    const vitals = [
      ['Age', assessment.age ?? '—'],
      ['BMI', assessment.bmi ?? '—'],
      ['BP', assessment.systolic_bp ? `${assessment.systolic_bp}/${assessment.diastolic_bp}` : '—'],
      ['Glucose', assessment.glucose ?? '—'],
      ['Cholesterol', assessment.cholesterol ?? '—'],
    ];
    const colW = CONTENT / vitals.length;
    vitals.forEach(([label, val], i) => {
      const x = MARGIN + i * colW;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(x, y, colW - 2, 14, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(String(val), x + colW / 2 - 1, y + 5.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(label, x + colW / 2 - 1, y + 10.5, { align: 'center' });
    });
    y += 18;

    // Recommendations
    if (assessment.recommendations) {
      let recs = [];
      try { recs = JSON.parse(assessment.recommendations); } catch { recs = [assessment.recommendations]; }
      if (recs.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text('Recommendations:', MARGIN, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        recs.slice(0, 5).forEach(rec => {
          const lines = doc.splitTextToSize(`• ${rec}`, CONTENT);
          doc.text(lines, MARGIN + 2, y);
          y += lines.length * 5;
        });
        y += 2;
      }
    }
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No assessment on record.', MARGIN, y);
    y += 10;
  }

  y += 4;

  // ── Medications ───────────────────────────────────────────────────────────
  heading('Active Medications');

  if (medications?.length) {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Medication', 'Dosage', 'Frequency', 'Prescriber', 'Start Date']],
      body: medications.map(m => [
        m.name || '—',
        m.dosage || '—',
        m.frequency || '—',
        m.prescriber || '—',
        m.start_date ? fmtDate(m.start_date) : '—',
      ]),
      headStyles: { fillColor: BRAND, textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      styles: { cellPadding: 2.5, lineColor: LIGHT, lineWidth: 0.2 },
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No active medications.', MARGIN, y);
    y += 10;
  }

  // ── Page-break guard ──────────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }

  // ── Upcoming Appointments ─────────────────────────────────────────────────
  heading('Upcoming Appointments');

  if (appointments?.length) {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Title', 'Doctor', 'Specialty', 'Date', 'Time', 'Location']],
      body: appointments.map(a => [
        a.title || '—',
        a.doctor_name || '—',
        a.specialty || '—',
        a.appointment_date ? fmtDate(a.appointment_date + 'T00:00:00') : '—',
        a.appointment_time || '—',
        a.location || '—',
      ]),
      headStyles: { fillColor: [124, 58, 237], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      styles: { cellPadding: 2.5, lineColor: LIGHT, lineWidth: 0.2 },
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No upcoming appointments.', MARGIN, y);
    y += 10;
  }

  // ── Page-break guard ──────────────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }

  // ── Recent Health Records ─────────────────────────────────────────────────
  heading('Recent Health Records');

  if (records?.length) {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Title', 'Type', 'BP', 'HR', 'Glucose', 'Cholesterol', 'Date']],
      body: records.map(r => [
        r.title || '—',
        r.record_type || '—',
        r.systolic_bp ? `${r.systolic_bp}/${r.diastolic_bp}` : '—',
        r.heart_rate ?? '—',
        r.glucose ?? '—',
        r.cholesterol ?? '—',
        fmtDate(r.recorded_at),
      ]),
      headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      styles: { cellPadding: 2.5, lineColor: LIGHT, lineWidth: 0.2 },
    });
    y = doc.lastAutoTable.finalY + 8;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No health records on file.', MARGIN, y);
    y += 10;
  }

  // ── Footer on every page ──────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...NAVY);
    doc.rect(0, 285, W, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Dr. Jigree Health Portfolio — Confidential', MARGIN, 292);
    doc.text(`Page ${i} of ${totalPages}`, W - MARGIN, 292, { align: 'right' });
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  const safeName = (user.full_name || 'patient').replace(/\s+/g, '_');
  const dateStr  = new Date().toISOString().slice(0, 10);
  doc.save(`DrJigree_HealthSummary_${safeName}_${dateStr}.pdf`);
}
