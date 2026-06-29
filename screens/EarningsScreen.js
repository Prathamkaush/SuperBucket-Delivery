import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMyDeliveries } from '../services/delivery';
import { Colors, card } from '../theme';

export default function EarningsScreen() {
  const [orders, setOrders] = useState([]);

  useFocusEffect(useCallback(() => {
    getMyDeliveries()
      .then((all) => setOrders(all.filter((order) => order.status === 'DELIVERED')))
      .catch((e) => Alert.alert('Could not load deliveries', e.message));
  }, []));

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>Delivery report</Text>
      <View style={styles.total}>
        <Text style={styles.totalLabel}>Completed deliveries</Text>
        <Text style={styles.totalValue}>{orders.length}</Text>
        <Text style={styles.totalHelp}>Payout can be connected after delivery fee rules are finalized.</Text>
      </View>
      <Text style={styles.heading}>Delivered orders</Text>
      {orders.map((order) => (
        <View key={order.id} style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.name}>Order #{order.id}</Text>
            <Text style={styles.date}>{order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : 'Delivered'}</Text>
            <Text style={styles.address}>{order.address?.city}, {order.address?.pincode}</Text>
          </View>
          <Text style={styles.amount}>DONE</Text>
        </View>
      ))}
      {!orders.length ? <Text style={styles.empty}>Completed deliveries will appear here.</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: Colors.background, paddingTop: 55, padding: 18, paddingBottom: 100 },
  title: { fontSize: 25, fontWeight: '900' },
  total: { ...card, backgroundColor: Colors.secondary, marginTop: 18 },
  totalLabel: { color: '#DCEBFA', fontWeight: '700' },
  totalValue: { color: Colors.white, fontWeight: '900', fontSize: 40, marginTop: 8 },
  totalHelp: { color: '#DCEBFA', marginTop: 5, lineHeight: 18 },
  heading: { fontSize: 18, fontWeight: '900', marginTop: 24, marginBottom: 10 },
  row: { ...card, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  rowText: { flex: 1, paddingRight: 10 },
  name: { fontWeight: '900' },
  date: { color: Colors.muted, fontSize: 12, marginTop: 4 },
  address: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  amount: { color: Colors.success, fontWeight: '900', fontSize: 12 },
  empty: { color: Colors.muted, textAlign: 'center', padding: 30 },
});
