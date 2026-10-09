import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { COLORS } from '../theme';

// Hour / minute / AM-PM wheels, like the iOS time picker. value and onChange use 'HH:MM' (24-hour).

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export default function TimeWheel({ value, onChange }) {
  const [h, m] = (value || '09:00').split(':').map(Number);
  const hour = h % 12 || 12;
  const pm = h >= 12;
  const set = (newHour, newMinute, newPm) => {
    const h24 = (newHour % 12) + (newPm ? 12 : 0);
    onChange(`${String(h24).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`);
  };

  return (
    <View style={styles.row}>
      <Picker selectedValue={hour} style={styles.picker} itemStyle={styles.item} onValueChange={(v) => set(v, m, pm)}>
        {HOURS.map((x) => <Picker.Item key={x} label={String(x)} value={x} color={COLORS.label} />)}
      </Picker>
      <Picker selectedValue={m} style={styles.picker} itemStyle={styles.item} onValueChange={(v) => set(hour, v, pm)}>
        {MINUTES.map((x) => <Picker.Item key={x} label={String(x).padStart(2, '0')} value={x} color={COLORS.label} />)}
      </Picker>
      <Picker selectedValue={pm ? 'pm' : 'am'} style={styles.picker} itemStyle={styles.item} onValueChange={(v) => set(hour, m, v === 'pm')}>
        <Picker.Item label="AM" value="am" color={COLORS.label} />
        <Picker.Item label="PM" value="pm" color={COLORS.label} />
      </Picker>
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
  picker: {
    flex: 1,
  },
  item: {
    fontSize: 20,
  },
});
