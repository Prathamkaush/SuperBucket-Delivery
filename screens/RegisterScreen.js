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
import { registerDeliveryPartner } from '../services/auth';
import { Colors } from '../theme';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    try {
      setLoading(true);
      await registerDeliveryPartner({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      });
      Alert.alert(
        'Registration submitted',
        'Admin approval is required before you can log in.',
        [{ text: 'OK', onPress: () => navigation.replace('Login') }],
      );
    } catch (error) {
      Alert.alert('Registration failed', error?.message || 'Please check your details');
    } finally {
      setLoading(false);
    }
  };

  const disabled = !form.name || !form.email || !form.phone || form.password.length < 6 || loading;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <LogoBrand size="lg" />
          <Text style={styles.subtitle}>Join the delivery team</Text>
          <View style={styles.partnerPill}><Text style={styles.partnerText}>APPROVAL REQUIRED</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Delivery registration</Text>
          <Text style={styles.hint}>Create your login details. Admin will verify the account before access opens.</Text>

          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={Colors.muted}
            value={form.name}
            onChangeText={(value) => setField('name', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.email}
            onChangeText={(value) => setField('email', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Mobile number"
            placeholderTextColor={Colors.muted}
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(value) => setField('phone', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.muted}
            secureTextEntry
            value={form.password}
            onChangeText={(value) => setField('password', value)}
          />

          <TouchableOpacity
            style={[styles.button, disabled && styles.disabled]}
            disabled={disabled}
            onPress={submit}
          >
            {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Submit for approval</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            disabled={loading}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 54, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 26 },
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
