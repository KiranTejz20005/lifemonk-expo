import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LifeMonkColors, LifeMonkSpacing, LifeMonkTypography } from '@/constants/lifemonk-theme';
import { useTabBarVisibility } from '@/contexts/TabBarVisibilityContext';

const TAB_CONFIG: Record<string, { label: string; icon: 'folder-outline' | 'flag-outline' | 'flash' | 'people-outline' | 'ellipsis-horizontal'; isCenter?: boolean }> = {
  projects: { label: 'Projects', icon: 'folder-outline' },
  goals: { label: 'Goals', icon: 'flag-outline' },
  index: { label: 'BYTES', icon: 'flash', isCenter: true },
  refer: { label: 'Refer', icon: 'people-outline' },
  more: { label: 'More', icon: 'ellipsis-horizontal' },
};

export function LifeMonkTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { tabBarVisible } = useTabBarVisibility();
  const currentRoute = state.routes[state.index]?.name;
  const isIndexTab = currentRoute === 'index';
  const shouldHide = isIndexTab && !tabBarVisible;

  const visibleRoutes = state.routes.filter((r) => TAB_CONFIG[r.name]);

  if (shouldHide) return null;

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, 14) },
      ]}
    >
      <View style={styles.bar}>
        {visibleRoutes.map((route) => {
          const config = TAB_CONFIG[route.name];
          const actualIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === actualIndex;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (!config) return null;

          if (config.isCenter) {
            const isOnBytes = state.routes[state.index]?.name === 'bytes';
            const centerActive = isFocused || isOnBytes;
            return (
              <Pressable
                key={route.key}
                onPress={() => navigation.navigate('bytes')}
                style={styles.centerTabWrap}
              >
                {centerActive ? (
                  <LinearGradient
                    colors={[LifeMonkColors.tabBarBytesGradientStart, LifeMonkColors.tabBarBytesGradientEnd]}
                    style={styles.centerTabGradient}
                  >
                    <Ionicons name={config.icon} size={28} color={LifeMonkColors.tabBarBytesIcon} />
                  </LinearGradient>
                ) : (
                  <View style={styles.centerTab}>
                    <Ionicons name={config.icon} size={28} color={LifeMonkColors.tabBarInactive} />
                  </View>
                )}
                <Text
                  style={[
                    styles.tabLabel,
                    styles.centerTabLabel,
                    centerActive ? styles.centerTabLabelActive : null,
                  ]}
                >
                  {config.label}
                </Text>
              </Pressable>
            );
          }

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab}>
              <Ionicons
                name={config.icon}
                size={24}
                color={isFocused ? LifeMonkColors.tabBarBytesGradientStart : LifeMonkColors.tabBarInactive}
              />
              <Text
                style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: LifeMonkColors.tabBarBg,
    borderRadius: LifeMonkSpacing.bottomBarRadius,
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 10,
    minHeight: 68,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  tabLabel: {
    ...LifeMonkTypography.tabLabel,
    color: LifeMonkColors.tabBarInactive,
    marginTop: 4,
  },
  tabLabelActive: {
    color: LifeMonkColors.tabBarBytesGradientStart,
  },
  centerTabWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: -22,
    flex: 1,
  },
  centerTab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LifeMonkColors.tabBarBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F5F0F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  centerTabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  centerTabLabel: {
    marginTop: 10,
  },
  centerTabLabelActive: {
    color: LifeMonkColors.tabBarBytesGradientStart,
    fontWeight: '600',
  },
});
