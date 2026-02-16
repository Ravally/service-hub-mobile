import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, StyleSheet } from 'react-native';
import SignatureScreen from 'react-native-signature-canvas';
import { Ionicons } from '@expo/vector-icons';
import { colors, typeScale, fonts, spacing } from '../../theme';

const SIGNATURE_STYLE = `
  .m-signature-pad { box-shadow: none; border: none; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { display: none; }
  body { background: #1A2138; }
  canvas { background: #1A2138; }
`;

export default function SignatureField({ field, value, error, onChange }) {
  const sigRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleDone = () => {
    sigRef.current?.readSignature();
  };

  const handleOK = (signature) => {
    // signature is a base64 data URI string
    if (signature) onChange(signature);
    setModalVisible(false);
  };

  const handleClear = () => {
    sigRef.current?.clearSignature();
  };

  const handleUndo = () => {
    sigRef.current?.undo();
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{field.label}{field.required ? ' *' : ''}</Text>

      {value ? (
        <View style={styles.preview}>
          <Image source={{ uri: value }} style={styles.previewImage} resizeMode="contain" />
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
              <Ionicons name="create-outline" size={18} color={colors.scaffld} />
              <Text style={styles.actionText}>Redo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleRemove} activeOpacity={0.7}>
              <Ionicons name="trash-outline" size={18} color={colors.coral} />
              <Text style={[styles.actionText, { color: colors.coral }]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addBtn, error && styles.addBtnError]}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={28} color={colors.scaffld} />
          <Text style={styles.addText}>Tap to Sign</Text>
        </TouchableOpacity>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="fullScreen">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Sign Here</Text>
            <TouchableOpacity style={styles.headerBtn} onPress={handleDone} activeOpacity={0.7}>
              <Text style={styles.doneText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.canvasContainer}>
            <SignatureScreen
              ref={sigRef}
              onOK={handleOK}
              onEmpty={() => setModalVisible(false)}
              webStyle={SIGNATURE_STYLE}
              penColor="#FFFFFF"
              backgroundColor="#1A2138"
              dotSize={2}
              minWidth={1.5}
              maxWidth={3}
              trimWhitespace
              imageType="image/png"
            />
          </View>

          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolBtn} onPress={handleUndo} activeOpacity={0.7}>
              <Ionicons name="arrow-undo-outline" size={22} color={colors.silver} />
              <Text style={styles.toolText}>Undo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={handleClear} activeOpacity={0.7}>
              <Ionicons name="refresh-outline" size={22} color={colors.coral} />
              <Text style={[styles.toolText, { color: colors.coral }]}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontFamily: fonts.data.medium, fontSize: 11, letterSpacing: 2,
    textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.xs,
  },
  addBtn: {
    backgroundColor: colors.midnight, borderWidth: 1, borderColor: colors.slate,
    borderRadius: 10, padding: spacing.lg, alignItems: 'center', justifyContent: 'center',
    minHeight: 100, borderStyle: 'dashed',
  },
  addBtnError: { borderColor: colors.coral },
  addText: { ...typeScale.bodySm, color: colors.scaffld, marginTop: spacing.xs },
  error: { color: colors.coral, fontSize: 12, marginTop: spacing.xs },
  preview: { borderRadius: 10, overflow: 'hidden', backgroundColor: colors.midnight, borderWidth: 1, borderColor: colors.slate },
  previewImage: { width: '100%', height: 120, backgroundColor: colors.midnight },
  previewActions: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, paddingVertical: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: spacing.sm },
  actionText: { ...typeScale.bodySm, color: colors.scaffld },
  modalContainer: { flex: 1, backgroundColor: colors.midnight },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: spacing.xl * 2, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.slate,
  },
  headerBtn: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.sm },
  modalTitle: { ...typeScale.h3, color: colors.white },
  cancelText: { ...typeScale.body, color: colors.muted },
  doneText: { ...typeScale.body, color: colors.scaffld, fontFamily: fonts.primary.semiBold },
  canvasContainer: { flex: 1 },
  toolbar: {
    flexDirection: 'row', justifyContent: 'center', gap: spacing.xl,
    paddingVertical: spacing.md, paddingBottom: spacing.xl,
    borderTopWidth: 1, borderTopColor: colors.slate,
  },
  toolBtn: { alignItems: 'center', minHeight: 44, justifyContent: 'center', minWidth: 60 },
  toolText: { ...typeScale.bodySm, color: colors.silver, marginTop: 2 },
});
