import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.store.planner.app',
  appName: 'store-planner',
  webDir: 'dist',
  server: {
    cleartext: true,
    url: 'http://localhost:5173',
  },
}

export default config
