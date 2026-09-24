import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { COLORS } from '../theme';

// Row of tappable options. Light = segmented bar (profile wizard), dark = wrapping buttons (profile screen).
// options can be strings or { value, label }.
export default function ChoiceRow({ options, selected, onSelect, dark }) {
  const styles = dark ? darkStyles : lightStyles;
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label;
        const isSelected = selected === value;
        return (
          <TouchableOpacity
            key={value}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onSelect(value)}
          >
            <Text style={[styles.text, isSelected && styles.textSelected]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const lightStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: COLORS.borderLight,
    borderRadius: 10,
    padding: 4,
    marginBottom: 8,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: COLORS.primary,
  },
  text: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  textSelected: {
    color: COLORS.white,
  },
});

const darkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    borderWidth: 2,
    borderColor: COLORS.navyLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  text: {
    color: COLORS.textOnDark,
    fontSize: 15,
  },
  textSelected: {
    color: COLORS.navy,
    fontWeight: '600',
  },
});
