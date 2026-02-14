import { Platform } from 'react-native';

/**
 * Platform-specific shadow definitions
 * iOS: uses shadowX/Y/Radius/Color/Opacity
 * Android: uses elevation
 */

function shadow(iosRadius, androidElevation, color = '#000') {
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: iosRadius / 4 },
      shadowOpacity: 0.2,
      shadowRadius: iosRadius,
    },
    android: {
      elevation: androidElevation,
    },
    default: {},
  });
}

export const shadows = {
  sm: shadow(4, 2),
  md: shadow(10, 4),
  lg: shadow(20, 8),
  glowTeal: shadow(10, 4, '#0EA5A0'),
  glowCoral: shadow(10, 4, '#F7845E'),
  glowAmber: shadow(10, 4, '#FFAA5C'),
};
