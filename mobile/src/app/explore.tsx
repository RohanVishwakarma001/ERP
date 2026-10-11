import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Leftover route from the Expo starter template (it linked to Expo docs).
 * Kept only so old deep links (jbitcampus://explore) land on the app instead
 * of a demo page; the file and its template components can be deleted.
 */
export default function ExploreRedirect() {
  useEffect(() => {
    router.replace('/');
  }, []);
  return null;
}
