import React, { useState } from 'react';
import { Alert } from 'react-native';
import { logIn, resetPassword, authErrorMessage } from './storage';
import AuthLayout, { TextLink } from './components/AuthLayout';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing info', 'Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await logIn(email, password);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      Alert.alert('Login failed', authErrorMessage(error));
      console.log(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'Type your email above, then tap "Forgot password?" again.');
      return;
    }
    try {
      await resetPassword(email);
      Alert.alert('Check your email', 'We sent a link to reset your password.');
    } catch (error) {
      Alert.alert("Couldn't send reset email", authErrorMessage(error));
      console.log(error);
    }
  };

  return (
    <AuthLayout
      title="Log In"
      subtitle="Welcome back."
      onBack={() => navigation.goBack()}
      fields={[
        {
          placeholder: 'Email',
          value: email,
          onChangeText: setEmail,
          autoCapitalize: 'none',
          keyboardType: 'email-address',
          textContentType: 'emailAddress',
        },
        {
          placeholder: 'Password',
          value: password,
          onChangeText: setPassword,
          secureTextEntry: true,
          textContentType: 'password',
        },
      ]}
      buttonLabel={submitting ? 'Logging in...' : 'Log In'}
      onSubmit={handleLogin}
      disabled={submitting}
    >
      <TextLink label="Forgot password?" onPress={handleForgotPassword} />
    </AuthLayout>
  );
}
