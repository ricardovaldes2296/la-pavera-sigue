import { GoogleGenAI, Type } from "@google/genai";
import { Drink, MenuResponse, ShoppingListResponse, DrinkType } from "../types";

const modelName = "gemini-2.5-flash";

// Helper to safely get API Key in ANY environment (Preview or Prod)
const getApiKey = () => {
  try {
    // Check for Window polyfill first (safest in browser)
    if (typeof window !== 'undefined' && (window as any).process?.env?.API_KEY) {
      return (window as any).process.env.API_KEY;
    }
    // Fallback to standard process (Vite replace)
    // We use typeof check to prevent ReferenceError if process is not defined
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Could not read environment variable safely.");
  }
  return "";
};

const enforceVocabulary = (text: string): string => {
  return text
    .replace(/ar[aá]ndano/gi, "Cranberry")
    .replace(/arce/gi, "Maple");
};

// FALLBACK MENU: Detailed Version
export const getFallbackMenu = (): MenuResponse => {
    return {
        drinks: [
            {
                name: "Manzana Mágica",
                description: "Bourbon con sidra de manzana y un toque de canela.",
                ingredients: ["2 oz Bourbon", "4 oz Sidra de Manzana", "0.5 oz Jugo de Limón", "Pizca de Canela", "Rodaja de Manzana"],
                instructions: "1. Llenar un vaso con hielo.\n2. Agregar el Bourbon y jugo de limón.\n3. Rellenar con sidra de manzana.\n4. Espolvorear canela y decorar.",
                type: DrinkType.COCKTAIL,
                emoji: "🍎"
            },
            {
                name: "Cranberry Embrujado",
                description: "Vodka con jugo de cranberry y lima refrescante.",
                ingredients: ["2 oz Vodka", "3 oz Jugo de Cranberry", "0.5 oz Jugo de Lima", "Top de Agua con Gas", "Rodaja de Lima"],
                instructions: "1. En un vaso alto con hielo, verter el Vodka y jugos.\n2. Revolver bien.\n3. Completar con agua con gas.\n4. Decorar con lima.",
                type: DrinkType.COCKTAIL,
                emoji: "🍒"
            },
            {
                name: "Margarita Picante",
                description: "Tequila con lima fresca y un toque de jalapeño.",
                ingredients: ["2 oz Tequila Blanco", "1 oz Jugo de Lima Fresco", "0.75 oz Agave/Jarabe", "2 Rodajas de Jalapeño", "Sal para borde"],
                instructions: "1. Pasar lima por el borde del vaso y escarchar con sal.\n2. En coctelera, machacar levemente el jalapeño.\n3. Añadir resto de ingredientes y hielo.\n4. Agitar fuerte y colar sobre hielo nuevo.",
                type: DrinkType.COCKTAIL,
                emoji: "🌶️"
            },
            {
                name: "Tequila Maple",
                description: "Tequila reposado con notas de maple y naranja.",
                ingredients: ["2 oz Tequila Reposado", "0.5 oz Sirope de Maple", "2 chorritos Amargo de Angostura", "Piel de Naranja"],
                instructions: "1. En un vaso bajo, mezclar el sirope y los amargos.\n2. Añadir el Tequila y un hielo grande.\n3. Revolver por 20 segundos.\n4. Exprimir la piel de naranja encima.",
                type: DrinkType.COCKTAIL,
                emoji: "🍁"
            },
            // MOCKTAILS
            {
                name: "Sidra Espumosa",
                description: "Refrescante y festiva.",
                ingredients: ["4 oz Sidra de Manzana", "4 oz Ginger Ale", "Rodaja de Manzana", "Canela en rama"],
                instructions: "1. Llenar vaso con hielo.\n2. Servir la sidra hasta la mitad.\n3. Completar con Ginger Ale.\n4. Decorar con canela.",
                type: DrinkType.MOCKTAIL,
                emoji: "✨"
            },
            {
                name: "Cranberry Fizz",
                description: "Burbujeante y dulce.",
                ingredients: ["3 oz Jugo de Cranberry", "3 oz Sprite/7-Up", "0.5 oz Jugo de Lima", "Arándanos frescos"],
                instructions: "1. Verter jugo de cranberry y lima en vaso con hielo.\n2. Rellenar con Sprite.\n3. Remover suavemente.",
                type: DrinkType.MOCKTAIL,
                emoji: "🥤"
            },
            {
                name: "Jengibre Otoñal",
                description: "Picante y cítrico.",
                ingredients: ["4 oz Ginger Beer", "1 oz Jugo de Lima", "0.5 oz Miel/Agave", "Hojas de Menta"],
                instructions: "1. Disolver la miel con el jugo de lima.\n2. Añadir hielo y Ginger Beer.\n3. Decorar con mucha menta fresca.",
                type: DrinkType.MOCKTAIL,
                emoji: "🍂"
            },
            {
                name: "Maple Naranja",
                description: "Dulce y cítrico.",
                ingredients: ["4 oz Jugo de Naranja", "0.5 oz Sirope de Maple", "Top de Soda/Agua con Gas", "Romero"],
                instructions: "1. Mezclar jugo de naranja y maple en el vaso.\n2. Añadir hielo.\n3. Completar con soda para dar burbujas.",
                type: DrinkType.MOCKTAIL,
                emoji: "🍊"
            }
        ]
    };
};

