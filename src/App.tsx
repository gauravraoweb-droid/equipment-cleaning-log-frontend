import { useState, useEffect } from 'react';
import api from './services/api';
import type { Equipment, CleaningRecord, AuditEntry } from './types';
import { FiSun, FiMoon } from 'react-icons/fi';


const EquipmentSkeleton = () => (
  <div className="animate-pulse space-y-2">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
    ))}
  </div>
);

const RecordSkeleton = () => (
  <div className="animate-pulse space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="border-b border-gray-200 dark:border-gray-700 py-3 flex justify-between">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

const AuditSkeleton = () => (
  <div className="animate-pulse space-y-3">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
    ))}
  </div>
);

function App() {

  const [darkMode, setDarkMode] = useState(() => 
    localStorage.getItem('theme') === 'dark'
  );

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);

  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [records, setRecords] = useState<CleaningRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');

  const [editingRecord, setEditingRecord] = useState<CleaningRecord | null>(null);
  const [form, setForm] = useState({
    cleanedBy: '',
    cleanedAt: '',
    method: '',
    notes: '',
    status: 'PENDING',
  });

  const [showAudit, setShowAudit] = useState<string | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);


  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);


useEffect(() => {
  setLoadingEquipment(true);

  api.get('/equipment')
    .then(res => {
      setEquipment(res.data);

      if (res.data.length > 0) {
        setSelectedEquipment(res.data[0]);
        setPage(1);
        setFilterStatus('');
      }
    })
    .finally(() => setLoadingEquipment(false));
}, []);


  useEffect(() => {
    if (!selectedEquipment) return;
    setLoadingRecords(true);
    const params: any = { equipmentId: selectedEquipment.id, page, limit: 2 };
    if (filterStatus) params.status = filterStatus;
    api.get('/records', { params })
      .then(res => {
        setRecords(res.data.data);
        setTotalPages(res.data.meta.totalPages);
      })
      .finally(() => setLoadingRecords(false));
  }, [selectedEquipment, page, filterStatus]);


  const fetchAudit = async (recordId: string) => {
    setShowAudit(recordId);
    setLoadingAudit(true);
    setAuditHistory([]);
    try {
      const res = await api.get(`/audits/${recordId}`);
      setAuditHistory(res.data);
    } finally {
      setLoadingAudit(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;

    setIsSubmitting(true); 
    setLoadingRecords(true); 

    const payload = { ...form, equipmentId: selectedEquipment.id, cleanedAt: new Date(form.cleanedAt).toISOString() };
    try {
      if (editingRecord) {
        await api.put(`/records/${editingRecord.id}`, payload);
      } else {
        await api.post('/records', payload);
      }

      setEditingRecord(null);
      setForm({ cleanedBy: '', cleanedAt: '', method: '', notes: '', status: 'PENDING' });

      const params: any = { equipmentId: selectedEquipment.id, page, limit: 2 };
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/records', { params });
      setRecords(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoadingRecords(false);
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: CleaningRecord) => {
    setEditingRecord(record);
    setForm({
      cleanedBy: record.cleanedBy,
      cleanedAt: record.cleanedAt.slice(0, 16),
      method: record.method,
      notes: record.notes || '',
      status: record.status,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
   
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2">
            🧼 Equipment Cleaning Log
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
          >
            {darkMode ? <FiSun className="text-yellow-400 text-xl" /> : <FiMoon className="text-gray-700 text-xl" />}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 h-fit">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Equipment</h2>
            {loadingEquipment ? (
              <EquipmentSkeleton />
            ) : (
              <ul className="space-y-2">
                {equipment.map(eq => (
                  <li
                    key={eq.id}
                    className={`p-2 rounded-lg cursor-pointer transition-all ${
                      selectedEquipment?.id === eq.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-medium shadow-sm'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedEquipment(eq);
                      setPage(1);
                      setFilterStatus('');
                      setEditingRecord(null);
                    }}
                  >
                    {eq.name} <span className="text-xs opacity-60">({eq.code})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

         
          <div className="md:col-span-3">
            {selectedEquipment ? (
              <>
            
                <div className="flex flex-wrap items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Records for <span className="text-blue-600 dark:text-blue-400">{selectedEquipment.name}</span>
                  </h2>
                  <select
                    value={filterStatus}
                    onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                    className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="VERIFIED">Verified</option>
                  </select>
                </div>


                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
                  {loadingRecords ? (
                    <RecordSkeleton />
                  ) : records.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-6">No cleaning records found.</p>
                  ) : (
                    <>
                      {records.map(rec => (
                        <div key={rec.id} className="border-b border-gray-100 dark:border-gray-700 py-3 flex flex-wrap justify-between items-center last:border-0">
                          <div className="space-y-1 flex-1">
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              👤 {rec.cleanedBy}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              🕒 {new Date(rec.cleanedAt).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              🧪 {rec.method}
                            </p>
                            <p className="text-sm">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                rec.status === 'VERIFIED'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              }`}>
                                {rec.status}
                              </span>
                            </p>
                          </div>
                          <div className="flex space-x-2 mt-2 md:mt-0">
                            <button
                              onClick={() => handleEdit(rec)}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => fetchAudit(rec.id)}
                              className="text-gray-600 dark:text-gray-400 hover:underline text-sm font-medium"
                            >
                              Audit
                            </button>
                          </div>
                        </div>
                      ))}
                  
                      {totalPages > 1  && (
                        <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <button
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                          >
                            Prev
                          </button>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {page} of {totalPages}
                          </span>
                          <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>


                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    {editingRecord ? '✏️ Edit' : '➕ Add'} Cleaning Record
                  </h3>
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text" placeholder="Cleaned By" value={form.cleanedBy}
                      onChange={e => setForm({ ...form, cleanedBy: e.target.value })}
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    />
                    <input
                      type="datetime-local" value={form.cleanedAt}
                      onChange={e => setForm({ ...form, cleanedAt: e.target.value })}
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    />
                    <input
                      type="text" placeholder="Method" value={form.method}
                      onChange={e => setForm({ ...form, method: e.target.value })}
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={isSubmitting}
                    />
                    <textarea
                      placeholder="Notes" value={form.notes}
                      onChange={e => setForm({ ...form, notes: e.target.value })}
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <select
                      value={form.status}
                      onChange={e => setForm({ ...form, status: e.target.value as 'PENDING' | 'VERIFIED' })}
                      className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="VERIFIED">Verified</option>
                    </select>
                    <div className="flex items-center space-x-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition font-medium ${
                          isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSubmitting ? 'Saving…' : (editingRecord ? 'Update' : 'Add')}
                      </button>
                      {editingRecord && !isSubmitting && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRecord(null);
                            setForm({ cleanedBy: '', cleanedAt: '', method: '', notes: '', status: 'PENDING' });
                          }}
                          className="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-lg transition font-medium"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>


                {showAudit && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-fade-in">
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        📜 Audit Trail
                      </h3>
                      {loadingAudit ? (
                        <AuditSkeleton />
                      ) : auditHistory.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No changes recorded.</p>
                      ) : (
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
                          {auditHistory.map(a => (
                            <li key={a.id} className="py-2 text-sm">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">{a.field}</span>
                              <span className="text-gray-600 dark:text-gray-400">
                                : {a.oldValue ?? 'null'} → {a.newValue ?? 'null'}
                              </span>
                              <span className="text-gray-400 dark:text-gray-500 text-xs ml-2">
                                ({new Date(a.changedAt).toLocaleString()})
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        onClick={() => setShowAudit(null)}
                        className="mt-5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-5 py-2 rounded-lg transition font-medium w-full"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <EquipmentSkeleton/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;