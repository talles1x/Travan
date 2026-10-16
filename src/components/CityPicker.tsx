import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HIT, colors, font, radius, space } from '@/constants/theme';
import type { City } from '@/lib/types';

import { Icon, Row } from './ui';

type Props = {
  visible: boolean;
  title: string;
  cities: City[];
  selectedId?: string;
  onSelect: (city: City) => void;
  onClose: () => void;
};

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function CityPicker({ visible, title, cities, selectedId, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const list = useMemo(
    () => cities.filter((c) => normalize(c.name).includes(normalize(query))),
    [cities, query],
  );

  const close = () => {
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <Row style={styles.header}>
          <Text style={font.h2} accessibilityRole="header">
            {title}
          </Text>
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Fechar" style={styles.close}>
            <Icon name="close" size={22} />
          </Pressable>
        </Row>

        <View style={styles.search}>
          <Icon name="search" size={18} color={colors.muted} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar cidade"
            placeholderTextColor="#A19FB0"
            accessibilityLabel="Buscar cidade"
            style={styles.input}
          />
        </View>

        <FlatList
          data={list}
          keyExtractor={(c) => c.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: space.lg }}
          ListEmptyComponent={<Text style={[font.small, { padding: space.lg }]}>Nenhuma cidade atendida com esse nome.</Text>}
          renderItem={({ item }) => {
            const selected = item.id === selectedId;
            return (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  close();
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.brandSoft }]}>
                <View style={styles.pin}>
                  <Icon name="location-outline" size={18} color={colors.brand} />
                </View>
                <Text style={[font.body, { flex: 1, fontWeight: selected ? '700' : '500' }]}>
                  {item.name} <Text style={font.small}>· {item.uf}</Text>
                </Text>
                {selected && <Icon name="checkmark" color={colors.brand} />}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { justifyContent: 'space-between', padding: space.lg },
  close: { width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center', marginRight: -space.md },
  search: {
    marginHorizontal: space.lg,
    marginBottom: space.md,
    minHeight: HIT,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: space.md },
  item: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
  },
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
