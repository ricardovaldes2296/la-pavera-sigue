import React from 'react';
import { X, Clock, Wine } from 'lucide-react';

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: string[];
}

const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({ isOpen, onClose, history }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-zinc-900 w-full max-w-sm border border-zinc-800 p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif italic text-2xl text-white flex items-center gap-2">
            <Clock size={20} className="text-gold-500" />
            Tu Historial
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-zinc-600">
            <Wine size={32} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm italic">Aún no has pedido nada.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {history.map((drink, index) => (
              <div key={index} className="flex items-center gap-3 border-b border-zinc-800 pb-3 last:border-0">
                <span className="text-gold-500/50 font-mono text-xs">{(index + 1).toString().padStart(2, '0')}</span>
                <span className="text-zinc-300 font-serif italic">{drink}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t border-zinc-800 text-center">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                Total consumido: <span className="text-gold-500 font-bold">{history.length}</span>
            </p>
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryModal;