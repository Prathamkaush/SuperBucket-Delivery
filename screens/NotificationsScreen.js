import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, PanResponder, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { deleteNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notifications';
import { Colors, card } from '../theme';

export default function NotificationsScreen() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const result = await getNotifications();
      setItems(result.items || []);
      setUnread(Number(result.unread || 0));
    } catch (error) { Alert.alert('Could not load notifications', error.message); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = (item) => {
    if (item.readAt) return;
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry));
    setUnread((value) => Math.max(0, value - 1));
    markNotificationRead(item.id).catch(load);
  };
  const remove = (item) => Alert.alert('Delete notification?', 'This notification will be removed from your inbox.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (!item.readAt) setUnread((value) => Math.max(0, value - 1));
      try { await deleteNotification(item.id); } catch (error) { Alert.alert('Could not delete', error.message); load(); }
    } },
  ]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>;
  return <View style={styles.page}>
    <View style={styles.header}>
      <View><Text style={styles.title}>Notifications</Text><Text style={styles.count}>{unread} unread</Text></View>
      <TouchableOpacity onPress={async () => { await markAllNotificationsRead(); setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))); setUnread(0); }}><Text style={styles.mark}>MARK ALL READ</Text></TouchableOpacity>
    </View>
    <ScrollView refreshControl={<RefreshControl refreshing={false} onRefresh={load} />} contentContainerStyle={styles.list}>
      {!items.length ? <Text style={styles.empty}>No notifications yet.</Text> : items.map((item) => (
        <SwipeRow key={item.id} onDelete={() => remove(item)}>
          <TouchableOpacity style={[styles.item, !item.readAt && styles.unread]} onPress={() => open(item)}>
            <Text style={styles.itemTitle}>{item.title}</Text><Text style={styles.body}>{item.body}</Text><Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
          </TouchableOpacity>
        </SwipeRow>
      ))}
    </ScrollView>
  </View>;
}

function SwipeRow({ children, onDelete }) {
  const x = useRef(new Animated.Value(0)).current;
  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => g.dx > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_e, g) => x.setValue(Math.min(g.dx, 120)),
    onPanResponderRelease: (_e, g) => { Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(); if (g.dx >= 95) onDelete(); },
    onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
  }), [onDelete, x]);
  return <View style={styles.swipe}><View style={styles.deleteBack}><Text style={styles.deleteText}>DELETE</Text></View><Animated.View style={{ transform: [{ translateX: x }] }} {...responder.panHandlers}>{children}</Animated.View></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background, paddingTop: 55 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: { paddingHorizontal: 18, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, title: { fontSize: 25, fontWeight: '900' }, count: { color: Colors.muted, marginTop: 3 }, mark: { color: Colors.primary, fontSize: 10, fontWeight: '900' },
  list: { padding: 18, paddingTop: 0, paddingBottom: 100 }, swipe: { marginBottom: 10, borderRadius: 16, overflow: 'hidden' }, deleteBack: { ...StyleSheet.absoluteFillObject, backgroundColor: Colors.primary, justifyContent: 'center', paddingLeft: 22 }, deleteText: { color: Colors.white, fontWeight: '900', fontSize: 11 },
  item: { ...card, marginBottom: 0 }, unread: { borderLeftWidth: 4, borderLeftColor: Colors.primary }, itemTitle: { color: Colors.text, fontWeight: '900', fontSize: 15 }, body: { color: Colors.textSecondary, marginTop: 6, lineHeight: 19 }, time: { color: Colors.muted, fontSize: 10, marginTop: 8 }, empty: { color: Colors.muted, textAlign: 'center', padding: 30 },
});
