import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { useMarkAllNotificationsRead, useNotifications } from '@/features/campus';
import { QueryState } from '@/components/common/query-state';
import { Button, EmptyNote } from '@/components/ui/primitives';
import { formatDate } from '@/lib/format';
import { Colors, MinTouchTarget, Radius, Spacing, Type } from '@/constants/theme';

const C = Colors.light;

/** Bottom sheet listing the user's notifications (replaces the old Alert popup). */
export function NotificationsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const feed = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const unread = feed.data?.unreadCount ?? 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close notifications" accessibilityRole="button" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]} accessibilityViewIsModal>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              Notifications
            </Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={styles.close} hitSlop={6}>
              <X size={22} color={C.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: Spacing.md }}>
            <QueryState query={feed}>
              {(data) =>
                data.items.length === 0 ? (
                  <EmptyNote title="You're all caught up" message="New announcements and updates will appear here." />
                ) : (
                  <>
                    {data.items.map((n) => (
                      <View key={n.id} style={[styles.item, !n.isRead && styles.itemUnread]} accessible>
                        {!n.isRead && <View style={styles.dot} accessibilityLabel="Unread" />}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemTitle}>{n.title}</Text>
                          <Text style={styles.itemBody}>{n.message}</Text>
                          <Text style={styles.itemDate}>{formatDate(n.createdAt)}</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )
              }
            </QueryState>
          </ScrollView>

          {unread > 0 && <Button label="Mark all as read" variant="secondary" loading={markAll.isPending} onPress={() => markAll.mutate()} />}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, paddingHorizontal: Spacing.lg, maxHeight: '85%' },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#D1D1D6', marginTop: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  title: { ...Type.title, color: C.text },
  close: { width: MinTouchTarget, height: MinTouchTarget, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  list: { flexGrow: 0, marginBottom: Spacing.md },
  item: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.sm },
  itemUnread: { backgroundColor: C.primaryLight },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primaryContainer, marginTop: 6 },
  itemTitle: { ...Type.callout, fontWeight: '600', color: C.text },
  itemBody: { ...Type.subhead, color: C.textSecondary, marginTop: 2 },
  itemDate: { ...Type.caption, color: C.textMuted, marginTop: 4 },
});
