import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { markDelivered, updateDeliveryLocation } from '../services/delivery';
import { getStoredUser } from '../services/auth';
import { Colors, card } from '../theme';

const ENABLE_NATIVE_MAPS =
  process.env.EXPO_PUBLIC_ENABLE_NATIVE_MAPS === 'true' &&
  Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY);
const NativeMaps = getNativeMaps();

export default function RouteScreen({ navigation, route }) {
  const initialOrder = route.params?.order;
  const [order, setOrder] = useState(initialOrder);
  const [current, setCurrent] = useState(null);
  const [otp, setOtp] = useState('');
  const [watching, setWatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolvedCustomerPoint, setResolvedCustomerPoint] = useState(null);
  const watchRef = useRef(null);

  const dropAddress = customerAddress(order?.address);
  const customerPoint = coordinateFrom(order?.address, true) || resolvedCustomerPoint;
  const driverPoint = current || coordinateFrom({
    latitude: order?.deliveryLatitude,
    longitude: order?.deliveryLongitude,
  });
  const routePoints = [driverPoint, customerPoint].filter(Boolean);
  const region = useMemo(() => buildRegion(routePoints), [driverPoint, customerPoint]);
  const canShowNativeMap = Boolean(NativeMaps && region);

  useEffect(() => {
    let active = true;

    const resolveMissingPoints = async () => {
      if (!coordinateFrom(order?.address, true) && order?.address) {
        const point = await geocodeAddress(dropAddress);
        if (active) setResolvedCustomerPoint(point);
      } else if (active) {
        setResolvedCustomerPoint(null);
      }
    };

    resolveMissingPoints().catch(() => undefined);
    return () => { active = false; };
  }, [dropAddress]);

  useEffect(() => {
    if (!order?.id || order?.status === 'DELIVERED') return undefined;
    let mounted = true;
    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') return;
        const user = await getStoredUser().catch(() => null);
        const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!mounted) return;
        const point = { latitude: first.coords.latitude, longitude: first.coords.longitude };
        setCurrent(point);
        setOrder((value) => ({
          ...value,
          deliveryLatitude: point.latitude,
          deliveryLongitude: point.longitude,
          deliveryLocationUpdatedAt: new Date().toISOString(),
        }));
        await pushLocation(order?.id, point, user);
        setWatching(true);
        watchRef.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
          async (position) => {
            const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
            setCurrent(next);
            setOrder((value) => ({
              ...value,
              deliveryLatitude: next.latitude,
              deliveryLongitude: next.longitude,
              deliveryLocationUpdatedAt: new Date().toISOString(),
            }));
            await pushLocation(order?.id, next, user);
          },
        );
      } catch {
        if (mounted) setWatching(false);
      }
    })();
    return () => {
      mounted = false;
      watchRef.current?.remove();
    };
  }, [order?.id, order?.status]);

  const complete = async () => {
    try {
      if (!/^\d{4}$/.test(otp)) {
        Alert.alert('Delivery OTP required', 'Enter the 4-digit OTP shown in the customer app.');
        return;
      }
      setSaving(true);
      const updated = await markDelivered(order.id, otp);
      setOrder(updated);
      Alert.alert('Delivered', 'Order marked delivered successfully.', [
        { text: 'Done', onPress: () => navigation.navigate('DeliveryTabs') },
      ]);
    } catch (error) {
      Alert.alert('Could not complete delivery', error.message);
    } finally {
      setSaving(false);
    }
  };

  const openNavigation = () => {
    const destination = customerPoint
      ? `${customerPoint.latitude},${customerPoint.longitude}`
      : customerAddress(order?.address);
    const encoded = encodeURIComponent(destination);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encoded}&travelmode=driving`;
    Linking.openURL(url)
      .catch(() => {
        Alert.alert('Could not open maps', 'Please install or enable Google Maps, then try again.');
      });
  };

  return (
    <View style={styles.page}>
      <View style={styles.mapWrap}>
        {canShowNativeMap ? (
          <NativeMaps.MapView style={styles.map} initialRegion={region} region={region}>
            {driverPoint ? <NativeMaps.Marker coordinate={driverPoint} title="You" pinColor={Colors.secondary} /> : null}
            {customerPoint ? <NativeMaps.Marker coordinate={customerPoint} title={order?.address?.name || 'Drop'} pinColor={Colors.primary} /> : null}
            {routePoints.length >= 2 ? <NativeMaps.Polyline coordinates={routePoints} strokeColor={Colors.secondary} strokeWidth={4} /> : null}
          </NativeMaps.MapView>
        ) : (
          <View style={styles.noMap}>
            <Text style={styles.noMapTitle}>{region ? 'Route ready' : 'Map needs coordinates'}</Text>
            <Text style={styles.noMapText}>
              {region
                ? 'Native map is disabled until Google Maps is configured. Use navigation below.'
                : 'Allow GPS, add shop coordinates, and ask customers to save address with current location.'}
            </Text>
            {region ? (
              <TouchableOpacity style={styles.mapButton} onPress={openNavigation}>
                <Text style={styles.mapButtonText}>Open Google Maps</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.sheet}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back</Text></TouchableOpacity>
          <View style={[styles.live, watching && styles.liveOn]}><Text style={[styles.liveText, watching && styles.liveTextOn]}>{watching ? 'LIVE' : 'GPS'}</Text></View>
        </View>
        <Text style={styles.title}>Order #{order?.id}</Text>
        <Text style={styles.status}>{order?.status === 'DELIVERED' ? 'Delivered' : 'Ready for delivery'}</Text>

        <Stop label="Drop" title={order?.address?.name || order?.user?.name || 'Customer'} body={dropAddress} phone={order?.address?.phone || order?.user?.phone} />

        <Text style={styles.itemsTitle}>Items</Text>
        {order?.items?.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.product?.title || 'Product'} x {item.quantity}</Text>
            <Text style={styles.itemMeta}>{item.variant?.flavour || item.variant?.weightLabel || item.size?.size || ''}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.secondary} onPress={openNavigation}>
          <Text style={styles.secondaryText}>Open Google Maps navigation</Text>
        </TouchableOpacity>
        {order?.status !== 'DELIVERED' ? (
          <>
            <View style={styles.otpBox}>
              <Text style={styles.otpLabel}>Customer delivery OTP</Text>
              <TextInput
                style={styles.otpInput}
                value={otp}
                onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Enter 4-digit OTP"
                placeholderTextColor={Colors.muted}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={styles.otpHelp}>Ask the customer for the OTP shown in their app.</Text>
            </View>
            <TouchableOpacity style={[styles.primary, saving && styles.disabled]} disabled={saving} onPress={complete}>
              {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.primaryText}>Verify OTP & mark delivered</Text>}
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function getNativeMaps() {
  if (!ENABLE_NATIVE_MAPS || Platform.OS === 'web') return null;
  try {
    const maps = require('react-native-maps');
    return {
      MapView: maps.default,
      Marker: maps.Marker,
      Polyline: maps.Polyline,
    };
  } catch {
    return null;
  }
}

async function pushLocation(orderId, point, user) {
  if (!orderId || !point) return;
  try {
    await updateDeliveryLocation(orderId, {
      latitude: point.latitude,
      longitude: point.longitude,
      deliveryPartnerName: user?.name,
      deliveryPartnerPhone: user?.phone,
    });
  } catch {
    // Keep navigation usable even if a background location sync fails.
  }
}

function coordinateFrom(value, indiaOnly = false) {
  const latitude = Number(value?.latitude ?? value?.lat);
  const longitude = Number(value?.longitude ?? value?.lng);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180 ||
    (latitude === 0 && longitude === 0)
  ) return null;
  // Delivery addresses in this app are Indian (10-digit Indian phone and 6-digit pincode).
  // Reject stale/default coordinates such as longitude 0 and geocode the written address instead.
  if (indiaOnly && (latitude < 6 || latitude > 38 || longitude < 68 || longitude > 98)) return null;
  return { latitude, longitude };
}

async function geocodeAddress(address) {
  if (!address || address.includes('unavailable')) return null;
  const results = await Location.geocodeAsync(`${address}, India`);
  const point = coordinateFrom(results?.[0], true);
  return point;
}

function buildRegion(points) {
  if (!points.length) return null;
  const lats = points.map((point) => point.latitude);
  const lngs = points.map((point) => point.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.01, (maxLat - minLat) * 1.8 || 0.02),
    longitudeDelta: Math.max(0.01, (maxLng - minLng) * 1.8 || 0.02),
  };
}

function customerAddress(address) {
  if (!address) return 'Customer address unavailable';
  return [address.street, address.city, address.state, address.pincode].filter(Boolean).join(', ');
}

function Stop({ label, title, body, phone }) {
  return (
    <View style={styles.stop}>
      <Text style={styles.stopLabel}>{label}</Text>
      <Text style={styles.stopTitle}>{title}</Text>
      <Text style={styles.stopBody}>{body}</Text>
      {phone ? <TouchableOpacity onPress={() => Linking.openURL(`tel:${phone}`)}><Text style={styles.call}>Call {phone}</Text></TouchableOpacity> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  mapWrap: { height: '43%', backgroundColor: Colors.gray100 },
  map: { flex: 1 },
  noMap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  noMapTitle: { fontWeight: '900', fontSize: 18 },
  noMapText: { color: Colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  mapButton: { marginTop: 14, backgroundColor: Colors.secondary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 11 },
  mapButtonText: { color: Colors.white, fontWeight: '900' },
  sheet: { padding: 18, paddingBottom: 42 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: Colors.secondary, fontWeight: '900' },
  live: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: Colors.gray100 },
  liveOn: { backgroundColor: Colors.successLight },
  liveText: { color: Colors.muted, fontWeight: '900', fontSize: 11 },
  liveTextOn: { color: Colors.success },
  title: { fontSize: 24, fontWeight: '900', marginTop: 14 },
  status: { color: Colors.secondary, fontWeight: '900', marginTop: 4, marginBottom: 12 },
  stop: { ...card, marginTop: 10 },
  stopLabel: { color: Colors.primary, fontSize: 11, fontWeight: '900' },
  stopTitle: { fontWeight: '900', fontSize: 16, marginTop: 5 },
  stopBody: { color: Colors.muted, lineHeight: 19, marginTop: 4 },
  call: { color: Colors.secondary, fontWeight: '900', marginTop: 10 },
  itemsTitle: { fontSize: 16, fontWeight: '900', marginTop: 18, marginBottom: 8 },
  itemRow: { ...card, marginBottom: 8, paddingVertical: 12 },
  itemName: { fontWeight: '900' },
  itemMeta: { color: Colors.muted, fontSize: 12, marginTop: 3 },
  secondary: { borderWidth: 1, borderColor: Colors.secondary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 14 },
  secondaryText: { color: Colors.secondary, fontWeight: '900' },
  otpBox: { ...card, marginTop: 10 },
  otpLabel: { color: Colors.text, fontWeight: '900', fontSize: 13 },
  otpInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 13, marginTop: 9, color: Colors.text, fontSize: 18, fontWeight: '900', letterSpacing: 4, textAlign: 'center' },
  otpHelp: { color: Colors.muted, fontSize: 12, marginTop: 8, lineHeight: 17 },
  primary: { backgroundColor: Colors.primary, borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 10 },
  primaryText: { color: Colors.white, fontWeight: '900' },
  disabled: { opacity: 0.6 },
});
