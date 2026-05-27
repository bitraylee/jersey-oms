import { useState, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle2, Users, ChevronDown, ChevronRight, Edit } from 'lucide-react';
import { fetchOrders, updateOrderStatus, updateOrder } from '../lib/sheets';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text, search) {
  if (!search.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${escapeRegExp(search)})`, 'gi');
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 font-semibold text-slate-900 rounded px-0.5">{part}</mark>
        ) : (
          part
        )
      )}
    </span>
  );
}

function getRowGradientClass(status) {
  if (status === 'Fulfilled') {
    return 'bg-gradient-to-r from-white via-white/80 to-green-100/70 hover:to-green-100 transition-all duration-200';
  }
  return 'hover:bg-slate-50/50 transition-colors';
}

export default function Orders({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [groupByOrderedBy, setGroupByOrderedBy] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [editingOrder, setEditingOrder] = useState(null);
  const [error, setError] = useState(null);

  const toggleGroupCollapse = (groupKey) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

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

  const handleToggleItemFulfillment = async (order, itemIndex) => {
    const newItemStatuses = [...(order.itemStatuses || [])];
    // Safeguard array length
    while (newItemStatuses.length < order.products.length) {
      newItemStatuses.push('Pending');
    }
    newItemStatuses[itemIndex] = newItemStatuses[itemIndex] === 'Fulfilled' ? 'Pending' : 'Fulfilled';

    // Calculate new overall status
    const allFulfilled = newItemStatuses.every(s => s === 'Fulfilled');
    const someFulfilled = newItemStatuses.some(s => s === 'Fulfilled');
    const newStatus = allFulfilled ? 'Fulfilled' : (someFulfilled ? 'Partially Fulfilled' : 'Pending');

    const updatedOrder = {
      ...order,
      itemStatuses: newItemStatuses,
      status: newStatus
    };

    try {
      await updateOrder(token, order.rowIndex, updatedOrder);
      setOrders(orders.map(o => o.rowIndex === order.rowIndex ? updatedOrder : o));
    } catch (err) {
      alert("Failed to update item: " + err.message);
    }
  };

  const handleFulfill = async (order) => {
    const newItemStatuses = order.products.map(() => 'Fulfilled');
    const updatedOrder = {
      ...order,
      itemStatuses: newItemStatuses,
      status: 'Fulfilled'
    };

    try {
      await updateOrder(token, order.rowIndex, updatedOrder);
      setOrders(orders.map(o => o.rowIndex === order.rowIndex ? updatedOrder : o));
    } catch (err) {
      alert("Failed to fulfill order: " + err.message);
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.customerName.toLowerCase().includes(search.toLowerCase()) || 
                       o.id.toLowerCase().includes(search.toLowerCase()) ||
                       o.products.some(p => p.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'All' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const groupedOrders = {};
  if (groupByOrderedBy) {
    filtered.forEach(order => {
      const key = order.contactInfo.trim() || 'Unspecified';
      if (!groupedOrders[key]) {
        groupedOrders[key] = [];
      }
      groupedOrders[key].push(order);
    });
  }

  return (
    <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold text-slate-800">Order Tracking</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search customer, ID, or item..." 
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
            onClick={() => setGroupByOrderedBy(!groupByOrderedBy)}
            className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              groupByOrderedBy 
                ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Group by Creator
          </button>
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
              <th className="p-4 text-sm font-semibold text-slate-600 w-48 text-right">Actions</th>
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
            ) : groupByOrderedBy ? (
              Object.entries(groupedOrders).map(([groupKey, groupRows]) => {
                const isCollapsed = !!collapsedGroups[groupKey];
                const fulfilledCount = groupRows.filter(o => o.status === 'Fulfilled').length;
                return (
                  <>
                    <tr 
                      key={`group-${groupKey}`} 
                      onClick={() => toggleGroupCollapse(groupKey)}
                      className="bg-slate-50 font-bold border-y border-slate-200 cursor-pointer select-none hover:bg-slate-100/80 transition-colors"
                    >
                      <td colSpan="6" className="p-3 text-sm font-semibold text-slate-800 bg-slate-50/80 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-slate-500 transition-transform duration-200" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-500 transition-transform duration-200" />
                          )}
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <span>Ordered By:</span>
                          <span className="text-blue-600 font-bold">{groupKey}</span>
                          <span className="text-xs text-slate-500 font-normal">
                            ({groupRows.length} {groupRows.length === 1 ? 'order' : 'orders'} • {fulfilledCount} fulfilled)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {!isCollapsed && groupRows.map((order, i) => (
                      <tr key={`row-${order.id}-${i}`} className={`${getRowGradientClass(order.status)} border-b border-slate-100`}>
                        <td className="p-4 font-mono text-xs text-slate-500">{(order.id || '').substring(0, 8)}</td>
                        <td className="p-4 text-sm text-slate-600">{new Date(order.timestamp).toLocaleString()}</td>
                        <td className="p-4">
                          <div className="font-medium text-slate-800">{order.customerName}</div>
                          <div className="text-xs text-slate-400 font-normal mt-0.5">Ordered by: <span className="font-medium text-slate-500">{order.contactInfo || 'N/A'}</span></div>
                        </td>
                        <td className="p-4">
                          <ul className="space-y-1.5">
                             {order.products.map((p, idx) => {
                              const isItemFulfilled = order.itemStatuses?.[idx] === 'Fulfilled' || order.status === 'Fulfilled';
                              return (
                                <li key={idx} className="text-sm flex items-center gap-2 py-0.5 group">
                                  {isItemFulfilled ? (
                                    <CheckCircle2 
                                      className={`w-4 h-4 text-emerald-600 shrink-0 ${
                                        order.status === 'Fulfilled' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                                      }`}
                                      onClick={() => order.status !== 'Fulfilled' && handleToggleItemFulfillment(order, idx)}
                                      title={order.status === 'Fulfilled' ? "Order is completed" : "Mark as Pending"}
                                    />
                                  ) : (
                                    <input 
                                      type="checkbox"
                                      checked={false}
                                      onChange={() => handleToggleItemFulfillment(order, idx)}
                                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer transition-all"
                                      title="Mark as Fulfilled"
                                    />
                                  )}
                                  <span className={`font-semibold inline-block w-6 ${isItemFulfilled ? 'text-emerald-600/80' : 'text-slate-700'}`}>{order.quantities[idx]}x</span>
                                  <span className={`transition-colors duration-200 ${isItemFulfilled ? 'text-emerald-700/85 font-medium' : 'text-slate-600'}`}>{highlightText(p, search)}</span>
                                  <span className={`text-xs border px-1.5 rounded transition-colors duration-200 ${isItemFulfilled ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>{order.sizes[idx]}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            order.status === 'Fulfilled' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : order.status === 'Partially Fulfilled'
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-right flex items-center justify-end gap-2 whitespace-nowrap">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingOrder(order);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 h-9 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 shadow-sm"
                            title="Edit Order"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          {order.status !== 'Fulfilled' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFulfill(order);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 h-9 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-green-600 transition-colors whitespace-nowrap shrink-0 shadow-sm"
                              title="Fulfill All Items"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Fulfill All
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                );
              })
            ) : (
              filtered.map((order, i) => (
                <tr key={i} className={`${getRowGradientClass(order.status)} border-b border-slate-100`}>
                  <td className="p-4 font-mono text-xs text-slate-500">{(order.id || '').substring(0, 8)}</td>
                  <td className="p-4 text-sm text-slate-600">{new Date(order.timestamp).toLocaleString()}</td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{order.customerName}</div>
                    <div className="text-xs text-slate-400 font-normal mt-0.5">Ordered by: <span className="font-medium text-slate-500">{order.contactInfo || 'N/A'}</span></div>
                  </td>
                  <td className="p-4">
                    <ul className="space-y-1.5">
                      {order.products.map((p, idx) => {
                        const isItemFulfilled = order.itemStatuses?.[idx] === 'Fulfilled' || order.status === 'Fulfilled';
                        return (
                          <li key={idx} className="text-sm flex items-center gap-2 py-0.5 group">
                            {isItemFulfilled ? (
                              <CheckCircle2 
                                className={`w-4 h-4 text-emerald-600 shrink-0 ${
                                  order.status === 'Fulfilled' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
                                }`}
                                onClick={() => order.status !== 'Fulfilled' && handleToggleItemFulfillment(order, idx)}
                                title={order.status === 'Fulfilled' ? "Order is completed" : "Mark as Pending"}
                              />
                            ) : (
                              <input 
                                type="checkbox"
                                checked={false}
                                onChange={() => handleToggleItemFulfillment(order, idx)}
                                className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer transition-all"
                                title="Mark as Fulfilled"
                              />
                            )}
                            <span className={`font-semibold inline-block w-6 ${isItemFulfilled ? 'text-emerald-600/80' : 'text-slate-700'}`}>{order.quantities[idx]}x</span>
                            <span className={`transition-colors duration-200 ${isItemFulfilled ? 'text-emerald-700/85 font-medium' : 'text-slate-600'}`}>{highlightText(p, search)}</span>
                            <span className={`text-xs border px-1.5 rounded transition-colors duration-200 ${isItemFulfilled ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>{order.sizes[idx]}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      order.status === 'Fulfilled' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : order.status === 'Partially Fulfilled'
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2 whitespace-nowrap">
                    <button 
                      onClick={() => setEditingOrder(order)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 h-9 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 shadow-sm"
                      title="Edit Order"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {order.status !== 'Fulfilled' && (
                      <button 
                        onClick={() => handleFulfill(order)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 h-9 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-green-600 transition-colors whitespace-nowrap shrink-0 shadow-sm"
                        title="Fulfill All Items"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Fulfill All
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {editingOrder && (
        <EditOrderModal 
          order={editingOrder} 
          uniqueCreators={Array.from(new Set(orders.map(o => (o.contactInfo || '').trim()).filter(Boolean)))}
          onClose={() => setEditingOrder(null)} 
          token={token} 
          onOrderUpdated={(updated) => {
            setOrders(orders.map(o => o.id === updated.id ? updated : o));
          }}
        />
      )}
    </div>
  );
}

function EditOrderModal({ order, uniqueCreators = [], onClose, token, onOrderUpdated }) {
  const [customerName, setCustomerName] = useState(order.customerName);
  const [contactInfo, setContactInfo] = useState(order.contactInfo);
  const [status, setStatus] = useState(order.status);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const filteredCreators = uniqueCreators.filter(c => 
    c.toLowerCase().includes(contactInfo.toLowerCase()) && c.toLowerCase() !== contactInfo.toLowerCase()
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const updated = {
        ...order,
        customerName,
        contactInfo,
        status
      };
      await updateOrder(token, order.rowIndex, updated);
      onOrderUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl">
            <Edit className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Edit Order</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {order.id.substring(0, 8)}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">For (Customer Name)</label>
            <input 
              required 
              type="text" 
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)} 
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800" 
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ordered By</label>
            <input 
              required 
              type="text" 
              value={contactInfo} 
              onChange={e => {
                setContactInfo(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                // Short timeout to let the click register on the suggestion item
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800" 
            />
            {showSuggestions && filteredCreators.length > 0 && (
              <ul className="absolute z-10 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-36 overflow-auto py-1.5 text-sm ring-1 ring-black/5">
                {filteredCreators.map((creator, idx) => (
                  <li 
                    key={idx}
                    onMouseDown={() => {
                      setContactInfo(creator);
                      setShowSuggestions(false);
                    }}
                    className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-slate-700 hover:text-slate-900 transition-colors font-medium"
                  >
                    {creator}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800"
            >
              <option value="Pending">Pending</option>
              <option value="Partially Fulfilled">Partially Fulfilled</option>
              <option value="Fulfilled">Fulfilled</option>
            </select>
          </div>
          
          <div className="pt-6 flex gap-3 justify-end items-center border-t border-slate-100 mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting} 
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all text-sm disabled:opacity-75 flex items-center gap-2"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Saving...</>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
