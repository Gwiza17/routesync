import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Card from '../../components/ui/Card';
import { colors, spacing, typography } from '../../theme';
import api from '../../services/api';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function EarningsDashboardScreen({ navigation }) {
  const [summary, setSummary] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await api.get('/earnings/summary');
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const chartData = summary?.earningsByDay?.slice(-14) || [];
  const chartLabels = chartData.map((d, i) => i % 3 === 0 ? d.date.slice(5) : '');
  const chartValues = chartData.map(d => d.amount || 0);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Earnings" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}>

        {summary && (
          <>
            <View style={styles.statsGrid}>
              <StatCard label="This Month" value={`$${summary.thisMonth.toFixed(2)}`} color={colors.primary} />
              <StatCard label="Last Month" value={`$${summary.lastMonth.toFixed(2)}`} color={colors.mid} />
              <StatCard label="All Time" value={`$${summary.totalEarnings.toFixed(2)}`} color={colors.success} />
              <StatCard label="Total Trips" value={summary.totalTrips.toString()} color={colors.warning} />
            </View>

            {chartValues.some(v => v > 0) && (
              <Card style={{ marginTop: spacing.md, overflow: 'hidden', padding: 0 }}>
                <Text style={[typography.label, { padding: spacing.md, paddingBottom: 0 }]}>Last 14 Days</Text>
                <BarChart
                  data={{ labels: chartLabels, datasets: [{ data: chartValues }] }}
                  width={SCREEN_WIDTH - spacing.lg * 2}
                  height={180}
                  chartConfig={{
                    backgroundColor: colors.white,
                    backgroundGradientFrom: colors.white,
                    backgroundGradientTo: colors.white,
                    decimalPlaces: 0,
                    color: () => colors.primary,
                    labelColor: () => colors.muted,
                    style: { borderRadius: 0 },
                    propsForBackgroundLines: { strokeDasharray: '' },
                  }}
                  style={{ marginVertical: spacing.sm }}
                  showValuesOnTopOfBars
                  fromZero
                  withInnerLines={false}
                />
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const StatCard = ({ label, value, color }) => (
  <Card style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Card>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statCard: { width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2, alignItems: 'center', padding: spacing.md },
  statValue: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  statLabel: { ...typography.caption },
});
