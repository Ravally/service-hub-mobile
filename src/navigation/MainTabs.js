import React, { useRef, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../theme';
import { mediumImpact } from '../utils/haptics';
import HomeStack from './HomeStack';
import ScheduleStack from './ScheduleStack';
import SearchStack from './SearchStack';
import MoreStack from './MoreStack';
import QuickCreateSheet from '../components/common/QuickCreateSheet';
import ClampIcon from '../components/clamp/ClampIcon';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: { focused: 'home', unfocused: 'home-outline' },
  Schedule: { focused: 'calendar', unfocused: 'calendar-outline' },
  Search: { focused: 'search', unfocused: 'search-outline' },
  More: { focused: 'menu', unfocused: 'menu-outline' },
};

function EmptyScreen() {
  return null;
}

function CenterCreateButton({ onPress }) {
  return (
    <TouchableOpacity style={styles.centerBtn} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.centerCircle}>
        <Ionicons name="add" size={30} color={colors.white} />
      </View>
    </TouchableOpacity>
  );
}

export default function MainTabs() {
  const sheetRef = useRef(null);

  const openSheet = useCallback(() => {
    mediumImpact();
    sheetRef.current?.open();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = TAB_ICONS[route.name];
            if (!icons) return null;
            const iconName = focused ? icons.focused : icons.unfocused;
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.scaffld,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.charcoal,
            borderTopColor: colors.slate,
            borderTopWidth: 0.5,
            height: 64,
            paddingBottom: 8,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontFamily: fonts.data.medium,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 1,
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Schedule" component={ScheduleStack} />
        <Tab.Screen
          name="Create"
          component={EmptyScreen}
          listeners={{ tabPress: (e) => { e.preventDefault(); openSheet(); } }}
          options={{
            tabBarLabel: () => null,
            tabBarButton: (props) => <CenterCreateButton onPress={openSheet} />,
          }}
        />
        <Tab.Screen name="Search" component={SearchStack} />
        <Tab.Screen name="More" component={MoreStack} />
      </Tab.Navigator>
      <QuickCreateSheet ref={sheetRef} />
      <ClampFAB />
    </View>
  );
}

function ClampFAB() {
  const navigation = useNavigation();

  const handlePress = useCallback(() => {
    mediumImpact();
    navigation.navigate('More', { screen: 'ClampChat' });
  }, [navigation]);

  return (
    <TouchableOpacity style={styles.clampFab} onPress={handlePress} activeOpacity={0.85}>
      <ClampIcon size={22} color={colors.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  centerBtn: {
    top: -14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.scaffld,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowTeal,
  },
  clampFab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.clamp,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
