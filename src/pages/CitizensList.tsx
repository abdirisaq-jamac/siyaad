import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Edit, Eye, UserPlus, Download, Filter, AlertTriangle, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { getCitizens, deleteCitizen } from '../services/storage';
import type { Citizen, AppUser } from '../types';
import { format } from 'date-fns';
import { useTranslation } from '../i18n';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function CitizensList() {
  const { t } = useTranslation();
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [occupationFilter, setOccupationFilter] = useState('All');
  const [maritalFilter, setMaritalFilter] = useState('All');
  const [selectedCitizens, setSelectedCitizens] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Sorting state
  const [sortField, setSortField] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function SortIcon({ field }: { field: string }) {
    if (sortField !== field) return <ChevronsUpDown size={13} style={{ opacity: 0.4 }} />;
    return sortDir === 'asc' ? <ChevronUp size={13} style={{ color: 'var(--primary-color)' }} /> : <ChevronDown size={13} style={{ color: 'var(--primary-color)' }} />;
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageInput, setPageInput] = useState('1');
  
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  const load = () => {
    setLoading(true);
    getCitizens()
      .then(setCitizens)
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(() => { 
    const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (rawUser) {
      try { setCurrentUser(JSON.parse(rawUser)); } catch (e) {}
    }
    load(); 
  }, []);

  // Reset to first page when filters change
  useEffect(() => { setCurrentPage(1); }, [query, statusFilter, genderFilter, districtFilter, occupationFilter, maritalFilter]);

  // Sync pageInput with currentPage
  useEffect(() => { setPageInput(currentPage.toString()); }, [currentPage]);

  const filtered = citizens.filter(c => {
    const q = query.toLowerCase();
    const matchQ = !q || c.fullName.toLowerCase().includes(q) ||
      c.nationalIdNumber.toLowerCase().includes(q) ||
      c.phone.includes(q) || c.district.toLowerCase().includes(q);
    const matchS = statusFilter === 'All' || c.status === statusFilter;
    const matchG = genderFilter === 'All' || c.gender === genderFilter;
    const matchD = districtFilter === 'All' || c.district === districtFilter;
    const matchO = occupationFilter === 'All' || c.occupation === occupationFilter;
    const matchM = maritalFilter === 'All' || c.maritalStatus === maritalFilter;
    return matchQ && matchS && matchG && matchD && matchO && matchM;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    let av: string = '';
    let bv: string = '';
    if (sortField === 'name') { av = a.fullName; bv = b.fullName; }
    else if (sortField === 'id') { av = a.nationalIdNumber; bv = b.nationalIdNumber; }
    else if (sortField === 'district') { av = a.district; bv = b.district; }
    else if (sortField === 'status') { av = a.status; bv = b.status; }
    else if (sortField === 'registered') { av = a.registrationDate; bv = b.registrationDate; }
    else if (sortField === 'gender') { av = a.gender; bv = b.gender; }
    const cmp = av.localeCompare(bv);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const allDistricts = Array.from(new Set(citizens.map(c => c.district))).filter(Boolean).sort();
  const allOccupations = Array.from(new Set(citizens.map(c => c.occupation))).filter(Boolean).sort();

  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sorted.slice(indexOfFirstItem, indexOfLastItem);

  async function handleDelete(id: string) {
    await deleteCitizen(id);
    setConfirmDelete(null);
    
    // Adjust page if we deleted the last item on the current page
    if (currentItems.length === 1 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
    load();
  }

  function exportCSV() {
    const dataToExport = selectedCitizens.size > 0 
      ? filtered.filter(c => selectedCitizens.has(c.id))
      : filtered;

    if (dataToExport.length === 0) return;

    // Helper: wrap value safely for Excel — prevents auto-conversion of dates/numbers
    const safe = (v: string | null | undefined) => {
      const str = (v ?? '').toString().replace(/"/g, '""');
      // Force text format for dates, phone numbers, IDs using ="value" trick
      return `"${str}"`;
    };
    // For fields Excel tends to auto-convert, use standard quotes (removes Excel ="value" formula trick)
    const asText = (v: string | null | undefined) => `"${(v ?? '').toString().replace(/"/g, '""')}"`;

    const header = ['National ID', 'Full Name', 'Father Name', 'Date of Birth', 'Gender', 'Phone', 'District', 'Status', 'Registered'];
    const rows = dataToExport.map(c => [
      asText(c.nationalIdNumber),  // prevent WB-2026-12345 being parsed
      safe(c.fullName),
      safe(c.fatherName),
      asText(c.dateOfBirth),        // prevent YYYY-MM-DD becoming a date serial
      safe(c.gender),
      asText(c.phone),              // prevent 0612345678 losing leading zero or becoming scientific
      safe(c.district),
      safe(c.status),
      asText(c.registrationDate),   // prevent date conversion
    ]);

    // UTF-8 BOM (\uFEFF) ensures Excel opens with correct encoding
    const BOM = '\uFEFF';
    const csv = BOM + [header.map(h => `"${h}"`), ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'citizens.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  function handleSelectAll(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      const newSet = new Set(selectedCitizens);
      currentItems.forEach(c => newSet.add(c.id));
      setSelectedCitizens(newSet);
    } else {
      const newSet = new Set(selectedCitizens);
      currentItems.forEach(c => newSet.delete(c.id));
      setSelectedCitizens(newSet);
    }
  }

  function handleSelectOne(id: string, checked: boolean) {
    const newSet = new Set(selectedCitizens);
    if (checked) newSet.add(id);
    if (checked) newSet.add(id); else newSet.delete(id);
    setSelectedCitizens(newSet);
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div variants={itemVariants} className="page-header">
        <div>
          <div className="page-title">{t('Citizens List') || 'Citizens List'}</div>
          <div className="page-subtitle">{sorted.length} {t('of')} {citizens.length} {t('citizens found')}</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-secondary" onClick={exportCSV} disabled={citizens.length === 0}>
            <Download size={18} /> {t('Export CSV') || 'Export CSV'}
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-primary" onClick={() => navigate('/register')}>
            <UserPlus size={18} /> {t('Register New') || 'Register New'}
          </motion.button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder={t('Search by name, ID, phone, district…') || 'Search by name, ID, phone, district…'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.8rem' }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input" style={{ width: 'auto', minWidth: '150px' }}>
          <option value="All">{t('All Statuses') || 'All Statuses'}</option>
          <option value="Active">{t('Active') || 'Active'}</option>
          <option value="Pending">{t('Pending') || 'Pending'}</option>
          <option value="Rejected">{t('Rejected') || 'Rejected'}</option>
        </select>
        <div style={{ position: 'relative' }} ref={filterRef}>
          <button className={`btn-secondary ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <Filter size={18} /> {t('Advanced Filters') || 'Advanced Filters'}
          </button>
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.25rem', zIndex: 50, minWidth: '340px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem' }}>{t('Filters')}</h3>
                  <button type="button" onClick={() => { setStatusFilter('All'); setGenderFilter('All'); setDistrictFilter('All'); setOccupationFilter('All'); setMaritalFilter('All'); }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>{t('Clear All')}</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <select className="form-input" value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>{['All','Male','Female'].map(g => <option key={g} value={g}>{t(g) || g}</option>)}</select>
                  <select className="form-input" value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}><option value="All">{t('All Districts')}</option>{allDistricts.map(d => <option key={d} value={d}>{d}</option>)}</select>
                  <select className="form-input" value={occupationFilter} onChange={e => setOccupationFilter(e.target.value)}><option value="All">{t('All Occupations')}</option>{allOccupations.map(o => <option key={o} value={o}>{o}</option>)}</select>
                  <select className="form-input" value={maritalFilter} onChange={e => setMaritalFilter(e.target.value)}><option value="All">{t('All Marital Statuses')}</option>{['Single', 'Married', 'Divorced', 'Widowed'].map(m => <option key={m} value={m}>{t(m) || m}</option>)}</select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('Rows per page:') || 'Rows per page:'}</span>
          <select className="form-input" style={{ width: 'auto' }} value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
            {[10, 15, 20, 25, 30, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" checked={currentItems.length > 0 && currentItems.every(c => selectedCitizens.has(c.id))} onChange={handleSelectAll} /></th>
                <th>{t('Photo')}</th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>{t('Citizen Details')} <SortIcon field="name" /></th>
                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>{t('National ID')} <SortIcon field="id" /></th>
                <th onClick={() => handleSort('district')} style={{ cursor: 'pointer' }}>{t('Contact & Location')} <SortIcon field="district" /></th>
                <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>{t('Status')} <SortIcon field="status" /></th>
                <th onClick={() => handleSort('registered')} style={{ cursor: 'pointer' }}>{t('Registered')} <SortIcon field="registered" /></th>
                <th style={{ textAlign: 'right' }}>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((citizen) => (
                <tr key={citizen.id}>
                  <td><input type="checkbox" checked={selectedCitizens.has(citizen.id)} onChange={(e) => handleSelectOne(citizen.id, e.target.checked)} /></td>
                  <td>{citizen.photo ? <img src={citizen.photo} alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} /> : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ccc' }} />}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{citizen.fullName}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{t(citizen.gender) || citizen.gender} • {t(citizen.maritalStatus) || citizen.maritalStatus}</div>
                  </td>
                  <td><code>{citizen.nationalIdNumber}</code></td>
                  <td><div>{citizen.phone}</div><div style={{ fontSize: '0.8rem' }}>{citizen.district}</div></td>
                  <td><span className={citizen.status === 'Active' ? 'badge-active' : citizen.status === 'Pending' ? 'badge-pending' : 'badge-rejected'}>{t(citizen.status) || citizen.status}</span></td>
                  <td>{format(new Date(citizen.registrationDate), 'dd MMM yyyy')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => navigate(`/citizens/${citizen.id}`)}><Eye size={16} /></button>
                      {(currentUser?.role === 'Super Admin' || currentUser?.permissions?.editCitizen) && <button onClick={() => navigate(`/citizens/${citizen.id}/edit`)}><Edit size={16} /></button>}
                      {(currentUser?.role === 'Super Admin' || currentUser?.permissions?.deleteCitizen) && <button onClick={() => setConfirmDelete(citizen.id)}><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {t('Showing')} <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentItems.length > 0 ? indexOfFirstItem + 1 : 0}</span> {t('to')} <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{Math.min(indexOfLastItem, sorted.length)}</span> {t('of')} <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{sorted.length}</span> {t('entries')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }} disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>{t('Previous')}</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                    return (
                      <button key={page} onClick={() => setCurrentPage(page)} style={{ width: 32, height: 32, borderRadius: 6, border: 'none', background: currentPage === page ? 'var(--primary-color)' : 'transparent', color: currentPage === page ? 'white' : 'var(--text-main)', cursor: 'pointer' }}>{page}</button>
                    );
                  } else if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} style={{ color: 'var(--text-muted)' }}>...</span>;
                  return null;
                })}
              </div>
              <button className="btn-secondary" style={{ padding: '0.5rem 1rem' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>{t('Next')}</button>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ padding: '2rem', maxWidth: 400, textAlign: 'center' }}>
              <AlertTriangle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
              <h3>{t('Confirm Deletion')}</h3>
              <p>{t('Are you sure you want to delete this citizen record? This action cannot be undone.')}</p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>{t('Cancel')}</button>
                <button className="btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(confirmDelete)}>{t('Delete')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
