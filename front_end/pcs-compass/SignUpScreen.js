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
import { loadUsers, saveUsers, setCurrentUser } from './storage';
import { COLORS } from './theme';

export default function SignUpScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    // Basic validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }

    try {
      // Pull existing users list (or start with an empty array)
      const existingUsers = await loadUsers();

      // Check if email already used
      const emailTaken = existingUsers.some(
        (user) => user.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (emailTaken) {
        Alert.alert('Account exists', 'An account with this email already exists.');
        return;
      }

      // Add new user to the list
      const newUser = { name: name.trim(), email: email.trim(), password };
      const updatedUsers = [...existingUsers, newUser];
      await saveUsers(updatedUsers);

      // Track who's currently logged in
      await setCurrentUser(newUser);

      navigation.navigate('MainTabs');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong saving your account.');
      console.log(error);
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
        placeholder="Password"
        placeholderTextColor={COLORS.textOnDark}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
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