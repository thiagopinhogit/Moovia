import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryItem {
  id: string;
  imageUri: string;
  description: string;
  createdAt: number;
}

const HISTORY_KEY = '@lumo_history';

export const saveToHistory = async (imageUri: string, description: string): Promise<void> => {
  try {
    const history = await getHistory();
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      imageUri,
      description,
      createdAt: Date.now(),
    };
    
    // Add to beginning of array
    const updatedHistory = [newItem, ...history];
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    console.log('✅ [History] Saved to history:', newItem.id);
  } catch (error) {
    console.error('❌ [History] Error saving to history:', error);
  }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const history = await AsyncStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('❌ [History] Error getting history:', error);
    return [];
  }
};

export const deleteHistoryItem = async (id: string): Promise<void> => {
  try {
    const history = await getHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    console.log('✅ [History] Deleted item:', id);
  } catch (error) {
    console.error('❌ [History] Error deleting item:', error);
  }
};

export const clearHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
    console.log('✅ [History] Cleared all history');
  } catch (error) {
    console.error('❌ [History] Error clearing history:', error);
  }
};

