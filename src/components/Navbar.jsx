import { Package, PlusCircle, ListOrdered } from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab }) {
  const tabs = [
    { id: 'new-order', label: 'New Order', icon: PlusCircle },
    { id: 'orders', label: 'Orders Dashboard', icon: ListOrdered },
    { id: 'products', label: 'Products Master', icon: Package },
  ];

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">OMS Tracker</span>
          </div>
          
          <div className="flex space-x-1 sm:space-x-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === tab.id 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
