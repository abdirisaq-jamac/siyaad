import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Edit, Eye, UserPlus, Download, Filter, AlertTriangle } from 'lucide-react';
import { getCitizens, deleteCitizen } from '../services/storage';
import type { Citizen, AppUser } from '../types';
import { format } from 'date-fns';

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

  const allDistricts = Array.from(new Set(citizens.map(c => c.district))).filter(Boolean).sort();
  const allOccupations = Array.from(new Set(citizens.map(c => c.occupation))).filter(Boolean).sort();

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);

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
    else newSet.delete(id);
    setSelectedCitizens(newSet);
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <motion.div variants={itemVariants} className="page-header">
        <div>
          <div className="page-title">Citizens List</div>
          <div className="page-subtitle">{filtered.length} of {citizens.length} citizens found</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            className="btn-secondary" 
            onClick={exportCSV}
          >
            <Download size={18} /> {selectedCitizens.size > 0 ? `Export CSV (${selectedCitizens.size})` : 'Export CSV'}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-primary" onClick={() => navigate('/register')}>
            <UserPlus size={18} /> Register New
          </motion.button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{
          flex: '1 1 300px', background: 'var(--bg-main)', border: '1px solid var(--border-color)',
          borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)', transition: 'all 0.3s ease'
        }} className="focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder="Search by name, ID, phone, district…"
            value={query} onChange={e => setQuery(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.95rem', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div ref={filterRef} style={{ position: 'relative' }}>
            <button 
              type="button"
              className="btn-secondary" 
              onClick={() => setShowFilters(!showFilters)}
              style={{ padding: '0.6rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: '140px', justifyContent: 'space-between' }}
            >
              <span>{statusFilter === 'All' ? 'All Statuses' : statusFilter}</span>
              {(statusFilter !== 'All' || genderFilter !== 'All' || districtFilter !== 'All' || occupationFilter !== 'All' || maritalFilter !== 'All') && (
                <span style={{ background: 'var(--primary-color)', width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }}></span>
              )}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{ 
                    position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', 
                    background: 'var(--bg-card)', border: '1px solid var(--border-color)', 
                    borderRadius: '16px', padding: '1.25rem', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', 
                    display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 50,
                    minWidth: '340px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Advanced Filters</h3>
                    {(statusFilter !== 'All' || genderFilter !== 'All' || districtFilter !== 'All' || occupationFilter !== 'All' || maritalFilter !== 'All') && (
                      <button 
                        type="button" 
                        onClick={() => { setStatusFilter('All'); setGenderFilter('All'); setDistrictFilter('All'); setOccupationFilter('All'); setMaritalFilter('All'); }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                         Clear All
                      </button>
                    )}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</label>
                      <select className="form-input" style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        {['All','Active','Pending','Rejected'].map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gender</label>
                      <select className="form-input" style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
                        {['All','Male','Female'].map(g => <option key={g} value={g}>{g === 'All' ? 'All Genders' : g}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>District</label>
                      <select className="form-input" style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
                        <option value="All">All Districts</option>
                        {allDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Occupation</label>
                      <select className="form-input" style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} value={occupationFilter} onChange={e => setOccupationFilter(e.target.value)}>
                        <option value="All">All Occupations</option>
                        {allOccupations.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Marital Status</label>
                      <select className="form-input" style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} value={maritalFilter} onChange={e => setMaritalFilter(e.target.value)}>
                        <option value="All">All Marital Statuses</option>
                        {['Single', 'Married', 'Divorced', 'Widowed'].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rows per page:</span>
            <select 
              className="form-input" 
              style={{ padding: '0.6rem 1.5rem 0.6rem 0.75rem', width: 'auto', fontSize: '0.85rem' }}
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[10, 15, 20, 25, 30, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div variants={itemVariants} className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input 
                    type="checkbox"
                    checked={currentItems.length > 0 && currentItems.every(c => selectedCitizens.has(c.id))}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ width: 40 }}>#</th>
                <th style={{ width: 70 }}>Photo</th>
                <th>Citizen Details</th>
                <th>National ID</th>
                <th>Contact & Location</th>
                <th>Status</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
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
                  <td colSpan={9} style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                    <div style={{ background: 'var(--bg-main)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <UserPlus size={40} style={{ opacity: 0.5, color: 'var(--primary-color)' }} />
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>No citizens found</div>
                    <div style={{ fontSize: '0.9rem' }}>Try adjusting your search or filters.</div>
                  </td>
                </tr>
              ) : (
                currentItems.map((c, i) => (
                  <tr key={c.id}>
                    <td>
                      <input 
                        type="checkbox"
                        checked={selectedCitizens.has(c.id)}
                        onChange={(e) => handleSelectOne(c.id, e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{indexOfFirstItem + i + 1}</td>
                    <td>
                      {c.photo ? (
                        <img src={c.photo} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)' }} />
                      ) : (
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%',
                          background: 'var(--primary-gradient)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, color: 'white', fontSize: '1rem',
                        }}>{c.fullName.charAt(0)}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>{c.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{c.gender} • {c.occupation}</div>
                    </td>
                    <td>
                      <code style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        {c.nationalIdNumber}
                      </code>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{c.phone}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{c.district}</div>
                    </td>
                    <td>
                      <span className={
                        c.status === 'Active' ? 'badge-active' :
                        c.status === 'Pending' ? 'badge-pending' : 'badge-rejected'
                      }>{c.status}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {format(new Date(c.registrationDate), 'dd MMM yyyy')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                          whileTap={{ scale: 0.9 }}
                          title="View Details"
                          onClick={() => navigate(`/citizens/${c.id}`)}
                          style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: 'var(--primary-color)', transition: 'all 0.2s' }}
                        ><Eye size={16} /></motion.button>
                        {(currentUser?.role === 'Super Admin' || currentUser?.permissions?.editCitizen === true) && (
                          <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(245, 158, 11, 0.1)' }}
                            whileTap={{ scale: 0.9 }}
                            title="Edit"
                            onClick={() => navigate(`/citizens/${c.id}/edit`)}
                            style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: '#f59e0b', transition: 'all 0.2s' }}
                          ><Edit size={16} /></motion.button>
                        )}
                        {(currentUser?.role === 'Super Admin' || currentUser?.permissions?.deleteCitizen === true) && (
                          <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                            whileTap={{ scale: 0.9 }}
                            title="Delete"
                            onClick={() => setConfirmDelete(c.id)}
                            style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: '#ef4444', transition: 'all 0.2s' }}
                          ><Trash2 size={16} /></motion.button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-main)', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing <strong style={{ color: 'var(--text-main)' }}>{indexOfFirstItem + 1}</strong> to <strong style={{ color: 'var(--text-main)' }}>{Math.min(indexOfLastItem, filtered.length)}</strong> of <strong style={{ color: 'var(--text-main)' }}>{filtered.length}</strong> entries
            </div>
            
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <button 
                  className="btn-secondary" 
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', opacity: currentPage === 1 ? 0.5 : 1 }} 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Page 
                  <input 
                    type="number"
                    min={1} 
                    max={totalPages}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={() => {
                      const val = parseInt(pageInput);
                      if (!isNaN(val) && val >= 1 && val <= totalPages) {
                        setCurrentPage(val);
                      } else {
                        setPageInput(currentPage.toString());
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(pageInput);
                        if (!isNaN(val) && val >= 1 && val <= totalPages) {
                          setCurrentPage(val);
                        } else {
                          setPageInput(currentPage.toString());
                        }
                      }
                    }}
                    style={{ 
                      width: '50px', margin: '0 0.5rem', textAlign: 'center', 
                      padding: '0.3rem', borderRadius: '6px', border: '1px solid var(--border-color)', 
                      background: 'var(--bg-main)', color: 'var(--text-main)' 
                    }}
                  />
                  of {totalPages}
                </div>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', opacity: currentPage === totalPages ? 0.5 : 1 }} 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card" 
              style={{ padding: '2.5rem', maxWidth: 450, width: '100%', textAlign: 'center', background: 'var(--bg-card)' }}
            >
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <AlertTriangle size={32} style={{ color: '#ef4444' }} />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                Confirm Deletion
              </div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.5 }}>
                Are you sure you want to delete this citizen record? This action cannot be undone and will permanently remove all associated data and ID cards.
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancel</button>
                <button className="btn-danger" style={{ flex: 1 }} onClick={() => handleDelete(confirmDelete)}>Delete Citizen</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
