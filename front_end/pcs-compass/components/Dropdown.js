import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { COLORS } from '../theme';

// Picker with a placeholder. options can be strings or { value, label }.
export default function Dropdown({ value, onChange, options, placeholder, dark }) {
  return (
    <View style={[styles.wrapper, dark ? styles.wrapperDark : styles.wrapperLight]}>
      <Picker
        selectedValue={value}
        style={dark ? { color: COLORS.white } : undefined}
        onValueChange={onChange}
      >
        <Picker.Item label={placeholder} value="" color={dark ? COLORS.textOnDark : COLORS.placeholder} />
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const label = typeof option === 'string' ? option : option.label;
          return (
            <Picker.Item
              key={optionValue}
              label={label}
              value={optionValue}
              color={dark ? COLORS.black : COLORS.text}
            />
          );
        })}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 10,
  },
  wrapperLight: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  wrapperDark: {
    backgroundColor: COLORS.navyLight,
    marginBottom: 10,
  },
});
