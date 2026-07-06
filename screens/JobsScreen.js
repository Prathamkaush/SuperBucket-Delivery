import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { acceptDelivery, getMyDeliveries, getReadyOrders } from '../services/delivery';
import { Colors, card } from '../theme';

export default function JobsScreen({ navigation }) {
  const [tab, setTab] = useState('ready');
  const [ready, setReady] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [nextReady, nextMine] = await Promise.all([getReadyOrders(), getMyDeliveries()]);
      setReady(nextReady);
      setMine(nextMine);
    } catch (e) {
      Alert.alert('Could not load deliveries', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const accept = async (order) => {
    try {
      const accepted = await acceptDelivery(order.id);
      await load();
      navigation.navigate('Route', { order: accepted });
    } catch (e) {
      Alert.alert('Could not accept order', e.message);
    }
  };

  const list = tab === 'ready' ? ready : mine;

  return (
    <View style={styles.page}>
      <Text style={styles.title}>Deliveries</Text>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'ready' && styles.tabActive]} onPress={() => setTab('ready')}>
          <Text style={styles.tabText}>Ready ({ready.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'mine' && styles.tabActive]} onPress={() => setTab('mine')}>
          <Text style={styles.tabText}>Mine ({mine.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
          {list.map((order) => (
            <View key={order.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.orderName}>Order #{order.id}</Text>
                <Text style={[styles.status, order.status === 'DELIVERED' && styles.done]}>{order.status}</Text>
              </View>
              <Text style={styles.meta}>Pickup: {resolvePickupShop(order)?.name || 'Shop'} {order.dispatchedAt ? `• ${new Date(order.dispatchedAt).toLocaleTimeString()}` : ''}</Text>
              <Text style={styles.address}>{shopAddress(resolvePickupShop(order))}</Text>
              <View style={styles.divider} />
              <Text style={styles.meta}>Drop: {order.address?.name || order.user?.name || 'Customer'}</Text>
              <Text style={styles.address}>{customerAddress(order.address)}</Text>
              <Text style={styles.items}>{order.items?.length || 0} item(s)</Text>

              {tab === 'ready' ? (
                <TouchableOpacity style={styles.primary} onPress={() => accept(order)}>
                  <Text style={styles.primaryText}>Accept and open route</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('Route', { order })}>
                  <Text style={styles.primaryText}>{order.status === 'DELIVERED' ? 'View delivery' : 'Open route'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {!list.length ? <Text style={styles.empty}>{tab === 'ready' ? 'No dispatched shop orders right now.' : 'You have not accepted any deliveries yet.'}</Text> : null}
        </ScrollView>
      )}
    </View>
  );
}

function shopAddress(shop) {
  if (!shop) return 'Shop address unavailable';
  return [shop.address, shop.city, shop.state, shop.pincode].filter(Boolean).join(', ') || 'Shop address unavailable';
}

function resolvePickupShop(order) {
  return order?.shop || order?.dispatchedBy?.staffShop || null;
}

function customerAddress(address) {
  if (!address) return 'Customer address unavailable';
  return [address.street, address.city, address.state, address.pincode].filter(Boolean).join(', ');
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background, paddingTop: 55 },
  title: { fontSize: 25, fontWeight: '900', paddingHorizontal: 18 },
  tabs: { flexDirection: 'row', padding: 18, gap: 8 },
  tab: { flex: 1, backgroundColor: Colors.white, padding: 12, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.secondaryLight, borderWidth: 1, borderColor: Colors.secondary },
  tabText: { fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 18, paddingBottom: 100, gap: 10 },
  card: { ...card },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderName: { fontSize: 17, fontWeight: '900', flex: 1 },
  status: { color: Colors.secondary, fontSize: 11, fontWeight: '900' },
  done: { color: Colors.success },
  meta: { color: Colors.secondary, fontWeight: '800', fontSize: 12, marginTop: 8 },
  address: { color: Colors.muted, lineHeight: 18, marginTop: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 10 },
  items: { color: Colors.textSecondary, fontWeight: '800', marginTop: 10 },
  primary: { backgroundColor: Colors.primary, padding: 13, borderRadius: 10, alignItems: 'center', marginTop: 12 },
  primaryText: { color: Colors.white, fontWeight: '900' },
  empty: { color: Colors.muted, textAlign: 'center', padding: 35 },
});
