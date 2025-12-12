import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryItem {
  id: string;
  taskId?: string; // For tracking video generation
  imageUri: string; // Can be video URL when completed
  description: string;
  status?: 'processing' | 'completed' | 'failed'; // Video generation status
  createdAt: number;
  completedAt?: number;
}

const HISTORY_KEY = '@moovia_history';

export const saveToHistory = async (
  imageUri: string, 
  description: string, 
  status: 'processing' | 'completed' | 'failed' = 'completed'
): Promise<string> => {
  try {
    const history = await getHistory();
    const itemId = Date.now().toString();
    const newItem: HistoryItem = {
      id: itemId,
      taskId: status === 'processing' ? imageUri : undefined, // If processing, imageUri is taskId
      imageUri: status === 'processing' ? '' : imageUri,
      description,
      status,
      createdAt: Date.now(),
      completedAt: status === 'completed' ? Date.now() : undefined,
    };
    
    // Add to beginning of array
    const updatedHistory = [newItem, ...history];
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    console.log('✅ [History] Saved to history:', newItem.id, 'status:', status);
    return itemId;
  } catch (error) {
    console.error('❌ [History] Error saving to history:', error);
    return '';
  }
};

export const updateHistoryItem = async (
  taskId: string,
  updates: Partial<HistoryItem>
): Promise<void> => {
  try {
    const history = await getHistory();
    const updatedHistory = history.map(item => {
      if (item.taskId === taskId) {
        return { ...item, ...updates };
      }
      return item;
    });
    
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    console.log('✅ [History] Updated item with taskId:', taskId);
  } catch (error) {
    console.error('❌ [History] Error updating item:', error);
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

