import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getStoredUser, getToken, logout } from './services/auth';
import DashboardScreen from './screens/DashboardScreen';
import JobsScreen from './screens/JobsScreen';
import EarningsScreen from './screens/EarningsScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';
import RouteScreen from './screens/RouteScreen';
import { Colors } from './theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const icons = { Dashboard: 'D', Deliveries: 'O', Earnings: '₹', Profile: 'P' };

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.muted,
        tabBarStyle: styles.tab,
        tabBarLabelStyle: styles.label,
        tabBarIcon: ({ focused }) => (
          <View style={[styles.icon, focused && styles.iconActive]}>
            <Text style={[styles.iconText, focused && { color: Colors.primary }]}>{icons[route.name]}</Text>
          </View>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Deliveries" component={JobsScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function DeliveryApp() {
  const [ready, setReady] = useState(false);
  const [initial, setInitial] = useState('Login');

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const user = await getStoredUser().catch(() => null);
      if (token && user?.role === 'DELIVERY_PARTNER') setInitial('DeliveryTabs');
      if (token && user?.role !== 'DELIVERY_PARTNER') await logout();
      setReady(true);
    })();
  }, []);

  if (!ready) return <View style={styles.loading}><ActivityIndicator color={Colors.primary} /></View>;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initial} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="DeliveryTabs" component={Tabs} />
        <Stack.Screen name="Route" component={RouteScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  tab: { height: 72, paddingTop: 7, paddingBottom: 9, borderTopWidth: 0, elevation: 15 },
  label: { fontSize: 10, fontWeight: '800' },
  icon: { width: 34, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconActive: { backgroundColor: Colors.primaryLight },
  iconText: { color: Colors.muted, fontWeight: '900' },
});
