import React, { useState, useEffect } from 'react';
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
import { getCurrentUser, loadProfile, saveProfile } from './storage';
import { withHomeLocation } from './geocode';
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
  priorityIds,
  ageFromDob,
  validateStep,
  PROFILE_STEPS,
} from './constants';

import WheelDatePicker from './components/WheelDatePicker';
import ChoiceRow from './components/ChoiceRow';
import ScaleSelector from './components/ScaleSelector';
import Dropdown from './components/Dropdown';
import DraggableRankList from './components/DraggableRankList';
import { COLORS } from './theme';

const TOTAL_STEPS = PROFILE_STEPS;
const STEP_TITLES = [
  'Basic Info',
  'Care Needs',
  'Insurance & Location',
  'Priorities',
  'PCS & Installation',
];

const EMPTY_PROFILE = {
  familyLastName: '',
  name: '',
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
};

export default function ProfileCreationScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(EMPTY_PROFILE);
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Pick up where they left off if they saved a draft earlier.
  useEffect(() => {
    (async () => {
      try {
        const user = await getCurrentUser();
        if (!user) return;
        setUid(user.uid);
        const saved = await loadProfile(user.uid);
        if (saved && saved.status === 'draft') {
          setData({ ...EMPTY_PROFILE, ...saved });
          setStep(saved.draftStep || 1);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  const priorityItems = getPriorityItems(data.residentialDecided, data.priorityOrder);
  const age = ageFromDob(data.dobMonth, data.dobDay, data.dobYear);

  const saveDraft = (draftStep) =>
    saveProfile(uid, { ...data, status: 'draft', draftStep });

  const handleNext = () => {
    const error = validateStep(data, step);
    if (error) {
      Alert.alert('Hold on', error);
      return;
    }
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      // Quietly keep a draft so nothing is lost if the app closes.
      saveDraft(step + 1).catch((e) => console.log(e));
    } else {
      handleFinish();
    }
  };

  const handleSaveForLater = async () => {
    try {
      await saveDraft(step);
      Alert.alert('Saved', 'Your profile is saved. You can finish it from the Home tab.');
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      Alert.alert('Error', 'Something went wrong saving your profile.');
      console.log(error);
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
    setSaving(true);
    try {
      // Save the ranking even if they never dragged anything (the default order is still a ranking).
      const { draftStep, updatedAt, ...rest } = data;
      const { profile, found } = await withHomeLocation({
        ...rest,
        priorityOrder: priorityIds(data.residentialDecided, data.priorityOrder),
        status: 'complete',
      });
      await saveProfile(uid, profile);
      if (!found) Alert.alert('Address not found', "We couldn't find that address on the map, so distances will be measured from the base. You can fix the address in your profile.");
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (error) {
      Alert.alert('Error', 'Something went wrong saving your profile.');
      console.log(error);
    } finally {
      setSaving(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <Question number={1}>Family last name</Question>
            <TextInput
              style={styles.input}
              placeholder="e.g. Reynolds"
              placeholderTextColor={COLORS.placeholder}
              value={data.familyLastName}
              onChangeText={(t) => update('familyLastName', t)}
            />

            <Question number={2}>Family member name</Question>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mia Reynolds"
              placeholderTextColor={COLORS.placeholder}
              value={data.name}
              onChangeText={(t) => update('name', t)}
            />

            <Question number={3}>Date of birth</Question>
            <WheelDatePicker
              month={data.dobMonth}
              day={data.dobDay}
              year={data.dobYear}
              onChangeMonth={(v) => update('dobMonth', v)}
              onChangeDay={(v) => update('dobDay', v)}
              onChangeYear={(v) => update('dobYear', v)}
              yearRange={DOB_YEARS}
            />
            {age !== null && <Text style={[styles.helperText, { marginTop: 6 }]}>Age {age}</Text>}

            <Question number={4}>Gender</Question>
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
            <Question number={5}>Disability category</Question>
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

            <Question number={6}>EFMP status</Question>
            <ChoiceRow options={EFMP_OPTIONS} selected={data.efmpStatus} onSelect={(v) => update('efmpStatus', v)} />

            <Question number={7}>
              How important is it for your school to have IEP / 504 accommodations?
            </Question>
            <Text style={styles.helperText}>1 = irrelevant, 5 = necessary</Text>
            <ScaleSelector value={data.iepImportance} onSelect={(v) => update('iepImportance', v)} />

            <Question number={8} style={{ marginTop: 20 }}>
              How important is it to have respite caregiver and support?
            </Question>
            <Text style={styles.helperText}>1 = irrelevant, 5 = necessary</Text>
            <ScaleSelector value={data.respiteImportance} onSelect={(v) => update('respiteImportance', v)} />
          </>
        );
      case 3:
        return (
          <>
            <Question number={9}>What TRICARE plan do you have?</Question>
            <ChoiceRow options={INSURANCE_OPTIONS} selected={data.insurance} onSelect={(v) => update('insurance', v)} />

            <Question number={10}>Have you already decided on your residential area?</Question>
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
            <Question number={11}>When finding resources, rank your priorities</Question>
            <Text style={styles.helperText}>Press and drag to reorder, top = most important.</Text>
            <DraggableRankList
              key={data.residentialDecided}
              items={priorityItems}
              onReorder={(order) => update('priorityOrder', order)}
            />
          </>
        );
      case 5:
        return (
          <>
            <Question number={12}>
              Receive notifications for status updates and deadlines?
            </Question>
            <Text style={styles.helperText}>Highly recommended — changeable anytime in settings.</Text>
            <ChoiceRow options={['Yes', 'No']} selected={data.notifications} onSelect={(v) => update('notifications', v)} />

            <Question number={13}>When is your estimated PCS date?</Question>
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

            <Question number={14}>
              Which military installation will you (or your spouse) be employed at?
            </Question>
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.helperText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={[COLORS.gradientTop, COLORS.gradientBottom]} style={styles.header}>
        <View style={styles.badgeRow}>
          <Ionicons name="compass-outline" size={18} color={COLORS.gold} />
          <Text style={styles.badgeText}>PCS Compass</Text>
          <TouchableOpacity style={styles.saveLater} onPress={handleSaveForLater}>
            <Text style={styles.saveLaterText}>Save & finish later</Text>
          </TouchableOpacity>
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
        <TouchableOpacity style={styles.navButtonPrimary} onPress={handleNext} disabled={saving}>
          <Text style={styles.navButtonPrimaryText}>
            {step === TOTAL_STEPS ? (saving ? 'Saving...' : 'Finish') : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// Question label with its number, e.g. "5. Disability category".
function Question({ number, style, children }) {
  return (
    <Text style={[styles.fieldLabel, style]}>
      <Text style={styles.questionNumber}>{number}. </Text>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveLater: {
    marginLeft: 'auto',
  },
  saveLaterText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  questionNumber: {
    color: COLORS.primary,
    fontWeight: '700',
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