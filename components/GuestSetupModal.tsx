import React, { useState } from 'react';
import { User, ChevronRight } from 'lucide-react';

interface GuestSetupModalProps {
  onSave: (name: string) => void;
}

const GuestSetupModal: React.FC<GuestSetupModalProps> = ({ onSave }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[60] p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-serif italic text-4xl text-white mb-2">Bienvenido</h1>
          <p className="text-gold-500 text-xs uppercase tracking-widest">La Pavera Sigue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group relative">
            <User className="absolute left-0 top-3 text-zinc-500 group-focus-within:text-gold-500 transition-colors" size={20} />
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu Nombre"
              className="w-full bg-transparent border-b border-zinc-700 py-3 pl-8 text-xl text-white placeholder-zinc-700 focus:outline-none focus:border-gold-500 transition-colors font-serif italic"
              autoFocus
            />
          </div>

          <button 
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-gold-600 hover:bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold py-4 uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
          >
            Comenzar <ChevronRight size={16} />
          </button>
        </form>
        
        <p className="text-center text-zinc-600 text-[10px] mt-8 uppercase tracking-widest">
          Por favor ingresa tu nombre para los pedidos
        </p>
      </div>
    </div>
  );
};

export default GuestSetupModal;