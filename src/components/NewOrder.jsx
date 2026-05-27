import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, CheckCircle2, ChevronDown, PackagePlus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { fetchProducts, appendOrder, appendProduct } from '../lib/sheets';

export default function NewOrder({ token }) {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [lineItems, setLineItems] = useState([
    { id: uuidv4(), search: '', selectedProduct: null, size: '', quantity: 1 }
  ]);
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const loadProductsList = async () => {
    setLoadingProducts(true);
    try {
      const data = await fetchProducts(token);
      setProducts(data);
    } catch (err) {
      setError('Failed to load products: ' + err.message);
    }
    setLoadingProducts(false);
  };

  useEffect(() => {
    loadProductsList();
  }, [token]);

  const addLineItem = () => {
    setLineItems([...lineItems, { id: uuidv4(), search: '', selectedProduct: null, size: '', quantity: 1 }]);
  };

  const removeLineItem = (id) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id, field, value) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // If product changes, reset size
        if (field === 'selectedProduct') {
          updated.size = value?.sizes?.[0] || '';
          updated.search = value ? `${value.name} (${value.year} - ${value.type})` : '';
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName) return alert('Customer Name is required');
    if (lineItems.some(item => !item.selectedProduct)) return alert('All line items must have a selected product');

    setSubmitting(true);
    setError(null);
    try {
      const orderId = uuidv4();
      const order = {
        id: orderId,
        timestamp: new Date().toISOString(),
        customerName,
        contactInfo,
        products: lineItems.map(item => `${item.selectedProduct.name} (${item.selectedProduct.year} - ${item.selectedProduct.type})`),
        sizes: lineItems.map(item => item.size),
        quantities: lineItems.map(item => item.quantity),
        status: 'Pending'
      };

      await appendOrder(token, order);
      
      setSuccess(true);
      // Reset form
      setCustomerName('');
      setContactInfo('');
      setLineItems([{ id: uuidv4(), search: '', selectedProduct: null, size: '', quantity: 1 }]);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Create New Order</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Fill out customer details and select products.</p>
          </div>
          {success && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-4 py-2 rounded-lg font-medium text-sm border border-green-200 dark:border-green-800 animate-pulse">
              <CheckCircle2 className="w-5 h-5" />
              Order Saved
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Customer Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">For (Customer Name)</label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ordered By</label>
                <input 
                  type="text" 
                  value={contactInfo}
                  onChange={e => setContactInfo(e.target.value)}
                  placeholder="e.g. Me, Co-dev Name"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-200 dark:bg-slate-800"></div>

          {/* Products Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Order Items
              </h3>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(true)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 px-2 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/50 transition-colors"
                title="If a product doesn't exist, you can quickly add it to your master list here."
              >
                <PackagePlus className="w-4 h-4" />
                Add New Product
              </button>
            </div>
            
            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 dark:bg-slate-800/45 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <div className="flex-1 relative">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Product</label>
                    <ProductSelector 
                      item={item} 
                      products={products}
                      disabled={loadingProducts}
                      onSelect={(val) => updateLineItem(item.id, 'selectedProduct', val)}
                      onSearch={(val) => updateLineItem(item.id, 'search', val)}
                    />
                  </div>
                  
                  <div className="w-full sm:w-28 shrink-0">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Size</label>
                    <select
                      value={item.size}
                      onChange={e => updateLineItem(item.id, 'size', e.target.value)}
                      disabled={!item.selectedProduct || item.selectedProduct.sizes.length === 0}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 transition-colors"
                    >
                      {item.selectedProduct?.sizes?.map(size => (
                        <option key={size} value={size}>{size}</option>
                      )) || <option value="">-</option>}
                    </select>
                  </div>

                  <div className="w-full sm:w-24 shrink-0">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Qty</label>
                    <input 
                      type="number" 
                      min="1"
                      value={item.quantity}
                      onChange={e => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      disabled={lineItems.length === 1}
                      className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-2 px-4 py-2 mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-950/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Another Item
            </button>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-75 flex items-center justify-center gap-2 shadow-lg dark:shadow-none"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving Order...
                </>
              ) : 'Submit Order'}
            </button>
          </div>
        </form>
      </div>

      <AddProductModal 
        isOpen={isAddProductModalOpen} 
        onClose={() => setIsAddProductModalOpen(false)} 
        token={token}
        onProductAdded={loadProductsList}
      />
    </div>
  );
}

// Subcomponent for adding a new product directly from the order screen
function AddProductModal({ isOpen, onClose, token, onProductAdded }) {
  const [name, setName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [type, setType] = useState('Home');
  const [sizes, setSizes] = useState('S, M, L, XL');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await appendProduct(token, { 
        name, 
        year, 
        type, 
        sizes: sizes.split(',').map(s => s.trim()).filter(Boolean) 
      });
      onProductAdded();
      
      // reset forms
      setName('');
      setYear(new Date().getFullYear().toString());
      setType('Home');
      setSizes('S, M, L, XL');
      
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg">
            <PackagePlus className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Add New Product</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">{error}</div>}
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Product Name</label>
            <input required type="text" placeholder="e.g. Real Madrid Jersey" value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 transition-colors" />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Year</label>
              <input required type="text" value={year} onChange={e=>setYear(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 transition-colors" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
              <input required type="text" placeholder="Home/Away/Third" value={type} onChange={e=>setType(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 transition-colors" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Sizes (Comma-separated)</label>
            <input required type="text" value={sizes} onChange={e=>setSizes(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 transition-colors" />
          </div>
          
          <div className="pt-6 flex gap-3 justify-end items-center border-t border-slate-100 dark:border-slate-800 mt-6">
            <button type="button" onClick={onClose} className="px-5 py-2.5 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold rounded-xl shadow-md dark:shadow-none transition-colors disabled:opacity-75 flex items-center gap-2">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Saving...</>
              ) : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponent for handling the dropdown autocomplete logic
function ProductSelector({ item, products, disabled, onSelect, onSearch }) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filtered = products.filter(p => {
    const term = item.search.toLowerCase();
    return p.name.toLowerCase().includes(term) || p.year.toString().includes(term) || p.type.toLowerCase().includes(term);
  });

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative group">
        <input
          type="text"
          value={item.search}
          onChange={(e) => {
            onSearch(e.target.value);
            setIsOpen(true);
            if (item.selectedProduct) onSelect(null); // clear selection if user types
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          placeholder={disabled ? "Loading..." : "Search products..."}
          className={`w-full px-4 py-2 border ${item.selectedProduct ? 'border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-300' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-900 transition-colors`}
        />
        <ChevronDown className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
      </div>

      {isOpen && !disabled && (
        <ul className="absolute z-10 w-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-auto py-2 ring-1 ring-black/5 dark:ring-white/5">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">No products match your search.</li>
          ) : (
            filtered.map((p, idx) => (
              <li 
                key={idx}
                onClick={() => {
                  onSelect(p);
                  setIsOpen(false);
                }}
                className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex flex-col transition-colors"
              >
                <div className="font-medium text-slate-800 dark:text-slate-100">{p.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-2">
                  <span className="font-medium text-blue-600/70 dark:text-blue-400/80">{p.year}</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span>{p.type}</span>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
