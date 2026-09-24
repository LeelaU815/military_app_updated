import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, saveProfile } from './storage';
import {
  GENDERS,
  DISABILITY_OPTIONS,
  INSURANCE_OPTIONS,
  EFMP_OPTIONS,
  INSTALLATION_OPTIONS,
  getPriorityItems,
  DOB_YEARS,
  FUTURE_YEARS,
  isOther,
} from './constants';

import WheelDatePicker from './components/WheelDatePicker';
import ChoiceRow from './components/ChoiceRow';
import ScaleSelector from './components/ScaleSelector';
import Dropdown from './components/Dropdown';
import DraggableRankList from './components/DraggableRankList';
import { COLORS } from './theme';

const TOTAL_STEPS = 5;
const STEP_TITLES = [
  'Basic Info',
  'Care Needs',
  'Insurance & Location',
  'Priorities',
  'PCS & Installation',
];

export default function ProfileCreationScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    familyLastName: '',
    name: '',
    age: '',
    dobMonth: null, dobDay: null, dobYear: null,
    gender: '', genderOther: '',
    disabilityType: '', disabilityOther: '',
    efmpStatus: '',
    iepImportance: 0,
    respiteImportance: 0,
    insurance: '',
    residentialDecided: '',
    address: '', city: '', state: '', zip: '',
    priorityOrder: null,
    notifications: '',
    pcsDateType: '',
    pcsMonth: null, pcsDay: null, pcsYear: null,
    pcsStartMonth: null, pcsStartDay: null, pcsStartYear: null,
    pcsEndMonth: null, pcsEndDay: null, pcsEndYear: null,
    installation: '',
  });

  const update = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  const priorityItems = getPriorityItems(data.residentialDecided);

  const canGoNext = () => {
    switch (step) {
      case 1:
        return (
          data.familyLastName.trim().length > 0 &&
          data.name.trim().length > 0 &&
          data.age.trim().length > 0 &&
          !!(data.dobMonth && data.dobDay && data.dobYear) &&
          data.gender.length > 0 &&
          (data.gender !== 'Self-describe' || data.genderOther.trim().length > 0)
        );
      case 2:
        return (
          data.disabilityType.length > 0 &&
          (!isOther(data.disabilityType) || data.disabilityOther.trim().length > 0) &&
          data.efmpStatus.length > 0 &&
          data.iepImportance > 0 &&
          data.respiteImportance > 0
        );
      case 3:
        if (data.insurance.length === 0) return false;
        if (data.residentialDecided === 'Yes') {
          return data.address.trim().length > 0 && data.zip.trim().length > 0;
        }
        return data.residentialDecided.length > 0;
      case 4:
        return true;
      case 5:
        if (data.notifications.length === 0) return false;
        if (data.pcsDateType === 'Date') {
          if (!(data.pcsMonth && data.pcsDay && data.pcsYear)) return false;
        } else if (data.pcsDateType === 'Timeframe') {
          if (!(data.pcsStartMonth && data.pcsStartDay && data.pcsStartYear &&
                data.pcsEndMonth && data.pcsEndDay && data.pcsEndYear)) return false;
        } else if (data.pcsDateType !== 'Not sure') {
          return false;
        }
        return data.installation.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canGoNext()) {
      Alert.alert('Hold on', 'Please fill in this section before continuing.');
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleFinish = async () => {
    try {
      const currentUser = await getCurrentUser();
      const email = currentUser ? currentUser.email : 'unknown';

      await saveProfile(email, data);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      Alert.alert('Error', 'Something went wrong saving your profile.');
      console.log(error);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Text style={styles.fieldLabel}>Family last name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Reynolds"
              placeholderTextColor={COLORS.placeholder}
              value={data.familyLastName}
              onChangeText={(t) => update('familyLastName', t)}
            />

            <Text style={styles.fieldLabel}>Family member name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mia Reynolds"
              placeholderTextColor={COLORS.placeholder}
              value={data.name}
              onChangeText={(t) => update('name', t)}
            />

            <Text style={styles.fieldLabel}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="9"
              placeholderTextColor={COLORS.placeholder}
              value={data.age}
              onChangeText={(t) => update('age', t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>Date of birth</Text>
            <WheelDatePicker
              month={data.dobMonth}
              day={data.dobDay}
              year={data.dobYear}
              onChangeMonth={(v) => update('dobMonth', v)}
              onChangeDay={(v) => update('dobDay', v)}
              onChangeYear={(v) => update('dobYear', v)}
              yearRange={DOB_YEARS}
            />

            <Text style={styles.fieldLabel}>Gender</Text>
            <Dropdown
              value={data.gender}
              onChange={(v) => update('gender', v)}
              options={GENDERS}
              placeholder="Select gender"
            />
            {data.gender === 'Self-describe' && (
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Please describe"
                placeholderTextColor={COLORS.placeholder}
                value={data.genderOther}
                onChangeText={(t) => update('genderOther', t)}
              />
            )}
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.fieldLabel}>Disability category</Text>
            <Dropdown
              value={data.disabilityType}
              onChange={(v) => update('disabilityType', v)}
              options={DISABILITY_OPTIONS}
              placeholder="Select category"
            />
            {isOther(data.disabilityType) && (
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Please describe"
                placeholderTextColor={COLORS.placeholder}
                value={data.disabilityOther}
                onChangeText={(t) => update('disabilityOther', t)}
              />
            )}

            <Text style={styles.fieldLabel}>EFMP status</Text>
            <ChoiceRow options={EFMP_OPTIONS} selected={data.efmpStatus} onSelect={(v) => update('efmpStatus', v)} />

            <Text style={styles.fieldLabel}>
              How important is it for your school to have IEP / 504 accommodations?
            </Text>
            <Text style={styles.helperText}>1 = irrelevant, 5 = necessary</Text>
            <ScaleSelector value={data.iepImportance} onSelect={(v) => update('iepImportance', v)} />

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>
              How important is it to have respite caregiver and support?
            </Text>
            <Text style={styles.helperText}>1 = irrelevant, 5 = necessary</Text>
            <ScaleSelector value={data.respiteImportance} onSelect={(v) => update('respiteImportance', v)} />
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.fieldLabel}>What insurance do you have?</Text>
            <ChoiceRow options={INSURANCE_OPTIONS} selected={data.insurance} onSelect={(v) => update('insurance', v)} />

            <Text style={styles.fieldLabel}>Have you already decided on your residential area?</Text>
            <ChoiceRow options={['Yes', 'No']} selected={data.residentialDecided} onSelect={(v) => update('residentialDecided', v)} />

            {data.residentialDecided === 'Yes' && (
              <View style={{ marginTop: 8 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Street address"
                  placeholderTextColor={COLORS.placeholder}
                  value={data.address}
                  onChangeText={(t) => update('address', t)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor={COLORS.placeholder}
                  value={data.city}
                  onChangeText={(t) => update('city', t)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  placeholderTextColor={COLORS.placeholder}
                  value={data.state}
                  onChangeText={(t) => update('state', t)}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Zip code"
                  placeholderTextColor={COLORS.placeholder}
                  value={data.zip}
                  onChangeText={(t) => update('zip', t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                />
              </View>
            )}
            {data.residentialDecided === 'No' && (
              <Text style={styles.helperText}>
                No problem — we can talk through school zones and ratings later.
              </Text>
            )}
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.fieldLabel}>When finding resources, rank your priorities</Text>
            <Text style={styles.helperText}>Press and drag to reorder, top = most important.</Text>
            <DraggableRankList
              items={priorityItems}
              onReorder={(order) => update('priorityOrder', order)}
            />
          </>
        );
      case 5:
        return (
          <>
            <Text style={styles.fieldLabel}>
              Receive notifications for status updates and deadlines?
            </Text>
            <Text style={styles.helperText}>Highly recommended — changeable anytime in settings.</Text>
            <ChoiceRow options={['Yes', 'No']} selected={data.notifications} onSelect={(v) => update('notifications', v)} />

            <Text style={styles.fieldLabel}>When is your estimated PCS date?</Text>
            <ChoiceRow options={['Date', 'Timeframe', 'Not sure']} selected={data.pcsDateType} onSelect={(v) => update('pcsDateType', v)} />

            {data.pcsDateType === 'Date' && (
              <View style={{ marginTop: 8 }}>
                <WheelDatePicker
                  month={data.pcsMonth}
                  day={data.pcsDay}
                  year={data.pcsYear}
                  onChangeMonth={(v) => update('pcsMonth', v)}
                  onChangeDay={(v) => update('pcsDay', v)}
                  onChangeYear={(v) => update('pcsYear', v)}
                  yearRange={FUTURE_YEARS}
                />
              </View>
            )}
            {data.pcsDateType === 'Timeframe' && (
              <View style={{ marginTop: 8 }}>
                <Text style={styles.helperText}>Earliest</Text>
                <WheelDatePicker
                  month={data.pcsStartMonth}
                  day={data.pcsStartDay}
                  year={data.pcsStartYear}
                  onChangeMonth={(v) => update('pcsStartMonth', v)}
                  onChangeDay={(v) => update('pcsStartDay', v)}
                  onChangeYear={(v) => update('pcsStartYear', v)}
                  yearRange={FUTURE_YEARS}
                />
                <Text style={[styles.helperText, { marginTop: 12 }]}>Latest</Text>
                <WheelDatePicker
                  month={data.pcsEndMonth}
                  day={data.pcsEndDay}
                  year={data.pcsEndYear}
                  onChangeMonth={(v) => update('pcsEndMonth', v)}
                  onChangeDay={(v) => update('pcsEndDay', v)}
                  onChangeYear={(v) => update('pcsEndYear', v)}
                  yearRange={FUTURE_YEARS}
                />
              </View>
            )}

            <Text style={styles.fieldLabel}>
              Which military installation will you (or your spouse) be employed at?
            </Text>
            <Dropdown
              value={data.installation}
              onChange={(v) => update('installation', v)}
              options={INSTALLATION_OPTIONS}
              placeholder="Select installation"
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={[COLORS.gradientTop, COLORS.gradientBottom]} style={styles.header}>
        <View style={styles.badgeRow}>
          <Ionicons name="compass-outline" size={18} color={COLORS.gold} />
          <Text style={styles.badgeText}>PCS Compass</Text>
        </View>
        <Text style={styles.headerTitle}>Let's build your family profile</Text>
        <Text style={styles.headerSubtitle}>
          Step {step} of {TOTAL_STEPS} · {STEP_TITLES[step - 1]}
        </Text>
        <View style={styles.progressTrack}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressSegment, i < step && styles.progressSegmentFilled]}
            />
          ))}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {renderStepContent()}
      </ScrollView>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navButtonSecondary} onPress={handleBack}>
          <Text style={styles.navButtonSecondaryText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButtonPrimary} onPress={handleNext}>
          <Text style={styles.navButtonPrimaryText}>
            {step === TOTAL_STEPS ? 'Finish' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeText: {
    color: COLORS.gold,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.mist,
    marginBottom: 14,
  },
  progressTrack: {
    flexDirection: 'row',
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginRight: 6,
  },
  progressSegmentFilled: {
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.white,
  },
  navButtonSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  navButtonSecondaryText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  navButtonPrimary: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
  },
  navButtonPrimaryText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
});