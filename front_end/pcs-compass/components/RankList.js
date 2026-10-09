import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../theme';

// Ranked list with up/down arrows on each row. Top = most important.
// items are already in ranked order; onReorder gets the new list of ids.
export default function RankList({ items, onReorder, dark }) {
  const theme = dark ? darkStyles : lightStyles;

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const ids = items.map((item) => item.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    onReorder(ids);
  };

  return (
    <View>
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;
        return (
          <View key={item.id} style={[styles.row, theme.row]}>
            <Text style={[styles.rank, theme.rank]}>{index + 1}</Text>
            <Text style={[styles.label, theme.label]}>{item.label}</Text>
            <TouchableOpacity
              style={[styles.arrow, theme.arrow, isFirst && styles.disabled]}
              onPress={() => move(index, -1)}
              disabled={isFirst}
              accessibilityLabel={`Move ${item.label} up`}
            >
              <Ionicons name="chevron-up" size={18} color={theme.icon.color} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.arrow, theme.arrow, isLast && styles.disabled]}
              onPress={() => move(index, 1)}
              disabled={isLast}
              accessibilityLabel={`Move ${item.label} down`}
            >
              <Ionicons name="chevron-down" size={18} color={theme.icon.color} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
    marginBottom: 8,
  },
  rank: {
    fontWeight: 'bold',
    fontSize: 17,
    width: 26,
  },
  label: {
    fontSize: 15,
    flex: 1,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  disabled: {
    opacity: 0.25,
  },
});

const lightStyles = StyleSheet.create({
  row: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  rank: { color: COLORS.primary },
  label: { color: COLORS.text },
  arrow: { backgroundColor: COLORS.borderLight },
  icon: { color: COLORS.primary },
});

const darkStyles = StyleSheet.create({
  row: { backgroundColor: COLORS.navyLight },
  rank: { color: COLORS.accent },
  label: { color: COLORS.white },
  arrow: { backgroundColor: COLORS.navy },
  icon: { color: COLORS.white },
});
