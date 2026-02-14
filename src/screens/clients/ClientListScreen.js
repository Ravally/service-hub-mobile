import React, { useState, useMemo, useCallback } from 'react';
import { View, FlatList, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useClientsStore } from '../../stores/clientsStore';
import { colors, typeScale, fonts, spacing } from '../../theme';
import ClientRow from '../../components/clients/ClientRow';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import { useAuthStore } from '../../stores/authStore';

export default function ClientListScreen({ navigation }) {
  const loading = useClientsStore((s) => s.loading);
  const clients = useClientsStore((s) => s.clients);
  const searchClients = useClientsStore((s) => s.searchClients);
  const userId = useAuthStore((s) => s.userId);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    useClientsStore.getState().subscribe(userId);
    setTimeout(() => setRefreshing(false), 800);
  }, [userId]);

  const filtered = useMemo(() => {
    return search.trim() ? searchClients(search) : clients;
  }, [search, clients, searchClients]);

  const renderItem = useCallback(({ item }) => (
    <ClientRow
      client={item}
      onPress={() => navigation.navigate('ClientDetail', { clientId: item.id })}
    />
  ), [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.header}>Clients</Text>
        <LoadingSkeleton count={5} variant="client" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Clients</Text>
      <Text style={styles.count}>
        {filtered.length} {filtered.length === 1 ? 'client' : 'clients'}
      </Text>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email, phone..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={search ? 'No results' : 'No clients yet'}
            message={search ? 'Try a different search term.' : 'Clients will appear here once added.'}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.midnight },
  center: {
    flex: 1,
    backgroundColor: colors.midnight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    ...typeScale.h1,
    color: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  count: {
    ...typeScale.bodySm,
    color: colors.muted,
    paddingHorizontal: spacing.lg,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.charcoal,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.slate,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.white,
    fontFamily: fonts.primary.regular,
    fontSize: 15,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  emptyList: { flex: 1 },
  separator: { height: spacing.sm },
});
