import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { getCurrentUser, loadProfile, saveProfile } from './storage';
import {
  GENDERS,
  INSURANCE_OPTIONS,
  EFMP_OPTIONS,
  INSTALLATIONS,
  PRIORITY_LABELS,
  getPriorityItems,
  DOB_YEARS,
  FUTURE_YEARS,
} from './constants';

import WheelDatePicker from './components/WheelDatePicker';
import DraggableRankList from './components/DraggableRankList';

function formatDate(month, day, year) {
  if (!month || !day || !year) return 'Not set';
  return `${month}/${day}/${year}`;
}

export default function ProfileScreen({ navigation }) {
  const [email, setEmail] = useState(null);
  const [savedData, setSavedData] = useState(null);
  const [draftData, setDraftData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }
      setEmail(currentUser.email);
      const profile = await loadProfile(currentUser.email);
      setSavedData(profile);
      setDraftData(profile);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      setEditMode(false);
    }, [])
  );

  const update = (field, value) => setDraftData((prev) => ({ ...prev, [field]: value }));

  const priorityItems = draftData ? getPriorityItems(draftData.residentialDecided) : [];

  const handleEdit = () => {
    setDraftData(savedData);
    setEditMode(true);
  };

  const handleCancel = () => {
    setDraftData(savedData);
    setEditMode(false);
  };

  const handleSave = async () => {
    try {
      await saveProfile(email, draftData);
      setSavedData(draftData);
      setEditMode(false);
      Alert.alert('Saved', 'Profile updated.');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong saving your profile.');
      console.log(error);
    }
  };

  const renderOptionRow = (options, selected, onSelect) => (
    <View style={styles.optionRow}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.optionButton, selected === option && styles.optionButtonSelected]}
          onPress={() => onSelect(option)}
        >
          <Text style={[styles.optionText, selected === option && styles.optionTextSelected]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderScale = (value, onSelect) => (
    <View style={styles.scaleRow}>
      {[1, 2, 3, 4, 5].map((num) => (
        <TouchableOpacity
          key={num}
          style={[styles.scaleCircle, value === num && styles.scaleCircleSelected]}
          onPress={() => onSelect(num)}
        >
          <Text style={[styles.scaleText, value === num && styles.scaleTextSelected]}>{num}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const Row = ({ label, value }) => (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || 'Not set'}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.subtitle}>Loading...</Text>
      </View>
    );
  }

  if (!savedData) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.title}>No profile found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pcsDateText =
    draftData.pcsDateType === 'Date'
      ? formatDate(draftData.pcsMonth, draftData.pcsDay, draftData.pcsYear)
      : draftData.pcsDateType === 'Timeframe'
      ? `${formatDate(draftData.pcsStartMonth, draftData.pcsStartDay, draftData.pcsStartYear)} – ${formatDate(draftData.pcsEndMonth, draftData.pcsEndDay, draftData.pcsEndYear)}`
      : 'Not sure';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {editMode ? (
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.backLink}>Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleEdit}>
            <Text style={styles.editLink}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {!editMode ? (
          <>
            <Row label="Family last name" value={savedData.familyLastName} />
            <Row label="Name" value={savedData.name} />
            <Row label="Age" value={savedData.age} />
            <Row label="Date of birth" value={formatDate(savedData.dobMonth, savedData.dobDay, savedData.dobYear)} />
            <Row
              label="Disability category"
              value={savedData.disabilityType === 'Other' ? savedData.disabilityOther : savedData.disabilityType}
            />
            <Row label="Gender" value={savedData.gender === 'Self-describe' ? savedData.genderOther : savedData.gender} />
            <Row label="Insurance" value={savedData.insurance} />
            <Row label="EFMP status" value={savedData.efmpStatus} />
            <Row
              label="Residential area decided"
              value={savedData.residentialDecided === 'Yes'
                ? `Yes — ${savedData.address}, ${savedData.city}, ${savedData.state} ${savedData.zip}`
                : 'No'}
            />
            <Row
              label="Priority ranking"
              value={(savedData.priorityOrder || []).map((id) => PRIORITY_LABELS[id]).join(', ')}
            />
            <Row label="IEP / 504 importance" value={savedData.iepImportance ? `${savedData.iepImportance} / 5` : null} />
            <Row label="Respite support importance" value={savedData.respiteImportance ? `${savedData.respiteImportance} / 5` : null} />
            <Row label="Notifications" value={savedData.notifications} />
            <Row label="Estimated PCS date" value={pcsDateText} />
            <Row label="Installation" value={savedData.installation} />
          </>
        ) : (
          <>
            <Text style={styles.fieldLabel}>Family last name</Text>
            <TextInput
              style={styles.input}
              value={draftData.familyLastName}
              onChangeText={(t) => update('familyLastName', t)}
              placeholderTextColor="#A9B7CC"
            />

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={draftData.name}
              onChangeText={(t) => update('name', t)}
              placeholderTextColor="#A9B7CC"
            />

            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={styles.input}
              value={draftData.age}
              onChangeText={(t) => update('age', t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholderTextColor="#A9B7CC"
            />

            <Text style={styles.fieldLabel}>Date of birth</Text>
            <WheelDatePicker
              month={draftData.dobMonth}
              day={draftData.dobDay}
              year={draftData.dobYear}
              onChangeMonth={(v) => update('dobMonth', v)}
              onChangeDay={(v) => update('dobDay', v)}
              onChangeYear={(v) => update('dobYear', v)}
              yearRange={DOB_YEARS}
            />

            <Text style={styles.fieldLabel}>Disability</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={draftData.disabilityType}
              onChangeText={(t) => update('disabilityType', t)}
              multiline
              placeholderTextColor="#A9B7CC"
            />

            <Text style={styles.fieldLabel}>Gender</Text>
            {renderOptionRow(GENDERS, draftData.gender, (v) => update('gender', v))}
            {draftData.gender === 'Self-describe' && (
              <TextInput
                style={[styles.input, { marginTop: 4 }]}
                value={draftData.genderOther}
                onChangeText={(t) => update('genderOther', t)}
                placeholderTextColor="#A9B7CC"
              />
            )}

            <Text style={styles.fieldLabel}>Insurance</Text>
            {renderOptionRow(INSURANCE_OPTIONS, draftData.insurance, (v) => update('insurance', v))}

            <Text style={styles.fieldLabel}>EFMP status</Text>
            {renderOptionRow(EFMP_OPTIONS, draftData.efmpStatus, (v) => update('efmpStatus', v))}

            <Text style={styles.fieldLabel}>Residential area decided?</Text>
            {renderOptionRow(['Yes', 'No'], draftData.residentialDecided, (v) => update('residentialDecided', v))}
            {draftData.residentialDecided === 'Yes' && (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Street address"
                  placeholderTextColor="#A9B7CC"
                  value={draftData.address}
                  onChangeText={(t) => update('address', t)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor="#A9B7CC"
                  value={draftData.city}
                  onChangeText={(t) => update('city', t)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  placeholderTextColor="#A9B7CC"
                  value={draftData.state}
                  onChangeText={(t) => update('state', t)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Zip code"
                  placeholderTextColor="#A9B7CC"
                  value={draftData.zip}
                  onChangeText={(t) => update('zip', t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                />
              </View>
            )}

            <Text style={styles.fieldLabel}>Priority ranking</Text>
            <Text style={styles.helperText}>Press and drag to reorder, top = most important.</Text>
            <DraggableRankList
              items={priorityItems}
              onReorder={(order) => update('priorityOrder', order)}
            />

            <Text style={[styles.fieldLabel, { marginTop: 24 }]}>IEP / 504 importance (1–5)</Text>
            {renderScale(draftData.iepImportance, (v) => update('iepImportance', v))}

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Respite support importance (1–5)</Text>
            {renderScale(draftData.respiteImportance, (v) => update('respiteImportance', v))}

            <Text style={styles.fieldLabel}>Notifications</Text>
            {renderOptionRow(['Yes', 'No'], draftData.notifications, (v) => update('notifications', v))}

            <Text style={styles.fieldLabel}>PCS date type</Text>
            {renderOptionRow(['Date', 'Timeframe', 'Not sure'], draftData.pcsDateType, (v) => update('pcsDateType', v))}
            {draftData.pcsDateType === 'Date' && (
              <WheelDatePicker
                month={draftData.pcsMonth}
                day={draftData.pcsDay}
                year={draftData.pcsYear}
                onChangeMonth={(v) => update('pcsMonth', v)}
                onChangeDay={(v) => update('pcsDay', v)}
                onChangeYear={(v) => update('pcsYear', v)}
                yearRange={FUTURE_YEARS}
              />
            )}
            {draftData.pcsDateType === 'Timeframe' && (
              <View>
                <Text style={styles.helperText}>Earliest</Text>
                <WheelDatePicker
                  month={draftData.pcsStartMonth}
                  day={draftData.pcsStartDay}
                  year={draftData.pcsStartYear}
                  onChangeMonth={(v) => update('pcsStartMonth', v)}
                  onChangeDay={(v) => update('pcsStartDay', v)}
                  onChangeYear={(v) => update('pcsStartYear', v)}
                  yearRange={FUTURE_YEARS}
                />
                <Text style={[styles.helperText, { marginTop: 12 }]}>Latest</Text>
                <WheelDatePicker
                  month={draftData.pcsEndMonth}
                  day={draftData.pcsEndDay}
                  year={draftData.pcsEndYear}
                  onChangeMonth={(v) => update('pcsEndMonth', v)}
                  onChangeDay={(v) => update('pcsEndDay', v)}
                  onChangeYear={(v) => update('pcsEndYear', v)}
                  yearRange={FUTURE_YEARS}
                />
              </View>
            )}

            <Text style={styles.fieldLabel}>Installation</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={draftData.installation}
                style={{ color: '#FFFFFF' }}
                onValueChange={(v) => update('installation', v)}
              >
                <Picker.Item label="Select installation" value="" color="#A9B7CC" />
                {INSTALLATIONS.map((inst) => (
                  <Picker.Item key={inst} label={inst} value={inst} color="#000000" />
                ))}
              </Picker>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1F3A',
  },
  emptyState: {
    flex: 1,
    backgroundColor: '#0B1F3A',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  backLink: {
    color: '#A9B7CC',
    fontSize: 15,
  },
  editLink: {
    color: '#4FA3FF',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#A9B7CC',
  },
  row: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#16305A',
    paddingBottom: 12,
  },
  rowLabel: {
    color: '#A9B7CC',
    fontSize: 13,
    marginBottom: 4,
  },
  rowValue: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  fieldLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  helperText: {
    color: '#A9B7CC',
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#16305A',
    color: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    borderWidth: 2,
    borderColor: '#16305A',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 10,
  },
  optionButtonSelected: {
    backgroundColor: '#4FA3FF',
    borderColor: '#4FA3FF',
  },
  optionText: {
    color: '#A9B7CC',
    fontSize: 15,
  },
  optionTextSelected: {
    color: '#0B1F3A',
    fontWeight: '600',
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#16305A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleCircleSelected: {
    backgroundColor: '#4FA3FF',
    borderColor: '#4FA3FF',
  },
  scaleText: {
    color: '#A9B7CC',
    fontSize: 16,
    fontWeight: '600',
  },
  scaleTextSelected: {
    color: '#0B1F3A',
  },
  pickerWrapper: {
    backgroundColor: '#16305A',
    borderRadius: 10,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#0B1F3A',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});