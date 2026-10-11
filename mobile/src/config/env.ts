import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Runtime configuration. Only `EXPO_PUBLIC_*` variables are available in the app
 * bundle, and each must be referenced literally so Expo can inline it.
 */

const API_PORT = 8000;
const API_PATH = '/api/v1';
const ANDROID_EMULATOR_HOST = '10.0.2.2';

const isLoopback = (host: string) => host === 'localhost' || host === '127.0.0.1';

/** LAN IP of the machine running Metro, so a physical phone in Expo Go can reach the dev API. */
function devMachineHost(): string | null {
  const constants = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
    experienceUrl?: string;
  };
  const hostUri = constants.expoConfig?.hostUri ?? constants.manifest2?.extra?.expoGo?.debuggerHost;
  const fromHostUri = hostUri?.split(':')[0];
  if (fromHostUri && !isLoopback(fromHostUri)) return fromHostUri;

  const fromExperienceUrl = constants.experienceUrl?.match(/:\/\/([^:/]+)/)?.[1];
  return fromExperienceUrl && !isLoopback(fromExperienceUrl) ? fromExperienceUrl : null;
}

/**
 * Resolves the backend base URL:
 * 1. EXPO_PUBLIC_API_URL when it points somewhere other than localhost (LAN IP or production);
 * 2. on native in development, the Metro host's LAN IP (Expo Go on a physical device);
 * 3. the Android emulator's alias for the host machine;
 * 4. otherwise EXPO_PUBLIC_API_URL / localhost.
 */
function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (Platform.OS === 'web') return configured || `http://localhost:${API_PORT}${API_PATH}`;
  if (configured && !/localhost|127\.0\.0\.1/.test(configured)) return configured;

  const devHost = devMachineHost();
  if (devHost) return `http://${devHost}:${API_PORT}${API_PATH}`;
  if (Platform.OS === 'android') return `http://${ANDROID_EMULATOR_HOST}:${API_PORT}${API_PATH}`;
  return configured || `http://localhost:${API_PORT}${API_PATH}`;
}

const apiUrl = resolveApiUrl();

export const env = {
  apiUrl,
  /** Socket.IO origin: the API URL without its /api/vN suffix. */
  socketOrigin: apiUrl.replace(/\/api\/v\d+$/, ''),
  appName: process.env.EXPO_PUBLIC_APP_NAME || 'JBIT Campus ERP',
  /** Web portal origin, for features that live on the web (fee payment, password reset). Optional. */
  webUrl: process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/+$/, '') || null,
} as const;
