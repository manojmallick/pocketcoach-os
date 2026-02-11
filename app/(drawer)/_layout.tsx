import Breadcrumb from '@/components/Breadcrumb';
import DrawerContent from '@/components/DrawerContent';
import Header from '@/components/Header';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { withLayoutContext } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

const { Navigator } = createDrawerNavigator();

const Drawer = withLayoutContext<
  React.ComponentProps<typeof Navigator>['screenOptions'] & {},
  typeof Navigator,
  any,
  any
>(Navigator);

/** Wraps Header + Breadcrumb so every screen gets them automatically. */
function ScreenHeader({ title }: { title: string }) {
  return (
    <View>
      <Header title={title} />
      <Breadcrumb />
    </View>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        drawerType: 'front',
        drawerStyle: { width: 280 },
        headerShown: false, // we render our own header per-screen below
      }}
    >
      <Drawer.Screen
        name="library"
        options={{
          drawerLabel: 'Library',
          headerShown: true,
          header: () => <ScreenHeader title="Library" />,
        }}
      />
      <Drawer.Screen
        name="chat"
        options={{
          drawerLabel: 'Chat',
          headerShown: true,
          header: () => <ScreenHeader title="Chat" />,
        }}
      />
      <Drawer.Screen
        name="today"
        options={{
          drawerLabel: 'Today',
          headerShown: true,
          header: () => <ScreenHeader title="Today" />,
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
          headerShown: true,
          header: () => <ScreenHeader title="Settings" />,
        }}
      />
      {/* index.tsx redirects to /library — hide from drawer */}
      <Drawer.Screen
        name="index"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
    </Drawer>
  );
}
