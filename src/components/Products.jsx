import { useState, useEffect } from 'react';
import { Search, RefreshCw, Copy, FileText, Check } from 'lucide-react';
import { fetchProducts, fetchOrders } from '../lib/sheets';
 
export default function Products({ token }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopySupplierList = () => {
    let text = `📋 OMS SUPPLIER ORDER LIST\n`;
    text += `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    text += `========================================\n\n`;
    
    let hasItems = false;
    products.forEach(product => {
      const pendingSizes = getPendingSizes(product);
      if (Object.keys(pendingSizes).length > 0) {
        hasItems = true;
        text += `${product.name} (${product.year} - ${product.type})\n`;
        Object.entries(pendingSizes).forEach(([size, qty]) => {
          text += `  • ${qty}x ${size}\n`;
        });
        text += `\n`;
      }
    });
    
    if (!hasItems) {
      text += `No pending orders currently.`;
    }
    
    const finalFormatter = text.trim();
    setCopiedText(finalFormatter);
    setShowCopyModal(true);
    
    // Copy to clipboard
    navigator.clipboard.writeText(finalFormatter);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };
 
  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, ordersData] = await Promise.all([
        fetchProducts(token),
        fetchOrders(token)
      ]);
      setProducts(productsData);
      setOrders(ordersData);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };
 
  useEffect(() => {
    loadProducts();
  }, [token]);
 
  const getPendingSizes = (product) => {
    const productString = `${product.name} (${product.year} - ${product.type})`;
    const sizeCounts = {};
    
    orders.forEach(order => {
      order.products.forEach((p, idx) => {
        if (p === productString) {
          const isPending = (order.itemStatuses?.[idx] || 'Pending') === 'Pending' && order.status !== 'Fulfilled';
          if (isPending) {
            const size = order.sizes[idx] || 'N/A';
            const qty = parseInt(order.quantities[idx]) || 0;
            sizeCounts[size] = (sizeCounts[size] || 0) + qty;
          }
        }
      });
    });
    
    return sizeCounts;
  };

  const getFulfilledSizes = (product) => {
    const productString = `${product.name} (${product.year} - ${product.type})`;
    const sizeCounts = {};
    
    orders.forEach(order => {
      order.products.forEach((p, idx) => {
        if (p === productString) {
          const isFulfilled = (order.itemStatuses?.[idx] === 'Fulfilled') || order.status === 'Fulfilled';
          if (isFulfilled) {
            const size = order.sizes[idx] || 'N/A';
            const qty = parseInt(order.quantities[idx]) || 0;
            sizeCounts[size] = (sizeCounts[size] || 0) + qty;
          }
        }
      });
    });
    
    return sizeCounts;
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.year.toString().includes(search.toLowerCase()) || 
    p.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 shadow-sm rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Products Master</h2>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
            />
          </div>
          <button 
            onClick={handleCopySupplierList}
            disabled={loading || products.length === 0}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 shadow-sm"
            title="Copy Supplier List"
          >
            <Copy className="w-4 h-4" />
            Copy Supplier List
          </button>
          <button 
            onClick={loadProducts}
            disabled={loading}
            className="p-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {error && (
          <div className="p-4 m-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Name</th>
              <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Year</th>
              <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Type</th>
              <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Sizes Available</th>
              <th className="p-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Orders Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && products.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500 dark:text-slate-400">Loading products from Sheets...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500 dark:text-slate-400">No products found.</td>
              </tr>
            ) : (
              filtered.map((product, i) => {
                const pendingSizes = getPendingSizes(product);
                const fulfilledSizes = getFulfilledSizes(product);
                const hasPending = Object.keys(pendingSizes).length > 0;
                const hasFulfilled = Object.keys(fulfilledSizes).length > 0;
                
                return (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{product.name}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{product.year}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-transparent dark:border-blue-900/50">
                        {product.type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      <div className="flex gap-1 flex-wrap">
                        {product.sizes.map((s, idx) => (
                          <span key={idx} className="border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      {hasPending || hasFulfilled ? (
                        <div className="flex flex-col gap-2">
                          {hasPending && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending</span>
                              <div className="flex gap-1.5 flex-wrap">
                                {Object.entries(pendingSizes).map(([size, qty]) => (
                                  <span key={size} className="text-xs font-bold border border-yellow-200 dark:border-yellow-900/60 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-md shadow-sm">
                                    <span className="text-amber-700 dark:text-amber-400 mr-0.5">{qty}x</span> {size}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {hasFulfilled && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fulfilled</span>
                              <div className="flex gap-1.5 flex-wrap">
                                {Object.entries(fulfilledSizes).map(([size, qty]) => (
                                  <span key={size} className="text-xs font-bold border border-emerald-250 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded-md shadow-sm">
                                    <span className="text-emerald-750 dark:text-emerald-400 mr-0.5">{qty}x</span> {size}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 dark:text-slate-500 font-normal">None</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-2.5 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Supplier Order List</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">Copied to your clipboard automatically!</p>
                </div>
              </div>
              {copySuccess ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-lg animate-pulse">
                  <Check className="w-3.5 h-3.5" />
                  Copied
                </span>
              ) : (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(copiedText);
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-750 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Again
                </button>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-900/5 dark:bg-slate-950/30 flex-1">
              <pre className="font-mono text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl whitespace-pre-wrap select-all leading-relaxed shadow-inner max-h-[50vh] overflow-y-auto">
                {copiedText}
              </pre>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowCopyModal(false)}
                className="px-6 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl shadow-md dark:shadow-none transition-colors text-sm"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
