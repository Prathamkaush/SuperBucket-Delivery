import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMyDeliveries, getReadyOrders } from '../services/delivery';
import { Colors, card } from '../theme';

export default function DashboardScreen({ navigation }) {
  const [ready, setReady] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [nextReady, nextMine] = await Promise.all([getReadyOrders(), getMyDeliveries()]);
      setReady(nextReady);
      setMine(nextMine);
    } catch (error) {
      Alert.alert('Could not refresh deliveries', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;

  const active = mine.filter((order) => order.status === 'SHIPPED');
  const delivered = mine.filter((order) => order.status === 'DELIVERED');
  const latest = active[0];

  return (
    <ScrollView contentContainerStyle={styles.page} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
      <Text style={styles.greeting}>Delivery dashboard</Text>
      <View style={styles.statusCard}>
        <View>
          <Text style={styles.statusTitle}>{active.length ? 'Delivery in progress' : 'Ready for orders'}</Text>
          <Text style={styles.statusHelp}>{ready.length} shop orders are ready to pick up.</Text>
        </View>
        <View style={styles.liveBadge}><Text style={styles.liveText}>ONLINE</Text></View>
      </View>

      <View style={styles.metrics}>
        <Metric value={ready.length} label="Ready" />
        <Metric value={active.length} label="Active" />
        <Metric value={delivered.length} label="Delivered" />
        <Metric value="10m" label="Target" />
      </View>

      <Text style={styles.heading}>Next delivery</Text>
      {latest ? (
        <TouchableOpacity style={styles.job} onPress={() => navigation.navigate('Route', { order: latest })}>
          <Text style={styles.jobName}>Order #{latest.id}</Text>
          <Text style={styles.jobMeta}>{latest.shop?.name || 'Shop'} to {latest.address?.name || latest.user?.name || 'Customer'}</Text>
          <Text style={styles.address}>{formatAddress(latest.address)}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.empty}>No active delivery. Open Deliveries to accept a ready order.</Text>
      )}
    </ScrollView>
  );
}

function formatAddress(address) {
  if (!address) return 'Customer address unavailable';
  return [address.street, address.city, address.state, address.pincode].filter(Boolean).join(', ');
}

function Metric({ value, label }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: Colors.background, paddingTop: 55, padding: 18, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  greeting: { fontSize: 25, fontWeight: '900', marginBottom: 18 },
  statusCard: { ...card, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusTitle: { fontSize: 18, fontWeight: '900' },
  statusHelp: { color: Colors.muted, marginTop: 4, fontSize: 12 },
  liveBadge: { backgroundColor: Colors.successLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  liveText: { color: Colors.success, fontWeight: '900', fontSize: 11 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  metric: { ...card, width: '48%', flexGrow: 1, alignItems: 'center', paddingHorizontal: 6 },
  metricValue: { fontSize: 20, fontWeight: '900', color: Colors.secondary },
  metricLabel: { fontSize: 10, color: Colors.muted, marginTop: 3, textAlign: 'center' },
  heading: { fontSize: 18, fontWeight: '900', marginTop: 24, marginBottom: 10 },
  job: { ...card, marginBottom: 8 },
  jobName: { fontWeight: '900' },
  jobMeta: { color: Colors.secondary, fontSize: 12, marginTop: 5, fontWeight: '800' },
  address: { color: Colors.muted, lineHeight: 18, marginTop: 5 },
  empty: { color: Colors.muted, backgroundColor: Colors.white, borderRadius: 12, padding: 20, textAlign: 'center' },
});
