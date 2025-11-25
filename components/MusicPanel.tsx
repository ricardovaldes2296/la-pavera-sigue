import React, { useState, useEffect } from 'react';
import { Send, Clock, ArrowLeft, Disc } from 'lucide-react';

interface MusicPanelProps {
  hostPhone: string;
  onBack: () => void;
  guestName: string;
}

const MusicPanel: React.FC<MusicPanelProps> = ({ hostPhone, onBack, guestName }) => {
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, 30000 - (now - lastRequestTime)); // 30 sec cooldown
      setCooldown(Math.ceil(diff / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastRequestTime]);

  const handleRequest = () => {
    if (!hostPhone) {
      alert("¡El anfitrión no ha configurado su teléfono todavía!");
      return;
    }
    
    if (cooldown > 0) return;

    // Optimized Message: SONG FIRST for notification visibility
    // Format: 🎵 [Song] - [Artist] (por [Name])
    const message = `🎵 *${song}* - ${artist || 'Unknown'}%0A👤 Solicitado por: *${guestName}*`;
    
    const url = `https://wa.me/${hostPhone}?text=${message}`;
    
    window.open(url, '_blank');
    setLastRequestTime(Date.now());
    setSong('');
    setArtist('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      <header className="px-6 pt-8 pb-4">
        <button onClick={onBack} className="text-zinc-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft size={20} />
        </button>
        {/* Changed to sans-serif for clean "J" */}
        <div className="flex justify-between items-center">
            <h1 className="font-sans text-3xl font-light uppercase tracking-widest text-white">DJ Booth</h1>
            <div className="text-right hidden sm:block">
               <p className="text-[10px] text-zinc-500 uppercase tracking-widest">DJ</p>
               <p className="text-sm font-serif italic text-gold-400">{guestName}</p>
             </div>
        </div>
        
        <p className="text-zinc-500 text-sm mt-2 font-light">Envía tu petición directamente al DJ.</p>
      </header>

      <div className="flex-1 px-6 flex flex-col justify-center">
        <div className="bg-zinc-900/30 backdrop-blur-sm p-8 border border-white/5">
          <div className="flex justify-center mb-8">
            <div className={`p-4 rounded-full border border-gold-500/30 ${cooldown > 0 ? '' : 'animate-spin-slow'}`}>
              <Disc size={32} className="text-gold-500" />
            </div>
          </div>

          <div className="space-y-8">
            <div className="group">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 group-focus-within:text-gold-500 transition-colors">Canción</label>
              <input 
                type="text" 
                value={song}
                onChange={(e) => setSong(e.target.value)}
                placeholder="Escribe el nombre..."
                className="w-full bg-transparent border-b border-zinc-700 py-2 text-xl text-white placeholder-zinc-700 focus:outline-none focus:border-gold-500 transition-colors font-serif italic"
              />
            </div>
            
            <div className="group">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 group-focus-within:text-gold-500 transition-colors">Artista</label>
              <input 
                type="text" 
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Nombre del artista..."
                className="w-full bg-transparent border-b border-zinc-700 py-2 text-xl text-white placeholder-zinc-700 focus:outline-none focus:border-gold-500 transition-colors font-serif italic"
              />
            </div>

            <button 
              onClick={handleRequest}
              disabled={!song || cooldown > 0}
              className={`w-full py-4 mt-8 flex items-center justify-center gap-3 transition-all tracking-widest uppercase text-xs font-bold border ${
                !song || cooldown > 0
                  ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'border-gold-500 text-gold-400 hover:bg-gold-500 hover:text-zinc-900'
              }`}
            >
              {cooldown > 0 ? (
                <>
                  <Clock size={16} className="animate-spin" />
                  Espere {cooldown}s
                </>
              ) : (
                <>
                  <Send size={16} />
                  Pedir por WhatsApp
                </>
              )}
            </button>
            
            <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest">
              Límite de 1 canción cada 30 segundos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPanel;