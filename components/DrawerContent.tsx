import { useProStatus } from '@/state/entitlements';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
    DrawerContentComponentProps,
    DrawerContentScrollView,
} from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type DrawerItem = {
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  route: string;
  highlight?: boolean;
};

const ITEMS: DrawerItem[] = [
  { label: 'Library', icon: 'menu-book', route: '/(drawer)/library' },
  { label: 'Chat', icon: 'chat-bubble-outline', route: '/(drawer)/chat' },
  { label: 'Today', icon: 'check-circle-outline', route: '/(drawer)/today' },
  { label: 'Settings', icon: 'settings', route: '/(drawer)/settings' },
];

export default function DrawerContent(props: DrawerContentComponentProps) {
  const router = useRouter();
  const pro = useProStatus((s) => s.isPro);

  const activeIndex = props.state.index;
  // Map drawer state route names to our items for highlighting
  const activeRouteName = props.state.routes[activeIndex]?.name;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
      {/* App branding */}
      <View style={styles.brand}>
        <Text style={styles.brandTitle}>PocketCoach</Text>
      </View>

      {/* Navigation items */}
      <View style={styles.nav}>
        {ITEMS.map((item) => {
          const isActive = activeRouteName === item.route.split('/').pop();
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.item, isActive && styles.itemActive]}
              onPress={() => {
                router.push(item.route as any);
                props.navigation.closeDrawer();
              }}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={item.icon}
                size={22}
                color={isActive ? '#000000' : '#666666'}
              />
              <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Upgrade to Pro */}
      {!pro && (
        <TouchableOpacity
          style={styles.upgrade}
          onPress={() => {
            router.push('/paywall');
            props.navigation.closeDrawer();
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="workspace-premium" size={22} color="#FFFFFF" />
          <Text style={styles.upgradeLabel}>Upgrade to Pro</Text>
        </TouchableOpacity>
      )}
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    paddingTop: 0,
  },
  brand: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.3,
  },
  nav: {
    paddingHorizontal: 12,
    gap: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  itemActive: {
    backgroundColor: '#F5F5F5',
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  itemLabelActive: {
    color: '#000000',
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  upgrade: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  upgradeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
