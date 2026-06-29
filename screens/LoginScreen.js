import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LogoBrand from '../components/LogoBrand';
import { loginDeliveryPartner } from '../services/auth';
import { Colors } from '../theme';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    try {
      setLoading(true);
      await loginDeliveryPartner(email.trim().toLowerCase(), password);
      navigation.replace('DeliveryTabs');
    } catch (error) {
      Alert.alert('Login failed', error?.message || 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <LogoBrand size="lg" />
          <Text style={styles.subtitle}>Fast local delivery</Text>
          <View style={styles.partnerPill}><Text style={styles.partnerText}>DELIVERY PARTNER</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Delivery login</Text>
          <Text style={styles.hint}>Use your approved delivery partner email and password.</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.muted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={[styles.button, (!email || !password || loading) && styles.disabled]}
            disabled={!email || !password || loading}
            onPress={login}
          >
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Go online</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            disabled={loading}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.secondaryText}>Register as delivery partner</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 70, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 34 },
  subtitle: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 6 },
  partnerPill: { backgroundColor: Colors.secondaryLight, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10 },
  partnerText: { color: Colors.secondary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 22, borderWidth: 1, borderColor: Colors.border },
  title: { color: Colors.text, fontSize: 21, fontWeight: '900', marginBottom: 6 },
  hint: { color: Colors.textSecondary, fontSize: 13, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 14, marginBottom: 12, color: Colors.text, fontWeight: '700' },
  button: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  disabled: { backgroundColor: Colors.gray300 },
  buttonText: { color: Colors.white, fontWeight: '900', fontSize: 15 },
  secondaryButton: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  secondaryText: { color: Colors.primary, fontWeight: '900', fontSize: 13 },
});
