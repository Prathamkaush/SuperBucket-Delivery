import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { apiRequest } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(authToken, app = 'delivery') {
  if (Platform.OS === 'web') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Superbucket Delivery',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E30613',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== 'granted') return null;

  const deviceToken = await Notifications.getDevicePushTokenAsync();
  const token = deviceToken?.data;
  if (!token) return null;

  return apiRequest('/notifications/devices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      token,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      app,
    }),
  });
}
