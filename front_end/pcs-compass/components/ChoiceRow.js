import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { COLORS } from '../theme';

// iOS-style segmented control for picking one option. options can be strings or { value, label }.
export default function ChoiceRow({ options, selected, onSelect }) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const value = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label;
        const isSelected = selected === value;
        return (
          <TouchableOpacity
            key={value}
            style={[styles.segment, isSelected && styles.segmentSelected]}
            onPress={() => onSelect(value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.text, isSelected && styles.textSelected]} numberOfLines={1}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: COLORS.fill,
    borderRadius: 9,
    padding: 2,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 7,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  text: {
    color: COLORS.label,
    fontSize: 14,
    fontWeight: '500',
  },
  textSelected: {
    fontWeight: '600',
  },
});
