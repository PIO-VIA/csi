import { OpenAPI } from '@/lib2';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://csi.datapipe.duckdns.org';

export function configureOpenAPI(): void {
  OpenAPI.BASE = BASE_URL;
  OpenAPI.WITH_CREDENTIALS = false;
  OpenAPI.TOKEN = async () => {
    if (typeof window === 'undefined') return '';
    try {
      const raw = localStorage.getItem('csi_session');
      if (!raw) return '';
      const session = JSON.parse(raw) as { token?: string };
      return session.token ?? '';
    } catch {
      return '';
    }
  };
}

configureOpenAPI();
