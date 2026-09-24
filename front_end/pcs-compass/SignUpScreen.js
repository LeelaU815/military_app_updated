import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { signUp, authErrorMessage } from './storage';
import { COLORS } from './theme';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignUp = async () => {
    // Basic validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password too short', 'Passwords need at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await signUp(name, email, password);
      // New accounts go straight into building their profile.
      navigation.reset({ index: 1, routes: [{ name: 'MainTabs' }, { name: 'ProfileCreation' }] });
    } catch (error) {
      Alert.alert("Couldn't create account", authErrorMessage(error));
      console.log(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor={COLORS.textOnDark}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={COLORS.textOnDark}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password (at least 6 characters)"
        placeholderTextColor={COLORS.textOnDark}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? 'Creating account...' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.navyLight,
    color: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: '600',
  },
  backText: {
    color: COLORS.textOnDark,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});