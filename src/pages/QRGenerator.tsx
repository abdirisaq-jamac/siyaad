import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Download } from 'lucide-react';
import { getCitizenById } from '../services/storage';
import { generateQRCode } from '../services/idGenerator';
import type { Citizen } from '../types';

/**
 * QRGenerator — opens at /qr/:id
 * Builds a QR code whose payload is the public citizen-profile URL.
 * Scanning with any mobile camera navigates the phone directly to that URL.
 */
export default function QRGenerator() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const c = await getCitizenById(id);
      if (!c) { setLoading(false); return; }
      setCitizen(c);
      // Encode the National ID — works offline, readable by any QR app,
      // and our QRVerification camera scanner resolves it to the full citizen record.
      const qr = await generateQRCode(c.nationalIdNumber);
      setQrUrl(qr);
      setLoading(false);
    })();
  }, [id]);

  function downloadQR() {
    if (!qrUrl || !citizen) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `${citizen.nationalIdNumber}-qr.png`;
    a.click();
  }

  if (loading) return (
    <div className="fade-in-up" style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
      QR code waa la diyaarinayaa…
    </div>
  );

  if (!citizen) return (
    <div className="fade-in-up" style={{ padding: '3rem', textAlign: 'center' }}>
      <div style={{ color: '#e74c3c', marginBottom: '1rem' }}>Citizen lama helin.</div>
      <button className="btn-secondary" onClick={() => navigate(-1)}>
        <ArrowLeft size={14} /> Dib u noqo
      </button>
    </div>
  );

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-secondary" style={{ padding: '0.5rem' }} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="page-title">QR Code — {citizen.fullName}</div>
            <div className="page-subtitle">Scan-gareeya mobile-ka, oo QR Verification-ka ku fur xogta oo dhamaysan</div>
          </div>
        </div>
        <button className="btn-secondary" onClick={downloadQR}>
          <Download size={16} /> Download QR
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', maxWidth: 400 }}>
          {/* Citizen thumbnail */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
            {citizen.photo
              ? <img src={citizen.photo} alt="" style={{ width: 56, height: 60, objectFit: 'cover', borderRadius: 6, border: '2px solid #00875a' }} />
              : <div style={{ width: 56, height: 60, borderRadius: 6, background: 'linear-gradient(135deg,#2563eb,#00875a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>{citizen.fullName.charAt(0)}</div>
            }
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, color: '#1e293b' }}>{citizen.fullName}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{citizen.nationalIdNumber}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{citizen.district}</div>
            </div>
          </div>

          {/* QR image */}
          <div style={{
            display: 'inline-block',
            padding: 12,
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '2px solid #e2e8f0',
          }}>
            {qrUrl
              ? <img src={qrUrl} alt="QR Code" style={{ width: 220, height: 220, display: 'block' }} />
              : <div style={{ width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  <QrCode size={48} style={{ opacity: 0.4 }} />
                </div>
            }
          </div>

          <div style={{ marginTop: '1.25rem', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
            Scan-gareeya QR code-ka mobile-ka, kaddib ku fur <strong>QR Verification</strong> page-ka si aad xogta oo dhamaysan u aragto.
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8', background: '#f1f5f9', padding: '0.3rem 0.75rem', borderRadius: 6, display: 'inline-block' }}>
            National ID: <strong>{citizen.nationalIdNumber}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
