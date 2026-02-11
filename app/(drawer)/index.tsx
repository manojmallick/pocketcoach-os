import { Redirect } from 'expo-router';

/**
 * Default index route for (drawer) group.
 * Immediately redirects to the Library screen so we have a deterministic
 * landing screen.
 */
export default function DrawerIndex() {
  return <Redirect href="/(drawer)/library" />;
}
