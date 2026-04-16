import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import Navbar from './components/Navbar';
import Products from './components/Products';
import NewOrder from './components/NewOrder';
import Orders from './components/Orders';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [currentTab, setCurrentTab] = useState('new-order');
  const [password, setPassword] = useState('');

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets',
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 max-w-sm w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Access</h1>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (password === 'admin123') setIsAuthenticated(true);
            else alert('Incorrect Password');
          }}>
            <input 
              type="password" 
              className="w-full px-4 py-3 rounded-lg bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Enter Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors">
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center border border-slate-100 max-w-md w-full">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" /></svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-slate-800">Google Authorization</h2>
          <p className="text-slate-500 mb-8">Please sign in with Google to enable read/write access to the order tracking sheets.</p>
          <button 
            onClick={() => login()}
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Connect Google Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'new-order' && <NewOrder token={accessToken} />}
        {currentTab === 'orders' && <Orders token={accessToken} />}
        {currentTab === 'products' && <Products token={accessToken} />}
      </main>
    </div>
  );
}

export default App;
