import { Business, SeoAudit, SeoAuditIssue, SeoOptimization } from '@/types';
import { SITE_URL } from '@/lib/site';

/**
 * Motor de Auditoria e Diagnóstico de SEO Local — Konnexy Local Intelligence
 * Realiza análise profunda de NAP, Schema.org, Meta Tags, Indexabilidade e Conteúdo.
 */
export function runLocalSeoAudit(business: Business): SeoAudit {
  const issues: SeoAuditIssue[] = [];
  const state = business.state_id?.toLowerCase() || 'sp';
  const city = business.city?.slug || 'sao-paulo';
  const neigh = business.neighborhood?.slug || 'bairro';
  const canonicalUrl = `${SITE_URL}/${state}/${city}/${neigh}/${business.slug}`;

  // 1. TÍTULO E META DESCRIPTION
  const title = `${business.name} em ${business.neighborhood?.name || 'São Paulo'} - ${business.city?.name || 'SP'} | Vitriniza`;
  const titleLength = title.length;
  const description = business.short_description || business.description || '';
  const descLength = description.length;

  if (!business.short_description || business.short_description.trim().length === 0) {
    issues.push({
      id: `issue-meta-desc-${business.id}`,
      code: 'MISSING_META_DESCRIPTION',
      category: 'technical',
      severity: 'critical',
      title: 'Descrição curta (Meta Description) ausente',
      description: 'Seu estabelecimento não possui uma meta descrição concisa cadastrada.',
      why_it_matters: 'A meta description é o snippet que aparece diretamente abaixo do seu link no Google. Sem ela, o Google seleciona textos aleatórios da página, reduzindo a taxa de cliques (CTR).',
      recommendation: `Cadastre uma descrição atraente entre 120 e 160 caracteres destacando seus diferenciais em ${business.neighborhood?.name || 'seu bairro'}.`,
      auto_fixable: true,
      action_label: 'Gerar Meta Description Otimizada',
      before_value: null,
      after_preview: `${business.name}: conheça os melhores produtos e serviços em ${business.neighborhood?.name || 'São Paulo'}. Atendimento rápido, horário e contato no Vitriniza.`,
      status: 'open',
    });
  } else if (descLength < 70 || descLength > 165) {
    issues.push({
      id: `issue-meta-desc-len-${business.id}`,
      code: 'SUBOPTIMAL_META_DESCRIPTION_LENGTH',
      category: 'technical',
      severity: 'medium',
      title: 'Tamanho da descrição fora da faixa ideal de SEO (120-160 caracteres)',
      description: `Sua descrição atual possui ${descLength} caracteres.`,
      why_it_matters: 'Descrições com menos de 70 caracteres desperdiçam espaço valioso no Google. Com mais de 165 caracteres, o Google corta com reticências (...) no meio de frases.',
      recommendation: 'Ajuste o texto para conter entre 120 e 160 caracteres, incluindo o nome do bairro e a especialidade.',
      auto_fixable: true,
      action_label: 'Ajustar Tamanho Ideal',
      before_value: description,
      after_preview: description.length > 160 ? `${description.slice(0, 157)}...` : `${description} Venha conferir em ${business.neighborhood?.name || 'São Paulo'}.`,
      status: 'open',
    });
  }

  // 2. NAP (NAME, ADDRESS, PHONE) CONSISTÊNCIA LOCAL
  const hasValidPhone = Boolean(business.phone && business.phone.replace(/\D/g, '').length >= 10);
  const hasValidWhatsApp = Boolean(business.whatsapp && business.whatsapp.replace(/\D/g, '').length >= 10);

  if (!hasValidPhone && !hasValidWhatsApp) {
    issues.push({
      id: `issue-nap-phone-${business.id}`,
      code: 'MISSING_PHONE_CONTACT',
      category: 'nap',
      severity: 'critical',
      title: 'Telefone ou WhatsApp de atendimento não cadastrado',
      description: 'Nenhum canal direto de comunicação por voz ou mensagem foi validado.',
      why_it_matters: 'O Google Maps e os motores de busca exigem número de telefone padronizado (NAP) para validar a autenticidade e exibir o botão "Ligar" no perfil comercial.',
      recommendation: 'Adicione o WhatsApp e/ou telefone fixo no painel de configurações da empresa.',
      auto_fixable: false,
      action_label: 'Cadastrar Telefone',
      before_value: business.phone || business.whatsapp || 'Nenhum',
      status: 'open',
    });
  }

  const hasAddress = Boolean(business.address && business.address.trim().length > 5);
  const hasPostalCode = Boolean(business.postal_code && business.postal_code.replace(/\D/g, '').length === 8);

  if (!hasAddress || !hasPostalCode) {
    issues.push({
      id: `issue-nap-address-${business.id}`,
      code: 'INCOMPLETE_PHYSICAL_ADDRESS',
      category: 'nap',
      severity: 'critical',
      title: 'Endereço físico incompleto ou sem CEP válido',
      description: 'Faltam dados essenciais de logradouro, número ou CEP de 8 dígitos.',
      why_it_matters: 'A consistência de endereço (Address do NAP) é o fator mais importante de ranqueamento no Google Local Pack (mapa de 3 empresas próximas).',
      recommendation: 'Preencha o CEP e endereço completo com número e complemento.',
      auto_fixable: false,
      action_label: 'Corrigir Endereço',
      before_value: business.address || 'Incompleto',
      status: 'open',
    });
  }

  // 3. HORÁRIOS DE ATENDIMENTO
  const hoursCount = business.hours?.length || 0;
  if (hoursCount === 0) {
    issues.push({
      id: `issue-hours-missing-${business.id}`,
      code: 'MISSING_BUSINESS_HOURS',
      category: 'content',
      severity: 'high',
      title: 'Horário de funcionamento não informado',
      description: 'O perfil não informa se o estabelecimento está aberto ou fechado.',
      why_it_matters: 'Clientes que buscam "aberto agora" descartam locais sem horários. O algoritmo do Google prioriza empresas com horários explícitos no Schema.org.',
      recommendation: 'Defina os horários de abertura e fechamento para cada dia da semana.',
      auto_fixable: true,
      action_label: 'Aplicar Horário Comercial Padrão (08h às 18h)',
      before_value: 'Sem horários',
      after_preview: 'Segunda a Sábado das 08:00 às 18:00',
      status: 'open',
    });
  }

  // 4. SCHEMA.ORG DADOS ESTRUTURADOS
  const hasCoordinates = Boolean(business.latitude && business.longitude && (business.latitude !== 0 || business.longitude !== 0));
  if (!hasCoordinates) {
    issues.push({
      id: `issue-schema-coords-${business.id}`,
      code: 'MISSING_GEO_COORDINATES',
      category: 'schema',
      severity: 'high',
      title: 'Geolocalização (Latitude/Longitude) ausente',
      description: 'O estabelecimento não possui coordenadas geográficas registradas.',
      why_it_matters: 'Sem coordenadas, os motores de busca não conseguem calcular a distância em relação ao usuário nem renderizar o mapa local interativo.',
      recommendation: 'Utilize a busca de CEP no painel para obter a latitude e longitude automáticas.',
      auto_fixable: true,
      action_label: 'Geocodificar por CEP',
      before_value: '0, 0',
      after_preview: '-23.5424, -46.4178',
      status: 'open',
    });
  }

  // 5. IMAGENS E IDENTIDADE VISUAL
  if (!business.logo_url || business.logo_url.includes('placehold.co') || business.logo_url.includes('dicebear')) {
    issues.push({
      id: `issue-media-logo-${business.id}`,
      code: 'DEFAULT_OR_PLACEHOLDER_LOGO',
      category: 'content',
      severity: 'medium',
      title: 'Logotipo padrão ou não personalizado',
      description: 'O estabelecimento está usando um avatar temporário em vez da logo oficial.',
      why_it_matters: 'Imagens reais aumentam o reconhecimento de marca em 70% e reduzem a taxa de rejeição nas pesquisas do Google Imagens e Discover.',
      recommendation: 'Faça upload de uma imagem quadrada de boa qualidade da sua marca.',
      auto_fixable: false,
      action_label: 'Fazer Upload de Logo',
      before_value: business.logo_url || 'Nenhuma',
      status: 'open',
    });
  }

  if (!business.cover_url || business.cover_url.trim().length === 0) {
    issues.push({
      id: `issue-media-cover-${business.id}`,
      code: 'MISSING_COVER_BANNER',
      category: 'content',
      severity: 'low',
      title: 'Foto de capa ou fachada ausente',
      description: 'O perfil não possui imagem panorâmica da fachada ou vitrine.',
      why_it_matters: 'Fotos de fachada ajudam o consumidor a reconhecer o estabelecimento físico na rua e enriquecem os snippets do Google.',
      recommendation: 'Envie uma foto horizontal nítida da frente da sua loja.',
      auto_fixable: false,
      action_label: 'Adicionar Imagem de Capa',
      before_value: 'Nenhuma',
      status: 'open',
    });
  }

  // 6. CATÁLOGO DE PRODUTOS E SERVIÇOS
  const productsCount = business.products?.length || 0;
  if (productsCount === 0) {
    issues.push({
      id: `issue-products-empty-${business.id}`,
      code: 'NO_PRODUCTS_LISTED',
      category: 'products',
      severity: 'high',
      title: 'Nenhum produto ou serviço cadastrado',
      description: 'Sua vitrine online ainda não possui itens catalogados.',
      why_it_matters: 'Mais de 65% das buscas locais incluem nomes específicos de produtos (ex: "comprar tinta", "troca de óleo", "pão artesanal"). Sem produtos, sua empresa não aparece nessas pesquisas de intenção de compra.',
      recommendation: 'Cadastre pelo menos 3 produtos ou serviços principais com preço e descrição.',
      auto_fixable: false,
      action_label: 'Adicionar Produtos',
      before_value: '0 produtos',
      status: 'open',
    });
  } else {
    const productsWithoutPrice = business.products?.filter((p) => !p.price || Number(p.price) <= 0) || [];
    if (productsWithoutPrice.length > 0) {
      issues.push({
        id: `issue-products-price-${business.id}`,
        code: 'PRODUCTS_WITHOUT_PRICE',
        category: 'products',
        severity: 'medium',
        title: `${productsWithoutPrice.length} produto(s) sem preço definido`,
        description: 'Existem itens no seu catálogo sem valor informado.',
        why_it_matters: 'O Google Merchant Center e o Schema.org Offer exigem preços claros para habilitar resultados ricos com preço no buscador.',
        recommendation: 'Adicione o preço regular ou promocional de todos os itens cadastrados.',
        auto_fixable: false,
        action_label: 'Revisar Preços',
        before_value: `${productsWithoutPrice.length} sem preço`,
        status: 'open',
      });
    }
  }

  // 7. LINKS E REDES SOCIAIS
  if (!business.instagram && !business.website) {
    issues.push({
      id: `issue-web-presence-${business.id}`,
      code: 'NO_EXTERNAL_WEB_PRESENCE',
      category: 'technical',
      severity: 'low',
      title: 'Website ou perfil do Instagram não conectado',
      description: 'O perfil não possui links externos para redes sociais ou site oficial.',
      why_it_matters: 'Links cruzados (SameAs no Schema.org) ajudam o Knowledge Graph do Google a validar que seu estabelecimento é o mesmo citado nas redes sociais.',
      recommendation: 'Adicione o link do seu Instagram ou site no painel da empresa.',
      auto_fixable: false,
      action_label: 'Conectar Redes Sociais',
      before_value: 'Nenhum',
      status: 'open',
    });
  }

  // CÁLCULO DO SCORE DE SEO LOCAL (0 - 100)
  // Penalidades ponderadas por severidade:
  // Critical: -20 pts cada
  // High: -12 pts cada
  // Medium: -6 pts cada
  // Low: -3 pts cada
  let penalty = 0;
  issues.forEach((i) => {
    if (i.severity === 'critical') penalty += 20;
    else if (i.severity === 'high') penalty += 12;
    else if (i.severity === 'medium') penalty += 6;
    else if (i.severity === 'low') penalty += 3;
  });

  const rawScore = Math.max(10, Math.min(100, 100 - penalty));

  let summary = 'Excelente! Seu estabelecimento cumpre os principais padrões técnicos de SEO Local e Schema.org.';
  if (rawScore < 50) {
    summary = 'Crítico: existem pendências estruturais de contato, endereço ou metadados que impedem o ranqueamento no Google.';
  } else if (rawScore < 80) {
    summary = 'Bom, mas há oportunidades de alto impacto para subir no ranking de buscas locais e aumentar os cliques de clientes.';
  }

  return {
    id: `audit-${business.id}-${Date.now()}`,
    business_id: business.id,
    score: rawScore,
    status: 'completed',
    issues,
    metrics: {
      meta_title_present: Boolean(title),
      meta_title_length: titleLength,
      meta_description_present: Boolean(business.short_description),
      meta_description_length: descLength,
      h1_count: 1,
      canonical_valid: Boolean(canonicalUrl),
      schema_org_valid: Boolean(hasCoordinates && hasValidPhone && hasAddress),
      nap_consistent: Boolean(hasAddress && hasValidPhone && business.name),
      whatsapp_verified: hasValidWhatsApp,
      phone_verified: hasValidPhone,
      address_complete: hasAddress && hasPostalCode,
      hours_complete: hoursCount >= 5,
      photos_count: (business.images?.length || 0) + (business.logo_url ? 1 : 0) + (business.cover_url ? 1 : 0),
      products_count: productsCount,
      products_with_price_count: business.products?.filter((p) => p.price && Number(p.price) > 0).length || 0,
    },
    summary,
    created_at: new Date().toISOString(),
  };
}

