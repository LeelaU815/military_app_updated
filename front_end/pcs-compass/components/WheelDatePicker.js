import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { MONTH_NAMES } from '../constants';
import { COLORS } from '../theme';

function daysInMonth(month, year) {
  if (!month) return 31;
  return new Date(year || 2024, month, 0).getDate();
}

export default function WheelDatePicker({
  month,
  day,
  year,
  onChangeMonth,
  onChangeDay,
  onChangeYear,
  yearRange,
}) {
  const days = Array.from({ length: daysInMonth(month, year) }, (_, i) => i + 1);

  return (
    <View style={styles.row}>
      <Picker
        selectedValue={month}
        style={styles.picker}
        itemStyle={styles.pickerItem}
        onValueChange={onChangeMonth}
      >
        <Picker.Item label="Month" value={null} color={COLORS.textOnDark} />
        {MONTH_NAMES.map((m, i) => (
          <Picker.Item key={m} label={m} value={i + 1} color={COLORS.black} />
        ))}
      </Picker>

      <Picker
        selectedValue={day}
        style={styles.picker}
        itemStyle={styles.pickerItem}
        onValueChange={onChangeDay}
      >
        <Picker.Item label="Day" value={null} color={COLORS.textOnDark} />
        {days.map((d) => (
          <Picker.Item key={d} label={String(d)} value={d} color={COLORS.black} />
        ))}
      </Picker>

      <Picker
        selectedValue={year}
        style={styles.picker}
        itemStyle={styles.pickerItem}
        onValueChange={onChangeYear}
      >
        <Picker.Item label="Year" value={null} color={COLORS.textOnDark} />
        {yearRange.map((y) => (
          <Picker.Item key={y} label={String(y)} value={y} color={COLORS.black} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.navyLight,
    borderRadius: 10,
  },
  picker: {
    flex: 1,
    color: COLORS.white,
  },
  pickerItem: {
    color: COLORS.white,
    fontSize: 16,
  },
});