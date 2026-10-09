import React, { useState } from 'react';
import { Alert } from 'react-native';
import { signUp, authErrorMessage } from './storage';
import AuthLayout, { TextLink } from './components/AuthLayout';

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
    <AuthLayout
      title="Create Account"
      subtitle="Plan your family's PCS in one place."
      onBack={() => navigation.goBack()}
      fields={[
        { placeholder: 'Your name', value: name, onChangeText: setName, textContentType: 'name' },
        {
          placeholder: 'Email',
          value: email,
          onChangeText: setEmail,
          autoCapitalize: 'none',
          keyboardType: 'email-address',
          textContentType: 'emailAddress',
        },
        {
          placeholder: 'Password (at least 6 characters)',
          value: password,
          onChangeText: setPassword,
          secureTextEntry: true,
          textContentType: 'newPassword',
        },
      ]}
      buttonLabel={submitting ? 'Creating account...' : 'Sign Up'}
      onSubmit={handleSignUp}
      disabled={submitting}
    >
      <TextLink label="Already have an account? Log In" onPress={() => navigation.replace('Login')} />
    </AuthLayout>
  );
}
