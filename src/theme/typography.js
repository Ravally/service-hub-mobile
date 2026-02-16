/**
 * Scaffld typography tokens for React Native
 * Fonts loaded via @expo-google-fonts in App.js
 */

export const fonts = {
  primary: {
    light: 'DMSans_300Light',
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semiBold: 'DMSans_600SemiBold',
    bold: 'DMSans_700Bold',
  },
  data: {
    regular: 'JetBrainsMono_400Regular',
    medium: 'JetBrainsMono_500Medium',
  },
};

export const typeScale = {
  h1: { fontSize: 28, fontFamily: fonts.primary.bold, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontFamily: fonts.primary.bold, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontFamily: fonts.primary.semiBold },
  h4: { fontSize: 16, fontFamily: fonts.primary.semiBold },
  body: { fontSize: 16, fontFamily: fonts.primary.regular, lineHeight: 24 },
  bodySm: { fontSize: 14, fontFamily: fonts.primary.regular, lineHeight: 20 },
  caption: { fontSize: 12, fontFamily: fonts.data.regular, letterSpacing: 0.5 },
  label: {
    fontSize: 11,
    fontFamily: fonts.data.medium,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
};
