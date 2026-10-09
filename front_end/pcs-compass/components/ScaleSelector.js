import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { COLORS } from '../theme';

// 1-5 rating circles.
export default function ScaleSelector({ value, onSelect }) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((num) => {
        const selected = value === num;
        return (
          <TouchableOpacity
            key={num}
            style={[styles.circle, selected && styles.circleSelected]}
            onPress={() => onSelect(num)}
            accessibilityLabel={`${num} out of 5`}
          >
            <Text style={[styles.text, selected && styles.textSelected]}>{num}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  circleSelected: {
    backgroundColor: COLORS.primary,
  },
  text: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  textSelected: {
    color: COLORS.white,
  },
});
