export interface EditEffect {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  effects: EditEffect[];
}

export type RootStackParamList = {
  Onboarding: undefined;
  Home: undefined;
  CategoryDetail: { effect: EditEffect };
  Edit: { effect?: EditEffect; imageUri?: string; originalImageUri?: string };
  Loading: { imageUri: string; description: string; effect?: EditEffect };
  History: undefined;
  PurchaseSuccess: {
    purchaseType: 'credits' | 'subscription';
    credits?: number;
    subscriptionName?: string;
  };
};
