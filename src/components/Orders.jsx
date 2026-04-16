import { useState, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle2 } from 'lucide-react';
import { fetchOrders, updateOrderStatus } from '../lib/sheets';

export default function Orders({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [error, setError] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrders(token);
      setOrders(data.reverse()); // Show newest first
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [token]);

  const handleFulfill = async (rowIndex) => {
    try {
      await updateOrderStatus(token, rowIndex, 'Fulfilled');
      setOrders(orders.map(o => o.rowIndex === rowIndex ? { ...o, status: 'Fulfilled' } : o));
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || 
                       o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Order Tracking</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search customer or ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-slate-300 rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Fulfilled">Fulfilled</option>
          </select>
          <button 
            onClick={loadOrders}
            disabled={loading}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {error && (
          <div className="p-4 m-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
            {error}
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 whitespace-nowrap">
              <th className="p-4 text-sm font-semibold text-slate-600 w-24">Order ID</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Timestamp</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Customer</th>
              <th className="p-4 text-sm font-semibold text-slate-600 min-w-[300px]">Items</th>
              <th className="p-4 text-sm font-semibold text-slate-600 w-32">Status</th>
              <th className="p-4 text-sm font-semibold text-slate-600 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && orders.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">Loading orders from Sheets...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">No orders found.</td>
              </tr>
            ) : (
              filtered.map((order, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-500">{(order.id || '').substring(0, 8)}</td>
                  <td className="p-4 text-sm text-slate-600">{new Date(order.timestamp).toLocaleString()}</td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{order.customerName}</div>
                    <div className="text-sm text-slate-500">{order.contactInfo}</div>
                  </td>
                  <td className="p-4">
                    <ul className="space-y-1">
                      {order.products.map((p, idx) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="font-medium inline-block w-6 text-slate-700">{order.quantities[idx]}x</span>
                          <span className="text-slate-600">{p}</span>
                          <span className="text-xs border px-1.5 rounded bg-slate-100 text-slate-500 mt-0.5">{order.sizes[idx]}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      order.status === 'Fulfilled' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {order.status !== 'Fulfilled' && (
                      <button 
                        onClick={() => handleFulfill(order.rowIndex)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-green-600 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Fulfill
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
