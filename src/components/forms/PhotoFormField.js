import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { pickFromCamera, pickFromGallery } from '../../services/imageService';

export default function PhotoFormField({ field, value, error, onChange }) {
  const navigation = useNavigation();
  const [sourceModal, setSourceModal] = useState(false);
  const uri = value || null;

  const handlePick = async (source) => {
    setSourceModal(false);
    const picked = source === 'camera' ? await pickFromCamera() : await pickFromGallery();
    if (picked) onChange(picked);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{field.label}{field.required ? ' *' : ''}</Text>

      {uri ? (
        <View>
          <View style={styles.preview}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => onChange(null)} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={24} color={colors.coral} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.markupBtn}
            onPress={() => navigation.navigate('PhotoMarkup', {
              photoUri: uri,
              onSave: (dataUri) => onChange(dataUri),
            })}
            activeOpacity={0.7}
          >
            <Ionicons name="brush-outline" size={16} color={colors.scaffld} />
            <Text style={styles.markupText}>Markup</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addBtn, error && styles.addBtnError]}
          onPress={() => setSourceModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="camera-outline" size={28} color={colors.scaffld} />
          <Text style={styles.addText}>Add Photo</Text>
        </TouchableOpacity>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {field.helpText ? <Text style={styles.help}>{field.helpText}</Text> : null}

      <Modal visible={sourceModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Photo</Text>
            <TouchableOpacity style={styles.option} onPress={() => handlePick('camera')} activeOpacity={0.7}>
              <Ionicons name="camera-outline" size={22} color={colors.scaffld} />
              <Text style={styles.optionText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => handlePick('gallery')} activeOpacity={0.7}>
              <Ionicons name="images-outline" size={22} color={colors.scaffld} />
              <Text style={styles.optionText}>Choose from Library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSourceModal(false)} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.xs },
  preview: { position: 'relative', borderRadius: 10, overflow: 'hidden' },
  image: { width: '100%', height: 200, borderRadius: 10 },
  removeBtn: { position: 'absolute', top: 8, right: 8 },
  markupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, minHeight: 44 },
  markupText: { ...typeScale.bodySm, color: colors.scaffld },
  addBtn: { backgroundColor: colors.midnight, borderWidth: 1, borderColor: colors.slate, borderRadius: 10, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', minHeight: 100, borderStyle: 'dashed' },
  addBtnError: { borderColor: colors.coral },
  addText: { ...typeScale.bodySm, color: colors.scaffld, marginTop: spacing.xs },
  error: { color: colors.coral, fontSize: 12, marginTop: spacing.xs },
  help: { ...typeScale.bodySm, color: colors.muted, marginTop: spacing.xs },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.charcoal, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: spacing.lg },
  modalTitle: { ...typeScale.h3, color: colors.white, marginBottom: spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.slate, minHeight: 48, gap: spacing.sm },
  optionText: { ...typeScale.body, color: colors.white },
  cancelBtn: { marginTop: spacing.md, alignItems: 'center', paddingVertical: 14, minHeight: 48 },
  cancelText: { ...typeScale.body, color: colors.coral },
});
