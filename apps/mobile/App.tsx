import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { Fuel, List, Map as MapIcon, Navigation, Search, Zap } from 'lucide-react-native';
import { Station } from '@voltgas/types';

const API_URL = 'http://192.168.0.208:3000/api/stations';

const c = {
  bg: '#0f172a',
  card: '#1e293b',
  border: 'rgba(255,255,255,0.05)',
  muted: '#475569',
  dim: '#334155',
  text: '#f1f5f9',
  subtext: '#64748b',
  blue: '#3b82f6',
  blueBg: 'rgba(59,130,246,0.12)',
  green: '#22c55e',
  greenBg: 'rgba(34,197,94,0.12)',
};

const filters: Record<'gas' | 'ev', { id: string; label: string }[]> = {
  gas: [
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

const MAP_POSITIONS = [
  { top: 60, left: 40 },
  { top: 180, left: 200 },
  { top: 110, left: 260 },
  { top: 290, left: 90 },
  { top: 230, left: 310 },
  { top: 340, left: 210 },
];

export default function App() {
  const [view, setView] = useState<'map' | 'list'>('map');
  const [mode, setMode] = useState<'gas' | 'ev'>('gas');
  const [activeFilter, setActiveFilter] = useState('all');
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStations = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      const data: Station[] = await res.json();
      setStations(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  const accent = mode === 'gas' ? c.blue : c.green;
  const accentBg = mode === 'gas' ? c.blueBg : c.greenBg;
  // API doesn't provide subType — filter by mode only; subType pills are visual
  const filtered = stations.filter(s => s.type === mode);

  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={c.bg} translucent={false} />

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.searchRow}>
            <Search size={16} color={c.subtext} />
            <TextInput
              style={styles.searchInput}
              placeholder="Hledat adresu nebo stanici..."
              placeholderTextColor={c.subtext}
            />
          </View>

          <View style={styles.modeToggle}>
            {(['gas', 'ev'] as const).map(id => {
              const isActive = mode === id;
              const color = id === 'gas' ? c.blue : c.green;
              const Icon = id === 'gas' ? Fuel : Zap;
              return (
                <Pressable
                  key={id}
                  style={[styles.modeBtn, isActive && { backgroundColor: color }]}
                  onPress={() => { setMode(id); setActiveFilter('all'); }}
                >
                  <Icon size={16} color={isActive ? '#fff' : c.subtext} />
                  <Text style={[styles.modeBtnText, { color: isActive ? '#fff' : c.subtext }]}>
                    {id === 'gas' ? 'Palivo' : 'Nabíjení'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
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
            <MapPlaceholder filtered={filtered} accent={accent} />
          ) : (
            <StationList filtered={filtered} accent={accent} accentBg={accentBg} mode={mode} />
          )}
        </View>

        {/* ── Tab Bar ── */}
        <View style={styles.tabBar}>
          <Pressable onPress={() => setView('map')} style={styles.tabBtn}>
            <MapIcon size={20} color={view === 'map' ? c.blue : c.subtext} />
            <Text style={[styles.tabLabel, { color: view === 'map' ? c.blue : c.subtext }]}>
              Mapa
            </Text>
          </Pressable>

          <View style={styles.tabCenterWrapper}>
            <Pressable style={styles.addBtn}>
              <Text style={styles.addBtnText}>+</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => setView('list')} style={styles.tabBtn}>
            <List size={20} color={view === 'list' ? c.blue : c.subtext} />
            <Text style={[styles.tabLabel, { color: view === 'list' ? c.blue : c.subtext }]}>
              Seznam
            </Text>
          </Pressable>
        </View>

    </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ─── Map placeholder ─────────────────────────────────────────────────────────

function MapPlaceholder({ filtered, accent }: { filtered: Station[]; accent: string }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Grid */}
      <Svg style={StyleSheet.absoluteFill} opacity={0.08}>
        <Defs>
          <Pattern id="grid" width={50} height={50} patternUnits="userSpaceOnUse">
            <Path d="M 50 0 L 0 0 0 50" fill="none" stroke="#475569" strokeWidth={0.5} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grid)" />
      </Svg>

      {/* Roads */}
      <Svg style={StyleSheet.absoluteFill} opacity={0.15}>
        <Line x1={0} y1={160} x2={400} y2={140} stroke="#94a3b8" strokeWidth={5} strokeLinecap="round" />
        <Line x1={90} y1={0} x2={110} y2={400} stroke="#94a3b8" strokeWidth={4} strokeLinecap="round" />
        <Line x1={0} y1={310} x2={400} y2={290} stroke="#94a3b8" strokeWidth={3} strokeLinecap="round" />
      </Svg>

      {/* Price markers */}
      {filtered.map((s, idx) => {
        const pos = MAP_POSITIONS[idx % MAP_POSITIONS.length];
        return (
          <View key={s.id} style={[styles.marker, { top: pos.top, left: pos.left }]}>
            <View style={[styles.markerBadge, { backgroundColor: accent }]}>
              <Text style={styles.markerPrice}>{s.price.toFixed(2)} Kč</Text>
            </View>
            <View style={[styles.markerDot, { backgroundColor: accent, shadowColor: accent }]} />
          </View>
        );
      })}

      {/* User location */}
      <View style={styles.userDot} />

      {/* Nav button */}
      <View style={styles.navBtnWrapper}>
        <Pressable style={styles.navBtn}>
          <Navigation size={20} color={c.text} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Station list ─────────────────────────────────────────────────────────────

function StationList({
  filtered,
  accent,
  accentBg,
  mode,
}: {
  filtered: Station[];
  accent: string;
  accentBg: string;
  mode: string;
}) {
  if (filtered.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>V této oblasti žádné stanice</Text>
      </View>
    );
  }

  const Icon = mode === 'gas' ? Fuel : Zap;

  return (
    <ScrollView contentContainerStyle={styles.listContainer}>
      {filtered.map(s => (
        <Pressable key={s.id} style={styles.stationCard}>
          <View style={[styles.stationIcon, { backgroundColor: accentBg }]}>
            <Icon size={22} color={accent} />
          </View>

          <View style={styles.stationInfo}>
            <Text style={styles.stationName} numberOfLines={1}>{s.name}</Text>
            <Text style={styles.stationMeta}>-- km • {s.address}</Text>
          </View>

          <View style={styles.stationRight}>
            <Text style={[styles.priceValue, { color: accent }]}>
              {s.price.toFixed(2)}{' '}
              <Text style={styles.priceUnit}>Kč/j</Text>
            </Text>
            <Text style={styles.priceAge}>před 15 min</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: 'rgba(15,23,42,0.8)',
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: c.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  searchInput: { flex: 1, color: c.text, fontSize: 13 },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    padding: 4,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: c.border,
    gap: 4,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
  },
  modeBtnText: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  filtersRow: { flexDirection: 'row', gap: 8, paddingBottom: 2 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  filterText: { fontSize: 11, fontWeight: '700' },

  // Content
  content: { flex: 1, backgroundColor: '#020617' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Map markers
  marker: { position: 'absolute', alignItems: 'center' },
  markerBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3, marginBottom: 3 },
  markerPrice: { fontSize: 10, fontWeight: '900', color: '#fff' },
  markerDot: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#fff',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 5, elevation: 4,
  },
  userDot: {
    position: 'absolute', top: '50%', left: '50%', marginTop: -9, marginLeft: -9,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#fff', borderWidth: 3, borderColor: '#3b82f6',
    shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 10, elevation: 6,
  },
  navBtnWrapper: { position: 'absolute', bottom: 16, right: 16 },
  navBtn: {
    backgroundColor: c.card, borderWidth: 1, borderColor: c.border,
    borderRadius: 16, padding: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },

  // Station list
  listContainer: { padding: 12, gap: 10 },
  stationCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30,41,59,0.7)',
    borderWidth: 1, borderColor: c.border,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14,
  },
  stationIcon: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stationInfo: { flex: 1, marginLeft: 12 },
  stationName: { fontWeight: '700', fontSize: 13, color: c.text },
  stationMeta: {
    fontSize: 10, fontWeight: '600', color: c.subtext,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 2,
  },
  stationRight: { alignItems: 'flex-end' },
  priceValue: { fontSize: 17, fontWeight: '900' },
  priceUnit: { fontSize: 10, opacity: 0.5 },
  priceAge: {
    fontSize: 9, color: c.muted, fontWeight: '700',
    marginTop: 2, textTransform: 'uppercase',
  },
  emptyText: { fontSize: 13, color: c.subtext },

  // Tab bar
  tabBar: {
    height: 76,
    backgroundColor: c.bg,
    borderTopWidth: 1, borderTopColor: c.border,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-around', paddingHorizontal: 24,
    overflow: 'visible',
  },
  tabBtn: { alignItems: 'center', gap: 4 },
  tabLabel: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  tabCenterWrapper: { alignItems: 'center', marginTop: -36 },
  addBtn: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
    shadowColor: '#fff', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 14, elevation: 8,
  },
  addBtnText: {
    color: '#0f172a', fontSize: 24, fontWeight: '900', lineHeight: 28,
    transform: [{ rotate: '-45deg' }],
  },
});
