import { GoogleIntegration, GoogleIntegrationProvider, GoogleIntegrationStatus, LocalIntelligenceMetric } from '@/types';

/**
 * Conectores Oficiais Google — Konnexy Local Intelligence
 * Gerencia Search Console, Analytics 4, Business Profile e Merchant Center.
 */

export interface GoogleProviderConfig {
  provider: GoogleIntegrationProvider;
  name: string;
  description: string;
  iconName: string;
  requiredScopes: string[];
  docsUrl: string;
}

export const GOOGLE_PROVIDERS_CONFIG: Record<GoogleIntegrationProvider, GoogleProviderConfig> = {
  google_search_console: {
    provider: 'google_search_console',
    name: 'Google Search Console',
    description: 'Acompanhe impressões, cliques orgânicos, CTR e posição média das palavras-chave locais no Google.',
    iconName: 'Search',
    requiredScopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    docsUrl: 'https://search.google.com/search-console/about',
  },
  google_analytics_4: {
    provider: 'google_analytics_4',
    name: 'Google Analytics 4',
    description: 'Monitore tráfego, sessões ativas, canais de aquisição de clientes e taxas de conversão da vitrine.',
    iconName: 'BarChart3',
    requiredScopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    docsUrl: 'https://analytics.google.com/',
  },
  google_business_profile: {
    provider: 'google_business_profile',
    name: 'Google Business Profile',
    description: 'Sincronize avaliações, rotas solicitadas no Google Maps, chamadas telefônicas e visualizações da ficha.',
    iconName: 'MapPin',
    requiredScopes: ['https://www.googleapis.com/auth/business.manage'],
    docsUrl: 'https://www.google.com/business/',
  },
  google_merchant_center: {
    provider: 'google_merchant_center',
    name: 'Google Merchant Center',
    description: 'Exiba seus produtos físicos diretamente na aba Shopping do Google e nos resultados de busca por produto.',
    iconName: 'ShoppingBag',
    requiredScopes: ['https://www.googleapis.com/auth/content'],
    docsUrl: 'https://merchants.google.com/',
  },
};

/**
 * Retorna as integrações padrão (desconectadas) para uma empresa caso ainda não estejam no banco.
 */
export function getDefaultGoogleIntegrations(businessId: string): GoogleIntegration[] {
  const now = new Date().toISOString();
  return (Object.keys(GOOGLE_PROVIDERS_CONFIG) as GoogleIntegrationProvider[]).map((provider) => ({
    id: `g-int-${businessId}-${provider}`,
    business_id: businessId,
    provider,
    status: 'disconnected' as GoogleIntegrationStatus,
    scopes: GOOGLE_PROVIDERS_CONFIG[provider].requiredScopes,
    metadata: {},
    created_at: now,
    updated_at: now,
  }));
}

/**
 * Gera URL de autorização OAuth segura para conectar o serviço do Google especificado.
 */
export function getGoogleOAuthAuthUrl(
  businessId: string,
  provider: GoogleIntegrationProvider,
  redirectOrigin: string
): string {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-google-client-id';
  const config = GOOGLE_PROVIDERS_CONFIG[provider];
  const redirectUri = `${redirectOrigin}/api/intelligence/google/callback`;
  const scope = encodeURIComponent(config.requiredScopes.join(' '));
  const state = Buffer.from(JSON.stringify({ businessId, provider, ts: Date.now() })).toString('base64');

  return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;
}

/**
 * Valida a integridade da conexão do provedor.
 */
export function validateIntegrationStatus(integration: GoogleIntegration): {
  isHealthy: boolean;
  statusLabel: string;
  badgeClass: string;
} {
  switch (integration.status) {
    case 'connected':
      return {
        isHealthy: true,
        statusLabel: 'Conectado e Ativo',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'error':
      return {
        isHealthy: false,
        statusLabel: 'Erro de Autenticação / Token Expirado',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    case 'pending_approval':
      return {
        isHealthy: false,
        statusLabel: 'Aguardando Aprovação de Acesso',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'disconnected':
    default:
      return {
        isHealthy: false,
        statusLabel: 'Não Conectado',
        badgeClass: 'bg-stone-100 text-stone-600 border-stone-200',
      };
  }
}
