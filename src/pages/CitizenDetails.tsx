import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit, CreditCard, Printer, Download,
  User, Phone, MapPin, Briefcase, Calendar, Hash, Shield, QrCode
} from 'lucide-react';
import { getCitizenById } from '../services/storage';
import type { Citizen, AppUser } from '../types';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '1rem 0', borderBottom: '1px solid var(--border-color)', alignItems: 'flex-start' }}>
      <div style={{ color: 'var(--primary-color)', marginTop: 2, flexShrink: 0, background: 'rgba(37, 99, 235, 0.1)', padding: '0.4rem', borderRadius: '8px' }}>{icon}</div>
      <div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem', fontSize: '0.95rem' }}>{value || '—'}</div>
      </div>
    </div>
  );
}

export default function CitizenDetails() {
  const { id } = useParams<{ id: string }>();
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (rawUser) { try { setCurrentUser(JSON.parse(rawUser)); } catch(e){} }
    if (id) {
      getCitizenById(id)
        .then(c => setCitizen(c || null))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 52, height: 52, border: '4px solid var(--border-color)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Loading citizen details...</div>
      </div>
    </div>
  );

  if (!citizen) return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem' }}>
      <Shield size={64} style={{ opacity: 0.3, margin: '0 auto 1.5rem', color: 'var(--primary-color)' }} />
      <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '1rem' }}>Citizen not found</div>
      <button className="btn-secondary" onClick={() => navigate('/citizens')}>
        <ArrowLeft size={16} /> Back to List
      </button>
    </div>
  );

  function handlePrint() {
    window.print();
  }

  async function handleDownloadPDF() {
    if (!citizen) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;

    // ── Helper: load image as data URL ──
    function loadImage(src: string): Promise<string> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            reject('Canvas context unavailable');
          }
        };
        img.onerror = () => reject('Image load failed');
        img.src = src;
      });
    }

    // ── Title Header ──
    pdf.setFillColor(37, 99, 235);
    pdf.rect(0, 0, pageW, 28, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Citizen Profile', margin, 12);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`National ID: ${citizen.nationalIdNumber}`, margin, 20);
    pdf.text(`Status: ${citizen.status}`, pageW - margin - 30, 20);
    y = 38;

    // ── Photo ──
    const photoX = margin;
    const photoSize = 40;
    if (citizen.photo) {
      try {
        const photoData = await loadImage(citizen.photo);
        pdf.addImage(photoData, 'PNG', photoX, y, photoSize, photoSize);
      } catch {
        pdf.setFillColor(37, 99, 235);
        pdf.roundedRect(photoX, y, photoSize, photoSize, 3, 3, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.text(citizen.fullName.charAt(0), photoX + 15, y + 27);
      }
    } else {
      pdf.setFillColor(37, 99, 235);
      pdf.roundedRect(photoX, y, photoSize, photoSize, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.text(citizen.fullName.charAt(0), photoX + 15, y + 27);
    }

    // ── Name & Occupation next to photo ──
    const textX = photoX + photoSize + 10;
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(citizen.fullName, textX, y + 12);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(citizen.occupation || '', textX, y + 20);

    // ── QR Code next to name ──
    const qrSize = 35;
    const qrX = pageW - margin - qrSize;
    if (citizen.qrCode) {
      try {
        const qrData = await loadImage(citizen.qrCode);
        pdf.addImage(qrData, 'PNG', qrX, y, qrSize, qrSize);
        pdf.setFontSize(7);
        pdf.setTextColor(100, 116, 139);
        pdf.text('Verification QR', qrX + 5, y + qrSize + 4);
      } catch {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.rect(qrX, y, qrSize, qrSize);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text('QR Error', qrX + 8, y + 20);
      }
    }

    y += photoSize + 16;

    // ── Divider ──
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageW - margin, y);
    y += 8;

    // ── Section Title ──
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text('Personal & Registration Details', margin, y);
    y += 8;

    // ── Info rows (two columns) ──
    const fields = [
      { label: 'Full Name', value: citizen.fullName },
      { label: 'National ID', value: citizen.nationalIdNumber },
      { label: "Father's Name", value: citizen.fatherName },
      { label: "Mother's Name", value: citizen.motherName },
      { label: 'Date of Birth', value: format(new Date(citizen.dateOfBirth), 'dd MMMM yyyy') },
      { label: 'Place of Birth', value: citizen.placeOfBirth },
      { label: 'Gender', value: citizen.gender },
      { label: 'Marital Status', value: citizen.maritalStatus },
      { label: 'Phone Number', value: citizen.phone },
      { label: 'Occupation', value: citizen.occupation },
      { label: 'District', value: citizen.district },
      { label: 'Registration Date', value: format(new Date(citizen.registrationDate), 'dd MMMM yyyy') },
      { label: 'Issue Date', value: format(new Date(citizen.issueDate), 'dd MMMM yyyy') },
      { label: 'Expiry Date', value: format(new Date(citizen.expiryDate), 'dd MMMM yyyy') },
    ];

    const colW = (pageW - margin * 2) / 2;
    const rowH = 14;

    fields.forEach((field, i) => {
      const col = i % 2;
      const x = margin + col * colW;

      // Draw light background for alternating rows
      if (col === 0) {
        const rowIndex = Math.floor(i / 2);
        if (rowIndex % 2 === 0) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin, y - 4, pageW - margin * 2, rowH, 'F');
        }
      }

      // Label
      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 116, 139);
      pdf.text(field.label.toUpperCase(), x + 2, y);

      // Value
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      pdf.text(field.value || '—', x + 2, y + 6);

      // Move y down after every 2 fields
      if (col === 1) {
        y += rowH;
      }
    });

    // Handle odd number of fields
    if (fields.length % 2 !== 0) {
      y += rowH;
    }

    // ── Full Address (full width) ──
    y += 4;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, y, pageW - margin, y);
    y += 6;
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text('FULL ADDRESS', margin + 2, y);
    y += 5;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    pdf.text(citizen.address || '—', margin + 2, y);

    // ── Footer ──
    y += 16;
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, y, pageW - margin, y);
    y += 6;
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('Generated by WNIMS — Waqooyi Bari National ID Management System', margin, y);
    pdf.text(format(new Date(), 'dd MMMM yyyy, HH:mm'), pageW - margin - 45, y);

    pdf.save(`${citizen.nationalIdNumber}.pdf`);
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <div className="page-header no-print">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" style={{ padding: '0.6rem' }} onClick={() => navigate('/citizens')}>
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <div className="page-title">Citizen Profile</div>
            <div className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              ID: <code style={{ background: 'var(--bg-main)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>{citizen.nationalIdNumber}</code>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {(currentUser?.role === 'Super Admin' || currentUser?.permissions?.printProfile === true) && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" onClick={handlePrint}><Printer size={16} /> Print Profile</motion.button>
          )}
          {(currentUser?.role === 'Super Admin' || currentUser?.permissions?.exportProfile === true) && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" onClick={handleDownloadPDF}><Download size={16} /> Export PDF</motion.button>
          )}
          {(currentUser?.role === 'Super Admin' || currentUser?.permissions?.editCitizen === true) && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" onClick={() => navigate(`/citizens/${citizen.id}/edit`)}><Edit size={16} /> Edit Record</motion.button>
          )}
          {(currentUser?.role === 'Super Admin' || currentUser?.permissions?.generateQR === true) && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" onClick={() => navigate(`/qr/${citizen.id}`)}><QrCode size={16} /> Generate QR</motion.button>
          )}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary" onClick={() => navigate(`/id-cards/${citizen.id}`)}><CreditCard size={16} /> View ID Card</motion.button>
        </div>
      </div>

      {/* Printable Content */}
      <div ref={printRef} style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2.5fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: Photo & Status */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {citizen.photo ? (
                  <img src={citizen.photo} alt="Citizen" style={{ width: 180, height: 180, objectFit: 'cover', borderRadius: '16px', border: '4px solid var(--bg-main)', boxShadow: 'var(--shadow-md)', margin: '0 auto', display: 'block' }} />
                ) : (
                  <div style={{
                    width: 180, height: 180, borderRadius: '16px',
                    background: 'var(--primary-gradient)',
                    margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '5rem', fontWeight: 800, color: 'white',
                    boxShadow: 'var(--shadow-md)', border: '4px solid var(--bg-main)'
                  }}>{citizen.fullName.charAt(0)}</div>
                )}
                <div style={{ position: 'absolute', bottom: -12, right: -12, background: 'var(--bg-card)', borderRadius: '50%', padding: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
                  <Shield size={24} style={{ color: 'var(--primary-color)' }} />
                </div>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-main)', lineHeight: 1.2 }}>{citizen.fullName}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{citizen.occupation}</div>
              </div>
              <div style={{ marginTop: '1.25rem' }}>
                <span className={citizen.status === 'Active' ? 'badge-active' : citizen.status === 'Pending' ? 'badge-pending' : 'badge-rejected'}
                  style={{ display: 'inline-block', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  {citizen.status} Status
                </span>
              </div>
            </motion.div>

            {/* QR Code */}
            <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
                <QrCode size={18} style={{ color: 'var(--primary-color)' }} /> Verification QR
              </div>
              {citizen.nationalIdNumber ? (
                <div style={{ background: 'white', padding: '0.75rem', borderRadius: '12px', display: 'inline-block', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                  <QRCodeSVG 
                    value={`https://siyaad-livid.vercel.app/verify/${citizen.nationalIdNumber}`} 
                    size={140} 
                    level="H" 
                  />
                </div>
              ) : (
                <div style={{ width: 140, height: 140, background: 'var(--bg-main)', border: '2px dashed var(--border-color)', borderRadius: '12px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No QR Generated</div>
              )}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>Scan to verify citizen identity instantly online.</div>
            </motion.div>
          </div>

          {/* Right: Info */}
          <motion.div variants={itemVariants} className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid var(--bg-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} style={{ color: 'var(--primary-color)' }} /> Personal & Registration Details
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0 2rem' }}>
              <InfoRow icon={<User size={18} />} label="Full Name" value={citizen.fullName} />
              <InfoRow icon={<Hash size={18} />} label="National ID Number" value={citizen.nationalIdNumber} />
              <InfoRow icon={<User size={18} />} label="Father's Name" value={citizen.fatherName} />
              <InfoRow icon={<User size={18} />} label="Mother's Name" value={citizen.motherName} />
              <InfoRow icon={<Calendar size={18} />} label="Date of Birth" value={format(new Date(citizen.dateOfBirth), 'dd MMMM yyyy')} />
              <InfoRow icon={<MapPin size={18} />} label="Place of Birth" value={citizen.placeOfBirth} />
              <InfoRow icon={<User size={18} />} label="Gender" value={citizen.gender} />
              <InfoRow icon={<User size={18} />} label="Marital Status" value={citizen.maritalStatus} />
              <InfoRow icon={<Phone size={18} />} label="Phone Number" value={citizen.phone} />
              <InfoRow icon={<Briefcase size={18} />} label="Occupation" value={citizen.occupation} />
              <InfoRow icon={<MapPin size={18} />} label="District" value={citizen.district} />
              <InfoRow icon={<Calendar size={18} />} label="Registration Date" value={format(new Date(citizen.registrationDate), 'dd MMMM yyyy')} />
              <InfoRow icon={<Calendar size={18} />} label="Issue Date" value={format(new Date(citizen.issueDate), 'dd MMMM yyyy')} />
              <InfoRow icon={<Calendar size={18} />} label="Expiry Date" value={format(new Date(citizen.expiryDate), 'dd MMMM yyyy')} />
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <InfoRow icon={<MapPin size={18} />} label="Full Address" value={citizen.address} />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
