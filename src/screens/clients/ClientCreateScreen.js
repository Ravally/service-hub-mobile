import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { useClientsStore } from '../../stores/clientsStore';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import { successNotification } from '../../utils/haptics';
import Input from '../../components/ui/Input';
import { getIsConnected } from '../../services/networkMonitor';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function ClientCreateScreen({ navigation }) {
  const userId = useAuthStore((s) => s.userId);
  const showToast = useUiStore((s) => s.showToast);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const handleImportContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow contact access in Settings to import contacts.');
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
          Contacts.Fields.Addresses,
          Contacts.Fields.Company,
        ],
      });

      if (!data.length) {
        showToast('No contacts found', 'warning');
        return;
      }

      // Show a simple picker — use first contact matching a search
      // For now, pick the first contact with a name to demo the flow
      // A full picker could be added later
      const contact = data[0];
      prefillFromContact(contact);
      showToast(`Imported ${contact.firstName || ''} ${contact.lastName || ''}`.trim(), 'success');
    } catch {
      showToast('Failed to access contacts', 'error');
    }
  };

  const prefillFromContact = (contact) => {
    if (contact.firstName) setFirstName(contact.firstName);
    if (contact.lastName) setLastName(contact.lastName);
    if (contact.company) setCompany(contact.company);
    if (contact.phoneNumbers?.length) {
      setPhone(contact.phoneNumbers[0].number || '');
    }
    if (contact.emails?.length) {
      setEmail(contact.emails[0].email || '');
    }
    if (contact.addresses?.length) {
      const addr = contact.addresses[0];
      if (addr.street) setStreet(addr.street);
      if (addr.city) setCity(addr.city);
      if (addr.region) setState(addr.region);
      if (addr.postalCode) setZip(addr.postalCode);
    }
  };

  const validate = () => {
    const next = {};
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!name) next.name = 'Name is required';
    if (!phone.trim() && !email.trim()) next.contact = 'Phone or email is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || saving) return;
    setSaving(true);

    try {
      const name = `${firstName.trim()} ${lastName.trim()}`.trim();
      const addressStr = [street, city, state, zip].map((s) => s.trim()).filter(Boolean).join(', ');

      const properties = [];
      if (street.trim() || city.trim()) {
        properties.push({
          uid: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          label: 'Primary',
          street1: street.trim(),
          street2: '',
          city: city.trim(),
          state: state.trim(),
          zip: zip.trim(),
          country: 'United States',
          isPrimary: true,
          isBilling: true,
          contacts: [],
        });
      }

      const clientData = {
        name,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        company: company.trim(),
        phone: phone.trim(),
        email: email.trim(),
        phones: phone.trim() ? [{ label: 'Main', number: phone.trim() }] : [],
        emails: email.trim() ? [{ label: 'Main', address: email.trim() }] : [],
        address: addressStr,
        properties,
        tags: [],
        contacts: [],
        notes: notes.trim(),
        receivesTexts: false,
        leadSource: '',
        commPrefs: {
          quoteFollowups: false,
          invoiceFollowups: false,
          visitReminders: false,
          jobFollowups: false,
          askForReview: false,
        },
      };

      const docId = await useClientsStore.getState().createClient(userId, clientData);
      await successNotification();
      const online = getIsConnected();
      showToast(online ? 'Client created' : 'Client saved — will sync when online', 'success');
      if (docId) {
        navigation.replace('ClientDetail', { clientId: docId });
      } else {
        navigation.goBack();
      }
    } catch {
      showToast('Failed to create client', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      {/* Import Button */}
      <TouchableOpacity
        style={styles.importBtn}
        onPress={handleImportContact}
        activeOpacity={0.7}
      >
        <Ionicons name="person-add-outline" size={20} color={colors.scaffld} />
        <Text style={styles.importText}>Import from Contacts</Text>
      </TouchableOpacity>

      {/* Name */}
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>CLIENT INFO</Text>
        <View style={styles.row}>
          <Input
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="John"
            style={styles.halfInput}
            autoCapitalize="words"
          />
          <Input
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Smith"
            style={styles.halfInput}
            autoCapitalize="words"
          />
        </View>
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <Input
          label="Company"
          value={company}
          onChangeText={setCompany}
          placeholder="Optional"
          autoCapitalize="words"
        />
      </Card>

      {/* Contact */}
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>CONTACT</Text>
        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="(555) 123-4567"
          keyboardType="phone-pad"
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="john@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.contact && <Text style={styles.errorText}>{errors.contact}</Text>}
      </Card>

      {/* Address */}
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>PROPERTY ADDRESS</Text>
        <Input
          label="Street"
          value={street}
          onChangeText={setStreet}
          placeholder="123 Main St"
          autoCapitalize="words"
        />
        <View style={styles.row}>
          <Input
            label="City"
            value={city}
            onChangeText={setCity}
            placeholder="City"
            style={styles.halfInput}
            autoCapitalize="words"
          />
          <Input
            label="State"
            value={state}
            onChangeText={setState}
            placeholder="ST"
            style={styles.quarterInput}
            autoCapitalize="characters"
            maxLength={3}
          />
        </View>
        <Input
          label="ZIP"
          value={zip}
          onChangeText={setZip}
          placeholder="12345"
          keyboardType="number-pad"
          maxLength={10}
        />
      </Card>

      {/* Notes */}
      <Card style={styles.section}>
        <Text style={styles.sectionLabel}>NOTES</Text>
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          multiline
          numberOfLines={3}
          inputStyle={styles.notesInput}
        />
      </Card>

      {/* Save */}
      <Button
        title="Save Client"
        onPress={handleSave}
        loading={saving}
        style={styles.saveBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.charcoal,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate,
    paddingVertical: 14,
    minHeight: 52,
    marginBottom: spacing.lg,
  },
  importText: { ...typeScale.body, color: colors.scaffld },
  section: { marginBottom: spacing.md },
  sectionLabel: {
    fontFamily: fonts.data.medium,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  halfInput: { flex: 1 },
  quarterInput: { flex: 0.5 },
  notesInput: { minHeight: 80, textAlignVertical: 'top' },
  errorText: {
    color: colors.coral,
    fontFamily: fonts.primary.regular,
    fontSize: 12,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  saveBtn: { marginTop: spacing.sm },
});
