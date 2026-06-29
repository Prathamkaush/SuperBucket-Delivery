import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';

export default function LogoBrand({ size = 'md', style }) {
  const sizes = { sm: 22, md: 29, lg: 38, xl: 50 };
  const fontSize = sizes[size] || sizes.md;
  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.base, { color: Colors.primary, fontSize }]}>SUPER</Text>
      <Text style={[styles.base, { color: Colors.secondary, fontSize }]}>BUKET</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', transform: [{ scaleX: 1.04 }] },
  base: { fontWeight: '900', includeFontPadding: false },
});
