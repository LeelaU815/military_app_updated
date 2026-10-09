import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { COLORS } from '../theme';

// Picker with a placeholder. options can be strings or { value, label }.
export default function Dropdown({ value, onChange, options, placeholder }) {
  return (
    <View style={styles.wrapper}>
      <Picker selectedValue={value} onValueChange={onChange}>
        <Picker.Item label={placeholder} value="" color={COLORS.tertiaryLabel} />
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const label = typeof option === 'string' ? option : option.label;
          return <Picker.Item key={optionValue} label={label} value={optionValue} color={COLORS.label} />;
        })}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
});
