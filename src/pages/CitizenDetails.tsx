import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Edit, CreditCard, Printer, Download,
  User, Phone, MapPin, Briefcase, Calendar, Hash, Shield, QrCode
} from 'lucide-react';
import { getCitizenById, getSettings } from '../services/storage';
import type { Citizen, AppUser, AppSettings } from '../types';
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
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (rawUser) { try { setCurrentUser(JSON.parse(rawUser)); } catch(e){} }
    
    getSettings().then(setSettings).catch(console.error);
    
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
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // Helper: load image
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
            reject('Canvas error');
          }
        };
        img.onerror = () => reject('Load failed');
        img.src = src;
      });
    }

    // Hex to RGB helper for primary color
    const primaryHex = settings?.primaryColor || '#2563eb';
    const hex2rgb = (hex: string) => {
      const v = hex.replace('#', '');
      return {
        r: parseInt(v.substring(0, 2), 16) || 37,
        g: parseInt(v.substring(2, 4), 16) || 99,
        b: parseInt(v.substring(4, 6), 16) || 235
      };
    };
    const pColor = hex2rgb(primaryHex);

    // --- Watermark ---
    if (settings?.watermarkUrl) {
      try {
        const wm = await loadImage(settings.watermarkUrl);
        const pdfAny = pdf as any;
        pdfAny.setGState(new pdfAny.GState({ opacity: 0.08 }));
        pdf.addImage(wm, 'PNG', pageW/2 - 60, pageH/2 - 60, 120, 120);
        pdfAny.setGState(new pdfAny.GState({ opacity: 1 }));
      } catch (e) {}
    }

    // --- Header ---
    if (settings?.logoUrl) {
      try {
        const logo = await loadImage(settings.logoUrl);
        pdf.addImage(logo, 'PNG', margin, margin, 25, 25);
      } catch (e) {}
    }
    
    if (settings?.flagUrl) {
      try {
        const flag = await loadImage(settings.flagUrl);
        pdf.addImage(flag, 'PNG', pageW - margin - 35, margin, 35, 22);
      } catch (e) {}
    }

    pdf.setTextColor(15, 23, 42);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text((settings?.stateName || 'WAQOOYI BARI').toUpperCase(), pageW/2, margin + 8, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setTextColor(pColor.r, pColor.g, pColor.b);
    pdf.text('OFFICIAL CITIZEN PROFILE RECORD', pageW/2, margin + 15, { align: 'center' });

    y += 32;
    
    // --- Header Divider ---
    pdf.setDrawColor(pColor.r, pColor.g, pColor.b);
    pdf.setLineWidth(1);
    pdf.line(margin, y, pageW - margin, y);
    y += 10;

    // --- Core Identity Block ---
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    const splitName = pdf.splitTextToSize(citizen.fullName.toUpperCase(), pageW - margin * 2);
    pdf.text(splitName, margin, y + 6);
    
    y += (splitName.length * 8) + 4;

    const photoSize = 42;
    if (citizen.photo) {
      try {
        const photo = await loadImage(citizen.photo);
        pdf.addImage(photo, 'PNG', margin, y, photoSize, photoSize);
      } catch (e) {
        pdf.setFillColor(241, 245, 249);
        pdf.rect(margin, y, photoSize, photoSize, 'F');
      }
    } else {
      pdf.setFillColor(241, 245, 249);
      pdf.rect(margin, y, photoSize, photoSize, 'F');
    }
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, y, photoSize, photoSize, 'S');

    const textX = margin + photoSize + 12;
    const qrSize = 36;
    const qrX = pageW - margin - qrSize;
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`REGISTRATION DATE:`, textX, y + 8);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(format(new Date(citizen.registrationDate), 'dd MMM yyyy').toUpperCase(), textX, y + 13);
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`NATIONAL ID:`, textX, y + 26);
    
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(pColor.r, pColor.g, pColor.b);
    pdf.text(citizen.nationalIdNumber, textX, y + 32);

    // --- QR Code ---
    if (citizen.qrCode) {
      try {
        const qr = await loadImage(citizen.qrCode);
        pdf.addImage(qr, 'PNG', qrX, y + (photoSize - qrSize)/2, qrSize, qrSize);
      } catch (e) {}
    }

    y += photoSize + 12;

    // --- Details Box ---
    const bannerBlue = { r: 30, g: 64, b: 175 }; // Deep blue for professional look
    
    const fields = [
      { label: 'Full Name', value: citizen.fullName?.toUpperCase() },
      { label: "Father's Name", value: citizen.fatherName?.toUpperCase() },
      { label: "Mother's Name", value: citizen.motherName?.toUpperCase() },
      { label: 'Date of Birth', value: format(new Date(citizen.dateOfBirth), 'dd MMM yyyy').toUpperCase() },
      { label: 'Place of Birth', value: citizen.placeOfBirth?.toUpperCase() },
      { label: 'Gender', value: citizen.gender?.toUpperCase() },
      { label: 'Marital Status', value: citizen.maritalStatus?.toUpperCase() },
      { label: 'Occupation', value: citizen.occupation?.toUpperCase() },
      { label: 'Phone Number', value: citizen.phone?.toUpperCase() },
      { label: 'District', value: citizen.district?.toUpperCase() },
      { label: 'Registration Date', value: format(new Date(citizen.registrationDate), 'dd MMM yyyy').toUpperCase() },
      { label: 'Expiry Date', value: format(new Date(citizen.expiryDate), 'dd MMM yyyy').toUpperCase() },
    ];

    const colW = (pageW - margin * 2 - 12) / 2;

    // 1. Calculate required height dynamically to avoid text overlap
    let totalFieldsHeight = 0;
    let currentRowMaxLines = 1;
    for (let i = 0; i < fields.length; i++) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const splitVal = pdf.splitTextToSize(fields[i].value || '—', colW - 5);
      if (splitVal.length > currentRowMaxLines) currentRowMaxLines = splitVal.length;
      if (i % 2 === 1 || i === fields.length - 1) {
        totalFieldsHeight += 13 + (currentRowMaxLines - 1) * 4.5;
        currentRowMaxLines = 1;
      }
    }
    
    pdf.setFontSize(10);
    const splitAddr = pdf.splitTextToSize(citizen.address?.toUpperCase() || '—', pageW - margin * 2 - 12);
    const addressHeight = 12 + (splitAddr.length - 1) * 4.5;
    
    const detailsHeight = 22 + totalFieldsHeight + addressHeight;

    // 2. Draw the Box
    pdf.setFillColor(250, 252, 254);
    pdf.setDrawColor(bannerBlue.r, bannerBlue.g, bannerBlue.b);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(margin, y, pageW - margin * 2, detailsHeight, 4, 4, 'FD');

    // Header banner
    pdf.setFillColor(bannerBlue.r, bannerBlue.g, bannerBlue.b);
    pdf.roundedRect(margin, y, pageW - margin * 2, 11, 4, 4, 'F');
    pdf.rect(margin, y + 5, pageW - margin * 2, 6, 'F'); // cover bottom corners
    
    pdf.setFontSize(10.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('CITIZEN DEMOGRAPHIC & REGISTRATION DATA', pageW / 2, y + 7.5, { align: 'center' });
    
    y += 18;
    
    // 3. Draw the fields
    let currentY = y;
    let rowMaxLines = 1;

    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const col = i % 2;
      const x = margin + 6 + col * colW;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      const splitVal = pdf.splitTextToSize(field.value || '—', colW - 5);
      if (splitVal.length > rowMaxLines) rowMaxLines = splitVal.length;

      pdf.setFontSize(7.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 116, 139);
      pdf.text(field.label.toUpperCase(), x, currentY);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(splitVal, x, currentY + 4.5);

      if (col === 1 || i === fields.length - 1) {
        currentY += 13 + (rowMaxLines - 1) * 4.5;
        rowMaxLines = 1;

        if (i < fields.length - 1) {
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.2);
          pdf.line(margin + 4, currentY - 5, pageW - margin - 4, currentY - 5);
        }
      }
    }

    y = currentY + 2;

    // Divider before address
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.2);
    pdf.line(margin + 4, y - 5, pageW - margin - 4, y - 5);

    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text('FULL ADDRESS', margin + 6, y);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(splitAddr, margin + 6, y + 4.5);

    y += addressHeight + 5;
    
    // --- Signatures ---
    y += 25;
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.4);
    pdf.line(margin + 15, y, margin + 65, y);
    pdf.line(pageW - margin - 65, y, pageW - margin - 15, y);
    
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text('Citizen Signature', margin + 40, y + 5, { align: 'center' });
    pdf.text('Authorized Official Signature', pageW - margin - 40, y + 5, { align: 'center' });

    // --- Bottom Edge / Footer ---
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, pageW/2, pageH - 12, { align: 'center' });

    pdf.setFillColor(pColor.r, pColor.g, pColor.b);
    pdf.rect(0, pageH - 8, pageW, 8, 'F');
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${settings?.stateName || 'Waqooyi Bari'} National ID Management System • Document ID: ${citizen.nationalIdNumber}`, pageW/2, pageH - 3, { align: 'center' });

    pdf.save(`${citizen.nationalIdNumber}-profile.pdf`);
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
                <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--text-main)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{citizen.fullName}</div>
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
