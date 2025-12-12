import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { RootStackParamList } from '../types';
import COLORS from '../constants/colors';
import TYPO from '../constants/typography';

type VideoPlayerScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'VideoPlayer'>;
  route: RouteProp<RootStackParamList, 'VideoPlayer'>;
};

const { width, height } = Dimensions.get('window');

export default function VideoPlayerScreen({ navigation, route }: VideoPlayerScreenProps) {
  const { videoUrl, description } = route.params;
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSaveToLibrary = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsSaving(true);

      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access media library is required!');
        setIsSaving(false);
        return;
      }

      // Download video
      const fileUri = FileSystem.documentDirectory + 'moovia_video_' + Date.now() + '.mp4';
      const downloadResult = await FileSystem.downloadAsync(videoUrl, fileUri);

      // Save to library
      await MediaLibrary.saveToLibraryAsync(downloadResult.uri);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      alert('Video saved to your library!');
    } catch (error) {
      console.error('❌ Failed to save video:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert('Failed to save video. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsLoading(false);
      setIsPlaying(status.isPlaying);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Video */}
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        isLooping
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.violet} />
        </View>
      )}

      {/* Top Gradient Overlay */}
      <LinearGradient
        colors={['rgba(0,0,0,0.8)', 'transparent']}
        style={styles.topGradient}
      />

      {/* Bottom Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.bottomGradient}
      />

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {description || 'Video'}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </SafeAreaView>

      {/* Play/Pause Button (Center) */}
      <TouchableOpacity style={styles.playButton} onPress={handlePlayPause}>
        <View style={styles.playButtonCircle}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={40}
            color="#FFFFFF"
          />
        </View>
      </TouchableOpacity>

      {/* Bottom Controls */}
      <SafeAreaView style={styles.bottomBar} edges={['bottom']}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSaveToLibrary}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="download-outline" size={28} color="#FFFFFF" />
          )}
          <Text style={styles.actionButtonText}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    width: width,
    height: height,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 16,
    fontFamily: TYPO.semibold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
  },
  playButtonCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  actionButton: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    minWidth: 100,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: TYPO.medium,
    color: '#FFFFFF',
    marginTop: 4,
  },
});
