import React, { useState, useEffect } from 'react';
import { QrCode, Search, CheckCircle, XCircle, User, Hash, Calendar, MapPin, Phone, Sun, Moon } from 'lucide-react';
import { getCitizenByNationalId, getCitizensByName } from '../services/storage';
import type { Citizen } from '../types';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function QRVerification() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Citizen | null | 'not-found'>(null);
  const [multiResults, setMultiResults] = useState<Citizen[]>([]);
  const navigate = useNavigate();
  // Removed local dark mode state (managed globally)


// Removed theme initialization effect (handled globally)


// Removed theme persistence effect

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    
    setResult(null);
    setMultiResults([]);

    // Check by National ID (exact match)
    const byId = await getCitizenByNationalId(q.toUpperCase());
    if (byId) {
      setResult(byId);
      return;
    }

    // Check by Full Name
    const byName = await getCitizensByName(q);
    if (byName.length === 1) {
      setResult(byName[0]);
    } else if (byName.length > 1) {
      setMultiResults(byName);
    } else {
      setResult('not-found');
    }
  }
// Removed toggleTheme function

  
  return (
  <main className="container mx-auto min-h-screen flex items-start justify-center p-4 relative z-0">
        <div className="w-full max-w-3xl relative z-20">
          <div className="flex justify-end mb-4"></div>
        <section className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">QR Code Verification</h1>
          <p className="text-gray-600 dark:text-gray-300">Verify citizen identity by National ID or QR code</p>
        </section>

        <section className="bg-transparent rounded-xl shadow-md p-6 mb-6 relative z-20">
          <div className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-indigo-600 rounded-full flex items-center justify-center mb-2">
              <QrCode size={32} className="text-white" />
            </div>
            <div className="font-bold text-lg text-gray-800 dark:text-gray-100">Identity Verification Portal</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Enter National ID Number to verify citizen</div>
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 dark:bg-gray-700 text-white"
              placeholder="e.g. WB-2024-000001 or Full Name"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button
              className="bg-blue-600 text-white font-medium px-4 py-2 rounded hover:bg-blue-700 transition"
              onClick={handleSearch}
            >
              <Search size={16} className="inline mr-1" /> Verify
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 Enter National ID or a 3‑part Full Name (Magaca oo sadexan) to search.
          </p>
        </section>

        {multiResults.length > 0 && (
          <section className="bg-transparent rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Multiple Citizens Found ({multiResults.length})
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Please select the correct citizen from the list below:</p>
            <div className="flex flex-col gap-2">
              {multiResults.map(c => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded cursor-pointer bg-transparent hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  onClick={() => { setResult(c); setMultiResults([]); }}
                >
                  {c.photo ? (
                    <img src={c.photo} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-teal-600 flex items-center justify-center text-white font-bold">
                      {c.fullName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-gray-100">{c.fullName}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">ID: <span className="text-yellow-600">{c.nationalIdNumber}</span></div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{c.district}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {result === 'not-found' && (
          <section className="bg-transparent rounded-xl shadow-md p-6 text-center">
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">No Record Found</h3>
            <p className="text-gray-600 dark:text-gray-300">
              The National ID number <code className="text-yellow-600">{query}</code> does not match any registered citizen.
            </p>
          </section>
        )}

        {result && result !== 'not-found' && (
          <section className="bg-transparent rounded-xl shadow-md p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0">
                {result.photo ? (
                  <img src={result.photo} alt="" className="w-32 h-40 object-cover rounded border-4 border-teal-600" />
                ) : (
                  <div className="w-32 h-40 bg-gradient-to-br from-indigo-600 to-teal-600 rounded flex items-center justify-center text-4xl font-extrabold text-white">
                    {result.fullName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 grid gap-1">
                <div className="font-semibold text-gray-800 dark:text-gray-100">First: {result.fullName.split(' ')[0] || ''}</div>
                <div className="font-semibold text-gray-800 dark:text-gray-100">Middle: {result.fullName.split(' ')[1] || ''}</div>
                <div className="font-semibold text-gray-800 dark:text-gray-100">Last: {result.fullName.split(' ')[2] || ''}</div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded hover:bg-gray-400 transition"
                onClick={() => navigate(`/citizens/${result.id}`)}
              >
                View Full Profile
              </button>
              <button
                className="bg-blue-600 text-white font-medium px-4 py-2 rounded hover:bg-blue-700 transition"
                onClick={() => navigate(`/id-cards/${result.id}`)}
              >
                View ID Card
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}


