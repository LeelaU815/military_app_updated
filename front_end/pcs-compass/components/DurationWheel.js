import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { COLORS } from '../theme';

// Days / hours / minutes wheels for "how long before". value and onChange are in minutes.

const DAYS = Array.from({ length: 8 }, (_, i) => i);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

export default function DurationWheel({ value, onChange }) {
  const days = Math.floor(value / 1440);
  const hours = Math.floor((value % 1440) / 60);
  const minutes = value % 60 - (value % 5);
  // Never 0 minutes before, so there's always a heads-up.
  const set = (d, h, m) => onChange(Math.max(5, d * 1440 + h * 60 + m));

  const wheel = (selected, values, label, onPick) => (
    <View style={styles.column}>
      <Picker selectedValue={selected} style={styles.picker} itemStyle={styles.item} onValueChange={onPick}>
        {values.map((x) => <Picker.Item key={x} label={String(x)} value={x} color={COLORS.label} />)}
      </Picker>
      <Text style={styles.unit}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.row}>
      {wheel(days, DAYS, days === 1 ? 'day' : 'days', (v) => set(v, hours, minutes))}
      {wheel(hours, HOURS, hours === 1 ? 'hour' : 'hours', (v) => set(days, v, minutes))}
      {wheel(minutes, MINUTES, 'min', (v) => set(days, hours, v))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  picker: {
    alignSelf: 'stretch',
  },
  item: {
    fontSize: 20,
  },
  unit: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginBottom: 10,
  },
});