// Lazy load client to prevent startup crashes
const getAiClient = () => {
  const key = getApiKey();
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
};

export const generateFallMenu = async (): Promise<MenuResponse> => {
  const ai = getAiClient();
  if (!ai) {
      console.warn("API Key missing, using fallback.");
      return getFallbackMenu();
  }

  const prompt = `
    Generate a Thanksgiving/Fall themed drink menu in Spanish.
    VOCAB RULES: Use "Cranberry" not "Arándano". Use "Maple" not "Arce".
    
    CRITICAL FORMATTING RULES:
    1. Ingredients MUST include specific measurements (e.g., "2 oz Bourbon", "15ml Jugo").
    2. Instructions MUST be numbered steps (1., 2., 3.).
    
    Menu Structure:
    - 1 Bourbon Cocktail: "Manzana Mágica"
    - 1 Vodka Cocktail: "Cranberry Embrujado"
    - 1 Spicy Tequila: "Margarita Picante"
    - 1 Fall Tequila Cocktail
    - 4 Mocktails (No alcohol, simple pour-and-mix).
  `;

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
                  description: { type: Type.STRING },
                  ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                  instructions: { type: Type.STRING },
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
    if (!text) throw new Error("No data");
    
    const parsed = JSON.parse(text) as MenuResponse;
    
    parsed.drinks = parsed.drinks.map(d => ({
      ...d,
      name: enforceVocabulary(d.name),
      description: enforceVocabulary(d.description),
      ingredients: d.ingredients.map(i => enforceVocabulary(i)),
      instructions: enforceVocabulary(d.instructions)
    }));

    return parsed;

  } catch (error) {
    console.error("AI Error:", error);
    return getFallbackMenu();
  }
};

export const generateShoppingList = async (drinks: Drink[]): Promise<ShoppingListResponse> => {
  const ai = getAiClient();
  if (!ai) return { categories: [] };

  const data = drinks.map(d => `${d.name}: ${d.ingredients.join(', ')}`).join('\n');
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Create a shopping list in Spanish for these drinks:\n${data}\nGroup by category (Licores, Frutas, etc). Use "Cranberry" and "Maple".`,
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

    const parsed = JSON.parse(response.text || "{}") as ShoppingListResponse;
    parsed.categories = parsed.categories.map(c => ({
        ...c,
        items: c.items.map(i => enforceVocabulary(i))
    }));
    return parsed;
  } catch (error) {
    return { categories: [] };
  }
};
