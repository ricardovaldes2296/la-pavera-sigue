import { GoogleGenAI, Type } from "@google/genai";
import { Drink, MenuResponse, ShoppingListResponse, DrinkType } from "../types";

// Robust API Key extraction for both Vite (replacement) and Browser (polyfill)
const getApiKey = () => {
  try {
    // In Vite/Netlify, this string literal is replaced at build time
    return process.env.API_KEY;
  } catch (e) {
    // In browser previews without build steps, process is undefined
    // We rely on the window.process polyfill defined in index.html
    return (window as any).process?.env?.API_KEY;
  }
};

const apiKey = getApiKey() || "";
const ai = new GoogleGenAI({ apiKey });

const modelName = "gemini-2.5-flash";

// Helper to enforce vocabulary rules
const enforceVocabulary = (text: string): string => {
  return text
    .replace(/ar[aá]ndano/gi, "Cranberry")
    .replace(/arce/gi, "Maple");
};

// Define fallback FIRST to avoid ReferenceError
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

export const generateFallMenu = async (): Promise<MenuResponse> => {
  // Prevent API call if key is missing
  if (!apiKey) {
      console.warn("API Key is missing. Using fallback menu.");
      return getFallbackMenu();
  }

  const prompt = `
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

export const generateShoppingList = async (drinks: Drink[]): Promise<ShoppingListResponse> => {
  if (!apiKey) return { categories: [] };

  const drinkNames = drinks.map(d => d.name).join(", ");
  const drinkIngredients = drinks.map(d => d.ingredients.join(", ")).join(" | ");
  
  const prompt = `
    Based on the following drinks and ingredients, create a consolidated shopping list in Spanish.
    Group items by category (e.g., Licores, Frutas, Mezcladores, Especias).
    Use "Cranberry" instead of "Arándano" and "Maple" instead of "Arce".
    Drinks: ${drinkNames}
    Ingredients: ${drinkIngredients}
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
};
