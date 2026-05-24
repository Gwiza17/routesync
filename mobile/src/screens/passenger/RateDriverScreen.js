import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import StarRating from 'react-native-star-rating-widget';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import api from '../../services/api';
import { colors, spacing, typography } from '../../theme';

export default function RateDriverScreen({ route, navigation }) {
  const { booking } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (rating === 0) return Alert.alert('Error', 'Please select a star rating');
    setLoading(true);
    try {
      await api.post('/ratings', { bookingId: booking.id, rating, comment });
      Alert.alert('Thank you!', 'Your rating has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not submit rating');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Rate Your Trip" onBack={() => navigation.goBack()} />
      <View style={styles.content}>
        <Card style={styles.card}>
          <Text style={styles.driverName}>{booking.driver?.user?.name}</Text>
          <Text style={styles.tripInfo}>{booking.schedule?.date} · {booking.pickupAddress} → {booking.dropoffAddress}</Text>

          <Text style={styles.label}>How was your experience?</Text>
          <View style={styles.stars}>
            <StarRating
              rating={rating}
              onChange={setRating}
              starSize={44}
              color={colors.warning}
              emptyColor={colors.border}
            />
          </View>

          <Text style={styles.label}>Leave a comment (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Tell others about your experience..."
            placeholderTextColor={colors.muted}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Button label="Submit Rating" onPress={submit} loading={loading} size="lg" style={{ marginTop: spacing.md }} />
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.md },
  card: { gap: spacing.sm },
  driverName: { ...typography.h2 },
  tripInfo: { ...typography.caption, marginBottom: spacing.md },
  label: { ...typography.label, marginTop: spacing.md, marginBottom: spacing.sm },
  stars: { alignItems: 'center', marginVertical: spacing.md },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 8,
    padding: spacing.md, fontSize: 15, color: colors.dark,
    backgroundColor: colors.surface, minHeight: 100,
  },
});
