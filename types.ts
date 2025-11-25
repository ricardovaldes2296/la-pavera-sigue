export enum DrinkType {
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

export type ViewState = 'landing' | 'drinks' | 'music' | 'bartender' | 'settings';
