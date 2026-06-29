# Superbucket Delivery App

Standalone Expo app for delivery partners only.

## Run locally

```bash
npm install
npm run start
```

Set `EXPO_PUBLIC_API_URL` in `.env` to the backend base URL, for example:

```bash
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:3030
```

Delivery partners can register in the app with name, phone, email, and password. Admin must approve the account before login works. Admin can also create approved delivery partner staff accounts directly using role `DELIVERY_PARTNER`.

## Backend flow

- Picker marks an order as `SHIPPED`.
- Delivery partner sees it in Ready deliveries.
- Delivery partner accepts the order.
- App shows pickup, drop, map, and Google Maps navigation.
- App syncs live location to the backend.
- Delivery partner marks the order delivered.
