import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Printer, Download, RotateCcw, CreditCard, Search, FileText } from 'lucide-react';
import { getCitizenById, getCitizens, getSettings } from '../services/storage';
import type { Citizen, AppSettings, AppUser } from '../types';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';

// ─── Card Face Components ──────────────────────────────────────────────────

function getDynamicFs(text: string, defaultSize: number, maxLength: number) {
  if (!text) return defaultSize;
  const len = text.length;
  if (len <= maxLength) return defaultSize;
  // Fit the full name across up to two lines without crossing into the photo:
  // uppercase bold chars are ~0.62 * fontSize wide, name area is ~190px per line.
  const availWidth = 190; // px available for the name on the card
  const fs = (availWidth * 2) / (len * 0.62);
  return Math.max(Math.min(fs, defaultSize), defaultSize * 0.5);
}

function CardFront({ citizen, settings }: { citizen: Citizen, settings?: AppSettings | null }) {
  const nameParts = citizen.fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const restName = nameParts.slice(1).join(' ');

  return (
    <div className="id-card-render" style={{
      width: 324, height: 204, // Exact CR80 size in 96dpi (3.375" x 2.125")
      background: 'linear-gradient(135deg, #cbeae5 0%, #a4d2c8 50%, #cbeae5 100%)',
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
      color: '#111',
      fontFamily: '"Arial", sans-serif',
      boxSizing: 'border-box',
      border: '1px solid rgba(0,0,0,0.05)',
    }}>
      {/* Emblem Watermark */}
      <div style={{
        position: 'absolute', left: '40%', top: '55%', width: 120, height: 120,
        transform: 'translate(-50%, -50%)',
        opacity: 0.15, /* Reduced opacity for cleaner print */
        pointerEvents: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 5
      }}>
        <div style={{
          width: '100%', height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <img 
            src={settings?.watermarkUrl || '/logo-lascanood.jpg'} 
            alt="Watermark" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.15)' }} 
          />
        </div>
      </div>

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 10, paddingTop: 6, paddingLeft: 8, paddingRight: 8, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        
        {/* Left: ID Card Left Logo — falls back to System Logo when leftLogoUrl is not set */}
        {(settings?.leftLogoUrl || settings?.logoUrl) && (
          <div style={{ width: 54, height: 54, flexShrink: 0, overflow: 'hidden', border: '2px solid rgba(0,0,0,0.25)', borderRadius: '50%' }}>
            <img 
              src={settings?.leftLogoUrl || settings?.logoUrl || ''} 
              alt="Left Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            />
          </div>
        )}

        {/* Center: Text Stack */}
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0, paddingTop: 2 }}>
          <div style={{ fontSize: 7.5, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '-0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dawlada Hoose Ee Lascanod</div>
          <div style={{ fontSize: 7, fontWeight: 900, color: '#111', marginTop: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Waqooyi Bari</div>
          <div style={{ fontSize: 7, fontWeight: 900, color: '#111', marginTop: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Kaadhka Dhalashada</div>
          <div style={{ fontSize: 6, fontWeight: 900, color: '#111', marginTop: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Birth Certificate</div>
        </div>

        {/* Right: Flag */}
        <div style={{ width: 62, height: 41, flexShrink: 0, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.3)', borderRadius: 4 }}>
          {settings?.flagUrl ? (
            <img src={settings.flagUrl} alt="ID Card Flag" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="68" height="45" style={{ display: 'block' }}>
              <rect width="900" height="300" fill="#4A90D9" />
              <rect y="300" width="900" height="300" fill="#2E8B2E" />
              <polygon points="0,0 300,300 0,600" fill="white" />
              <polygon points="480,90 494,135 542,135 504,162 518,207 480,180 442,207 456,162 418,135 466,135" fill="white" />
              <g transform="translate(120, 280) scale(0.55)" fill="black">
                <ellipse cx="100" cy="120" rx="75" ry="38" />
                <path d="M168,95 Q195,60 185,40 Q175,25 160,30 Q150,35 155,55 Q158,70 148,90 Z" />
                <rect x="55" y="150" width="12" height="55" rx="4" />
                <rect x="80" y="152" width="12" height="58" rx="4" />
                <rect x="120" y="152" width="12" height="58" rx="4" />
                <rect x="145" y="150" width="12" height="55" rx="4" />
                <path d="M28,110 Q0,100 5,135 Q10,165 35,155" stroke="black" strokeWidth="6" fill="none" strokeLinecap="round" />
                <ellipse cx="130" cy="72" rx="20" ry="30" />
                <circle cx="130" cy="38" r="16" />
                <line x1="140" y1="60" x2="170" y2="30" stroke="black" strokeWidth="7" strokeLinecap="round" />
              </g>
            </svg>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', padding: '2px 14px 10px', position: 'relative', zIndex: 10, height: 'calc(100% - 62px)' }}>
        
        {/* Text Details */}
        <div style={{ flex: 1, paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 3.5, paddingTop: 8, minWidth: 0, justifyContent: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 7, color: '#333', lineHeight: 1, fontWeight: 600, marginBottom: 1 }}>Tirsiga Aqoonsiga / ID Number</div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#000', lineHeight: 1.1, letterSpacing: '0.02em' }}>{citizen.nationalIdNumber}</div>
          </div>
          
          <div>
            <div style={{ fontSize: 7, color: '#333', lineHeight: 1, fontWeight: 600, marginBottom: 1 }}>Magaca / Name</div>
            <div style={{
              fontSize: getDynamicFs(citizen.fullName, 9.5, 20),
              fontWeight: 900, color: '#000', lineHeight: 1.1, textTransform: 'uppercase',
              whiteSpace: 'normal', overflowWrap: 'break-word', wordBreak: 'break-word',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>{citizen.fullName}</div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <div style={{ fontSize: 7, color: '#333', lineHeight: 1, fontWeight: 600, marginBottom: 1 }}>Taar. Dhalashada / D.O.B</div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#000', lineHeight: 1.1 }}>{format(new Date(citizen.dateOfBirth), 'dd-MM-yyyy')}</div>
            </div>
            <div>
              <div style={{ fontSize: 7, color: '#333', lineHeight: 1, fontWeight: 600, marginBottom: 1 }}>Jinsiga / Gender</div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#000', lineHeight: 1.1 }}>{citizen.gender === 'Male' ? 'Lab / Male' : 'Dhedig / Female'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div>
              <div style={{ fontSize: 7, color: '#333', lineHeight: 1, fontWeight: 600, marginBottom: 1 }}>La Bixiyey / Issue Date</div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#000', lineHeight: 1.1 }}>{format(new Date(citizen.issueDate), 'dd-MM-yyyy')}</div>
            </div>
            <div>
              <div style={{ fontSize: 7, color: '#333', lineHeight: 1, fontWeight: 600, marginBottom: 1 }}>Dhicitaanka / Expiry Date</div>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#b30000', lineHeight: 1.1 }}>{format(new Date(citizen.expiryDate), 'dd-MM-yyyy')}</div>
            </div>
          </div>
        </div>

{/* Right Side: Photo + Digital Signature Below */}
        <div style={{ flexShrink: 0, paddingLeft: 8, marginLeft: 10 }}>
          {citizen.photo ? (
             <img src={citizen.photo} alt="Citizen" style={{ 
               width: 84, height: 84, objectFit: 'cover', objectPosition: 'center', 
               border: 'none',
               borderRadius: 6,
               backgroundColor: 'transparent',
               mixBlendMode: 'multiply'
             }} />
) : (
             <div style={{ width: 84, height: 84, background: 'transparent', border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#1a4a3a', fontWeight: 'bold' }}>
               {citizen.fullName.charAt(0)}
             </div>
          )}

          {settings?.officialSignatureUrl && (
            <div style={{ marginTop: 4, textAlign: 'center', width: 84 }}>
              <img src={settings.officialSignatureUrl} alt="Signature" style={{
                height: 18, maxWidth: 84, objectFit: 'contain', display: 'block', margin: '0 auto',
              }} />
              <div style={{
                height: 1, background: '#111', marginTop: 3, opacity: 0.6,
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CardBack({ citizen, settings }: { citizen: Citizen, settings?: AppSettings | null }) {
  return (
    <div className="id-card-render" style={{
      width: 324, height: 204, // Exact CR80 size in 96dpi (3.375" x 2.125")
      background: '#f4f7f6',
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
      color: '#111',
      fontFamily: '"Arial", sans-serif',
      boxSizing: 'border-box',
      border: '1px solid rgba(0,0,0,0.05)',
    }}>
      {/* Pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.05,
        backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 10px)',
      }} />

      <div style={{ padding: '18px 16px 14px', display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
           <div>
             <div style={{ fontSize: 9, color: '#111', fontWeight: 900, lineHeight: 1.3 }}>{settings?.stateName || 'Waqooyi Bari'} National ID Management System</div>
           </div>

           <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 6, padding: '6px 8px' }}>
             <div style={{ fontSize: 6, color: '#333', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 2 }}>Full Address / Cinwaanka</div>
             <div style={{ fontSize: 7.5, color: '#111', fontWeight: 700, lineHeight: 1.4, wordBreak: 'break-word' }}>
               {[citizen.address, citizen.district].filter(Boolean).join(', ')}
             </div>
           </div>

           <div style={{ fontSize: 7.5, color: '#111', fontWeight: 800, lineHeight: 1.6, borderTop: '1px solid rgba(0,0,0,0.15)', paddingTop: 6 }}>
             This card is the property of the Government of {settings?.stateName || 'Waqooyi Bari'}. If found, please return to the nearest police station.
           </div>
        </div>

        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '4px', border: '2px solid #000', borderRadius: '4px', display: 'flex' }}>
            <QRCodeSVG 
              value={`https://siyaad-livid.vercel.app/verify/${citizen.nationalIdNumber}`} 
              size={62} 
              level="H" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ID Cards Page ─────────────────────────────────────────────────────────

export default function IdCardPreview() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [selected, setSelected] = useState<Citizen | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBack, setShowBack] = useState(false);
  const [query, setQuery] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageInput, setPageInput] = useState('1');

  useEffect(() => {
    setLoading(true);
    // Read logged-in user for permission checks
    const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (rawUser) { try { setCurrentUser(JSON.parse(rawUser)); } catch (e) {} }
    getSettings().then(setSettings).catch(console.error);
    getCitizens().then(all => {
      setCitizens(all);
      if (id) {
        const c = all.find(x => x.id === id);
        if (c) setSelected(c);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { setCurrentPage(1); }, [query]);
  useEffect(() => { setPageInput(currentPage.toString()); }, [currentPage]);

  const filtered = citizens.filter(c => {
    const q = query.toLowerCase();
    return !q || c.fullName.toLowerCase().includes(q) ||
      c.nationalIdNumber.toLowerCase().includes(q) ||
      c.phone.includes(q) || c.district.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

  async function captureFace(front: boolean): Promise<HTMLCanvasElement | null> {
    if (!selected) return null;
    // Render the selected face standalone (no 3D flip transform) into an
    // offscreen node so html2canvas captures it cleanly.
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(front ? <CardFront citizen={selected} settings={settings} /> : <CardBack citizen={selected} settings={settings} />);
    await new Promise(r => setTimeout(r, 300));
    const canvas = await html2canvas(container, { scale: 3, backgroundColor: null, useCORS: true });
    root.unmount();
    document.body.removeChild(container);
    return canvas;
  }

  async function handleDownload() {
    if (!selected) return;
    const canvas = await captureFace(!showBack);
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${selected.nationalIdNumber}-id-card.png`;
    a.click();
  }

  async function handleDownloadPDF() {
    if (!selected) return;
    setPdfLoading(true);
    try {
      const frontCanvas = await captureFace(true);
      const backCanvas = await captureFace(false);
      if (!frontCanvas || !backCanvas) return;

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [90, 58] });

      const frontImg = frontCanvas.toDataURL('image/png');
      pdf.addImage(frontImg, 'PNG', 2, 2, 86, 54);

      pdf.addPage([90, 58], 'landscape');
      const backImg = backCanvas.toDataURL('image/png');
      pdf.addImage(backImg, 'PNG', 2, 2, 86, 54);

      pdf.save(`${selected.nationalIdNumber}-id-card.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setPdfLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fade-in-up">
      <div className="page-header no-print">
        <div>
          <div className="page-title">ID Card Preview</div>
          <div className="page-subtitle">Select a citizen to preview and export their ID card</div>
        </div>
      </div>

      {/* Filters (Search only) */}
      <div className="glass-card no-print" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{
          flex: '1 1 300px', background: 'var(--bg-main)', border: '1px solid var(--border-color)',
          borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', transition: 'all 0.3s ease'
        }} className="focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search by name, ID, phone, district..."
            value={query} onChange={e => setQuery(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.95rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card no-print" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th style={{ width: 70 }}>Photo</th>
                <th>Citizen Details</th>
                <th>National ID</th>
                <th>Contact & Location</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: 52, height: 52,
                        border: '4px solid var(--border-color)',
                        borderTop: '4px solid var(--primary-color)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>Loading citizens...</div>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <div style={{ background: 'var(--bg-main)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <CreditCard size={40} style={{ opacity: 0.5, color: 'var(--primary-color)' }} />
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No citizens found</div>
                  </td>
                </tr>
              ) : (
                currentItems.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{indexOfFirstItem + i + 1}</td>
                    <td>
                      {c.photo ? (
                        <img src={c.photo} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '1rem' }}>{c.fullName.charAt(0)}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{c.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{c.gender} • {c.occupation}</div>
                    </td>
                    <td><code style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>{c.nationalIdNumber}</code></td>
                    <td>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{c.phone}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{c.district}</div>
                    </td>
                    <td>
                      <span className={c.status === 'Active' ? 'badge-active' : c.status === 'Pending' ? 'badge-pending' : 'badge-rejected'}>{c.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }} onClick={() => setSelected(c)}>
                        <CreditCard size={14} style={{ display: 'inline', marginRight: 4 }} /> Preview ID
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-main)', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <strong style={{ color: 'var(--text-main)' }}>{indexOfFirstItem + 1}</strong> to <strong style={{ color: 'var(--text-main)' }}>{Math.min(indexOfLastItem, filtered.length)}</strong> of <strong style={{ color: 'var(--text-main)' }}>{filtered.length}</strong> entries
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', opacity: currentPage === 1 ? 0.5 : 1 }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Previous</button>
              <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Page 
                <input 
                  type="number" min={1} max={totalPages} value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={() => {
                    const val = parseInt(pageInput);
                    if (!isNaN(val) && val >= 1 && val <= totalPages) setCurrentPage(val);
                    else setPageInput(currentPage.toString());
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt(pageInput);
                      if (!isNaN(val) && val >= 1 && val <= totalPages) setCurrentPage(val);
                      else setPageInput(currentPage.toString());
                    }
                  }}
                  style={{ width: '50px', margin: '0 0.5rem', textAlign: 'center', padding: '0.3rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                />
                of {totalPages}
              </div>
              <button className="btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', opacity: currentPage === totalPages ? 0.5 : 1 }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Card Preview */}
      <AnimatePresence>
        {selected && (
          <motion.div 
            className="no-print"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass-card" style={{ padding: '2.5rem', maxWidth: 600, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-card)' }}>
              
              <div style={{ alignSelf: 'stretch', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-main)' }}>ID Card Preview</div>
                <button className="btn-secondary" style={{ padding: '0.4rem', border: 'none', background: 'none' }} onClick={() => setSelected(null)}>✕</button>
              </div>

              <div style={{ background: 'var(--bg-main)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)', marginBottom: '1.5rem' }}>
                <div ref={cardRef} style={{ perspective: 1000 }}>
                  <motion.div initial={false} animate={{ rotateY: showBack ? 180 : 0 }} transition={{ duration: 0.4 }} style={{ transformStyle: 'preserve-3d', position: 'relative' }}>
                    {!showBack ? <CardFront citizen={selected} settings={settings} /> : <div style={{ transform: 'rotateY(180deg)' }}><CardBack citizen={selected} settings={settings} /></div>}
                  </motion.div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <button className={!showBack ? 'btn-primary' : 'btn-secondary'} style={{ border: 'none' }} onClick={() => setShowBack(false)}><CreditCard size={16} /> Front Face</button>
                <button className={showBack ? 'btn-primary' : 'btn-secondary'} style={{ border: 'none' }} onClick={() => setShowBack(true)}><RotateCcw size={16} /> Back Face</button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" onClick={handlePrint}><Printer size={16} /> Print</motion.button>
                {(currentUser?.role === 'Super Admin' || currentUser?.permissions?.exportPDF === true) && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary" onClick={handleDownloadPDF} disabled={pdfLoading} style={{ opacity: pdfLoading ? 0.7 : 1 }}>
                    {pdfLoading ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="spinner" style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>Generating PDF...</span> : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={16} /> Export PDF</span>}
                  </motion.button>
                )}
                {(currentUser?.role === 'Super Admin' || currentUser?.permissions?.savePNG === true) && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" onClick={handleDownload}><Download size={16} /> Save PNG</motion.button>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Only Section for Crisp ID Print - Moved outside fixed modal to ensure it prints perfectly */}
      {selected && (
        <div className="print-only print-card-layout" style={{ display: 'none' }}>
          <CardFront citizen={selected} settings={settings} />
          <CardBack citizen={selected} settings={settings} />
        </div>
      )}
    </motion.div>
  );
}
