import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostPhone: string;
  setHostPhone: (phone: string) => void;
  guestName: string;
  setGuestName: (name: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  hostPhone, 
  setHostPhone,
  guestName,
  setGuestName
}) => {
  const [phoneInput, setPhoneInput] = useState(hostPhone);
  const [nameInput, setNameInput] = useState(guestName);

  useEffect(() => {
    setPhoneInput(hostPhone);
    setNameInput(guestName);
  }, [hostPhone, guestName, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setHostPhone(phoneInput);
    if (nameInput.trim()) setGuestName(nameInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-zinc-900 w-full max-w-sm border border-zinc-800 p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-serif italic text-2xl text-white">Configuración</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={20} /></button>
        </div>
        <div className="space-y-8">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-2">Tu Nombre (Invitado)</label>
            <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Tu nombre..." className="w-full bg-transparent border-b border-zinc-700 py-2 text-white focus:outline-none focus:border-gold-500 transition-colors font-serif italic text-lg" />
          </div>
          <div className="w-full h-[1px] bg-zinc-800"></div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">WhatsApp del Host (Admin)</label>
            <input type="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} placeholder="1787xxxxxxx" className="w-full bg-transparent border-b border-zinc-700 py-2 text-white focus:outline-none focus:border-gold-500 transition-colors font-mono" />
             <p className="text-xs text-zinc-600 mt-2">Incluye el código de país.</p>
          </div>
          <button onClick={handleSave} className="w-full bg-gold-600 hover:bg-gold-500 text-zinc-950 font-bold py-3 uppercase tracking-widest text-xs transition-colors mt-4">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};
export default SettingsModal;