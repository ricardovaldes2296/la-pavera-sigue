import React, { useState } from 'react';
import { Drink, ShoppingListResponse } from '../types';
import { generateShoppingList } from '../services/gemini';
import { ShoppingCart, Loader2, CheckSquare, ArrowLeft } from 'lucide-react';

interface BartenderViewProps {
  drinks: Drink[];
  onBack: () => void;
}

const BartenderView: React.FC<BartenderViewProps> = ({ drinks, onBack }) => {
  const [shoppingList, setShoppingList] = useState<ShoppingListResponse | null>(null);
  const [isGeneratingList, setIsGeneratingList] = useState(false);
  const [activeTab, setActiveTab] = useState<'recipes' | 'shopping'>('recipes');

  const handleGenerateList = async () => {
    if (drinks.length === 0) return;
    setIsGeneratingList(true);
    const list = await generateShoppingList(drinks);
    setShoppingList(list);
    setIsGeneratingList(false);
    setActiveTab('shopping');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      <header className="px-6 pt-8 pb-4 border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 border border-zinc-800 px-2 py-1">
            Staff Only
          </span>
        </div>
        <h1 className="font-serif text-3xl italic text-white mb-6">Bartender</h1>
        
        <div className="flex gap-4">
           <button
            onClick={() => setActiveTab('recipes')}
            className={`text-sm tracking-widest uppercase pb-2 transition-all border-b ${
              activeTab === 'recipes'
                ? 'border-gold-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Recetas
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={`text-sm tracking-widest uppercase pb-2 transition-all border-b ${
              activeTab === 'shopping'
                ? 'border-gold-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Compras
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'recipes' && (
          <div className="space-y-8">
            {drinks.map((drink, idx) => (
              <div key={idx} className="border-l border-zinc-800 pl-4">
                 <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-serif text-xl italic text-gold-400">{drink.name}</h3>
                 </div>
                 <p className="text-xs text-zinc-500 font-mono mb-2 uppercase tracking-tight">
                    {drink.ingredients.join(' • ')}
                 </p>
                 <p className="text-sm text-zinc-300 font-light leading-relaxed">{drink.instructions}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'shopping' && (
          <div className="space-y-4">
            {!shoppingList ? (
              <div className="text-center py-10">
                <p className="text-zinc-500 font-serif italic mb-6">Genera la lista de ingredientes basada en el menú.</p>
                <button 
                  onClick={handleGenerateList}
                  disabled={isGeneratingList}
                  className="bg-zinc-900 border border-zinc-700 hover:border-gold-500 text-white px-6 py-3 uppercase tracking-widest text-xs font-bold flex items-center justify-center gap-2 mx-auto disabled:opacity-50 transition-all"
                >
                  {isGeneratingList ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                  {isGeneratingList ? 'Procesando...' : 'Generar Lista'}
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {shoppingList.categories.map((cat, i) => (
                  <div key={i}>
                    <h3 className="text-gold-600 font-bold uppercase tracking-widest text-[10px] mb-3">{cat.categoryName}</h3>
                    <ul className="space-y-2">
                      {cat.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-3 text-zinc-300 text-sm font-light border-b border-zinc-900 pb-2">
                          <CheckSquare size={14} className="text-zinc-600" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                <button 
                  onClick={() => setShoppingList(null)} 
                  className="w-full py-4 text-zinc-600 text-xs uppercase tracking-widest hover:text-white transition-colors"
                >
                  Regenerar Lista
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BartenderView;
