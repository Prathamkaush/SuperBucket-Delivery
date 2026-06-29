import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getStoredUser, logout } from '../services/auth';
import { getMyDeliveries } from '../services/delivery';
import { Colors, card } from '../theme';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);

  useFocusEffect(useCallback(() => {
    Promise.all([getStoredUser(), getMyDeliveries()])
      .then(([nextUser, nextOrders]) => { setUser(nextUser); setOrders(nextOrders); })
      .catch((error) => Alert.alert('Could not load profile', error.message));
  }, []));

  const signOut = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (!user) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

  const delivered = orders.filter((order) => order.status === 'DELIVERED').length;
  const active = orders.filter((order) => order.status === 'SHIPPED').length;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>Profile</Text>
      <View style={styles.card}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user.name?.[0] || 'D'}</Text></View>
        <Text style={styles.name}>{user.name || 'Delivery partner'}</Text>
        <Text style={styles.phone}>{user.phone ? `+91 ${user.phone}` : user.email}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>DELIVERY PARTNER</Text></View>
        <View style={styles.ratingRow}>
          <View><Text style={styles.ratingValue}>{active}</Text><Text style={styles.ratingLabel}>active</Text></View>
          <View style={styles.metricDivider} />
          <View><Text style={styles.ratingValue}>{delivered}</Text><Text style={styles.ratingLabel}>delivered</Text></View>
        </View>
      </View>

      <Text style={styles.detail}>Email: {user.email || 'Not set'}</Text>
      <Text style={styles.detail}>Role: {user.role}</Text>
      <TouchableOpacity style={styles.logout} onPress={signOut}><Text style={styles.logoutText}>Log out</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  page: { flexGrow: 1, backgroundColor: Colors.background, paddingTop: 55, padding: 18, paddingBottom: 100 },
  title: { fontSize: 25, fontWeight: '900' },
  card: { ...card, alignItems: 'center', marginTop: 18 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: Colors.secondaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Colors.secondary, fontWeight: '900', fontSize: 30 },
  name: { fontSize: 20, fontWeight: '900', marginTop: 10 },
  phone: { color: Colors.muted, marginTop: 4 },
  badge: { backgroundColor: Colors.successLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 12 },
  badgeText: { color: Colors.success, fontWeight: '900', fontSize: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 28, marginTop: 18 },
  ratingValue: { color: Colors.secondary, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  ratingLabel: { color: Colors.muted, fontSize: 10, textAlign: 'center', marginTop: 3 },
  metricDivider: { width: 1, height: 35, backgroundColor: Colors.border },
  detail: { ...card, marginTop: 10, color: Colors.muted },
  logout: { padding: 15, alignItems: 'center', marginTop: 18 },
  logoutText: { color: Colors.danger, fontWeight: '900' },
});
