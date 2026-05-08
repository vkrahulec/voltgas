import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Station } from '@voltgas/types';

export default function App() {
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/stations')
      .then(res => res.json())
      .then((data: Station[]) => setStations(data));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stations</Text>
      <FlatList
        data={stations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>{item.price} Kč/l</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, paddingHorizontal: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  name: { fontSize: 16, fontWeight: '600' },
  price: { fontSize: 14, color: '#666', marginTop: 4 },
});
