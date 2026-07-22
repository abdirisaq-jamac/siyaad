import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Printer, Download, RotateCcw, CreditCard, Search, FileText } from 'lucide-react';
import { getCitizenById, getCitizens, getSettings } from '../services/storage';
import type { Citizen, AppSettings } from '../types';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─── Card Face Components ──────────────────────────────────────────────────

function CardFront({ citizen, settings }: { citizen: Citizen, settings?: AppSettings | null }) {
  const nameParts = citizen.fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const restName = nameParts.slice(1).join(' ');

  return (
    <div style={{
      width: 350, height: 220,
      background: 'linear-gradient(135deg, #cbeae5 0%, #a4d2c8 50%, #cbeae5 100%)',
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      color: '#111',
      fontFamily: '"Arial", sans-serif',
      boxSizing: 'border-box',
    }}>
      {/* Background Patterns */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.2,
        backgroundImage: 'repeating-radial-gradient(circle at center, transparent 0, transparent 8px, rgba(0,100,80,0.1) 8px, rgba(0,100,80,0.1) 9px)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.15,
        backgroundImage: 'repeating-linear-gradient(45deg, #005f40 0, #005f40 1px, transparent 0, transparent 15px)',
      }} />
      
      {/* Central Sunburst */}
      <div style={{
        position: 'absolute', left: '50%', top: '35%', width: 250, height: 250,
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle, rgba(240,240,200,0.7) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      {/* Emblem Watermark */}
      <div style={{
        position: 'absolute', left: '40%', top: '55%', width: 130, height: 130,
        transform: 'translate(-50%, -50%)',
        opacity: 0.20,
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
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px 0', position: 'relative', zIndex: 10 }}>
        {/* Left: Flag */}
        <div style={{ flexShrink: 0, width: 72, height: 48, position: 'relative', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.2)', boxShadow: '0 2px 6px rgba(0,0,0,0.15)', borderRadius: 4, marginRight: 12 }}>
          <img src={settings?.flagUrl || "/waqooyi-bari-flag.png?v=2"} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ flex: 1, whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '-0.2px' }}>Dawlada Hoose Ee Lascanod</div>
          <div style={{ fontSize: 7.5, fontWeight: 800, color: '#111', marginTop: 1 }}>{settings?.stateName?.toUpperCase() || 'WAQOOYI BARI'}</div>
          <div style={{ fontSize: 6.5, fontWeight: 900, color: '#111', marginTop: 1, textTransform: 'uppercase' }}>Kaadhka Dhalashada</div>
        </div>

        <div style={{ flex: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: 7.5, fontWeight: 800, color: '#111', marginTop: 12 }}>{settings?.stateName?.toUpperCase() || 'WAQOOYI BARI'}</div>
          <div style={{ fontSize: 6.5, fontWeight: 900, color: '#111', marginTop: 1, textTransform: 'uppercase' }}>Birth Certificate</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', padding: '5px 14px 10px', position: 'relative', zIndex: 10, height: 'calc(100% - 56px)' }}>
        
        {/* Text Details */}
        <div style={{ flex: 1, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
          <div>
            <div style={{ fontSize: 8, color: '#333', lineHeight: 1 }}>Tirsiga Aqoonsiga / ID Number</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#111', lineHeight: 1.2, letterSpacing: '0.02em' }}>{citizen.nationalIdNumber}</div>
          </div>
          
          <div>
            <div style={{ fontSize: 8, color: '#333', lineHeight: 1 }}>Magaca / Name</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#111', lineHeight: 1.1, textTransform: 'uppercase' }}>{firstName}</div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#111', lineHeight: 1.1, textTransform: 'uppercase' }}>{restName}</div>
          </div>

          <div>
            <div style={{ fontSize: 8, color: '#333', lineHeight: 1 }}>Taar. Dhalashada / D.O.B</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#111', lineHeight: 1.2 }}>{format(new Date(citizen.dateOfBirth), 'dd-MM-yyyy')}</div>
          </div>

          <div>
            <div style={{ fontSize: 8, color: '#333', lineHeight: 1 }}>Taar. La Bixiyey / Date of Issue</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#111', lineHeight: 1.2 }}>{format(new Date(citizen.issueDate), 'dd-MM-yyyy')}</div>
          </div>

          <div>
            <div style={{ fontSize: 8, color: '#333', lineHeight: 1 }}>Jinsiga / Gender</div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#111', lineHeight: 1.2 }}>{citizen.gender === 'Male' ? 'Lab / Male' : 'Dhedig / Female'}</div>
          </div>
        </div>

        {/* Right Side: Photo */}
        <div style={{ flexShrink: 0, paddingLeft: 10 }}>
          {citizen.photo ? (
             <img src={citizen.photo} alt="Citizen" style={{ 
               width: 85, height: 110, objectFit: 'cover', objectPosition: 'center', 
               mixBlendMode: 'multiply',
               filter: 'contrast(1.05)'
             }} />
          ) : (
             <div style={{ width: 85, height: 110, background: 'rgba(255,255,255,0.4)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#333', fontWeight: 'bold' }}>
               {citizen.fullName.charAt(0)}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CardBack({ citizen, settings }: { citizen: Citizen, settings?: AppSettings | null }) {
  return (
    <div style={{
      width: 350, height: 220,
      background: '#f4f7f6',
      borderRadius: 10,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      color: '#111',
      fontFamily: '"Arial", sans-serif',
      boxSizing: 'border-box',
    }}>
      {/* Pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.05,
        backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 10px)',
      }} />

      <div style={{ padding: '30px 20px 15px', display: 'flex', gap: 20 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
           <div>
             <div style={{ fontSize: 9, color: '#555' }}>{settings?.stateName || 'Waqooyi Bari'} National ID Management System</div>
             <div style={{ fontSize: 8, color: '#777', marginTop: 2 }}>This card is the property of the Government of {settings?.stateName || 'Waqooyi Bari'}. If found, please return to the nearest police station.</div>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 5 }}>
             <div>
               <div style={{ fontSize: 8, color: '#555' }}>Father's Name</div>
               <div style={{ fontSize: 10, fontWeight: 'bold' }}>{citizen.fatherName}</div>
             </div>
             <div>
               <div style={{ fontSize: 8, color: '#555' }}>Mother's Name</div>
               <div style={{ fontSize: 10, fontWeight: 'bold' }}>{citizen.motherName}</div>
             </div>
             <div>
               <div style={{ fontSize: 8, color: '#555' }}>District</div>
               <div style={{ fontSize: 10, fontWeight: 'bold' }}>{citizen.district}</div>
             </div>
             <div>
               <div style={{ fontSize: 8, color: '#555' }}>Expiry Date</div>
               <div style={{ fontSize: 10, fontWeight: 'bold', color: '#b30000' }}>{format(new Date(citizen.expiryDate), 'dd-MM-yyyy')}</div>
             </div>
           </div>
        </div>

        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {citizen.qrCode && (
            <img src={citizen.qrCode} alt="QR" style={{ width: 60, height: 60, padding: 2, background: 'white', border: '1px solid #ccc' }} />
          )}
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
  const [showBack, setShowBack] = useState(false);
  const [query, setQuery] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageInput, setPageInput] = useState('1');

  useEffect(() => {
    getSettings().then(setSettings).catch(console.error);
    getCitizens().then(all => {
      setCitizens(all);
      if (id) {
        const c = all.find(x => x.id === id);
        if (c) setSelected(c);
      }
    }).catch(console.error);
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

  async function handleDownload() {
    if (!cardRef.current || !selected) return;
    const canvas = await html2canvas(cardRef.current, { scale: 3, backgroundColor: null });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${selected.nationalIdNumber}-id-card.png`;
    a.click();
  }

  async function handleDownloadPDF() {
    if (!selected) return;
    setPdfLoading(true);
    try {
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      const frontDiv = document.createElement('div');
      container.appendChild(frontDiv);
      
      const wasShowingBack = showBack;
      
      if (wasShowingBack) setShowBack(false);
      await new Promise(r => setTimeout(r, 300));
      const frontCanvas = await html2canvas(cardRef.current!, { scale: 3, backgroundColor: null, useCORS: true });
      
      setShowBack(true);
      await new Promise(r => setTimeout(r, 300));
      const backCanvas = await html2canvas(cardRef.current!, { scale: 3, backgroundColor: null, useCORS: true });
      
      setShowBack(wasShowingBack);
      document.body.removeChild(container);

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
              {filtered.length === 0 ? (
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
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>{c.fullName}</div>
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
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary" onClick={handleDownloadPDF} disabled={pdfLoading} style={{ opacity: pdfLoading ? 0.7 : 1 }}>
                  {pdfLoading ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div className="spinner" style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>Generating PDF...</span> : <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={16} /> Export PDF</span>}
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-secondary" onClick={handleDownload}><Download size={16} /> Save PNG</motion.button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
