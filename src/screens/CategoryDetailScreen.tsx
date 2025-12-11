import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../types';

type CategoryDetailScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CategoryDetail'>;
  route: RouteProp<RootStackParamList, 'CategoryDetail'>;
};

const { width, height } = Dimensions.get('window');

export default function CategoryDetailScreen({ 
  navigation, 
  route 
}: CategoryDetailScreenProps) {
  const { t } = useTranslation();
  const { effect } = route.params;
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);

  const handleTryIt = () => {
    setShowImagePickerModal(true);
  };

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('permissions.libraryTitle'),
        t('permissions.libraryMessage')
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        t('permissions.cameraTitle'),
        t('permissions.cameraMessage')
      );
      return false;
    }
    return true;
  };

  const pickFromGallery = async () => {
    setShowImagePickerModal(false);
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7, // Reduced to prevent API Gateway 413 errors
      });

      if (!result.canceled && result.assets[0]) {
        navigation.navigate('Edit', { effect, imageUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      const errorMsg = error instanceof Error && error.message 
        ? `${t('errors.pickImageFailed')}: ${error.message}` 
        : t('errors.pickImageMessage');
      Alert.alert(t('errors.pickImageFailed'), errorMsg);
    }
  };

  const takePhoto = async () => {
    setShowImagePickerModal(false);
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7, // Reduced to prevent API Gateway 413 errors
      });

      if (!result.canceled && result.assets[0]) {
        navigation.navigate('Edit', { effect, imageUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      const errorMsg = error instanceof Error && error.message 
        ? `${t('errors.takePhotoFailed')}: ${error.message}` 
        : t('errors.takePhotoMessage');
      Alert.alert(t('errors.takePhotoFailed'), errorMsg);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.appName}>{t('categoryDetail.appName')}</Text>
        <Text style={styles.effectName}>{effect.name}</Text>
        <Text style={styles.description}>{effect.description}</Text>

        {/* Image Preview */}
        <Image
          source={{ uri: effect.image }}
          style={styles.previewImage}
          resizeMode="cover"
        />
      </View>

      {/* Try It Button */}
      <TouchableOpacity style={styles.tryButton} onPress={handleTryIt}>
        <Text style={styles.tryButtonText}>{t('categoryDetail.tryIt')}</Text>
      </TouchableOpacity>

      {/* Image Picker Modal - Bottom Sheet Style */}
      <Modal
        visible={showImagePickerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePickerModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('categoryDetail.choosePhoto')}</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={pickFromGallery}
            >
              <Text style={styles.modalOptionIcon}>🖼️</Text>
              <Text style={styles.modalOptionText}>{t('home.gallery')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalOption}
              onPress={takePhoto}
            >
              <Text style={styles.modalOptionIcon}>📷</Text>
              <Text style={styles.modalOptionText}>{t('home.camera')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalCancel}
              onPress={() => setShowImagePickerModal(false)}
            >
              <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backIcon: {
    fontSize: 24,
    color: '#000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  effectName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  previewImage: {
    width: width - 80,
    height: (width - 80) * 1.5,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
  },
  tryButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#000',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  tryButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#D0D0D0',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
  },
  modalOptionIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  modalOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalCancel: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
});

