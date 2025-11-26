import React, { useState, useEffect } from 'react';
import { Drink, ViewState } from './types';
import { generateFallMenu, getFallbackMenu } from './services/gemini';
import MusicPanel from './components/MusicPanel';
import DrinksPanel from './components/DrinksPanel';
import BartenderView from './components/BartenderView';
import SettingsModal from './components/SettingsModal';
import GuestSetupModal from './components/GuestSetupModal';
import { Settings, Music, Wine, Star } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  
  // Hardcoded Host Phone
  const [hostPhone, setHostPhone] = useState<string>('17873105178');
  const [showSettings, setShowSettings] = useState(false);

  // User State
  const [guestName, setGuestName] = useState<string>('');
  const [orderHistory, setOrderHistory] = useState<string[]>([]);
  const [isGuestSetupDone, setIsGuestSetupDone] = useState(false);

  // Load data
  useEffect(() => {
    const savedName = localStorage.getItem('guestName');
    if (savedName) {
      setGuestName(savedName);
      setIsGuestSetupDone(true);
    }

    const savedHistory = localStorage.getItem('orderHistory');
    if (savedHistory) setOrderHistory(JSON.parse(savedHistory));

    // Force reload for v9 (Detailed Recipes update)
    const savedDrinks = localStorage.getItem('paveraDrinks_v9');
    if (savedDrinks) {
      setDrinks(JSON.parse(savedDrinks));
    } else {
      loadMenu();
    }
  }, []);

  const loadMenu = async () => {
    setMenuLoading(true);
    // Use Fallback immediately while AI loads (or if AI fails)
    const fallback = getFallbackMenu();
    setDrinks(fallback.drinks); 
    
    // Attempt AI generation
    try {
        const menu = await generateFallMenu();
        if (menu && menu.drinks && menu.drinks.length > 0) {
            setDrinks(menu.drinks);
            localStorage.setItem('paveraDrinks_v9', JSON.stringify(menu.drinks));
        }
    } catch (e) {
        console.log("Using fallback menu");
    }
    setMenuLoading(false);
  };

  const saveHostPhone = (phone: string) => {
    setHostPhone(phone);
  };

  const saveGuestName = (name: string) => {
    setGuestName(name);
    localStorage.setItem('guestName', name);
    setIsGuestSetupDone(true);
  };

  const addToHistory = (drinkName: string) => {
    const newHistory = [...orderHistory, drinkName];
    setOrderHistory(newHistory);
    localStorage.setItem('orderHistory', JSON.stringify(newHistory));
  };

  // Monochromatic PR Flag
  const PRFlag = () => (
    <svg viewBox="0 0 900 600" className="w-16 h-auto drop-shadow-lg opacity-90 hover:opacity-100 transition-opacity">
      <rect width="900" height="600" fill="#18181b" />
      <rect y="0" width="900" height="120" fill="#27272a" />
      <rect y="120" width="900" height="120" fill="#e4e4e7" />
      <rect y="240" width="900" height="120" fill="#27272a" />
      <rect y="360" width="900" height="120" fill="#e4e4e7" />
      <rect y="480" width="900" height="120" fill="#27272a" />
      <path d="M 0,0 L 520,300 L 0,600 Z" fill="#18181b" />
      <path transform="translate(180, 300) scale(0.8)" fill="#e4e4e7" d="M 0,-100 L 22.45,-30.9 L 95.1,-30.9 L 36.33,11.8 L 58.78,80.9 L 0,38.2 L -58.78,80.9 L -36.33,11.8 L -95.1,-30.9 L -22.45,-30.9 Z" />
    </svg>
  );

  const renderLanding = () => (
    <div className="flex flex-col h-screen relative bg-zinc-950 text-zinc-100">
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover opacity-50 grayscale-[40%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-900/30"></div>
      </div>
      <div className="relative z-10 flex flex-col h-full p-8 max-w-md mx-auto w-full">
        <div className="flex justify-between pt-4 items-center">
          {guestName && <div className="text-xs font-serif italic text-gold-500/80">Hola, {guestName}</div>}
          <button onClick={() => setShowSettings(true)} className="p-2 text-zinc-400 hover:text-white transition-colors ml-auto"><Settings size={20} /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="border border-gold-500/30 p-4 rounded-full bg-zinc-900/40 backdrop-blur-md mb-2 shadow-[0_0_15px_rgba(212,141,34,0.3)]">
            <Star size={24} className="text-gold-400 fill-gold-400/20" />
          </div>
          <h1 className="font-serif italic text-6xl text-zinc-100 leading-none tracking-tight drop-shadow-lg">La Pavera<span className="block text-gold-500 not-italic font-normal mt-2 text-4xl tracking-widest uppercase">Sigue</span></h1>
          <div className="py-6"><PRFlag /></div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-gold-300 font-bold text-[10px] tracking-[0.2em] uppercase">Temática</span>
            <p className="text-zinc-200 font-serif text-lg tracking-wide">Famosos Puertorriqueños</p>
          </div>
        </div>
        <div className="space-y-4 mb-12">
          <button onClick={() => setView('drinks')} className="w-full group bg-zinc-900/40 backdrop-blur-md border border-white/10 hover:border-gold-500/50 p-6 flex items-center justify-between transition-all duration-300 hover:bg-zinc-900/60">
            <div className="text-left"><span className="text-xs text-gold-500 font-bold tracking-widest uppercase mb-1 block">Barra Abierta</span><h3 className="font-serif text-2xl text-white italic group-hover:text-gold-200 transition-colors">Cocktails & Mocktails</h3></div>
            <div className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-gold-500 group-hover:bg-gold-500/10 transition-all"><Wine size={16} className="text-zinc-300 group-hover:text-gold-400" /></div>
          </button>
          <button onClick={() => setView('music')} className="w-full group bg-zinc-900/40 backdrop-blur-md border border-white/10 hover:border-gold-500/50 p-6 flex items-center justify-between transition-all duration-300 hover:bg-zinc-900/60">
            <div className="text-left"><span className="text-xs text-gold-500 font-bold tracking-widest uppercase mb-1 block">Música de la Isla</span><h3 className="font-sans text-xl font-light text-white uppercase tracking-widest group-hover:text-gold-200 transition-colors mt-1">DJ Request</h3></div>
            <div className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-gold-500 group-hover:bg-gold-500/10 transition-all"><Music size={16} className="text-zinc-300 group-hover:text-gold-400" /></div>
          </button>
        </div>
        <button onClick={() => setView('bartender')} className="text-zinc-600 text-[10px] tracking-widest uppercase text-center pb-4 hover:text-zinc-400 transition-colors">Staff Access</button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full mx-auto bg-zinc-950 overflow-hidden relative">
      {!isGuestSetupDone && <GuestSetupModal onSave={saveGuestName} />}
      {view === 'landing' && renderLanding()}
      {view === 'drinks' && <DrinksPanel drinks={drinks} isLoading={menuLoading} hostPhone={hostPhone} onBack={() => setView('landing')} guestName={guestName} orderHistory={orderHistory} addToHistory={addToHistory} />}
      {view === 'music' && <MusicPanel hostPhone={hostPhone} onBack={() => setView('landing')} guestName={guestName} />}
      {view === 'bartender' && <BartenderView drinks={drinks} onBack={() => setView('landing')} />}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} hostPhone={hostPhone} setHostPhone={saveHostPhone} guestName={guestName} setGuestName={saveGuestName} />
    </div>
  );
};

export default App;