import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, MinTouchTarget, Spacing, Type } from '@/constants/theme';
import { getErrorMessage } from '@/lib/api/api-error';

interface QueryLike<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

interface QueryStateProps<T> {
  query: QueryLike<T>;
  /** Shown when the data is an empty array (or when `isEmpty` returns true). */
  emptyText?: string;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => React.ReactNode;
}

/**
 * Renders loading / error-with-retry / empty / data for a React Query result,
 * so every screen section handles all four states the same way.
 */
export function QueryState<T>({ query, emptyText, isEmpty, children }: QueryStateProps<T>) {
  if (query.isPending) {
    return (
      <View style={styles.box} accessible accessibilityLabel="Loading" accessibilityRole="progressbar">
        <ActivityIndicator color={Colors.light.primaryContainer} />
      </View>
    );
  }

  if (query.isError) {
    return (
      <View style={styles.box} accessibilityLiveRegion="polite">
        <Text style={styles.errorTitle}>Couldn&apos;t load this section</Text>
        <Text style={styles.muted}>{getErrorMessage(query.error)}</Text>
        <Pressable
          onPress={() => query.refetch()}
          style={({ pressed }) => [styles.retry, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Try loading again"
        >
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const data = query.data as T;
  const empty = isEmpty ? isEmpty(data) : Array.isArray(data) && data.length === 0;
  if (empty && emptyText) {
    return (
      <View style={styles.box}>
        <Text style={styles.muted}>{emptyText}</Text>
      </View>
    );
  }
  return <>{children(data)}</>;
}

const styles = StyleSheet.create({
  box: { paddingVertical: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  errorTitle: { ...Type.callout, fontWeight: '600', color: Colors.light.text },
  muted: { ...Type.subhead, color: Colors.light.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg },
  retry: {
    marginTop: Spacing.xs,
    minHeight: MinTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderRadius: 10,
    backgroundColor: Colors.light.primaryLight,
  },
  retryText: { ...Type.callout, fontWeight: '600', color: Colors.light.primaryContainer },
});
