import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStations } from './src/hooks/useStations';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Fuel, List, Map as MapIcon, Moon, Search, Sun, SunMoon, Zap } from 'lucide-react-native';
import { Station } from '@voltgas/types';

const queryClient = new QueryClient();

const DEFAULT_LAT = 50.0755;
const DEFAULT_LNG = 14.4378;

type UserLocation = { lat: number; lng: number };

// ─── Theme ────────────────────────────────────────────────────────────────────

type ThemePref = 'dark' | 'light' | 'system';
const THEME_CYCLE: ThemePref[] = ['system', 'light', 'dark'];

type Colors = {
  bg: string; contentBg: string; card: string; toggleBg: string;
  border: string; muted: string; text: string; subtext: string;
  blue: string; blueBg: string; green: string; greenBg: string;
};

const darkColors: Colors = {
  bg: '#0f172a',
  contentBg: '#020617',
  card: '#1e293b',
  toggleBg: '#020617',
  border: 'rgba(255,255,255,0.05)',
  muted: '#475569',
  text: '#f1f5f9',
  subtext: '#64748b',
  blue: '#3b82f6',
  blueBg: 'rgba(59,130,246,0.12)',
  green: '#22c55e',
  greenBg: 'rgba(34,197,94,0.12)',
};

const lightColors: Colors = {
  bg: '#f8fafc',
  contentBg: '#f1f5f9',
  card: '#ffffff',
  toggleBg: '#e2e8f0',
  border: 'rgba(0,0,0,0.08)',
  muted: '#94a3b8',
  text: '#0f172a',
  subtext: '#64748b',
  blue: '#2563eb',
  blueBg: 'rgba(37,99,235,0.08)',
  green: '#16a34a',
  greenBg: 'rgba(22,163,74,0.08)',
};

// ─── Static data ──────────────────────────────────────────────────────────────

const filters: Record<'fuel' | 'ev', { id: string; label: string }[]> = {
  fuel: [
    { id: 'all', label: 'Vše' },
    { id: '95', label: 'Natural 95' },
    { id: 'diesel', label: 'Nafta' },
  ],
  ev: [
    { id: 'all', label: 'Vše' },
    { id: 'fast', label: 'Rychlé (DC)' },
    { id: 'ultra', label: 'Ultra (150kW+)' },
  ],
};


// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

