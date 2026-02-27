/**
 * Life Monk app - pixel-perfect theme from reference design
 */
export const LifeMonkColors = {
  // Brand / text
  title: '#2D3748',
  text: '#2D3748',
  textSecondary: '#4A5568',
  textMuted: '#718096',

  // Screen background gradient
  screenGradientTop: '#F5F0F5',
  screenGradientBottom: '#E8D5F2',

  // Welcome card
  welcomeGradientStart: '#FADDE1',
  welcomeGradientEnd: '#E8D5F2',

  // Cards
  reflectionCard: '#7C3AED',
  focusGradientStart: '#EA580C',
  focusGradientEnd: '#C2410C',
  focusStartButton: '#B45309',
  challengeCardBg: '#FFFFFF',
  challengeCardBorder: '#E2E8F0',
  challengeIconBlue: '#1E40AF',
  challengeMoreButtonBg: '#DBEAFE',
  challengeMoreButtonText: '#1E40AF',

  // Segment: unselected = dark grey + white text; selected = light + dark text + purple glow
  segmentUnselectedBg: '#4A5568',
  segmentUnselectedText: '#FFFFFF',
  segmentSelectedBg: '#FFFFFF',
  segmentSelectedText: '#2D3748',
  segmentSelectedBorder: '#E2E8F0',
  segmentContainerBg: '#4A5568',
  segmentShadowPurple: 'rgba(124, 58, 237, 0.35)',

  // Bottom bar - white pill, BYTES = purple-to-pink gradient
  tabBarBg: '#FFFFFF',
  tabBarInactive: '#4A5568',
  tabBarBytesGradientStart: '#6366F1',
  tabBarBytesGradientEnd: '#EC4899',
  tabBarBytesIcon: '#FFFFFF',
  tabBarBytesLabel: '#FFFFFF',

  // From main-rn index.css (semantic)
  accentPrimary: '#6E44FF',
  accentSecondary: '#FF7A45',
  accentPurple: '#8B5CF6',
  bgApp: '#F5F0F5',
  bgSurface: '#FFFFFF',
  bgCard: '#FFFFFF',
  borderSubtle: 'rgba(0,0,0,0.05)',
  borderStrong: 'rgba(0,0,0,0.1)',
} as const;

export const LifeMonkSpacing = {
  screenPadding: 20,
  contentPadding: 20,
  headerGap: 10,
  sectionGap: 14,
  cardPadding: 20,
  bottomBarHeight: 76,
  bottomBarPaddingBottom: 28,
  // From main-rn fluid system (fixed values for RN)
  spacingXs: 5,
  spacingSm: 10,
  spacingMd: 18,
  spacingLg: 24,
  spacingXl: 32,
  spacing2xl: 44,
  navHeight: 68,
  touchTarget: 48,
  // Corner radii - pixel perfect
  cardRadiusLarge: 24,
  cardRadius: 20,
  cardRadiusSmall: 12,
  segmentRadius: 26,
  segmentItemRadius: 22,
  bottomBarRadius: 32,
  buttonRadius: 10,
} as const;

export const LifeMonkTypography = {
  fontXs: 11,
  fontSm: 13,
  fontBase: 15,
  fontLg: 17,
  fontXl: 20,
  font2xl: 24,
  font3xl: 32,
  appTitle: { fontSize: 22, fontWeight: '700' as const },
  segment: { fontSize: 13, fontWeight: '600' as const },
  welcomeGreeting: { fontSize: 20, fontWeight: '600' as const },
  welcomeCta: { fontSize: 19, fontWeight: '700' as const },
  cardTitle: { fontSize: 16, fontWeight: '700' as const },
  cardSubtitle: { fontSize: 13, fontWeight: '400' as const },
  focusTimer: { fontSize: 34, fontWeight: '700' as const },
  challengeTitle: { fontSize: 16, fontWeight: '700' as const },
  challengeItem: { fontSize: 14, fontWeight: '400' as const },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const },
  tabLabel: { fontSize: 11, fontWeight: '500' as const },
} as const;
