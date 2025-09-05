import { ref, onMounted } from 'vue';

interface VersionInfo {
  app: string;
  version: string;
  fullVersion: string;
  timestamp: string;
  commit: string;
  buildNumber: number;
}

export function useVersion() {
  const version = ref<VersionInfo | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchVersion = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch('/api/version');
      if (!response.ok) {
        throw new Error(`Failed to fetch version: ${response.status}`);
      }
      
      const data = await response.json();
      version.value = data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      console.error('[Version] Failed to fetch version info:', err);
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchVersion();
  });

  return {
    version,
    loading,
    error,
    fetchVersion
  };
}