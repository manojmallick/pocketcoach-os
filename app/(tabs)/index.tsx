import { Redirect } from 'expo-router';

/**
 * Default index route for (tabs) group.
 * Immediately redirects to the Library tab so we have a deterministic
 * landing screen and avoid any leftover template "Welcome" flash.
 */
export default function TabIndex() {
  return <Redirect href="/(tabs)/library" />;
}
