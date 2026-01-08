export interface EditEffect {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
}

// Alias for backward compatibility
export type Effect = EditEffect;

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
  Edit: { effect?: EditEffect; imageUri?: string; originalImageUri?: string; aiModel?: string; prompt?: string };
  Loading: { imageUri: string; description: string; effect?: EditEffect };
  History: undefined;
  DebugSubscription: undefined;
  PurchaseSuccess: {
    purchaseType: 'credits' | 'subscription';
    credits?: number;
    subscriptionName?: string;
  };
  VideoPlayer: {
    videoUrl: string;
    description: string;
  };
};
