import React from 'react';
import { TouchableOpacity, ActionSheetIOS, Alert, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { logOut } from '../storage';
import { COLORS } from '../theme';

// Person icon in the top-right corner. Opens an iOS-style action sheet: Profile / Log out.
export default function AccountButton({ navigation, color = COLORS.white, showProfile = true }) {
  const confirmLogOut = () => {
    Alert.alert('Log out?', 'You can log back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logOut();
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ]);
  };

  const openMenu = () => {
    const options = showProfile ? ['Profile', 'Log out', 'Cancel'] : ['Log out', 'Cancel'];
    const handle = (choice) => {
      if (choice === 'Profile') navigation.navigate('Profile');
      if (choice === 'Log out') confirmLogOut();
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, destructiveButtonIndex: options.indexOf('Log out') },
        (index) => handle(options[index])
      );
    } else {
      Alert.alert('Account', null, options.map((text) => ({
        text,
        style: text === 'Cancel' ? 'cancel' : text === 'Log out' ? 'destructive' : 'default',
        onPress: () => handle(text),
      })));
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={openMenu} hitSlop={10} accessibilityLabel="Account">
      <Ionicons name="person-circle-outline" size={30} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 2,
  },
});
