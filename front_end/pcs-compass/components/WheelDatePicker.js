import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

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
        <Picker.Item label="Month" value={null} color="#A9B7CC" />
        {MONTHS.map((m, i) => (
          <Picker.Item key={m} label={m} value={i + 1} color="#000000" />
        ))}
      </Picker>

      <Picker
        selectedValue={day}
        style={styles.picker}
        itemStyle={styles.pickerItem}
        onValueChange={onChangeDay}
      >
        <Picker.Item label="Day" value={null} color="#A9B7CC" />
        {days.map((d) => (
          <Picker.Item key={d} label={String(d)} value={d} color="#000000" />
        ))}
      </Picker>

      <Picker
        selectedValue={year}
        style={styles.picker}
        itemStyle={styles.pickerItem}
        onValueChange={onChangeYear}
      >
        <Picker.Item label="Year" value={null} color="#A9B7CC" />
        {yearRange.map((y) => (
          <Picker.Item key={y} label={String(y)} value={y} color="#000000" />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#16305A',
    borderRadius: 10,
  },
  picker: {
    flex: 1,
    color: '#FFFFFF',
  },
  pickerItem: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});