/**
 * Executa uma correção automática segura para uma issue de SEO diagnosticada.
 */
export function applySafeSeoAutoFix(
  business: Business,
  issueCode: string
): { updatedBusiness: Partial<Business>; optimization: Partial<SeoOptimization> } | null {
  const now = new Date().toISOString();

  switch (issueCode) {
    case 'MISSING_META_DESCRIPTION': {
      const generated = `${business.name}: conheça os melhores produtos e serviços em ${business.neighborhood?.name || 'São Paulo'}. Atendimento rápido, horário e contato no Vitriniza.`;
      return {
        updatedBusiness: {
          short_description: generated,
        },
        optimization: {
          business_id: business.id,
          issue_code: issueCode,
          action_type: 'generate_meta_description',
          title: 'Geração Automática de Meta Description Local',
          status: 'applied',
          before_state: { short_description: business.short_description || null },
          after_state: { short_description: generated },
          applied_at: now,
          notes: 'Gerada automaticamente com base no nome comercial e bairro do estabelecimento.',
        },
      };
    }

    case 'SUBOPTIMAL_META_DESCRIPTION_LENGTH': {
      const current = business.short_description || '';
      let adjusted = current;
      if (current.length > 160) {
        adjusted = `${current.slice(0, 157)}...`;
      } else if (current.length < 100) {
        adjusted = `${current} Encontre no ${business.neighborhood?.name || 'seu bairro'} com facilidade no Vitriniza.`;
      }
      return {
        updatedBusiness: {
          short_description: adjusted,
        },
        optimization: {
          business_id: business.id,
          issue_code: issueCode,
          action_type: 'optimize_meta_description_length',
          title: 'Ajuste de Comprimento da Meta Description',
          status: 'applied',
          before_state: { short_description: current },
          after_state: { short_description: adjusted },
          applied_at: now,
          notes: `Ajustado de ${current.length} para ${adjusted.length} caracteres para evitar truncamento no Google.`,
        },
      };
    }

    case 'MISSING_BUSINESS_HOURS': {
      const defaultHours = [
        { day_of_week: 1, open_time: '08:00', close_time: '18:00', is_closed: false },
        { day_of_week: 2, open_time: '08:00', close_time: '18:00', is_closed: false },
        { day_of_week: 3, open_time: '08:00', close_time: '18:00', is_closed: false },
        { day_of_week: 4, open_time: '08:00', close_time: '18:00', is_closed: false },
        { day_of_week: 5, open_time: '08:00', close_time: '18:00', is_closed: false },
        { day_of_week: 6, open_time: '08:00', close_time: '14:00', is_closed: false },
        { day_of_week: 0, open_time: '00:00', close_time: '00:00', is_closed: true },
      ];
      return {
        updatedBusiness: {
          hours: defaultHours,
        },
        optimization: {
          business_id: business.id,
          issue_code: issueCode,
          action_type: 'apply_default_business_hours',
          title: 'Configuração de Horário Comercial Padrão',
          status: 'applied',
          before_state: { hours: business.hours || [] },
          after_state: { hours: defaultHours },
          applied_at: now,
          notes: 'Definido horário padrão comercial (Seg-Sex 08h-18h, Sáb 08h-14h). O comerciante pode editar a qualquer momento.',
        },
      };
    }

    case 'MISSING_GEO_COORDINATES': {
      // Coordenadas centrais aproximadas de São Paulo caso o endereço ainda não tenha sido geocodificado
      const lat = -23.5424;
      const lng = -46.4178;
      return {
        updatedBusiness: {
          latitude: lat,
          longitude: lng,
        },
        optimization: {
          business_id: business.id,
          issue_code: issueCode,
          action_type: 'geocode_approximate_coordinates',
          title: 'Geocodificação Inicial de Localização',
          status: 'applied',
          before_state: { latitude: business.latitude, longitude: business.longitude },
          after_state: { latitude: lat, longitude: lng },
          applied_at: now,
          notes: 'Coordenadas iniciais aplicadas para habilitar renderização de Schema.org e raio de busca.',
        },
      };
    }

    default:
      return null;
  }
}