function AppContent() {
  const systemScheme = useColorScheme();
  const [themePref, setThemePref] = useState<ThemePref>('system');
  const [view, setView] = useState<'map' | 'list'>('map');
  const [mode, setMode] = useState<'fuel' | 'ev'>('fuel');
  const [activeFilter, setActiveFilter] = useState('all');
  const [userLocation, setUserLocation] = useState<UserLocation>({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });

  const isDark = themePref === 'system' ? (systemScheme ?? 'dark') === 'dark' : themePref === 'dark';
  const c = isDark ? darkColors : lightColors;
  const styles = useMemo(() => makeStyles(c), [isDark]);

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({}).then(loc => {
          setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        });
      }
    });
  }, []);

  const { data: stations = [], isLoading: loading } = useStations(userLocation.lat, userLocation.lng, mode);

  const cycleTheme = () =>
    setThemePref(prev => THEME_CYCLE[(THEME_CYCLE.indexOf(prev) + 1) % THEME_CYCLE.length]);

  const ThemeIcon = themePref === 'dark' ? Moon : themePref === 'light' ? Sun : SunMoon;

  const accent = mode === 'fuel' ? c.blue : c.green;
  const accentBg = mode === 'fuel' ? c.blueBg : c.greenBg;
  const filtered = stations;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={c.bg}
          translucent={false}
        />

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <Search size={16} color={c.subtext} />
            <TextInput
              style={styles.searchInput}
              placeholder="Hledat adresu nebo stanici..."
              placeholderTextColor={c.subtext}
            />
            <Pressable onPress={cycleTheme} style={styles.themeBtn}>
              <ThemeIcon size={16} color={c.subtext} />
            </Pressable>
          </View>

          <View style={styles.modeToggle}>
            {(['fuel', 'ev'] as const).map(id => {
              const isActive = mode === id;
              const color = id === 'fuel' ? c.blue : c.green;
              const Icon = id === 'fuel' ? Fuel : Zap;
              return (
                <Pressable
                  key={id}
                  style={[styles.modeBtn, isActive && { backgroundColor: color }]}
                  onPress={() => { setMode(id); setActiveFilter('all'); }}
                >
                  <Icon size={16} color={isActive ? '#fff' : c.subtext} />
                  <Text style={[styles.modeBtnText, { color: isActive ? '#fff' : c.subtext }]}>
                    {id === 'fuel' ? 'Palivo' : 'Nabíjení'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
            {filters[mode].map(f => (
              <Pressable
                key={f.id}
                onPress={() => setActiveFilter(f.id)}
                style={[
                  styles.filterPill,
                  {
                    borderColor: activeFilter === f.id ? accent : c.border,
                    backgroundColor: activeFilter === f.id ? accentBg : c.card,
                  },
                ]}
              >
                <Text style={[styles.filterText, { color: activeFilter === f.id ? accent : c.subtext }]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Content ── */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={c.green} />
            </View>
          ) : view === 'map' ? (
            <StationMap filtered={filtered} userLocation={userLocation} />
          ) : (
            <StationList filtered={filtered} accent={accent} accentBg={accentBg} mode={mode} c={c} styles={styles} />
          )}
        </View>

        {/* ── Tab Bar ── */}
        <View style={styles.tabBar}>
          <Pressable onPress={() => setView('map')} style={styles.tabBtn}>
            <MapIcon size={20} color={view === 'map' ? c.blue : c.subtext} />
            <Text style={[styles.tabLabel, { color: view === 'map' ? c.blue : c.subtext }]}>Mapa</Text>
          </Pressable>

          <View style={styles.tabCenterWrapper}>
            <Pressable style={styles.addBtn}>
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => setView('list')} style={styles.tabBtn}>
            <List size={20} color={view === 'list' ? c.blue : c.subtext} />
            <Text style={[styles.tabLabel, { color: view === 'list' ? c.blue : c.subtext }]}>Seznam</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ─── Station map ──────────────────────────────────────────────────────────────

function StationMap({
  filtered, userLocation,
}: {
  filtered: Station[]; userLocation: UserLocation;
}) {
  return (
    <MapView
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      showsUserLocation
      showsMyLocationButton={false}
      initialRegion={{
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      }}
    >
      {filtered.map(s => (
        <Marker
          key={s.id}
          coordinate={{ latitude: s.lat, longitude: s.lng }}
          title={s.name}
          description={s.address ?? ''}
          pinColor={s.type === 'ev' ? '#22c55e' : '#3b82f6'}
        />
      ))}
    </MapView>
  );
}

// ─── Station list ─────────────────────────────────────────────────────────────

function StationList({
  filtered, accent, accentBg, mode, c, styles,
}: {
  filtered: Station[]; accent: string; accentBg: string; mode: string;
  c: Colors; styles: ReturnType<typeof makeStyles>;
}) {
  if (filtered.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={[styles.emptyText, { color: c.subtext }]}>V této oblasti žádné stanice</Text>
      </View>
    );
  }

  const Icon = mode === 'fuel' ? Fuel : Zap;

  return (
    <ScrollView contentContainerStyle={styles.listContainer}>
      {filtered.map(s => (
        <Pressable key={s.id} style={styles.stationCard}>
          <View style={[styles.stationIcon, { backgroundColor: accentBg }]}>
            <Icon size={22} color={accent} />
          </View>

          <View style={styles.stationInfo}>
            <Text style={[styles.stationName, { color: c.text }]} numberOfLines={1}>{s.name}</Text>
            <Text style={[styles.stationMeta, { color: c.subtext }]}>-- km • {s.address}</Text>
          </View>

          <View style={styles.stationRight}>
            <Text style={[styles.priceValue, { color: accent }]}>
              {s.price != null ? s.price.toFixed(2) : '--'}{' '}
              <Text style={styles.priceUnit}>Kč/j</Text>
            </Text>
            <Text style={[styles.priceAge, { color: c.muted }]}>před 15 min</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },

    header: {
      paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
      backgroundColor: c.bg, zIndex: 10,
    },
    searchRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: c.card, borderRadius: 16,
      paddingHorizontal: 16, paddingVertical: 10, marginBottom: 12,
      borderWidth: 1, borderColor: c.border,
    },
    searchInput: { flex: 1, color: c.text, fontSize: 13 },
    themeBtn: { padding: 4 },
    modeToggle: {
      flexDirection: 'row', backgroundColor: c.toggleBg,
      padding: 4, borderRadius: 18, marginBottom: 12,
      borderWidth: 1, borderColor: c.border, gap: 4,
    },
    modeBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 14,
    },
    modeBtnText: { fontWeight: '700', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
    filtersRow: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
    filterPill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
    filterText: { fontSize: 11, fontWeight: '700' },

    content: { flex: 1, backgroundColor: c.contentBg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    listContainer: { padding: 12, gap: 10 },
    stationCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
      borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14,
    },
    stationIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    stationInfo: { flex: 1, marginLeft: 12 },
    stationName: { fontWeight: '700', fontSize: 13 },
    stationMeta: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2 },
    stationRight: { alignItems: 'flex-end' },
    priceValue: { fontSize: 17, fontWeight: '900' },
    priceUnit: { fontSize: 10, opacity: 0.5 },
    priceAge: { fontSize: 9, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
    emptyText: { fontSize: 13 },

    tabBar: {
      height: 76, backgroundColor: c.bg,
      borderTopWidth: 1, borderTopColor: c.border,
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-around', paddingHorizontal: 24, overflow: 'visible',
    },
    tabBtn: { alignItems: 'center', gap: 4 },
    tabLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
    tabCenterWrapper: { alignItems: 'center', marginTop: -36 },
    addBtn: {
      width: 52, height: 52, borderRadius: 16, backgroundColor: '#fff',
      alignItems: 'center', justifyContent: 'center',
      transform: [{ rotate: '45deg' }],
      shadowColor: '#fff', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 14, elevation: 8,
    },
    addBtnText: {
      color: '#0f172a', fontSize: 24, fontWeight: '900', lineHeight: 28,
      transform: [{ rotate: '-45deg' }],
    },
  });
}
