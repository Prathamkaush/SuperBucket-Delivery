import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DeliveryApp from './DeliveryApp';

export default function App() {
  return (
    <SafeAreaProvider>
      <DeliveryApp />
    </SafeAreaProvider>
  );
}
