import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { COLORS } from '../theme';

// 1-5 rating circles.
export default function ScaleSelector({ value, onSelect, dark }) {
  const theme = dark ? darkStyles : lightStyles;
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((num) => (
        <TouchableOpacity
          key={num}
          style={[styles.circle, theme.circle, value === num && theme.circleSelected]}
          onPress={() => onSelect(num)}
        >
          <Text style={[styles.text, theme.text, value === num && theme.textSelected]}>{num}</Text>
        </TouchableOpacity>
      ))}
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
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

const lightStyles = StyleSheet.create({
  circle: { borderColor: COLORS.border, backgroundColor: COLORS.white },
  circleSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  text: { color: COLORS.textMuted },
  textSelected: { color: COLORS.white },
});

const darkStyles = StyleSheet.create({
  circle: { borderColor: COLORS.navyLight },
  circleSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  text: { color: COLORS.textOnDark },
  textSelected: { color: COLORS.navy },
});
