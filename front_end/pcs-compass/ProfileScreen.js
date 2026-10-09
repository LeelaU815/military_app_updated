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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentUser, loadProfile, saveProfile, logOut } from './storage';
import { withHomeLocation } from './geocode';
import {
  GENDERS,
  INSURANCE_OPTIONS,
  EFMP_OPTIONS,
  DISABILITY_OPTIONS,
  INSTALLATION_OPTIONS,
  PRIORITY_LABELS,
  getPriorityItems,
  DOB_YEARS,
  FUTURE_YEARS,
  isOther,
  disabilityLabel,
  installationName,
  priorityIds,
  displayAge,
  ageFromDob,
  validateProfile,
} from './constants';

import WheelDatePicker from './components/WheelDatePicker';
import ChoiceRow from './components/ChoiceRow';
import ScaleSelector from './components/ScaleSelector';
import Dropdown from './components/Dropdown';
import RankList from './components/RankList';
import { COLORS } from './theme';

function formatDate(month, day, year) {
  if (!month || !day || !year) return 'Not set';
  return `${month}/${day}/${year}`;
}

export default function ProfileScreen({ navigation }) {
  const [uid, setUid] = useState(null);
  const [savedData, setSavedData] = useState(null);
  const [draftData, setDraftData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const refreshProfile = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }
      setUid(currentUser.uid);
      const profile = await loadProfile(currentUser.uid);
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

  const priorityItems = draftData ? getPriorityItems(draftData.residentialDecided, draftData.priorityOrder) : [];

  const handleEdit = () => {
    setDraftData(savedData);
    setEditMode(true);
  };

  const handleCancel = () => {
    setDraftData(savedData);
    setEditMode(false);
  };

  const handleSave = async () => {
    const error = validateProfile(draftData);
    if (error) {
      Alert.alert('Hold on', error);
      return;
    }
    const { draftStep, updatedAt, ...rest } = draftData;
    try {
      // Only looks the address up again if it changed.
      const { profile, found } = await withHomeLocation({
        ...rest,
        priorityOrder: priorityIds(draftData.residentialDecided, draftData.priorityOrder),
        status: 'complete',
      }, savedData);
      await saveProfile(uid, profile);
      setSavedData(profile);
      setEditMode(false);
      Alert.alert(found ? 'Saved' : 'Saved, but address not found', found ? 'Profile updated.' : "We couldn't find that address on the map, so distances will be measured from the base. You can fix the address in your profile.");
    } catch (error) {
      Alert.alert('Error', 'Something went wrong saving your profile.');
      console.log(error);
    }
  };

  const handleLogOut = () => {
    Alert.alert('Log out?', 'You can log back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await logOut();
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ]);
  };

  // Settings-style row: label on the left, value on the right.
  const Row = ({ label, value, last }) => (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || 'Not set'}</Text>
    </View>
  );

  const Section = ({ title, children }) => (
    <>
      <Text style={styles.sectionHeader}>{title}</Text>
      <View style={styles.group}>{children}</View>
    </>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.muted}>Loading...</Text>
      </View>
    );
  }

  if (!savedData) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>No profile found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={styles.navLink}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pcsDateText =
    savedData.pcsDateType === 'Date'
      ? formatDate(savedData.pcsMonth, savedData.pcsDay, savedData.pcsYear)
      : savedData.pcsDateType === 'Timeframe'
      ? `${formatDate(savedData.pcsStartMonth, savedData.pcsStartDay, savedData.pcsStartYear)} – ${formatDate(savedData.pcsEndMonth, savedData.pcsEndDay, savedData.pcsEndYear)}`
      : 'Not sure';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.navBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={editMode ? handleCancel : () => navigation.goBack()} hitSlop={10}>
          <Text style={styles.navLink}>{editMode ? 'Cancel' : 'Back'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={editMode ? handleSave : handleEdit} hitSlop={10}>
          <Text style={[styles.navLink, styles.navLinkBold]}>{editMode ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">
        <Text style={styles.largeTitle}>{editMode ? 'Edit Profile' : 'Profile'}</Text>
        {!editMode ? (
          <>
            <Section title="FAMILY MEMBER">
              <Row label="Family" value={savedData.familyLastName} />
              <Row label="Name" value={savedData.name} />
              <Row label="Age" value={displayAge(savedData)} />
              <Row label="Birthday" value={formatDate(savedData.dobMonth, savedData.dobDay, savedData.dobYear)} />
              <Row label="Gender" value={savedData.gender === 'Self-describe' ? savedData.genderOther : savedData.gender} />
              <Row label="Needs" value={disabilityLabel(savedData)} last />
            </Section>

            <Section title="COVERAGE & EFMP">
              <Row label="TRICARE" value={savedData.insurance} />
              <Row label="EFMP status" value={savedData.efmpStatus} last />
            </Section>

            <Section title="HOME">
              <Row
                label="Address"
                value={savedData.residentialDecided === 'Yes'
                  ? `${savedData.address}, ${savedData.city}, ${savedData.state} ${savedData.zip}`
                  : 'Not decided yet'}
                last
              />
            </Section>

            <Section title="WHAT MATTERS MOST">
              {priorityIds(savedData.residentialDecided, savedData.priorityOrder).map((id, i) => (
                <Row key={id} label={`${i + 1}`} value={PRIORITY_LABELS[id]} last={false} />
              ))}
              <Row label="IEP / 504" value={savedData.iepImportance ? `${savedData.iepImportance} of 5` : null} />
              <Row label="Respite care" value={savedData.respiteImportance ? `${savedData.respiteImportance} of 5` : null} last />
            </Section>

            <Section title="PCS">
              <Row label="Installation" value={installationName(savedData.installation)} />
              <Row label="Date" value={pcsDateText} />
              <Row label="Notifications" value={savedData.notifications} last />
            </Section>

            <View style={[styles.group, { marginTop: 32 }]}>
              <TouchableOpacity style={styles.logOutRow} onPress={handleLogOut}>
                <Text style={styles.logOutText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.fieldLabel}>Family last name</Text>
            <TextInput
              style={styles.input}
              value={draftData.familyLastName}
              onChangeText={(t) => update('familyLastName', t)}
              placeholderTextColor={COLORS.tertiaryLabel}
            />

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={draftData.name}
              onChangeText={(t) => update('name', t)}
              placeholderTextColor={COLORS.tertiaryLabel}
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
            {ageFromDob(draftData.dobMonth, draftData.dobDay, draftData.dobYear) !== null && (
              <Text style={[styles.helperText, { marginTop: 6 }]}>
                Age {ageFromDob(draftData.dobMonth, draftData.dobDay, draftData.dobYear)}
              </Text>
            )}

            <Text style={styles.fieldLabel}>Disability category</Text>
            <Dropdown
              value={draftData.disabilityType}
              onChange={(v) => update('disabilityType', v)}
              options={DISABILITY_OPTIONS}
              placeholder="Select category"
            />
            {isOther(draftData.disabilityType) && (
              <TextInput
                style={styles.input}
                placeholder="Please describe"
                value={draftData.disabilityOther}
                onChangeText={(t) => update('disabilityOther', t)}
                placeholderTextColor={COLORS.tertiaryLabel}
              />
            )}

            <Text style={styles.fieldLabel}>Gender</Text>
            <ChoiceRow options={GENDERS} selected={draftData.gender} onSelect={(v) => update('gender', v)} />
            {draftData.gender === 'Self-describe' && (
              <TextInput
                style={[styles.input, { marginTop: 4 }]}
                value={draftData.genderOther}
                onChangeText={(t) => update('genderOther', t)}
                placeholderTextColor={COLORS.tertiaryLabel}
              />
            )}

            <Text style={styles.fieldLabel}>Insurance</Text>
            <ChoiceRow options={INSURANCE_OPTIONS} selected={draftData.insurance} onSelect={(v) => update('insurance', v)} />

            <Text style={styles.fieldLabel}>EFMP status</Text>
            <ChoiceRow options={EFMP_OPTIONS} selected={draftData.efmpStatus} onSelect={(v) => update('efmpStatus', v)} />

            <Text style={styles.fieldLabel}>Residential area decided?</Text>
            <ChoiceRow options={['Yes', 'No']} selected={draftData.residentialDecided} onSelect={(v) => update('residentialDecided', v)} />
            {draftData.residentialDecided === 'Yes' && (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Street address"
                  placeholderTextColor={COLORS.tertiaryLabel}
                  value={draftData.address}
                  onChangeText={(t) => update('address', t)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor={COLORS.tertiaryLabel}
                  value={draftData.city}
                  onChangeText={(t) => update('city', t)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  placeholderTextColor={COLORS.tertiaryLabel}
                  value={draftData.state}
                  onChangeText={(t) => update('state', t)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Zip code"
                  placeholderTextColor={COLORS.tertiaryLabel}
                  value={draftData.zip}
                  onChangeText={(t) => update('zip', t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                />
              </View>
            )}

            <Text style={styles.fieldLabel}>Priority ranking</Text>
            <Text style={styles.helperText}>Use the arrows to move things up or down. Top = most important.</Text>
            <RankList
              items={priorityItems}
              onReorder={(order) => update('priorityOrder', order)}
            />

            <Text style={[styles.fieldLabel, { marginTop: 24 }]}>IEP / 504 importance (1–5)</Text>
            <ScaleSelector value={draftData.iepImportance} onSelect={(v) => update('iepImportance', v)} />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Respite support importance (1–5)</Text>
            <ScaleSelector value={draftData.respiteImportance} onSelect={(v) => update('respiteImportance', v)} />

            <Text style={styles.fieldLabel}>Notifications</Text>
            <ChoiceRow options={['Yes', 'No']} selected={draftData.notifications} onSelect={(v) => update('notifications', v)} />

            <Text style={styles.fieldLabel}>PCS date type</Text>
            <ChoiceRow options={['Date', 'Timeframe', 'Not sure']} selected={draftData.pcsDateType} onSelect={(v) => update('pcsDateType', v)} />
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
            <Dropdown
              value={draftData.installation}
              onChange={(v) => update('installation', v)}
              options={INSTALLATION_OPTIONS}
              placeholder="Select installation"
            />

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
    backgroundColor: COLORS.groupedBackground,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  muted: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.label,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  navLink: {
    fontSize: 17,
    color: COLORS.primary,
  },
  navLinkBold: {
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.label,
    marginTop: 4,
    marginBottom: 4,
  },
  sectionHeader: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 24,
    marginBottom: 6,
    marginLeft: 16,
  },
  group: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    paddingRight: 16,
    paddingVertical: 12,
    minHeight: 46,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.separator,
  },
  rowLabel: {
    fontSize: 17,
    color: COLORS.label,
    marginRight: 12,
  },
  rowValue: {
    flex: 1,
    fontSize: 17,
    color: COLORS.secondaryLabel,
    textAlign: 'right',
  },
  logOutRow: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  logOutText: {
    fontSize: 17,
    color: '#FF3B30',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.label,
    marginTop: 22,
    marginBottom: 8,
  },
  helperText: {
    color: COLORS.secondaryLabel,
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.white,
    color: COLORS.label,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '600',
  },
});
