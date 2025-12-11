import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ImageSourcePropType,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

type BadgeText = {
  before: string;
  after: string;
};

type BeforeAfterCardProps = {
  beforeUri: string | ImageSourcePropType;
  afterUri: string | ImageSourcePropType;
  label: string;
  width: number;
  height: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  badgeText?: BadgeText;
  swapInterval?: number;
  hideLabel?: boolean;
};

const DEFAULT_BADGE_TEXT: BadgeText = {
  before: 'Before',
  after: 'After',
};

const BeforeAfterCard: React.FC<BeforeAfterCardProps> = ({
  beforeUri,
  afterUri,
  label,
  width,
  height,
  onPress,
  style,
  swapInterval = 2400,
  badgeText = DEFAULT_BADGE_TEXT,
  hideLabel = false,
}) => {
  const fade = useRef(new Animated.Value(0)).current;
  const [showAfter, setShowAfter] = useState(false);

  useEffect(() => {
    const intervalId = setInterval(
      () => setShowAfter((prev) => !prev),
      swapInterval
    );
    return () => clearInterval(intervalId);
  }, [swapInterval]);

  useEffect(() => {
    Animated.timing(fade, {
      toValue: showAfter ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [fade, showAfter]);

  const sources = useMemo(
    () => ({
      before: typeof beforeUri === 'string' ? { uri: beforeUri } : beforeUri,
      after: typeof afterUri === 'string' ? { uri: afterUri } : afterUri,
    }),
    [afterUri, beforeUri]
  );

  const beforeOpacity = fade.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={[styles.imageWrapper, { width, height }]}>
        <Animated.Image
          source={sources.before}
          style={[styles.image, { opacity: beforeOpacity }]}
          resizeMode="cover"
        />
        <Animated.Image
          source={sources.after}
          style={[styles.image, { opacity: fade }]}
          resizeMode="cover"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {showAfter ? badgeText.after : badgeText.before}
          </Text>
        </View>
      </View>
      {!hideLabel && (
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginRight: 15,
  },
  imageWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  label: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
});

export default BeforeAfterCard;

