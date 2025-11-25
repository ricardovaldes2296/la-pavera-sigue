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
                ingredients: [
                    "2 oz Bourbon", 
                    "4 oz Sidra de Manzana (Apple Cider)", 
                    "0.5 oz Jugo de Limón", 
                    "Pizca de Canela"
                ],
                instructions: "1. Llenar vaso con hielo. 2. Agregar Bourbon y jugo de limón. 3. Rellenar con Sidra. 4. Espolvorear canela y mezclar suavemente.",
                type: DrinkType.COCKTAIL,
                emoji: "🍎"
            },
            {
                name: "Cranberry Embrujado",
                description: "Vodka con jugo de cranberry y lima refrescante.",
                ingredients: [
                    "2 oz Vodka", 
                    "3 oz Jugo de Cranberry", 
                    "0.5 oz Jugo de Lima Fresco", 
                    "Top de Agua con Gas (Club Soda)"
                ],
                instructions: "1. Llenar vaso alto con hielo. 2. Agregar Vodka, Cranberry y Lima. 3. Rellenar con agua con gas. 4. Decorar con rodaja de lima.",
                type: DrinkType.COCKTAIL,
                emoji: "🍒"
            },
            {
                name: "Margarita Picante",
                description: "Tequila con lima fresca y un toque de jalapeño.",
                ingredients: [
                    "2 oz Tequila Blanco", 
                    "1 oz Jugo de Lima Fresco", 
                    "0.75 oz Jarabe Simple (Agave)", 
                    "2-3 Rodajas de Jalapeño fresco"
                ],
                instructions: "1. Macerar suavemente 1 rodaja de jalapeño en el shaker. 2. Agregar hielo, Tequila, Lima y Jarabe. 3. Agitar vigorosamente. 4. Colar sobre hielo nuevo en vaso con borde de sal.",
                type: DrinkType.COCKTAIL,
                emoji: "🌶️"
            },
            {
                name: "Tequila Maple",
                description: "Tequila reposado con notas de maple y naranja.",
                ingredients: [
                    "2 oz Tequila Reposado", 
                    "0.5 oz Sirope de Maple", 
                    "2 toques de Amargo de Angostura", 
                    "Cascara de Naranja (Garnish)"
                ],
                instructions: "1. En un vaso corto con hielo grande, agregar Tequila, Maple y Amargos. 2. Remover con cuchara por 20 segundos hasta enfriar. 3. Exprimir aceites de la cáscara de naranja encima.",
                type: DrinkType.COCKTAIL,
                emoji: "🍁"
            },
            // Mocktails
            {
                name: "Sidra Espumosa (Sin Alcohol)",
                description: "Refrescante mezcla de manzana y jengibre.",
                ingredients: [
                    "4 oz Sidra de Manzana", 
                    "2 oz Ginger Beer", 
                    "Rodaja de Manzana"
                ],
                instructions: "1. Servir hielo en vaso alto. 2. Agregar Sidra y Ginger Beer. 3. Mezclar suavemente.",
                type: DrinkType.MOCKTAIL,
                emoji: "🍏"
            },
            {
                name: "Cranberry Fizz (Sin Alcohol)",
                description: "Burbujeante y festivo con romero.",
                ingredients: [
                    "3 oz Jugo de Cranberry", 
                    "3 oz Sprite o 7-Up", 
                    "Ramita de Romero",
                    "Chorro de Lima"
                ],
                instructions: "1. Llenar vaso con hielo. 2. Servir jugo y refresco. 3. Exprimir lima y decorar con romero.",
                type: DrinkType.MOCKTAIL,
                emoji: "🌿"
            },
            {
                name: "Mula de Otoño (Sin Alcohol)",
                description: "Versión sin alcohol del Moscow Mule con sabor a otoño.",
                ingredients: [
                    "4 oz Ginger Beer", 
                    "1 oz Jugo de Pera (o Néctar)", 
                    "0.5 oz Jugo de Lima",
                    "Canela en rama"
                ],
                instructions: "1. Llenar taza de cobre o vaso con hielo. 2. Agregar ingredientes y mezclar. 3. Decorar con canela.",
                type: DrinkType.MOCKTAIL,
                emoji: "🍐"
            },
            {
                name: "Naranja Maple (Sin Alcohol)",
                description: "Cítrico dulce y sofisticado.",
                ingredients: [
                    "3 oz Jugo de Naranja Recién Exprimido", 
                    "0.5 oz Sirope de Maple", 
                    "Top de Agua con Gas",
                    "Cereza Maraschino"
                ],
                instructions: "1. Agitar jugo y maple con hielo en shaker para enfriar. 2. Servir en copa y rellenar con agua con gas.",
                type: DrinkType.MOCKTAIL,
                emoji: "🍊"
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
    2. **CRITICAL:** INGREDIENTS MUST HAVE SPECIFIC MEASUREMENTS (e.g., "2 oz", "1/2 oz", "Top with"). Do not list just the name.
    3. ABSOLUTELY NO PUMPKIN (CALABAZA) or PUMPKIN PUREE.

    I need exactly 4 Cocktails (alcohol) with the following specific requirements:
    1. Bourbon Cocktail: Named "Manzana Mágica". Ingredients: Bourbon, Apple Cider, Lemon, Cinnamon.
    2. Vodka Cocktail: Named "Cranberry Embrujado". Ingredients: Vodka, Cranberry Juice, Lime, Soda.
    3. Tequila Cocktail: Named "Margarita Picante". Traditional Spicy Margarita (Tequila, Lime, Agave, Jalapeño).
    4. Tequila Cocktail: Fall themed (e.g. Maple Old Fashioned style).
    
    I need exactly 4 Mocktails (non-alcoholic) with fall themes using simple ingredients.
    IMPORTANT MOCKTAIL RULES:
    1. Ingredients must be ready-to-use from a supermarket (e.g., Ginger Beer, Apple Cider, Sparkling Water, Cranberry Juice, Orange Juice, Sprite/7-Up).
    2. NO preparation required (no muddling, no homemade syrups, no cooking).
    3. Use simple sweeteners like Maple Syrup or Honey if needed.
    
    **INSTRUCTIONS REQUIREMENT:**
    The instructions must be practical, step-by-step for a bartender. Example: "1. Add ice. 2. Pour 2oz Vodka. 3. Shake."
    
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
                  ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of ingredients WITH AMOUNTS (e.g., '2 oz Bourbon')" },
                  instructions: { type: Type.STRING, description: "Numbered step-by-step mixing instructions for the bartender." },
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
