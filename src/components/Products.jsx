import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { fetchProducts } from '../lib/sheets';

export default function Products({ token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProducts(token);
      setProducts(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, [token]);

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.year.toLowerCase().includes(search.toLowerCase()) || 
    p.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Products Master</h2>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            onClick={loadProducts}
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
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-sm font-semibold text-slate-600">Name</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Year</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Type</th>
              <th className="p-4 text-sm font-semibold text-slate-600">Sizes Available</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && products.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-500">Loading products from Sheets...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-500">No products found.</td>
              </tr>
            ) : (
              filtered.map((product, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{product.name}</td>
                  <td className="p-4 text-slate-600">{product.year}</td>
                  <td className="p-4 text-slate-600">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                      {product.type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="flex gap-1 flex-wrap">
                      {product.sizes.map((s, idx) => (
                        <span key={idx} className="border border-slate-200 px-2 py-0.5 rounded text-xs bg-white text-slate-600">{s}</span>
                      ))}
                    </div>
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
