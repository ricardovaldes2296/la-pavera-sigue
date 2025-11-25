import React, { useState } from 'react';
import { Drink, DrinkType } from '../types';
import { Loader2, ArrowLeft, History } from 'lucide-react';
import OrderHistoryModal from './OrderHistoryModal';

interface DrinksPanelProps {
  drinks: Drink[];
  isLoading: boolean;
  hostPhone: string;
  onBack: () => void;
  guestName: string;
  orderHistory: string[];
  addToHistory: (drinkName: string) => void;
}

const DrinksPanel: React.FC<DrinksPanelProps> = ({ 
  drinks, 
  isLoading, 
  hostPhone, 
  onBack,
  guestName,
  orderHistory,
  addToHistory
}) => {
  const [activeTab, setActiveTab] = useState<DrinkType>(DrinkType.COCKTAIL);
  const [showHistory, setShowHistory] = useState(false);

  const filteredDrinks = drinks.filter(d => d.type === activeTab);

  const handleOrder = (drink: Drink) => {
    if (!hostPhone) {
      alert("¡El Bartender no ha configurado su teléfono!");
      return;
    }

    const historyList = orderHistory.length > 0 
      ? orderHistory.map(d => `- ${d}`).join('%0A') 
      : '(Primer trago)';

    const header = `${drink.emoji} *${drink.name}*`;
    const subHeader = `👤 Para: *${guestName}*`;
    const historyInfo = `📋 *Historial:*%0A${historyList}`;
    
    const message = `${header}%0A${subHeader}%0A%0A${historyInfo}`;
    
    addToHistory(drink.name);

    const url = `https://wa.me/${hostPhone}?text=${message}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-gold-500">
        <Loader2 size={32} className="animate-spin mb-4" />
        <p className="font-serif italic text-zinc-400">Curando el menú...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 relative">
      <header className="px-6 pt-8 pb-4 bg-zinc-950 sticky top-0 z-20 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Hola,</p>
               <p className="text-sm font-serif italic text-gold-400">{guestName}</p>
             </div>
             <button 
                onClick={() => setShowHistory(true)}
                className="text-zinc-400 hover:text-gold-400 transition-colors relative"
             >
                <History size={20} />
                {orderHistory.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold-600 text-zinc-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {orderHistory.length}
                  </span>
                )}
             </button>
          </div>
        </div>
        
        <h1 className="font-serif text-4xl italic text-white mb-6">Bebidas</h1>
        
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab(DrinkType.COCKTAIL)}
            className={`flex-1 pb-3 text-sm tracking-wider uppercase transition-all relative ${
              activeTab === DrinkType.COCKTAIL
                ? 'text-gold-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Cócteles
            {activeTab === DrinkType.COCKTAIL && (
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gold-400"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab(DrinkType.MOCKTAIL)}
            className={`flex-1 pb-3 text-sm tracking-wider uppercase transition-all relative ${
              activeTab === DrinkType.MOCKTAIL
                ? 'text-gold-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Mocktails
            {activeTab === DrinkType.MOCKTAIL && (
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gold-400"></span>
            )}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {filteredDrinks.map((drink, index) => (
          <div 
            key={index} 
            onClick={() => handleOrder(drink)}
            className="group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-serif text-2xl text-white group-hover:text-gold-300 transition-colors italic">
                  {drink.name}
                </h3>
              </div>
              <span className="text-xl opacity-80 filter grayscale group-hover:grayscale-0 transition-all">{drink.emoji}</span>
            </div>
            
            <p className="text-zinc-400 text-sm font-light leading-relaxed mb-3">
              {drink.description}
            </p>

            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {drink.ingredients.map((ing, i) => (
                <span key={i} className="text-[10px] uppercase tracking-wider text-zinc-600 border border-zinc-800 px-2 py-0.5 rounded-full">
                  {ing}
                </span>
              ))}
            </div>
            
            <div className="w-full h-[1px] bg-white/5 mt-6 group-hover:bg-gold-500/20 transition-colors"></div>
          </div>
        ))}
        
        <div className="h-12"></div>
      </div>

      <OrderHistoryModal 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        history={orderHistory} 
      />
    </div>
  );
};

export default DrinksPanel;