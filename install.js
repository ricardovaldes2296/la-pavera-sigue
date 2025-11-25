const fs = require('fs');
const path = require('path');

const files = {
  'package.json': `{
  "name": "la-pavera-sigue",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.292.0",
    "@google/genai": "^0.0.10"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}`,

  'vite.config.ts': `import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});`,

  'metadata.json': `{
  "name": "La Pavera Sigue",
  "description": "A centralized Thanksgiving party hub for requesting music and ordering AI-generated fall cocktails and mocktails.",
  "requestFramePermissions": []
}`,

  'index.html': `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>La Pavera Sigue</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
    <script>
      // Polyfill for process.env to prevent crashes in browser preview environments
      window.process = { env: { API_KEY: '' } };
      
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: {
              serif: ['"Playfair Display"', 'serif'],
              sans: ['"Inter"', 'sans-serif'],
            },
            colors: {
              gold: {
                50: '#fbf7eb',
                100: '#f5ecce',
                200: '#edd89b',
                300: '#e4c063',
                400: '#dba536',
                500: '#d48d22',
                600: '#b96e1a',
                700: '#944f19',
                800: '#7a3f1b',
                900: '#643419',
              }
            }
          }
        }
      }
    </script>
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@18.2.0",
          "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
          "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime",
          "react/jsx-dev-runtime": "https://esm.sh/react@18.2.0/jsx-dev-runtime",
          "lucide-react": "https://esm.sh/lucide-react@0.292.0",
          "@google/genai": "https://esm.sh/@google/genai@0.0.10"
        }
      }
    </script>
    <style>
      body {
        font-family: 'Inter', sans-serif;
        background-color: #09090b; /* zinc-950 */
      }
      .font-serif {
        font-family: 'Playfair Display', serif;
      }
    </style>
  </head>
  <body class="bg-zinc-950 text-zinc-100 antialiased selection:bg-gold-500/30">
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
  </body>
</html>`,

  'index.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

  'types.ts': `export enum DrinkType {
  COCKTAIL = 'Cocktail',
  MOCKTAIL = 'Mocktail'
}

export interface Drink {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string;
  type: DrinkType;
  emoji: string;
}

export interface MenuResponse {
  drinks: Drink[];
}

export interface ShoppingListResponse {
  categories: {
    categoryName: string;
    items: string[];
  }[];
}

export type ViewState = 'landing' | 'drinks' | 'music' | 'bartender' | 'settings';`,

  'services/gemini.ts': `import { GoogleGenAI, Type } from "@google/genai";
import { Drink, MenuResponse, ShoppingListResponse, DrinkType } from "../types";

// Initialize Gemini Client
// Use a safe fallback for process.env.API_KEY to avoid crashing in browser preview
const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

const modelName = "gemini-2.5-flash";

// Helper to enforce vocabulary rules
const enforceVocabulary = (text: string): string => {
  return text
    .replace(/ar[aá]ndano/gi, "Cranberry")
    .replace(/arce/gi, "Maple");
};

export const generateFallMenu = async (): Promise<MenuResponse> => {
  // Prevent API call if key is missing (e.g. in preview)
  if (!apiKey) {
      console.warn("API Key is missing. Using fallback menu.");
      return getFallbackMenu();
  }

  const prompt = \`
    Generate a Thanksgiving/Fall themed drink menu in Spanish.
    
    IMPORTANT VOCABULARY RULES:
    1. NEVER use the word "Arándano". ALWAYS use "Cranberry".
    2. NEVER use the word "Arce". ALWAYS use "Maple".
    
    IMPORTANT INGREDIENT RULES: 
    1. Use ONLY simple, easy-to-find ingredients available at a standard supermarket. 
    2. DO NOT include hard-to-find purees, specialized syrups, or obscure liqueurs.
    3. ABSOLUTELY NO PUMPKIN (CALABAZA) or PUMPKIN PUREE.

    I need exactly 4 Cocktails (alcohol) with the following specific requirements:
    1. Bourbon Cocktail: Must be named "Manzana Mágica" (Apple Cider/Cinnamon flavor profile).
    2. Vodka Cocktail: Must be named "Cranberry Embrujado" (Cranberry flavor profile).
    3. Tequila Cocktail: Traditional Spicy Margarita (Jalapeño/Lime profile). Name it "Margarita Picante".
    4. Tequila Cocktail: Fall themed (e.g. Maple, Apple, or Cinnamon).
    
    I need exactly 4 Mocktails (non-alcoholic) with fall themes using simple ingredients.
    IMPORTANT MOCKTAIL RULES:
    1. Ingredients must be ready-to-use from a supermarket (e.g., Ginger Beer, Apple Cider, Sparkling Water, Cranberry Juice, Orange Juice, Sprite/7-Up).
    2. NO preparation required (no muddling, no homemade syrups, no cooking).
    3. Use simple sweeteners like Maple Syrup or Honey if needed.
    4. Simple garnishes only (Cinnamon stick, Apple slice, Orange slice).
    
    The descriptions should be elegant and sophisticated.
    Assign a relevant emoji to each drink.
  \`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            drinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING, description: "Short, elegant description in Spanish" },
                  ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  instructions: { type: Type.STRING, description: "Brief mixing instructions for the bartender" },
                  type: { type: Type.STRING, enum: ["Cocktail", "Mocktail"] },
                  emoji: { type: Type.STRING }
                },
                required: ["name", "description", "ingredients", "instructions", "type", "emoji"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from Gemini");
    
    const parsed = JSON.parse(text) as MenuResponse;
    
    // Post-process to ensure vocabulary rules
    parsed.drinks = parsed.drinks.map(d => ({
      ...d,
      name: enforceVocabulary(d.name),
      description: enforceVocabulary(d.description),
      ingredients: d.ingredients.map(i => enforceVocabulary(i)),
      instructions: enforceVocabulary(d.instructions)
    }));

    return parsed;

  } catch (error) {
    console.error("Error generating menu:", error);
    return getFallbackMenu();
  }
};

const getFallbackMenu = (): MenuResponse => {
    return {
        drinks: [
            {
                name: "Manzana Mágica",
                description: "Bourbon con sidra de manzana y un toque de canela.",
                ingredients: ["Bourbon", "Sidra de Manzana", "Canela", "Jugo de Limón"],
                instructions: "Mezclar ingredientes con hielo.",
                type: DrinkType.COCKTAIL,
                emoji: "🍎"
            },
            {
                name: "Cranberry Embrujado",
                description: "Vodka con jugo de cranberry y lima refrescante.",
                ingredients: ["Vodka", "Jugo de Cranberry", "Lima", "Agua con Gas"],
                instructions: "Mezclar y servir con hielo.",
                type: DrinkType.COCKTAIL,
                emoji: "🍒"
            },
            {
                name: "Margarita Picante",
                description: "Tequila con lima fresca y un toque de jalapeño.",
                ingredients: ["Tequila", "Jugo de Lima", "Jarabe Simple", "Rodajas de Jalapeño"],
                instructions: "Agitar con hielo y servir con borde de sal.",
                type: DrinkType.COCKTAIL,
                emoji: "🌶️"
            },
            {
                name: "Tequila Maple",
                description: "Tequila reposado con notas de maple y naranja.",
                ingredients: ["Tequila", "Sirope de Maple", "Jugo de Naranja", "Amargo de Angostura"],
                instructions: "Mezclar suavemente.",
                type: DrinkType.COCKTAIL,
                emoji: "🍁"
            }
        ]
    };
};

export const generateShoppingList = async (drinks: Drink[]): Promise<ShoppingListResponse> => {
  if (!apiKey) return { categories: [] };

  const drinkNames = drinks.map(d => d.name).join(", ");
  const drinkIngredients = drinks.map(d => d.ingredients.join(", ")).join(" | ");
  
  const prompt = \`
    Based on the following drinks and ingredients, create a consolidated shopping list in Spanish.
    Group items by category (e.g., Licores, Frutas, Mezcladores, Especias).
    Use "Cranberry" instead of "Arándano" and "Maple" instead of "Arce".
    Drinks: \${drinkNames}
    Ingredients: \${drinkIngredients}
  \`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  categoryName: { type: Type.STRING },
                  items: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No data returned");
    const parsed = JSON.parse(text) as ShoppingListResponse;

    parsed.categories = parsed.categories.map(c => ({
        ...c,
        items: c.items.map(i => enforceVocabulary(i))
    }));

    return parsed;

  } catch (error) {
    console.error("Error generating shopping list:", error);
    return { categories: [] };
  }
};`,

  'components/SettingsModal.tsx': `import React, { useState, useEffect } from 'react';
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
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-8">
          {/* Guest Name Section */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-2">Tu Nombre (Invitado)</label>
            <input 
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Tu nombre..."
              className="w-full bg-transparent border-b border-zinc-700 py-2 text-white focus:outline-none focus:border-gold-500 transition-colors font-serif italic text-lg"
            />
          </div>

          <div className="w-full h-[1px] bg-zinc-800"></div>

          {/* Host Phone Section */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">WhatsApp del Host (Admin)</label>
            <input 
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="1787xxxxxxx"
              className="w-full bg-transparent border-b border-zinc-700 py-2 text-white focus:outline-none focus:border-gold-500 transition-colors font-mono"
            />
             <p className="text-xs text-zinc-600 mt-2">
              Incluye el código de país.
            </p>
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-gold-600 hover:bg-gold-500 text-zinc-950 font-bold py-3 uppercase tracking-widest text-xs transition-colors mt-4"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;`,

  'components/MusicPanel.tsx': `import React, { useState, useEffect } from 'react';
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
    const message = \`🎵 *\${song}* - \${artist || 'Unknown'}%0A👤 Solicitado por: *\${guestName}*\`;
    
    const url = \`https://wa.me/\${hostPhone}?text=\${message}\`;
    
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
            <div className={\`p-4 rounded-full border border-gold-500/30 \${cooldown > 0 ? '' : 'animate-spin-slow'}\`}>
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
              className={\`w-full py-4 mt-8 flex items-center justify-center gap-3 transition-all tracking-widest uppercase text-xs font-bold border \${
                !song || cooldown > 0
                  ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'border-gold-500 text-gold-400 hover:bg-gold-500 hover:text-zinc-900'
              }\`}
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

export default MusicPanel;`,

  'components/DrinksPanel.tsx': `import React, { useState } from 'react';
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

    // Prepare History String
    const historyList = orderHistory.length > 0 
      ? orderHistory.map(d => \`- \${d}\`).join('%0A') 
      : '(Primer trago)';

    // Optimized Message: DRINK NAME FIRST for notification visibility
    // Format: 🍸 [Drink] (para [Name]) ... details
    const header = \`\${drink.emoji} *\${drink.name}*\`;
    const subHeader = \`👤 Para: *\${guestName}*\`;
    const historyInfo = \`📋 *Historial:*%0A\${historyList}\`;
    
    const message = \`\${header}%0A\${subHeader}%0A%0A\${historyInfo}\`;
    
    // Add to history state
    addToHistory(drink.name);

    // Send
    const url = \`https://wa.me/\${hostPhone}?text=\${message}\`;
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
      {/* Elegant Header */}
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
        
        {/* Minimalist Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab(DrinkType.COCKTAIL)}
            className={\`flex-1 pb-3 text-sm tracking-wider uppercase transition-all relative \${
              activeTab === DrinkType.COCKTAIL
                ? 'text-gold-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }\`}
          >
            Cócteles
            {activeTab === DrinkType.COCKTAIL && (
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gold-400"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab(DrinkType.MOCKTAIL)}
            className={\`flex-1 pb-3 text-sm tracking-wider uppercase transition-all relative \${
              activeTab === DrinkType.MOCKTAIL
                ? 'text-gold-400 font-semibold'
                : 'text-zinc-500 hover:text-zinc-300'
            }\`}
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
        
        <div className="h-12"></div> {/* Spacer */}
      </div>

      <OrderHistoryModal 
        isOpen={showHistory} 
        onClose={() => setShowHistory(false)} 
        history={orderHistory} 
      />
    </div>
  );
};

export default DrinksPanel;`,

  'components/BartenderView.tsx': `import React, { useState } from 'react';
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
            className={\`text-sm tracking-widest uppercase pb-2 transition-all border-b \${
              activeTab === 'recipes'
                ? 'border-gold-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }\`}
          >
            Recetas
          </button>
          <button
            onClick={() => setActiveTab('shopping')}
            className={\`text-sm tracking-widest uppercase pb-2 transition-all border-b \${
              activeTab === 'shopping'
                ? 'border-gold-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }\`}
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

export default BartenderView;`,

  'App.tsx': `import React, { useState, useEffect } from 'react';
import { Drink, ViewState } from './types';
import { generateFallMenu } from './services/gemini';
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
  
  // Settings State
  const [hostPhone, setHostPhone] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  // User State
  const [guestName, setGuestName] = useState<string>('');
  const [orderHistory, setOrderHistory] = useState<string[]>([]);
  const [isGuestSetupDone, setIsGuestSetupDone] = useState(false);

  // Load persisted data
  useEffect(() => {
    const savedPhone = localStorage.getItem('hostPhone');
    if (savedPhone) setHostPhone(savedPhone);

    const savedName = localStorage.getItem('guestName');
    if (savedName) {
      setGuestName(savedName);
      setIsGuestSetupDone(true);
    }

    const savedHistory = localStorage.getItem('orderHistory');
    if (savedHistory) setOrderHistory(JSON.parse(savedHistory));

    // v6 to force vocab changes
    const savedDrinks = localStorage.getItem('paveraDrinks_v6');
    if (savedDrinks) {
      setDrinks(JSON.parse(savedDrinks));
    } else {
      loadMenu();
    }
  }, []);

  const loadMenu = async () => {
    setMenuLoading(true);
    const menu = await generateFallMenu();
    setDrinks(menu.drinks);
    localStorage.setItem('paveraDrinks_v6', JSON.stringify(menu.drinks));
    setMenuLoading(false);
  };

  const saveHostPhone = (phone: string) => {
    setHostPhone(phone);
    localStorage.setItem('hostPhone', phone);
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

  // Monochromatic PR Flag Component
  const PRFlag = () => (
    <svg viewBox="0 0 900 600" className="w-16 h-auto drop-shadow-lg opacity-90 hover:opacity-100 transition-opacity">
      {/* 5 Stripes */}
      <rect width="900" height="600" fill="#18181b" /> {/* zinc-950 base */}
      <rect y="0" width="900" height="120" fill="#27272a" /> {/* Stripe 1 (Dark) */}
      <rect y="120" width="900" height="120" fill="#e4e4e7" /> {/* Stripe 2 (Light) */}
      <rect y="240" width="900" height="120" fill="#27272a" /> {/* Stripe 3 (Dark) */}
      <rect y="360" width="900" height="120" fill="#e4e4e7" /> {/* Stripe 4 (Light) */}
      <rect y="480" width="900" height="120" fill="#27272a" /> {/* Stripe 5 (Dark) */}
      
      {/* Triangle */}
      <path d="M 0,0 L 520,300 L 0,600 Z" fill="#18181b" />
      
      {/* Star */}
      <path 
        transform="translate(180, 300) scale(0.8)" 
        fill="#e4e4e7" 
        d="M 0,-100 L 22.45,-30.9 L 95.1,-30.9 L 36.33,11.8 L 58.78,80.9 L 0,38.2 L -58.78,80.9 L -36.33,11.8 L -95.1,-30.9 L -22.45,-30.9 Z" 
      />
    </svg>
  );

  const renderLanding = () => (
    <div className="flex flex-col h-screen relative bg-zinc-950 text-zinc-100">
      {/* Background Image with elegant overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2070&auto=format&fit=crop" 
          alt="Tropical Night Background" 
          className="w-full h-full object-cover opacity-50 grayscale-[40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-900/30"></div>
      </div>
      
      <div className="relative z-10 flex flex-col h-full p-8 max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex justify-between pt-4 items-center">
          {guestName && (
             <div className="text-xs font-serif italic text-gold-500/80">
                Hola, {guestName}
             </div>
          )}
          <button onClick={() => setShowSettings(true)} className="p-2 text-zinc-400 hover:text-white transition-colors ml-auto">
            <Settings size={20} />
          </button>
        </div>

        {/* Title Section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="border border-gold-500/30 p-4 rounded-full bg-zinc-900/40 backdrop-blur-md mb-2 shadow-[0_0_15px_rgba(212,141,34,0.3)]">
            <Star size={24} className="text-gold-400 fill-gold-400/20" />
          </div>
          
          <h1 className="font-serif italic text-6xl text-zinc-100 leading-none tracking-tight drop-shadow-lg">
            La Pavera
            <span className="block text-gold-500 not-italic font-normal mt-2 text-4xl tracking-widest uppercase">Sigue</span>
          </h1>
          
          <div className="py-6">
            <PRFlag />
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <span className="text-gold-300 font-bold text-[10px] tracking-[0.2em] uppercase">Temática</span>
            <p className="text-zinc-200 font-serif text-lg tracking-wide">
              Famosos Puertorriqueños
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-12">
          <button 
            onClick={() => setView('drinks')}
            className="w-full group bg-zinc-900/40 backdrop-blur-md border border-white/10 hover:border-gold-500/50 p-6 flex items-center justify-between transition-all duration-300 hover:bg-zinc-900/60"
          >
            <div className="text-left">
              <span className="text-xs text-gold-500 font-bold tracking-widest uppercase mb-1 block">Barra Abierta</span>
              <h3 className="font-serif text-2xl text-white italic group-hover:text-gold-200 transition-colors">Cocktails & Mocktails</h3>
            </div>
            <div className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-gold-500 group-hover:bg-gold-500/10 transition-all">
              <Wine size={16} className="text-zinc-300 group-hover:text-gold-400" />
            </div>
          </button>

          <button 
            onClick={() => setView('music')}
            className="w-full group bg-zinc-900/40 backdrop-blur-md border border-white/10 hover:border-gold-500/50 p-6 flex items-center justify-between transition-all duration-300 hover:bg-zinc-900/60"
          >
            <div className="text-left">
               <span className="text-xs text-gold-500 font-bold tracking-widest uppercase mb-1 block">Música de la Isla</span>
               <h3 className="font-sans text-xl font-light text-white uppercase tracking-widest group-hover:text-gold-200 transition-colors mt-1">DJ Request</h3>
            </div>
            <div className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-gold-500 group-hover:bg-gold-500/10 transition-all">
              <Music size={16} className="text-zinc-300 group-hover:text-gold-400" />
            </div>
          </button>
        </div>

        <button 
            onClick={() => setView('bartender')}
            className="text-zinc-600 text-[10px] tracking-widest uppercase text-center pb-4 hover:text-zinc-400 transition-colors"
        >
            Staff Access
        </button>
      </div>
    </div>
  );
};

export default App;`,

  'components/GuestSetupModal.tsx': `import React, { useState } from 'react';
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

export default GuestSetupModal;`,

  'components/OrderHistoryModal.tsx': `import React from 'react';
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

export default OrderHistoryModal;`
};

// Create folders if they don't exist
['components', 'services'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
    console.log(`Created directory: ${dir}`);
  }
});

// Write files
Object.entries(files).forEach(([filename, content]) => {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, content);
  console.log(`Created file: ${filename}`);
});

console.log('✅ Project setup complete!');
