import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { pickFromCamera, pickFromGallery, uploadImage } from '../../services/imageService';
import { lightImpact, successNotification } from '../../utils/haptics';
import Card from '../ui/Card';

export default function ChecklistSection({ checklist, userId, onToggle, onUpdate }) {
  const [expandedId, setExpandedId] = useState(null);

  const { completed, total, percent } = useMemo(() => {
    const t = checklist.length;
    const c = checklist.filter((i) => i.completed).length;
    return { completed: c, total: t, percent: t > 0 ? Math.round((c / t) * 100) : 0 };
  }, [checklist]);

  const handleToggle = (itemId) => {
    lightImpact();
    const item = checklist.find((i) => i.id === itemId);
    if (!item) return;
    const updated = checklist.map((i) =>
      i.id === itemId
        ? { ...i, completed: !i.completed, completedBy: !i.completed ? userId : '', completedAt: !i.completed ? new Date().toISOString() : '' }
        : i,
    );
    onToggle(updated);
  };

  const handleNoteChange = (itemId, notes) => {
    const updated = checklist.map((i) => (i.id === itemId ? { ...i, notes } : i));
    onUpdate(updated);
  };

  const handleAddPhoto = async (itemId) => {
    const uri = await pickFromCamera();
    if (!uri) return;
    const path = `users/${userId}/checklists/${itemId}_${Date.now()}.jpg`;
    const url = await uploadImage(uri, path);
    // Use download URL if upload succeeded, otherwise store local URI
    const photoUrl = url || uri;
    const updated = checklist.map((i) =>
      i.id === itemId
        ? { ...i, photos: [...(i.photos || []), { url: photoUrl, uploadedAt: new Date().toISOString() }] }
        : i,
    );
    onUpdate(updated);
  };

  const handleMarkAll = () => {
    successNotification();
    const updated = checklist.map((i) => ({
      ...i,
      completed: true,
      completedBy: i.completed ? i.completedBy : userId,
      completedAt: i.completed ? i.completedAt : new Date().toISOString(),
    }));
    onToggle(updated);
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.sectionLabel}>CHECKLIST</Text>

      {/* Progress Bar */}
      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
        <Text style={styles.progressText}>{completed}/{total}</Text>
      </View>

      {/* Items */}
      {checklist.map((item) => {
        const expanded = expandedId === item.id;
        return (
          <View key={item.id} style={styles.itemContainer}>
            <TouchableOpacity style={styles.itemRow} onPress={() => handleToggle(item.id)} activeOpacity={0.7}>
              <Ionicons
                name={item.completed ? 'checkbox' : 'square-outline'}
                size={22}
                color={item.completed ? colors.trellio : item.required ? colors.coral : colors.muted}
              />
              <Text style={[styles.itemText, item.completed && styles.itemDone]} numberOfLines={expanded ? undefined : 2}>
                {item.text}
              </Text>
              {item.required && !item.completed && <Text style={styles.requiredDot}>*</Text>}
              <TouchableOpacity onPress={() => setExpandedId(expanded ? null : item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
              </TouchableOpacity>
            </TouchableOpacity>

            {expanded && (
              <View style={styles.expanded}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Add a note..."
                  placeholderTextColor={colors.muted}
                  value={item.notes || ''}
                  onChangeText={(text) => handleNoteChange(item.id, text)}
                  multiline
                />
                {(item.photos || []).map((photo, idx) => (
                  <Image key={idx} source={{ uri: photo.url }} style={styles.photo} />
                ))}
                <TouchableOpacity style={styles.photoBtn} onPress={() => handleAddPhoto(item.id)} activeOpacity={0.7}>
                  <Ionicons name="camera-outline" size={18} color={colors.trellio} />
                  <Text style={styles.photoBtnText}>Add Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      })}

      {/* Mark All */}
      {percent >= 50 && percent < 100 && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAll} activeOpacity={0.7}>
          <Text style={styles.markAllText}>Mark All Complete</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md },
  sectionLabel: { fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  progressBar: { flex: 1, height: 6, backgroundColor: colors.slate, borderRadius: 3, marginRight: spacing.sm, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.trellio, borderRadius: 3 },
  progressText: { fontFamily: fonts.data.regular, fontSize: 13, color: colors.muted, width: 40, textAlign: 'right' },
  itemContainer: { borderBottomWidth: 1, borderBottomColor: colors.slate },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, minHeight: 48 },
  itemText: { ...typeScale.body, color: colors.white, marginLeft: 10, flex: 1 },
  itemDone: { color: colors.muted, textDecorationLine: 'line-through' },
  requiredDot: { color: colors.coral, fontSize: 16, marginRight: 4 },
  expanded: { paddingLeft: 32, paddingBottom: spacing.sm },
  noteInput: { backgroundColor: colors.midnight, borderWidth: 1, borderColor: colors.slate, borderRadius: 8, padding: spacing.sm, color: colors.white, fontFamily: fonts.primary.regular, fontSize: 14, minHeight: 48, marginBottom: spacing.sm },
  photo: { width: '100%', height: 120, borderRadius: 8, marginBottom: spacing.sm },
  photoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, minHeight: 44 },
  photoBtnText: { ...typeScale.bodySm, color: colors.trellio },
  markAllBtn: { marginTop: spacing.md, alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: colors.trellio, borderRadius: 10, minHeight: 48 },
  markAllText: { ...typeScale.bodySm, color: colors.trellio, fontFamily: fonts.primary.semiBold },
});
