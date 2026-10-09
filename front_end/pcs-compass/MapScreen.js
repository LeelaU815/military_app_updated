import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { getCurrentUser, loadProfile } from './storage';
import { findBase } from './constants';
import { scorePlaces, criteriaWeights, PLACE_TYPES } from './scoring';
import SegmentedControl from './components/SegmentedControl';
import { COLORS, TYPE_COLORS } from './theme';

const TABS = ['All', ...PLACE_TYPES];

export default function MapScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wide = width >= 768; // iPad: list on the left, map on the right (like Apple Maps)

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('All');
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const mapRef = useRef(null);
  const listRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const user = await getCurrentUser();
          setProfile(user ? await loadProfile(user.uid) : null);
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  const ready = profile && profile.status === 'complete';
  const base = ready ? findBase(profile.installation) : null;
  const firstName = ready ? (profile.name || '').trim().split(' ')[0] || 'your child' : '';
  const home = ready && profile.homeLat != null ? { latitude: profile.homeLat, longitude: profile.homeLng } : null;

  const results = useMemo(() => (ready ? scorePlaces(profile, { showAll }) : []), [profile, showAll]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return results.filter((r) =>
      (tab === 'All' || r.type === tab) &&
      (!q || r.place.name.toLowerCase().includes(q) || (r.place.address || '').toLowerCase().includes(q))
    );
  }, [results, tab, query]);

  // Zoom the map to whatever is showing.
  useEffect(() => {
    if (!mapRef.current || !base) return;
    const coords = visible.map((r) => ({ latitude: r.place.lat, longitude: r.place.lng }));
    coords.push({ latitude: base.lat, longitude: base.lng });
    if (home) coords.push(home);
    const pad = wide ? 80 : 40;
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: pad, right: pad, bottom: pad, left: pad },
      animated: true,
    });
  }, [visible.length, tab, showAll, base && base.id]);

  const selectFromList = (result) => {
    setSelectedId(result.place.id);
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: result.place.lat,
        longitude: result.place.lng,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      }, 400);
    }
  };

  const selectFromMap = (result) => {
    setSelectedId(result.place.id);
    const index = visible.findIndex((r) => r.place.id === result.place.id);
    if (index >= 0 && listRef.current) {
      listRef.current.scrollToIndex({ index, animated: true, viewPosition: 0 });
    }
  };

  const openDetails = (result) => {
    const weights = criteriaWeights(profile);
    if (!home) delete weights.distance;
    const sameType = results.filter((r) => r.type === result.type).length;
    navigation.navigate('PlaceDetails', { result, weights, firstName, sameType });
  };

  if (loading) {
    return <View style={[styles.screen, styles.center]}><Text style={styles.muted}>Loading...</Text></View>;
  }

  if (!ready) {
    return (
      <View style={[styles.screen, styles.center, { paddingHorizontal: 32 }]}>
        <Ionicons name="map-outline" size={44} color={COLORS.tertiaryLabel} />
        <Text style={styles.emptyTitle}>Finish your profile first</Text>
        <Text style={styles.emptyText}>We rank places using your family's needs and priorities.</Text>
        <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate('ProfileCreation')}>
          <Text style={styles.emptyButtonText}>{profile ? 'Finish Profile' : 'Create Profile'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!base || !base.complete) {
    return (
      <View style={[styles.screen, styles.center, { paddingHorizontal: 32 }]}>
        <Ionicons name="construct-outline" size={44} color={COLORS.tertiaryLabel} />
        <Text style={styles.emptyTitle}>Coming soon for your base</Text>
        <Text style={styles.emptyText}>
          Right now we have schools and providers for Naval Station Norfolk. More bases are on the way.
        </Text>
      </View>
    );
  }

  const header = (
    <View style={styles.header}>
      <Text style={styles.largeTitle}>Discover</Text>
      <Text style={styles.subtitle}>Ranked for {firstName} near {base.name}</Text>

      <View style={styles.search}>
        <Ionicons name="search" size={16} color={COLORS.secondaryLabel} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search schools, providers, clinics"
          placeholderTextColor={COLORS.secondaryLabel}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={{ paddingRight: 16 }}>
        {TABS.map((t) => {
          const active = t === tab;
          return (
            <TouchableOpacity key={t} style={[styles.chip, active && styles.chipActive]} onPress={() => setTab(t)}>
              {t !== 'All' && <View style={[styles.dot, { backgroundColor: TYPE_COLORS[t] }]} />}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <SegmentedControl
        options={[{ value: false, label: `For ${firstName}` }, { value: true, label: 'Show all' }]}
        selected={showAll}
        onSelect={setShowAll}
      />
      <Text style={styles.resultCount}>
        {visible.length} {visible.length === 1 ? 'place' : 'places'}
        {!showAll ? ` that fit ${firstName}'s grade and needs` : ''}
      </Text>
    </View>
  );

  const map = (
    <MapView
      ref={mapRef}
      style={wide ? styles.mapWide : styles.map}
      initialRegion={{ latitude: base.lat, longitude: base.lng, latitudeDelta: 0.4, longitudeDelta: 0.4 }}
      showsPointsOfInterest={false}
    >
      <Marker
        coordinate={{ latitude: base.lat, longitude: base.lng }}
        title={base.name}
        pinColor={COLORS.primary}
      >
        <View style={[styles.specialPin, { backgroundColor: COLORS.primary }]}>
          <Ionicons name="star" size={14} color={COLORS.white} />
        </View>
      </Marker>
      {home && (
        <Marker coordinate={home} title="Home">
          <View style={[styles.specialPin, { backgroundColor: COLORS.label }]}>
            <Ionicons name="home" size={13} color={COLORS.white} />
          </View>
        </Marker>
      )}
      {visible.map((r) => (
        <Marker
          key={r.place.id}
          coordinate={{ latitude: r.place.lat, longitude: r.place.lng }}
          title={r.place.name}
          description={`${r.score}% match`}
          pinColor={TYPE_COLORS[r.type]}
          onPress={() => selectFromMap(r)}
          zIndex={r.place.id === selectedId ? 10 : 1}
        />
      ))}
    </MapView>
  );

  const renderCard = ({ item: r }) => {
    const selected = r.place.id === selectedId;
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.card, selected && styles.cardSelected]}
        onPress={() => selectFromList(r)}
      >
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardType, { color: TYPE_COLORS[r.type] }]}>
              #{r.rank} · {r.type.toUpperCase()}
            </Text>
            <Text style={styles.cardName}>{r.place.name}</Text>
            {!!r.place.address && <Text style={styles.cardAddress}>{r.place.address}</Text>}
          </View>
          <View style={styles.score}>
            <Text style={styles.scoreNumber}>{r.score}%</Text>
            <Text style={styles.scoreLabel}>match</Text>
          </View>
        </View>
        <Text style={styles.reasons}>{r.reasons.join('  ·  ')}</Text>
        {r.forChild === false && (
          <Text style={styles.notForChild}>
            {r.servesChild === false ? `Doesn't list ${firstName}'s needs` : `Not ${firstName}'s grade`}
          </Text>
        )}
        <TouchableOpacity style={styles.detailsButton} onPress={() => openDetails(r)}>
          <Text style={styles.detailsText}>Details</Text>
          <Ionicons name="chevron-forward" size={15} color={COLORS.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const list = (
    <FlatList
      ref={listRef}
      data={visible}
      keyExtractor={(r) => r.place.id}
      renderItem={renderCard}
      ListHeaderComponent={wide ? header : <>{header}{map}</>}
      ListEmptyComponent={<Text style={[styles.muted, { textAlign: 'center', marginTop: 24 }]}>No places match.</Text>}
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      onScrollToIndexFailed={() => {}}
    />
  );

  if (wide) {
    return (
      <View style={[styles.screen, styles.row, { paddingTop: insets.top }]}>
        <View style={styles.sidebar}>{list}</View>
        <View style={styles.mapPane}>{map}</View>
      </View>
    );
  }

  // Phone: the header and map scroll away with the list so the cards get the whole screen.
  return <View style={[styles.screen, { paddingTop: insets.top }]}>{list}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.groupedBackground,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  sidebar: {
    width: 400,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: COLORS.separator,
  },
  mapPane: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: COLORS.label,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    marginTop: 2,
    marginBottom: 12,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.fill,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 16,
    color: COLORS.label,
  },
  tabs: {
    marginTop: 12,
    marginBottom: 12,
    marginRight: -16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.separator,
  },
  chipActive: {
    backgroundColor: COLORS.label,
    borderColor: COLORS.label,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.label,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  resultCount: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 10,
  },
  map: {
    height: 220,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapWide: {
    flex: 1,
  },
  specialPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: COLORS.primary,
  },
  cardTop: {
    flexDirection: 'row',
  },
  cardType: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.label,
  },
  cardAddress: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 2,
  },
  score: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scoreLabel: {
    fontSize: 11,
    color: COLORS.secondaryLabel,
    marginTop: -2,
  },
  reasons: {
    fontSize: 13,
    color: COLORS.secondaryLabel,
    marginTop: 10,
    lineHeight: 18,
  },
  notForChild: {
    fontSize: 13,
    color: COLORS.goldDark,
    marginTop: 6,
    fontWeight: '500',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  detailsText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 2,
  },
  muted: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.label,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.secondaryLabel,
    textAlign: 'center',
    marginTop: 6,
  },
  emptyButton: {
    marginTop: 18,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
