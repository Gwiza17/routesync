import React, { useState, useRef } from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { colors, spacing, radius, shadows } from '../theme';

export default function AddressSearch({ placeholder = 'Search address...', onSelect, value }) {
  const [query, setQuery] = useState(value?.address || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);

  const handleChange = (text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    if (text.length < 3) { setResults([]); setShowResults(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/bookings/geocode', { params: { address: text } });
        setResults(data);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleSelect = (item) => {
    setQuery(item.address);
    setResults([]);
    setShowResults(false);
    onSelect?.(item);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.inputRow}>
        <Ionicons name="location-outline" size={18} color={colors.primary} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={handleChange}
          onFocus={() => results.length > 0 && setShowResults(true)}
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: spacing.sm }} />}
      </View>
      {showResults && results.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={(_, i) => i.toString()}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                <Ionicons name="location" size={14} color={colors.muted} style={{ marginRight: 8 }} />
                <Text style={styles.itemText} numberOfLines={2}>{item.address}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.sm },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  icon: { marginLeft: spacing.md },
  input: { flex: 1, padding: 14, fontSize: 15, color: colors.dark },
  dropdown: {
    marginTop: 2,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 200,
    overflow: 'hidden',
    ...shadows.card,
  },
  item: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.surface },
  itemText: { flex: 1, fontSize: 14, color: colors.dark },
});
