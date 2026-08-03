import type {
  Empresa, DespesaFixa, Material, Imposto, Produto,
  Perfil, Usuario, Permissao
} from '@/types'

// ─── Empresas (3 segmentos) ───────────────────────────────────────────────────

/** 🧁 Confeitaria — Simples Nacional Anexo II (indústria/comércio de mercadoria própria) */
export const mockEmpresa: Empresa = {
  id: '1',
  razaoSocial: 'Doces da Ana — Confeitaria Artesanal',
  cnpj: '12.345.678/0001-90',
  segmento: 'CONFEITARIA',
  regimeTributario: 'SIMPLES_NACIONAL',
  anexoCadastrado: 'ANEXO_II',
  faturamentoMedioMensal: 52000,
  percentualDespesasFixas: 0,   // preenchido abaixo a partir das despesas ativas
  donoUsuarioId: '2'
}

/** 🏭 Indústria — Simples Nacional Anexo II, maior porte de faturamento */
export const mockEmpresaIndustria: Empresa = {
  id: '2',
  razaoSocial: 'MetalForte Indústria de Esquadrias LTDA',
  cnpj: '23.456.789/0001-12',
  segmento: 'INDUSTRIA',
  regimeTributario: 'SIMPLES_NACIONAL',
  anexoCadastrado: 'ANEXO_II',
  faturamentoMedioMensal: 300000,
  folhaPagamentoMensal: 38000,
  percentualDespesasFixas: 0,   // preenchido abaixo a partir das despesas ativas
  donoUsuarioId: '6'
}

/**
 * 🛠️ Serviços — Simples Nacional. Fator R = 52.000 / 158.000 = 32,9% (≥ 28%)
 * → tributa no Anexo III (6% na 1ª faixa) em vez do Anexo V (15,5%).
 */
export const mockEmpresaServicos: Empresa = {
  id: '3',
  razaoSocial: 'NexaTech Consultoria em Tecnologia LTDA',
  cnpj: '34.567.890/0001-34',
  segmento: 'SERVICOS',
  regimeTributario: 'SIMPLES_NACIONAL',
  anexoCadastrado: 'ANEXO_III',
  faturamentoMedioMensal: 158000,
  folhaPagamentoMensal: 52000,
  percentualDespesasFixas: 0,   // preenchido abaixo a partir das despesas ativas
  donoUsuarioId: '7'
}

/**
 * 🛠️ Serviços (enxuta) — Simples Nacional. Fator R = 24.000 / 120.000 = 20,0% (< 28%)
 * → tributa no Anexo V (15,5% na 1ª faixa). Muita terceirização, folha baixa.
 * Demonstra o lado oposto da NexaTech: mesmo segmento, tributação mais pesada.
 */
export const mockEmpresaServicosV: Empresa = {
  id: '4',
  razaoSocial: 'CodeLab Studio de Software LTDA',
  cnpj: '45.678.901/0001-56',
  segmento: 'SERVICOS',
  regimeTributario: 'SIMPLES_NACIONAL',
  anexoCadastrado: 'ANEXO_V',
  faturamentoMedioMensal: 120000,
  folhaPagamentoMensal: 24000,
  percentualDespesasFixas: 0,   // preenchido abaixo a partir das despesas ativas
  donoUsuarioId: '8'
}

export const mockEmpresas: Empresa[] = [
  mockEmpresa, mockEmpresaIndustria, mockEmpresaServicos, mockEmpresaServicosV,
]

// ─── Despesas Fixas ───────────────────────────────────────────────────────────

export const mockDespesasFixas: DespesaFixa[] = [
  { id: 'df-001', empresaId: '1', descricao: 'Aluguel do espaço', valorMensal: 1800, categoria: 'ALUGUEL', ativa: true },
  { id: 'df-002', empresaId: '1', descricao: 'Energia elétrica', valorMensal: 420, categoria: 'ENERGIA', ativa: true },
  { id: 'df-003', empresaId: '1', descricao: 'Gás de cozinha', valorMensal: 180, categoria: 'GAS', ativa: true },
  { id: 'df-004', empresaId: '1', descricao: 'Internet fibra', valorMensal: 99.90, categoria: 'INTERNET', ativa: true },
  { id: 'df-005', empresaId: '1', descricao: 'Pró-labore proprietária', valorMensal: 2500, categoria: 'PROLABORE', ativa: true },
  { id: 'df-006', empresaId: '1', descricao: 'Honorários contabilidade', valorMensal: 350, categoria: 'CONTADOR', ativa: true },
  { id: 'df-007', empresaId: '1', descricao: 'Seguro do estabelecimento', valorMensal: 220, categoria: 'OUTRO', ativa: true },
  { id: 'df-008', empresaId: '1', descricao: 'Sistema de gestão (SaaS)', valorMensal: 129, categoria: 'OUTRO', ativa: true },
  { id: 'df-009', empresaId: '1', descricao: 'Manutenção de equipamentos', valorMensal: 150, categoria: 'OUTRO', ativa: true },
  { id: 'df-010', empresaId: '1', descricao: 'Água e saneamento', valorMensal: 95, categoria: 'ENERGIA', ativa: true },
  { id: 'df-011', empresaId: '1', descricao: 'Material de limpeza', valorMensal: 80, categoria: 'OUTRO', ativa: true },
  { id: 'df-012', empresaId: '1', descricao: 'Telefone celular', valorMensal: 59.90, categoria: 'INTERNET', ativa: true },
  { id: 'df-013', empresaId: '1', descricao: 'Pró-labore auxiliar de confeitaria', valorMensal: 1412, categoria: 'PROLABORE', ativa: true },
  { id: 'df-014', empresaId: '1', descricao: 'Propaganda e marketing digital', valorMensal: 300, categoria: 'OUTRO', ativa: false },
  { id: 'df-015', empresaId: '1', descricao: 'Frete e entregas (fixo mensal)', valorMensal: 200, categoria: 'OUTRO', ativa: true },

  // 🏭 Indústria — MetalForte (emp-002)
  { id: 'df-i01', empresaId: '2', descricao: 'Aluguel do galpão industrial', valorMensal: 12000, categoria: 'ALUGUEL', ativa: true },
  { id: 'df-i02', empresaId: '2', descricao: 'Energia elétrica (maquinário pesado)', valorMensal: 8500, categoria: 'ENERGIA', ativa: true },
  { id: 'df-i03', empresaId: '2', descricao: 'Gás industrial (solda/corte)', valorMensal: 2200, categoria: 'GAS', ativa: true },
  { id: 'df-i04', empresaId: '2', descricao: 'Internet dedicada + telefonia', valorMensal: 650, categoria: 'INTERNET', ativa: true },
  { id: 'df-i05', empresaId: '2', descricao: 'Pró-labore sócios (2)', valorMensal: 16000, categoria: 'PROLABORE', ativa: true },
  { id: 'df-i06', empresaId: '2', descricao: 'Honorários contábeis', valorMensal: 1800, categoria: 'CONTADOR', ativa: true },
  { id: 'df-i07', empresaId: '2', descricao: 'Manutenção preventiva de máquinas', valorMensal: 3200, categoria: 'OUTRO', ativa: true },
  { id: 'df-i08', empresaId: '2', descricao: 'Seguro industrial e patrimonial', valorMensal: 1900, categoria: 'OUTRO', ativa: true },
  { id: 'df-i09', empresaId: '2', descricao: 'ERP industrial (licença)', valorMensal: 890, categoria: 'OUTRO', ativa: true },
  { id: 'df-i10', empresaId: '2', descricao: 'EPIs e segurança do trabalho', valorMensal: 1100, categoria: 'OUTRO', ativa: true },
  { id: 'df-i11', empresaId: '2', descricao: 'Água e efluentes industriais', valorMensal: 1400, categoria: 'ENERGIA', ativa: true },
  { id: 'df-i12', empresaId: '2', descricao: 'Frota de entrega (leasing)', valorMensal: 4500, categoria: 'OUTRO', ativa: true },

  // 🛠️ Serviços — NexaTech (emp-003)
  { id: 'df-s01', empresaId: '3', descricao: 'Aluguel do escritório', valorMensal: 4200, categoria: 'ALUGUEL', ativa: true },
  { id: 'df-s02', empresaId: '3', descricao: 'Energia elétrica', valorMensal: 780, categoria: 'ENERGIA', ativa: true },
  { id: 'df-s03', empresaId: '3', descricao: 'Internet fibra dedicada', valorMensal: 520, categoria: 'INTERNET', ativa: true },
  { id: 'df-s04', empresaId: '3', descricao: 'Pró-labore sócios (2)', valorMensal: 14000, categoria: 'PROLABORE', ativa: true },
  { id: 'df-s05', empresaId: '3', descricao: 'Honorários contábeis', valorMensal: 900, categoria: 'CONTADOR', ativa: true },
  { id: 'df-s06', empresaId: '3', descricao: 'Licenças de software (IDEs, cloud, SaaS)', valorMensal: 3800, categoria: 'OUTRO', ativa: true },
  { id: 'df-s07', empresaId: '3', descricao: 'Infraestrutura em nuvem (AWS/Azure)', valorMensal: 2600, categoria: 'OUTRO', ativa: true },
  { id: 'df-s08', empresaId: '3', descricao: 'Marketing e prospecção', valorMensal: 1500, categoria: 'OUTRO', ativa: true },
  { id: 'df-s09', empresaId: '3', descricao: 'Plano de saúde da equipe', valorMensal: 3200, categoria: 'OUTRO', ativa: true },
  { id: 'df-s10', empresaId: '3', descricao: 'Coworking / salas de reunião extras', valorMensal: 700, categoria: 'OUTRO', ativa: false },

  // 🛠️ Serviços enxuta — CodeLab (emp-004) — folha baixa, muita terceirização
  { id: 'df-c01', empresaId: '4', descricao: 'Aluguel do escritório', valorMensal: 3500, categoria: 'ALUGUEL', ativa: true },
  { id: 'df-c02', empresaId: '4', descricao: 'Energia elétrica', valorMensal: 600, categoria: 'ENERGIA', ativa: true },
  { id: 'df-c03', empresaId: '4', descricao: 'Internet fibra dedicada', valorMensal: 450, categoria: 'INTERNET', ativa: true },
  { id: 'df-c04', empresaId: '4', descricao: 'Pró-labore sócio (1)', valorMensal: 8000, categoria: 'PROLABORE', ativa: true },
  { id: 'df-c05', empresaId: '4', descricao: 'Honorários contábeis', valorMensal: 800, categoria: 'CONTADOR', ativa: true },
  { id: 'df-c06', empresaId: '4', descricao: 'Licenças de software e SaaS', valorMensal: 2500, categoria: 'OUTRO', ativa: true },
  { id: 'df-c07', empresaId: '4', descricao: 'Infraestrutura em nuvem', valorMensal: 1800, categoria: 'OUTRO', ativa: true },
  { id: 'df-c08', empresaId: '4', descricao: 'Marketing e prospecção', valorMensal: 1200, categoria: 'OUTRO', ativa: true },
  { id: 'df-c09', empresaId: '4', descricao: 'Plano de saúde', valorMensal: 1200, categoria: 'OUTRO', ativa: true },
]

/**
 * `Empresa.percentualDespesasFixas` é **calculado pelo backend** (C2/B1) e chega
 * pronto na query. Aqui o mock só reproduz o número, derivando-o das despesas
 * ativas, para as telas que ainda não migraram continuarem coerentes — nunca
 * como definição de como o cálculo se faz.
 */
for (const emp of mockEmpresas) {
  const totalAtivas = mockDespesasFixas
    .filter(d => d.empresaId === emp.id && d.ativa)
    .reduce((soma, d) => soma + d.valorMensal, 0)
  emp.percentualDespesasFixas =
    emp.faturamentoMedioMensal > 0 ? (totalAtivas / emp.faturamentoMedioMensal) * 100 : 0
}

// ─── Materiais ────────────────────────────────────────────────────────────────

export const mockMateriais: Material[] = [
  { id: 'mat-001', empresaId: '1', nome: 'Farinha de trigo', unidade: 'KG', custoUnitario: 4.50, fornecedor: 'Distribuidora Pão de Ouro', estoque: 25 },
  { id: 'mat-002', empresaId: '1', nome: 'Açúcar refinado', unidade: 'KG', custoUnitario: 3.80, fornecedor: 'Distribuidora Pão de Ouro', estoque: 20 },
  { id: 'mat-003', empresaId: '1', nome: 'Ovos', unidade: 'UN', custoUnitario: 0.65, fornecedor: 'Sítio das Galinhas', estoque: 180 },
  { id: 'mat-004', empresaId: '1', nome: 'Manteiga', unidade: 'KG', custoUnitario: 28.00, fornecedor: 'Laticínios Central', estoque: 5 },
  { id: 'mat-005', empresaId: '1', nome: 'Chocolate em pó', unidade: 'KG', custoUnitario: 22.00, fornecedor: 'Cacau Foods', estoque: 8 },
  { id: 'mat-006', empresaId: '1', nome: 'Leite integral', unidade: 'L', custoUnitario: 4.20, fornecedor: 'Laticínios Central', estoque: 30 },
  { id: 'mat-007', empresaId: '1', nome: 'Cenoura', unidade: 'KG', custoUnitario: 3.50, fornecedor: 'Hortifruti do Bairro', estoque: 12 },
  { id: 'mat-008', empresaId: '1', nome: 'Caixa embalagem kraft', unidade: 'UN', custoUnitario: 1.80, fornecedor: 'Embalagens Flex', estoque: 200 },
  { id: 'mat-009', empresaId: '1', nome: 'Fermento em pó', unidade: 'KG', custoUnitario: 18.00, fornecedor: 'Distribuidora Pão de Ouro', estoque: 3 },
  { id: 'mat-010', empresaId: '1', nome: 'Creme de leite', unidade: 'ML', custoUnitario: 0.012, fornecedor: 'Laticínios Central', estoque: 10000 },
  // mat-011 a mat-050
  { id: 'mat-011', empresaId: '1', nome: 'Chocolate meio amargo 70%', unidade: 'KG', custoUnitario: 48.00, fornecedor: 'Cacau Foods', estoque: 6 },
  { id: 'mat-012', empresaId: '1', nome: 'Chocolate branco', unidade: 'KG', custoUnitario: 42.00, fornecedor: 'Cacau Foods', estoque: 4 },
  { id: 'mat-013', empresaId: '1', nome: 'Achocolatado em pó', unidade: 'KG', custoUnitario: 14.50, fornecedor: 'Distribuidora Pão de Ouro', estoque: 10 },
  { id: 'mat-014', empresaId: '1', nome: 'Leite condensado', unidade: 'KG', custoUnitario: 9.80, fornecedor: 'Laticínios Central', estoque: 15 },
  { id: 'mat-015', empresaId: '1', nome: 'Doce de leite cremoso', unidade: 'KG', custoUnitario: 12.50, fornecedor: 'Laticínios Central', estoque: 8 },
  { id: 'mat-016', empresaId: '1', nome: 'Cream cheese', unidade: 'KG', custoUnitario: 35.00, fornecedor: 'Laticínios Central', estoque: 3 },
  { id: 'mat-017', empresaId: '1', nome: 'Manteiga sem sal', unidade: 'KG', custoUnitario: 30.00, fornecedor: 'Laticínios Central', estoque: 4 },
  { id: 'mat-018', empresaId: '1', nome: 'Óleo de soja', unidade: 'L', custoUnitario: 7.20, fornecedor: 'Distribuidora Pão de Ouro', estoque: 18 },
  { id: 'mat-019', empresaId: '1', nome: 'Açúcar de confeiteiro', unidade: 'KG', custoUnitario: 6.50, fornecedor: 'Distribuidora Pão de Ouro', estoque: 12 },
  { id: 'mat-020', empresaId: '1', nome: 'Açúcar mascavo', unidade: 'KG', custoUnitario: 8.90, fornecedor: 'Distribuidora Pão de Ouro', estoque: 7 },
  { id: 'mat-021', empresaId: '1', nome: 'Farinha de amêndoas', unidade: 'KG', custoUnitario: 62.00, fornecedor: 'Importados Gourmet', estoque: 2 },
  { id: 'mat-022', empresaId: '1', nome: 'Farinha de arroz', unidade: 'KG', custoUnitario: 8.00, fornecedor: 'Distribuidora Pão de Ouro', estoque: 9 },
  { id: 'mat-023', empresaId: '1', nome: 'Amido de milho', unidade: 'KG', custoUnitario: 6.80, fornecedor: 'Distribuidora Pão de Ouro', estoque: 14 },
  { id: 'mat-024', empresaId: '1', nome: 'Bicarbonato de sódio', unidade: 'KG', custoUnitario: 5.50, fornecedor: 'Distribuidora Pão de Ouro', estoque: 6 },
  { id: 'mat-025', empresaId: '1', nome: 'Sal refinado', unidade: 'KG', custoUnitario: 2.20, fornecedor: 'Distribuidora Pão de Ouro', estoque: 20 },
  { id: 'mat-026', empresaId: '1', nome: 'Extrato de baunilha', unidade: 'ML', custoUnitario: 0.08, fornecedor: 'Importados Gourmet', estoque: 500 },
  { id: 'mat-027', empresaId: '1', nome: 'Essência de laranja', unidade: 'ML', custoUnitario: 0.05, fornecedor: 'Aromas & Sabores', estoque: 300 },
  { id: 'mat-028', empresaId: '1', nome: 'Canela em pó', unidade: 'KG', custoUnitario: 28.00, fornecedor: 'Aromas & Sabores', estoque: 1 },
  { id: 'mat-029', empresaId: '1', nome: 'Cravo em pó', unidade: 'KG', custoUnitario: 32.00, fornecedor: 'Aromas & Sabores', estoque: 1 },
  { id: 'mat-030', empresaId: '1', nome: 'Noz-moscada', unidade: 'KG', custoUnitario: 55.00, fornecedor: 'Aromas & Sabores', estoque: 0 },
  { id: 'mat-031', empresaId: '1', nome: 'Iogurte natural integral', unidade: 'KG', custoUnitario: 7.50, fornecedor: 'Laticínios Central', estoque: 10 },
  { id: 'mat-032', empresaId: '1', nome: 'Queijo mascarpone', unidade: 'KG', custoUnitario: 78.00, fornecedor: 'Importados Gourmet', estoque: 2 },
  { id: 'mat-033', empresaId: '1', nome: 'Gelatina sem sabor', unidade: 'KG', custoUnitario: 45.00, fornecedor: 'Distribuidora Pão de Ouro', estoque: 1 },
  { id: 'mat-034', empresaId: '1', nome: 'Agar-agar', unidade: 'KG', custoUnitario: 120.00, fornecedor: 'Importados Gourmet', estoque: 0 },
  { id: 'mat-035', empresaId: '1', nome: 'Nozes picadas', unidade: 'KG', custoUnitario: 68.00, fornecedor: 'Importados Gourmet', estoque: 3 },
  { id: 'mat-036', empresaId: '1', nome: 'Castanha de caju torrada', unidade: 'KG', custoUnitario: 55.00, fornecedor: 'Importados Gourmet', estoque: 2 },
  { id: 'mat-037', empresaId: '1', nome: 'Amendoim torrado sem sal', unidade: 'KG', custoUnitario: 14.00, fornecedor: 'Hortifruti do Bairro', estoque: 5 },
  { id: 'mat-038', empresaId: '1', nome: 'Coco ralado seco', unidade: 'KG', custoUnitario: 18.50, fornecedor: 'Distribuidora Pão de Ouro', estoque: 6 },
  { id: 'mat-039', empresaId: '1', nome: 'Passas de uva preta', unidade: 'KG', custoUnitario: 22.00, fornecedor: 'Importados Gourmet', estoque: 4 },
  { id: 'mat-040', empresaId: '1', nome: 'Frutas cristalizadas mistas', unidade: 'KG', custoUnitario: 19.00, fornecedor: 'Importados Gourmet', estoque: 3 },
  { id: 'mat-041', empresaId: '1', nome: 'Morango fresco', unidade: 'KG', custoUnitario: 12.00, fornecedor: 'Hortifruti do Bairro', estoque: 4 },
  { id: 'mat-042', empresaId: '1', nome: 'Banana prata', unidade: 'KG', custoUnitario: 4.50, fornecedor: 'Hortifruti do Bairro', estoque: 15 },
  { id: 'mat-043', empresaId: '1', nome: 'Limão siciliano', unidade: 'KG', custoUnitario: 9.00, fornecedor: 'Hortifruti do Bairro', estoque: 8 },
  { id: 'mat-044', empresaId: '1', nome: 'Maçã fuji', unidade: 'KG', custoUnitario: 8.50, fornecedor: 'Hortifruti do Bairro', estoque: 10 },
  { id: 'mat-045', empresaId: '1', nome: 'Polpa de maracujá congelada', unidade: 'KG', custoUnitario: 16.00, fornecedor: 'Frios & Congelados', estoque: 5 },
  { id: 'mat-046', empresaId: '1', nome: 'Corante alimentar vermelho', unidade: 'ML', custoUnitario: 0.18, fornecedor: 'Aromas & Sabores', estoque: 200 },
  { id: 'mat-047', empresaId: '1', nome: 'Corante alimentar azul', unidade: 'ML', custoUnitario: 0.18, fornecedor: 'Aromas & Sabores', estoque: 150 },
  { id: 'mat-048', empresaId: '1', nome: 'Saco plástico biodegradável', unidade: 'UN', custoUnitario: 0.35, fornecedor: 'Embalagens Flex', estoque: 500 },
  { id: 'mat-049', empresaId: '1', nome: 'Fita de cetim 15mm', unidade: 'UN', custoUnitario: 1.20, fornecedor: 'Embalagens Flex', estoque: 120 },
  { id: 'mat-050', empresaId: '1', nome: 'Forma de alumínio descartável', unidade: 'UN', custoUnitario: 2.50, fornecedor: 'Embalagens Flex', estoque: 80 },

  // 🏭 Indústria — matérias-primas (emp-002)
  { id: 'mat-i01', empresaId: '2', nome: 'Perfil de alumínio anodizado', unidade: 'M', custoUnitario: 28.50, fornecedor: 'Alumínios Brasil', estoque: 420, tipo: 'INSUMO' },
  { id: 'mat-i02', empresaId: '2', nome: 'Vidro temperado 8mm', unidade: 'M2', custoUnitario: 145.00, fornecedor: 'Vidraçaria Cristal', estoque: 60, tipo: 'INSUMO' },
  { id: 'mat-i03', empresaId: '2', nome: 'Chapa de aço galvanizado', unidade: 'M2', custoUnitario: 89.00, fornecedor: 'Siderúrgica Norte', estoque: 90, tipo: 'INSUMO' },
  { id: 'mat-i04', empresaId: '2', nome: 'Fechadura multiponto', unidade: 'UN', custoUnitario: 78.00, fornecedor: 'Ferragens Premium', estoque: 150, tipo: 'INSUMO' },
  { id: 'mat-i05', empresaId: '2', nome: 'Roldana em nylon reforçado', unidade: 'UN', custoUnitario: 6.40, fornecedor: 'Ferragens Premium', estoque: 800, tipo: 'INSUMO' },
  { id: 'mat-i06', empresaId: '2', nome: 'Borracha de vedação (EPDM)', unidade: 'M', custoUnitario: 3.20, fornecedor: 'Vedações Tech', estoque: 1200, tipo: 'INSUMO' },
  { id: 'mat-i07', empresaId: '2', nome: 'Parafuso inox autobrocante', unidade: 'UN', custoUnitario: 0.35, fornecedor: 'Ferragens Premium', estoque: 15000, tipo: 'INSUMO' },
  { id: 'mat-i08', empresaId: '2', nome: 'Silicone estrutural (bisnaga)', unidade: 'UN', custoUnitario: 24.00, fornecedor: 'Vedações Tech', estoque: 200, tipo: 'INSUMO' },
  { id: 'mat-i09', empresaId: '2', nome: 'Tinta eletrostática (pó)', unidade: 'KG', custoUnitario: 32.00, fornecedor: 'Coberturas Industriais', estoque: 180, tipo: 'INSUMO' },
  { id: 'mat-i10', empresaId: '2', nome: 'Puxador de alumínio', unidade: 'UN', custoUnitario: 19.50, fornecedor: 'Alumínios Brasil', estoque: 300, tipo: 'INSUMO' },
  { id: 'mat-i11', empresaId: '2', nome: 'Escova de vedação', unidade: 'M', custoUnitario: 2.10, fornecedor: 'Vedações Tech', estoque: 900, tipo: 'INSUMO' },
  { id: 'mat-i12', empresaId: '2', nome: 'Contramarco de alumínio', unidade: 'M', custoUnitario: 15.80, fornecedor: 'Alumínios Brasil', estoque: 350, tipo: 'INSUMO' },

  // 🛠️ Serviços — mão de obra (hora técnica) e custos diretos (emp-003)
  { id: 'mat-s01', empresaId: '3', nome: 'Hora — Desenvolvedor Sênior', unidade: 'H', custoUnitario: 62.00, fornecedor: 'Equipe interna', tipo: 'MAO_DE_OBRA' },
  { id: 'mat-s02', empresaId: '3', nome: 'Hora — Desenvolvedor Pleno', unidade: 'H', custoUnitario: 42.00, fornecedor: 'Equipe interna', tipo: 'MAO_DE_OBRA' },
  { id: 'mat-s03', empresaId: '3', nome: 'Hora — Desenvolvedor Júnior', unidade: 'H', custoUnitario: 24.00, fornecedor: 'Equipe interna', tipo: 'MAO_DE_OBRA' },
  { id: 'mat-s04', empresaId: '3', nome: 'Hora — Gestão de Projeto (PM)', unidade: 'H', custoUnitario: 55.00, fornecedor: 'Equipe interna', tipo: 'MAO_DE_OBRA' },
  { id: 'mat-s05', empresaId: '3', nome: 'Hora — UX/UI Designer', unidade: 'H', custoUnitario: 48.00, fornecedor: 'Equipe interna', tipo: 'MAO_DE_OBRA' },
  { id: 'mat-s06', empresaId: '3', nome: 'Hora — Arquiteto de Soluções', unidade: 'H', custoUnitario: 85.00, fornecedor: 'Equipe interna', tipo: 'MAO_DE_OBRA' },
  { id: 'mat-s07', empresaId: '3', nome: 'Deslocamento técnico (por visita)', unidade: 'UN', custoUnitario: 90.00, fornecedor: 'Custo direto', tipo: 'INSUMO' },
  { id: 'mat-s08', empresaId: '3', nome: 'Ambiente cloud dedicado (mês/projeto)', unidade: 'UN', custoUnitario: 320.00, fornecedor: 'AWS', tipo: 'INSUMO' },
  { id: 'mat-s09', empresaId: '3', nome: 'Licença de software por projeto', unidade: 'UN', custoUnitario: 180.00, fornecedor: 'Fornecedores diversos', tipo: 'INSUMO' },
  { id: 'mat-s10', empresaId: '3', nome: 'Certificado digital / assinatura', unidade: 'UN', custoUnitario: 45.00, fornecedor: 'Certificadora', tipo: 'INSUMO' },

  // 🏭 Indústria — matérias-primas adicionais (emp-002)
  { id: 'mat-i13', empresaId: '2', nome: 'Chapa de policarbonato 10mm', unidade: 'M2', custoUnitario: 165.00, fornecedor: 'Coberturas Industriais', estoque: 40, tipo: 'INSUMO' },
  { id: 'mat-i14', empresaId: '2', nome: 'Perfil U de alumínio', unidade: 'M', custoUnitario: 12.50, fornecedor: 'Alumínios Brasil', estoque: 500, tipo: 'INSUMO' },
  { id: 'mat-i15', empresaId: '2', nome: 'Tubo de aço 40×40mm', unidade: 'M', custoUnitario: 22.00, fornecedor: 'Siderúrgica Norte', estoque: 300, tipo: 'INSUMO' },
  { id: 'mat-i16', empresaId: '2', nome: 'Vidro laminado 10mm', unidade: 'M2', custoUnitario: 210.00, fornecedor: 'Vidraçaria Cristal', estoque: 35, tipo: 'INSUMO' },

  // 🛠️ Serviços enxuta — CodeLab (emp-004) — horas freelancer + terceirização
  { id: 'mat-c01', empresaId: '4', nome: 'Hora — Dev Sênior (freelancer)', unidade: 'H', custoUnitario: 75.00, fornecedor: 'Freelancers', tipo: 'MAO_DE_OBRA' },
  { id: 'mat-c02', empresaId: '4', nome: 'Hora — Dev Pleno (CLT)', unidade: 'H', custoUnitario: 40.00, fornecedor: 'Equipe interna', tipo: 'MAO_DE_OBRA' },
  { id: 'mat-c03', empresaId: '4', nome: 'Hora — Especialista terceirizado', unidade: 'H', custoUnitario: 120.00, fornecedor: 'Consultoria parceira', tipo: 'MAO_DE_OBRA' },
  { id: 'mat-c04', empresaId: '4', nome: 'Hora — QA / Testes', unidade: 'H', custoUnitario: 32.00, fornecedor: 'Equipe interna', tipo: 'MAO_DE_OBRA' },
  { id: 'mat-c05', empresaId: '4', nome: 'Ambiente cloud por projeto', unidade: 'UN', custoUnitario: 280.00, fornecedor: 'AWS', tipo: 'INSUMO' },
  { id: 'mat-c06', empresaId: '4', nome: 'Licença de ferramenta por projeto', unidade: 'UN', custoUnitario: 150.00, fornecedor: 'Fornecedores diversos', tipo: 'INSUMO' },
]

// ─── Impostos ─────────────────────────────────────────────────────────────────

export const mockImpostos: Imposto[] = [
  { id: 'imp-001', nome: 'Simples Nacional — Anexo II (Faixa 1)', chave: 'SIMPLES_NACIONAL_ANEXO_II_F1', aliquotaPercentual: 4.5, descricao: 'DAS unificado para faturamento até R$ 180.000/ano — indústria/confeitaria', ativo: true },
  { id: 'imp-002', nome: 'Simples Nacional — Anexo II (Faixa 2)', chave: 'SIMPLES_NACIONAL_ANEXO_II_F2', aliquotaPercentual: 7.8, descricao: 'DAS unificado para faturamento R$ 180.001 a R$ 360.000/ano', ativo: true },
  { id: 'imp-003', nome: 'Simples Nacional — Anexo III (Faixa 1)', chave: 'SIMPLES_NACIONAL_ANEXO_III_F1', aliquotaPercentual: 6.0, descricao: 'DAS para serviços com Fator R ≥ 28% — faturamento até R$ 180.000/ano (ISS embutido)', ativo: true },
  { id: 'imp-004', nome: 'Simples Nacional — Anexo V (Faixa 1)', chave: 'SIMPLES_NACIONAL_ANEXO_V_F1', aliquotaPercentual: 15.5, descricao: 'DAS para serviços com Fator R < 28% — faturamento até R$ 180.000/ano', ativo: true },
  { id: 'imp-005', nome: 'ISS — Imposto Sobre Serviços', chave: 'ISS', aliquotaPercentual: 5.0, descricao: 'Imposto municipal sobre serviços (2% a 5%). No Simples já está embutido no DAS; no Lucro Presumido é recolhido por fora', ativo: false },
  { id: 'imp-006', nome: 'ICMS — São Paulo', chave: 'ICMS_SP', aliquotaPercentual: 12.0, descricao: 'ICMS padrão para empresas no Lucro Presumido em SP', ativo: false },
]

// ─── Produtos ─────────────────────────────────────────────────────────────────

export const mockProdutos: Produto[] = [
  {
    id: 'prod-001',
    empresaId: '1',
    nome: 'Bolo de Cenoura com Cobertura de Chocolate',
    descricao: 'Bolo caseiro de cenoura com cobertura cremosa de chocolate belga',
    categoria: 'Bolos Clássicos',
    margemLucro: 30,
    descontoMaximo: 5,
    ativo: true,
    materiais: [
      { materialId: 'mat-007', quantidadeUtilizada: 0.3, unidade: 'KG' },
      { materialId: 'mat-001', quantidadeUtilizada: 0.25, unidade: 'KG' },
      { materialId: 'mat-002', quantidadeUtilizada: 0.2, unidade: 'KG' },
      { materialId: 'mat-003', quantidadeUtilizada: 3, unidade: 'UN' },
      { materialId: 'mat-004', quantidadeUtilizada: 0.08, unidade: 'KG' },
      { materialId: 'mat-005', quantidadeUtilizada: 0.1, unidade: 'KG' },
      { materialId: 'mat-009', quantidadeUtilizada: 0.01, unidade: 'KG' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-02-01T09:00:00Z'
  },
  {
    id: 'prod-002',
    empresaId: '1',
    nome: 'Bolo Red Velvet',
    descricao: 'Clássico red velvet com cream cheese frosting',
    categoria: 'Bolos Especiais',
    margemLucro: 35,
    descontoMaximo: 5,
    ativo: true,
    materiais: [
      { materialId: 'mat-001', quantidadeUtilizada: 0.28, unidade: 'KG' },
      { materialId: 'mat-002', quantidadeUtilizada: 0.22, unidade: 'KG' },
      { materialId: 'mat-003', quantidadeUtilizada: 4, unidade: 'UN' },
      { materialId: 'mat-004', quantidadeUtilizada: 0.1, unidade: 'KG' },
      { materialId: 'mat-010', quantidadeUtilizada: 200, unidade: 'ML' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-02-10T11:00:00Z'
  },
  {
    id: 'prod-003',
    empresaId: '1',
    nome: 'Bolo de Chocolate Trufado',
    descricao: 'Bolo de chocolate com recheio de trufa e ganache',
    categoria: 'Bolos Especiais',
    margemLucro: 40,
    descontoMaximo: 5,
    ativo: true,
    materiais: [
      { materialId: 'mat-001', quantidadeUtilizada: 0.25, unidade: 'KG' },
      { materialId: 'mat-005', quantidadeUtilizada: 0.18, unidade: 'KG' },
      { materialId: 'mat-003', quantidadeUtilizada: 5, unidade: 'UN' },
      { materialId: 'mat-004', quantidadeUtilizada: 0.12, unidade: 'KG' },
      { materialId: 'mat-010', quantidadeUtilizada: 300, unidade: 'ML' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-03-05T14:00:00Z'
  },
  {
    id: 'prod-004',
    empresaId: '1',
    nome: 'Cupcake de Baunilha com Glacê',
    descricao: 'Cupcake fofinho de baunilha com cobertura de glacê real colorido',
    categoria: 'Cupcakes',
    margemLucro: 45,
    descontoMaximo: 8,
    ativo: true,
    materiais: [
      { materialId: 'mat-001', quantidadeUtilizada: 0.15, unidade: 'KG' },
      { materialId: 'mat-002', quantidadeUtilizada: 0.12, unidade: 'KG' },
      { materialId: 'mat-003', quantidadeUtilizada: 2, unidade: 'UN' },
      { materialId: 'mat-004', quantidadeUtilizada: 0.06, unidade: 'KG' },
      { materialId: 'mat-006', quantidadeUtilizada: 0.05, unidade: 'L' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-03-12T10:00:00Z'
  },
  {
    id: 'prod-005',
    empresaId: '1',
    nome: 'Cupcake de Chocolate com Nutella',
    descricao: 'Cupcake de chocolate recheado com Nutella e cobertura de brigadeiro',
    categoria: 'Cupcakes',
    margemLucro: 42,
    descontoMaximo: 8,
    ativo: true,
    materiais: [
      { materialId: 'mat-001', quantidadeUtilizada: 0.15, unidade: 'KG' },
      { materialId: 'mat-005', quantidadeUtilizada: 0.08, unidade: 'KG' },
      { materialId: 'mat-002', quantidadeUtilizada: 0.12, unidade: 'KG' },
      { materialId: 'mat-003', quantidadeUtilizada: 2, unidade: 'UN' },
      { materialId: 'mat-010', quantidadeUtilizada: 100, unidade: 'ML' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-03-18T14:00:00Z'
  },
  {
    id: 'prod-006',
    empresaId: '1',
    nome: 'Torta de Limão Siciliano',
    descricao: 'Torta cremosa de limão siciliano com base de biscoito e merengue italiano',
    categoria: 'Tortas',
    margemLucro: 38,
    descontoMaximo: 5,
    ativo: true,
    materiais: [
      { materialId: 'mat-001', quantidadeUtilizada: 0.2, unidade: 'KG' },
      { materialId: 'mat-002', quantidadeUtilizada: 0.25, unidade: 'KG' },
      { materialId: 'mat-003', quantidadeUtilizada: 6, unidade: 'UN' },
      { materialId: 'mat-004', quantidadeUtilizada: 0.1, unidade: 'KG' },
      { materialId: 'mat-010', quantidadeUtilizada: 200, unidade: 'ML' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-04-02T09:00:00Z'
  },
  {
    id: 'prod-007',
    empresaId: '1',
    nome: 'Torta Holandesa',
    descricao: 'Torta gelada com creme holandês, biscoito e cobertura de chocolate',
    categoria: 'Tortas',
    margemLucro: 40,
    descontoMaximo: 5,
    ativo: true,
    materiais: [
      { materialId: 'mat-005', quantidadeUtilizada: 0.12, unidade: 'KG' },
      { materialId: 'mat-002', quantidadeUtilizada: 0.18, unidade: 'KG' },
      { materialId: 'mat-004', quantidadeUtilizada: 0.15, unidade: 'KG' },
      { materialId: 'mat-010', quantidadeUtilizada: 400, unidade: 'ML' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-04-10T11:00:00Z'
  },
  {
    id: 'prod-008',
    empresaId: '1',
    nome: 'Brownie Fudge com Nozes',
    descricao: 'Brownie denso e úmido com pedaços de nozes e calda de chocolate amargo',
    categoria: 'Brownie & Cookies',
    margemLucro: 50,
    descontoMaximo: 10,
    ativo: true,
    materiais: [
      { materialId: 'mat-005', quantidadeUtilizada: 0.15, unidade: 'KG' },
      { materialId: 'mat-002', quantidadeUtilizada: 0.2, unidade: 'KG' },
      { materialId: 'mat-003', quantidadeUtilizada: 3, unidade: 'UN' },
      { materialId: 'mat-004', quantidadeUtilizada: 0.1, unidade: 'KG' },
      { materialId: 'mat-001', quantidadeUtilizada: 0.08, unidade: 'KG' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-04-18T14:00:00Z'
  },
  {
    id: 'prod-009',
    empresaId: '1',
    nome: 'Cookie de Chocolate Duplo',
    descricao: 'Cookie artesanal com gotas de chocolate ao leite e chocolate amargo',
    categoria: 'Brownie & Cookies',
    margemLucro: 52,
    descontoMaximo: 10,
    ativo: true,
    materiais: [
      { materialId: 'mat-001', quantidadeUtilizada: 0.2, unidade: 'KG' },
      { materialId: 'mat-005', quantidadeUtilizada: 0.12, unidade: 'KG' },
      { materialId: 'mat-002', quantidadeUtilizada: 0.15, unidade: 'KG' },
      { materialId: 'mat-003', quantidadeUtilizada: 2, unidade: 'UN' },
      { materialId: 'mat-004', quantidadeUtilizada: 0.1, unidade: 'KG' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-05-01T09:00:00Z'
  },
  {
    id: 'prod-010',
    empresaId: '1',
    nome: 'Pão de Mel com Chocolate Belga',
    descricao: 'Pão de mel recheado com doce de leite e banhado em chocolate belga 70%',
    categoria: 'Docinhos',
    margemLucro: 55,
    descontoMaximo: 0,
    ativo: true,
    materiais: [
      { materialId: 'mat-001', quantidadeUtilizada: 0.5, unidade: 'KG' },
      { materialId: 'mat-002', quantidadeUtilizada: 0.3, unidade: 'KG' },
      { materialId: 'mat-005', quantidadeUtilizada: 0.2, unidade: 'KG' },
      { materialId: 'mat-003', quantidadeUtilizada: 4, unidade: 'UN' },
      { materialId: 'mat-009', quantidadeUtilizada: 0.008, unidade: 'KG' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-05-10T10:00:00Z'
  },
  {
    id: 'prod-011',
    empresaId: '1',
    nome: 'Brigadeiro Gourmet (caixa 12 un)',
    descricao: 'Brigadeiros gourmet em 4 sabores: tradicional, pistache, maracujá e morango',
    categoria: 'Docinhos',
    margemLucro: 60,
    descontoMaximo: 0,
    ativo: true,
    materiais: [
      { materialId: 'mat-006', quantidadeUtilizada: 0.4, unidade: 'L' },
      { materialId: 'mat-005', quantidadeUtilizada: 0.08, unidade: 'KG' },
      { materialId: 'mat-002', quantidadeUtilizada: 0.05, unidade: 'KG' },
      { materialId: 'mat-004', quantidadeUtilizada: 0.02, unidade: 'KG' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-05-20T14:00:00Z'
  },
  {
    id: 'prod-012',
    empresaId: '1',
    nome: 'Cheesecake de Frutas Vermelhas',
    descricao: 'Cheesecake cremoso com calda de frutas vermelhas frescas e base amanteigada',
    categoria: 'Tortas',
    margemLucro: 42,
    descontoMaximo: 5,
    ativo: true,
    materiais: [
      { materialId: 'mat-002', quantidadeUtilizada: 0.15, unidade: 'KG' },
      { materialId: 'mat-003', quantidadeUtilizada: 4, unidade: 'UN' },
      { materialId: 'mat-004', quantidadeUtilizada: 0.08, unidade: 'KG' },
      { materialId: 'mat-010', quantidadeUtilizada: 300, unidade: 'ML' },
      { materialId: 'mat-001', quantidadeUtilizada: 0.1, unidade: 'KG' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-06-01T09:00:00Z'
  },
  {
    id: 'prod-013',
    empresaId: '1',
    nome: 'Bolo Naked Cake Floral',
    descricao: 'Bolo naked cake de baunilha com flores comestíveis e creme de mascarpone',
    categoria: 'Bolos Especiais',
    margemLucro: 45,
    descontoMaximo: 5,
    ativo: true,
    materiais: [
      { materialId: 'mat-001', quantidadeUtilizada: 0.4, unidade: 'KG' },
      { materialId: 'mat-002', quantidadeUtilizada: 0.35, unidade: 'KG' },
      { materialId: 'mat-003', quantidadeUtilizada: 6, unidade: 'UN' },
      { materialId: 'mat-004', quantidadeUtilizada: 0.15, unidade: 'KG' },
      { materialId: 'mat-010', quantidadeUtilizada: 250, unidade: 'ML' },
      { materialId: 'mat-009', quantidadeUtilizada: 0.015, unidade: 'KG' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-06-10T11:00:00Z'
  },
  {
    id: 'prod-014',
    empresaId: '1',
    nome: 'Muffin de Blueberry',
    descricao: 'Muffin americano com blueberries frescas e crumble de açúcar cristal',
    categoria: 'Cupcakes',
    margemLucro: 48,
    descontoMaximo: 10,
    ativo: false,
    materiais: [
      { materialId: 'mat-001', quantidadeUtilizada: 0.18, unidade: 'KG' },
      { materialId: 'mat-002', quantidadeUtilizada: 0.12, unidade: 'KG' },
      { materialId: 'mat-003', quantidadeUtilizada: 2, unidade: 'UN' },
      { materialId: 'mat-006', quantidadeUtilizada: 0.12, unidade: 'L' },
      { materialId: 'mat-004', quantidadeUtilizada: 0.04, unidade: 'KG' },
      { materialId: 'mat-009', quantidadeUtilizada: 0.008, unidade: 'KG' },
      { materialId: 'mat-008', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-06-20T14:00:00Z'
  },
  {
    id: 'prod-015',
    empresaId: '1',
    nome: 'Kit Festa Personalizado (porções)',
    descricao: 'Kit com 50 docinhos sortidos, bolo de 2 andares e 12 cupcakes temáticos para festas',
    categoria: 'Kits & Festas',
    margemLucro: 35,
    descontoMaximo: 3,
    ativo: true,
    materiais: [
      { materialId: 'mat-001', quantidadeUtilizada: 1.2, unidade: 'KG' },
      { materialId: 'mat-002', quantidadeUtilizada: 1.0, unidade: 'KG' },
      { materialId: 'mat-003', quantidadeUtilizada: 20, unidade: 'UN' },
      { materialId: 'mat-004', quantidadeUtilizada: 0.4, unidade: 'KG' },
      { materialId: 'mat-005', quantidadeUtilizada: 0.35, unidade: 'KG' },
      { materialId: 'mat-010', quantidadeUtilizada: 600, unidade: 'ML' },
      { materialId: 'mat-009', quantidadeUtilizada: 0.03, unidade: 'KG' },
      { materialId: 'mat-008', quantidadeUtilizada: 5, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-07-01T09:00:00Z'
  },

  // 🏭 Indústria — produtos fabricados (emp-002) — Anexo II 4,5%
  {
    id: 'prod-i01', empresaId: '2', tipo: 'PRODUTO',
    nome: 'Janela de Correr 2 Folhas (1,20 × 1,00m)',
    descricao: 'Janela de alumínio anodizado com 2 folhas de correr e vidro temperado 8mm',
    categoria: 'Janelas', margemLucro: 25, descontoMaximo: 8, ativo: true,
    materiais: [
      { materialId: 'mat-i01', quantidadeUtilizada: 8, unidade: 'M' },
      { materialId: 'mat-i02', quantidadeUtilizada: 1.2, unidade: 'M2' },
      { materialId: 'mat-i05', quantidadeUtilizada: 4, unidade: 'UN' },
      { materialId: 'mat-i06', quantidadeUtilizada: 6, unidade: 'M' },
      { materialId: 'mat-i07', quantidadeUtilizada: 20, unidade: 'UN' },
      { materialId: 'mat-i08', quantidadeUtilizada: 1, unidade: 'UN' },
      { materialId: 'mat-i11', quantidadeUtilizada: 5, unidade: 'M' },
      { materialId: 'mat-i12', quantidadeUtilizada: 4.4, unidade: 'M' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2023-07-01T09:00:00Z'
  },
  {
    id: 'prod-i02', empresaId: '2', tipo: 'PRODUTO',
    nome: 'Janela Maxim-ar (0,60 × 0,60m)',
    descricao: 'Janela basculante maxim-ar em alumínio com vidro temperado',
    categoria: 'Janelas', margemLucro: 28, descontoMaximo: 5, ativo: true,
    materiais: [
      { materialId: 'mat-i01', quantidadeUtilizada: 3, unidade: 'M' },
      { materialId: 'mat-i02', quantidadeUtilizada: 0.36, unidade: 'M2' },
      { materialId: 'mat-i10', quantidadeUtilizada: 1, unidade: 'UN' },
      { materialId: 'mat-i06', quantidadeUtilizada: 2.4, unidade: 'M' },
      { materialId: 'mat-i07', quantidadeUtilizada: 12, unidade: 'UN' },
      { materialId: 'mat-i08', quantidadeUtilizada: 0.5, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2023-07-15T09:00:00Z'
  },
  {
    id: 'prod-i03', empresaId: '2', tipo: 'PRODUTO',
    nome: 'Porta de Alumínio com Vidro (2,10 × 0,90m)',
    descricao: 'Porta de abrir em alumínio com fechadura multiponto e vidro temperado',
    categoria: 'Portas', margemLucro: 24, descontoMaximo: 8, ativo: true,
    materiais: [
      { materialId: 'mat-i01', quantidadeUtilizada: 6, unidade: 'M' },
      { materialId: 'mat-i02', quantidadeUtilizada: 1.0, unidade: 'M2' },
      { materialId: 'mat-i04', quantidadeUtilizada: 1, unidade: 'UN' },
      { materialId: 'mat-i06', quantidadeUtilizada: 5, unidade: 'M' },
      { materialId: 'mat-i07', quantidadeUtilizada: 24, unidade: 'UN' },
      { materialId: 'mat-i10', quantidadeUtilizada: 1, unidade: 'UN' },
      { materialId: 'mat-i08', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2023-08-02T09:00:00Z'
  },
  {
    id: 'prod-i04', empresaId: '2', tipo: 'PRODUTO',
    nome: 'Portão de Correr (3,00 × 2,00m)',
    descricao: 'Portão de correr em chapa de aço galvanizado com pintura eletrostática',
    categoria: 'Portões', margemLucro: 22, descontoMaximo: 10, ativo: true,
    materiais: [
      { materialId: 'mat-i03', quantidadeUtilizada: 6, unidade: 'M2' },
      { materialId: 'mat-i01', quantidadeUtilizada: 10, unidade: 'M' },
      { materialId: 'mat-i05', quantidadeUtilizada: 4, unidade: 'UN' },
      { materialId: 'mat-i07', quantidadeUtilizada: 40, unidade: 'UN' },
      { materialId: 'mat-i09', quantidadeUtilizada: 2, unidade: 'KG' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2023-08-20T09:00:00Z'
  },
  {
    id: 'prod-i05', empresaId: '2', tipo: 'PRODUTO',
    nome: 'Box de Banheiro Temperado',
    descricao: 'Box de banheiro em vidro temperado 8mm com perfis de alumínio',
    categoria: 'Vidros', margemLucro: 30, descontoMaximo: 5, ativo: true,
    materiais: [
      { materialId: 'mat-i02', quantidadeUtilizada: 1.8, unidade: 'M2' },
      { materialId: 'mat-i01', quantidadeUtilizada: 4, unidade: 'M' },
      { materialId: 'mat-i05', quantidadeUtilizada: 4, unidade: 'UN' },
      { materialId: 'mat-i08', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2023-09-10T09:00:00Z'
  },
  {
    id: 'prod-i06', empresaId: '2', tipo: 'PRODUTO',
    nome: 'Fachada Glazing Estrutural (por m²)',
    descricao: 'Fachada envidraçada estrutural com vidro temperado e fixação em silicone estrutural',
    categoria: 'Fachadas', margemLucro: 20, descontoMaximo: 5, ativo: false,
    materiais: [
      { materialId: 'mat-i01', quantidadeUtilizada: 2, unidade: 'M' },
      { materialId: 'mat-i02', quantidadeUtilizada: 1, unidade: 'M2' },
      { materialId: 'mat-i08', quantidadeUtilizada: 0.5, unidade: 'UN' },
      { materialId: 'mat-i07', quantidadeUtilizada: 8, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2023-10-05T09:00:00Z'
  },

  // 🛠️ Serviços — NexaTech (emp-003) — Anexo III 6% (Fator R ≥ 28%)
  {
    id: 'prod-s01', empresaId: '3', tipo: 'SERVICO',
    nome: 'Desenvolvimento de Sistema Web (pacote 200h)',
    descricao: 'Projeto de desenvolvimento full-stack com equipe multidisciplinar',
    categoria: 'Desenvolvimento', margemLucro: 40, descontoMaximo: 8, ativo: true,
    materiais: [
      { materialId: 'mat-s01', quantidadeUtilizada: 40, unidade: 'H' },
      { materialId: 'mat-s02', quantidadeUtilizada: 80, unidade: 'H' },
      { materialId: 'mat-s03', quantidadeUtilizada: 60, unidade: 'H' },
      { materialId: 'mat-s04', quantidadeUtilizada: 20, unidade: 'H' },
      { materialId: 'mat-s08', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-003', aliquotaPercentual: 6.0 }],
    createdAt: '2023-10-01T09:00:00Z'
  },
  {
    id: 'prod-s02', empresaId: '3', tipo: 'SERVICO',
    nome: 'Consultoria e Diagnóstico Técnico',
    descricao: 'Análise de arquitetura, code review e plano de modernização',
    categoria: 'Consultoria', margemLucro: 45, descontoMaximo: 5, ativo: true,
    materiais: [
      { materialId: 'mat-s06', quantidadeUtilizada: 24, unidade: 'H' },
      { materialId: 'mat-s01', quantidadeUtilizada: 16, unidade: 'H' },
      { materialId: 'mat-s07', quantidadeUtilizada: 3, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-003', aliquotaPercentual: 6.0 }],
    createdAt: '2023-11-01T09:00:00Z'
  },
  {
    id: 'prod-s03', empresaId: '3', tipo: 'SERVICO',
    nome: 'Sustentação Mensal (AMS)',
    descricao: 'Manutenção evolutiva e corretiva mensal com SLA e ambiente em nuvem',
    categoria: 'Sustentação', margemLucro: 35, descontoMaximo: 5, ativo: true,
    materiais: [
      { materialId: 'mat-s02', quantidadeUtilizada: 40, unidade: 'H' },
      { materialId: 'mat-s03', quantidadeUtilizada: 30, unidade: 'H' },
      { materialId: 'mat-s08', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-003', aliquotaPercentual: 6.0 }],
    createdAt: '2023-11-15T09:00:00Z'
  },
  {
    id: 'prod-s04', empresaId: '3', tipo: 'SERVICO',
    nome: 'Desenvolvimento de App Mobile',
    descricao: 'Aplicativo iOS/Android com backend, design e gestão de projeto',
    categoria: 'Desenvolvimento', margemLucro: 42, descontoMaximo: 8, ativo: true,
    materiais: [
      { materialId: 'mat-s01', quantidadeUtilizada: 50, unidade: 'H' },
      { materialId: 'mat-s02', quantidadeUtilizada: 90, unidade: 'H' },
      { materialId: 'mat-s05', quantidadeUtilizada: 40, unidade: 'H' },
      { materialId: 'mat-s04', quantidadeUtilizada: 25, unidade: 'H' },
    ],
    impostos: [{ impostoId: 'imp-003', aliquotaPercentual: 6.0 }],
    createdAt: '2024-01-10T09:00:00Z'
  },
  {
    id: 'prod-s05', empresaId: '3', tipo: 'SERVICO',
    nome: 'Auditoria de Segurança (Pentest)',
    descricao: 'Teste de intrusão, análise de vulnerabilidades e relatório executivo',
    categoria: 'Segurança', margemLucro: 48, descontoMaximo: 5, ativo: true,
    materiais: [
      { materialId: 'mat-s06', quantidadeUtilizada: 30, unidade: 'H' },
      { materialId: 'mat-s01', quantidadeUtilizada: 40, unidade: 'H' },
      { materialId: 'mat-s10', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-003', aliquotaPercentual: 6.0 }],
    createdAt: '2024-02-20T09:00:00Z'
  },
  {
    id: 'prod-s06', empresaId: '3', tipo: 'SERVICO',
    nome: 'Site Institucional / Landing Page',
    descricao: 'Site responsivo com design, desenvolvimento e SEO técnico',
    categoria: 'Web', margemLucro: 40, descontoMaximo: 10, ativo: true,
    materiais: [
      { materialId: 'mat-s05', quantidadeUtilizada: 30, unidade: 'H' },
      { materialId: 'mat-s02', quantidadeUtilizada: 25, unidade: 'H' },
      { materialId: 'mat-s03', quantidadeUtilizada: 15, unidade: 'H' },
    ],
    impostos: [{ impostoId: 'imp-003', aliquotaPercentual: 6.0 }],
    createdAt: '2024-03-05T09:00:00Z'
  },

  // 🏭 Indústria — produtos adicionais (emp-002)
  {
    id: 'prod-i07', empresaId: '2', tipo: 'PRODUTO',
    nome: 'Guarda-corpo de Vidro (por metro)',
    descricao: 'Guarda-corpo em vidro laminado com perfil de alumínio',
    categoria: 'Vidros', margemLucro: 28, descontoMaximo: 5, ativo: true,
    materiais: [
      { materialId: 'mat-i16', quantidadeUtilizada: 1, unidade: 'M2' },
      { materialId: 'mat-i14', quantidadeUtilizada: 2, unidade: 'M' },
      { materialId: 'mat-i07', quantidadeUtilizada: 6, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2023-11-05T09:00:00Z'
  },
  {
    id: 'prod-i08', empresaId: '2', tipo: 'PRODUTO',
    nome: 'Cobertura de Policarbonato (por m²)',
    descricao: 'Cobertura em policarbonato alveolar com estrutura de aço',
    categoria: 'Coberturas', margemLucro: 26, descontoMaximo: 8, ativo: true,
    materiais: [
      { materialId: 'mat-i13', quantidadeUtilizada: 1, unidade: 'M2' },
      { materialId: 'mat-i15', quantidadeUtilizada: 2, unidade: 'M' },
      { materialId: 'mat-i08', quantidadeUtilizada: 0.3, unidade: 'UN' },
      { materialId: 'mat-i07', quantidadeUtilizada: 8, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2023-12-01T09:00:00Z'
  },
  {
    id: 'prod-i09', empresaId: '2', tipo: 'PRODUTO',
    nome: 'Divisória de Vidro Temperado',
    descricao: 'Divisória de ambientes em vidro temperado com perfis de alumínio',
    categoria: 'Vidros', margemLucro: 30, descontoMaximo: 5, ativo: true,
    materiais: [
      { materialId: 'mat-i02', quantidadeUtilizada: 2, unidade: 'M2' },
      { materialId: 'mat-i01', quantidadeUtilizada: 5, unidade: 'M' },
      { materialId: 'mat-i07', quantidadeUtilizada: 12, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-01-15T09:00:00Z'
  },
  {
    id: 'prod-i10', empresaId: '2', tipo: 'PRODUTO',
    nome: 'Grade de Proteção (por m²)',
    descricao: 'Grade de proteção em tubo de aço com pintura eletrostática',
    categoria: 'Portões', margemLucro: 32, descontoMaximo: 10, ativo: true,
    materiais: [
      { materialId: 'mat-i15', quantidadeUtilizada: 8, unidade: 'M' },
      { materialId: 'mat-i09', quantidadeUtilizada: 1, unidade: 'KG' },
      { materialId: 'mat-i07', quantidadeUtilizada: 20, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-001', aliquotaPercentual: 4.5 }],
    createdAt: '2024-02-10T09:00:00Z'
  },

  // 🛠️ Serviços — NexaTech — serviços adicionais (emp-003) — Anexo III
  {
    id: 'prod-s07', empresaId: '3', tipo: 'SERVICO',
    nome: 'Treinamento e Capacitação Técnica',
    descricao: 'Workshop presencial de capacitação em tecnologia para a equipe do cliente',
    categoria: 'Consultoria', margemLucro: 50, descontoMaximo: 5, ativo: true,
    materiais: [
      { materialId: 'mat-s06', quantidadeUtilizada: 8, unidade: 'H' },
      { materialId: 'mat-s01', quantidadeUtilizada: 16, unidade: 'H' },
      { materialId: 'mat-s07', quantidadeUtilizada: 2, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-003', aliquotaPercentual: 6.0 }],
    createdAt: '2024-04-01T09:00:00Z'
  },
  {
    id: 'prod-s08', empresaId: '3', tipo: 'SERVICO',
    nome: 'Migração para Cloud',
    descricao: 'Migração de infraestrutura legada para nuvem com arquitetura escalável',
    categoria: 'Infraestrutura', margemLucro: 44, descontoMaximo: 8, ativo: true,
    materiais: [
      { materialId: 'mat-s06', quantidadeUtilizada: 30, unidade: 'H' },
      { materialId: 'mat-s02', quantidadeUtilizada: 50, unidade: 'H' },
      { materialId: 'mat-s08', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-003', aliquotaPercentual: 6.0 }],
    createdAt: '2024-04-20T09:00:00Z'
  },
  {
    id: 'prod-s09', empresaId: '3', tipo: 'SERVICO',
    nome: 'Integração de Sistemas (API)',
    descricao: 'Desenvolvimento de integrações entre sistemas via APIs REST/GraphQL',
    categoria: 'Desenvolvimento', margemLucro: 42, descontoMaximo: 5, ativo: true,
    materiais: [
      { materialId: 'mat-s01', quantidadeUtilizada: 40, unidade: 'H' },
      { materialId: 'mat-s02', quantidadeUtilizada: 30, unidade: 'H' },
      { materialId: 'mat-s09', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-003', aliquotaPercentual: 6.0 }],
    createdAt: '2024-05-10T09:00:00Z'
  },

  // 🛠️ Serviços enxuta — CodeLab (emp-004) — Anexo V 15,5% (Fator R < 28%)
  {
    id: 'prod-c01', empresaId: '4', tipo: 'SERVICO',
    nome: 'MVP de Startup (pacote)',
    descricao: 'Desenvolvimento de produto mínimo viável com time enxuto e freelancers',
    categoria: 'Desenvolvimento', margemLucro: 38, descontoMaximo: 8, ativo: true,
    materiais: [
      { materialId: 'mat-c01', quantidadeUtilizada: 60, unidade: 'H' },
      { materialId: 'mat-c02', quantidadeUtilizada: 100, unidade: 'H' },
      { materialId: 'mat-c04', quantidadeUtilizada: 40, unidade: 'H' },
      { materialId: 'mat-c05', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-004', aliquotaPercentual: 15.5 }],
    createdAt: '2024-03-01T09:00:00Z'
  },
  {
    id: 'prod-c02', empresaId: '4', tipo: 'SERVICO',
    nome: 'Manutenção sob Demanda',
    descricao: 'Pacote de horas de manutenção corretiva e evolutiva sob demanda',
    categoria: 'Sustentação', margemLucro: 35, descontoMaximo: 5, ativo: true,
    materiais: [
      { materialId: 'mat-c02', quantidadeUtilizada: 40, unidade: 'H' },
      { materialId: 'mat-c04', quantidadeUtilizada: 20, unidade: 'H' },
      { materialId: 'mat-c05', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-004', aliquotaPercentual: 15.5 }],
    createdAt: '2024-03-20T09:00:00Z'
  },
  {
    id: 'prod-c03', empresaId: '4', tipo: 'SERVICO',
    nome: 'Integração de Sistemas',
    descricao: 'Integração entre plataformas com apoio de especialista terceirizado',
    categoria: 'Desenvolvimento', margemLucro: 40, descontoMaximo: 5, ativo: true,
    materiais: [
      { materialId: 'mat-c01', quantidadeUtilizada: 30, unidade: 'H' },
      { materialId: 'mat-c03', quantidadeUtilizada: 20, unidade: 'H' },
      { materialId: 'mat-c06', quantidadeUtilizada: 1, unidade: 'UN' },
    ],
    impostos: [{ impostoId: 'imp-004', aliquotaPercentual: 15.5 }],
    createdAt: '2024-04-05T09:00:00Z'
  },
  {
    id: 'prod-c04', empresaId: '4', tipo: 'SERVICO',
    nome: 'Landing Page de Alta Conversão',
    descricao: 'Landing page otimizada para conversão com testes A/B',
    categoria: 'Web', margemLucro: 42, descontoMaximo: 8, ativo: true,
    materiais: [
      { materialId: 'mat-c02', quantidadeUtilizada: 30, unidade: 'H' },
      { materialId: 'mat-c01', quantidadeUtilizada: 10, unidade: 'H' },
    ],
    impostos: [{ impostoId: 'imp-004', aliquotaPercentual: 15.5 }],
    createdAt: '2024-04-25T09:00:00Z'
  },
]

// ─── Permissões ───────────────────────────────────────────────────────────────

export const mockPermissoes: Permissao[] = [
  { id: 'perm-01', chave: 'PRODUTO_READ', descricao: 'Visualizar produtos e fichas técnicas', modulo: 'Produtos' },
  { id: 'perm-02', chave: 'PRODUTO_WRITE', descricao: 'Criar e editar produtos', modulo: 'Produtos' },
  { id: 'perm-03', chave: 'MATERIAL_READ', descricao: 'Visualizar materiais e insumos', modulo: 'Materiais' },
  { id: 'perm-04', chave: 'MATERIAL_WRITE', descricao: 'Criar e editar materiais', modulo: 'Materiais' },
  { id: 'perm-05', chave: 'DESPESA_READ', descricao: 'Visualizar despesas fixas', modulo: 'Despesas' },
  { id: 'perm-06', chave: 'DESPESA_WRITE', descricao: 'Cadastrar e editar despesas fixas', modulo: 'Despesas' },
  { id: 'perm-07', chave: 'IMPOSTO_READ', descricao: 'Visualizar impostos e alíquotas', modulo: 'Impostos' },
  { id: 'perm-08', chave: 'IMPOSTO_WRITE', descricao: 'Alterar alíquotas de impostos', modulo: 'Impostos' },
  { id: 'perm-09', chave: 'RELATORIO_READ', descricao: 'Gerar e visualizar relatórios de precificação', modulo: 'Relatórios' },
  { id: 'perm-10', chave: 'USUARIO_READ', descricao: 'Visualizar usuários e acessos', modulo: 'Usuários' },
  { id: 'perm-11', chave: 'USUARIO_WRITE', descricao: 'Gerenciar usuários e vínculos', modulo: 'Usuários' },
  { id: 'perm-12', chave: 'EMPRESA_READ', descricao: 'Visualizar dados da empresa', modulo: 'Empresa' },
  { id: 'perm-13', chave: 'EMPRESA_WRITE', descricao: 'Editar configurações da empresa', modulo: 'Empresa' },
  { id: 'perm-14', chave: 'PERFIL_READ', descricao: 'Visualizar perfis e permissões', modulo: 'Perfis' },
  { id: 'perm-15', chave: 'PERFIL_WRITE', descricao: 'Criar e editar perfis RBAC', modulo: 'Perfis' },
]

// ─── Perfis ───────────────────────────────────────────────────────────────────

/**
 * ADMIN **global** (R09): visão de suporte sobre todas as empresas, independente
 * de dono ou compartilhamento. É o único perfil com `escopoGlobal`.
 */
export const perfilAdminGlobal: Perfil = {
  id: '1',
  nome: 'ADMIN',
  descricao: 'Administrador global — vê e opera todas as empresas (suporte)',
  permissoes: mockPermissoes,
  escopoGlobal: true,
}

/** Dono da empresa: acesso total, porém **restrito às empresas dele**. */
export const perfilProprietario: Perfil = {
  id: '2',
  nome: 'PROPRIETARIO',
  descricao: 'Proprietário — acesso total às empresas que possui',
  permissoes: mockPermissoes,
  escopoGlobal: false,
}

export const perfilGerente: Perfil = {
  id: '3',
  nome: 'GERENTE',
  descricao: 'Gerente — leitura e edição de produtos, materiais e relatórios',
  permissoes: mockPermissoes.filter(p =>
    ['PRODUTO_READ','PRODUTO_WRITE','MATERIAL_READ','MATERIAL_WRITE','DESPESA_READ','RELATORIO_READ','EMPRESA_READ'].includes(p.chave)
  ),
  escopoGlobal: false,
}

export const perfilVendedor: Perfil = {
  id: '4',
  nome: 'VENDEDOR',
  descricao: 'Vendedor — apenas visualização de produtos e preços',
  permissoes: mockPermissoes.filter(p =>
    ['PRODUTO_READ','RELATORIO_READ'].includes(p.chave)
  ),
  escopoGlobal: false,
}

export const perfilContador: Perfil = {
  id: '5',
  nome: 'CONTADOR',
  descricao: 'Contador — acesso a impostos, despesas e relatórios',
  permissoes: mockPermissoes.filter(p =>
    ['IMPOSTO_READ','IMPOSTO_WRITE','DESPESA_READ','DESPESA_WRITE','RELATORIO_READ','EMPRESA_READ'].includes(p.chave)
  ),
  escopoGlobal: false,
}

export const mockPerfis: Perfil[] = [
  perfilAdminGlobal,
  perfilProprietario,
  perfilGerente,
  perfilVendedor,
  perfilContador,
]

// ─── Usuários ─────────────────────────────────────────────────────────────────

/**
 * Cenário multi-usuário (R09). Donos: Ana→emp-001, Roberto→emp-002,
 * Juliana→emp-003, Diego→emp-004 — cada um só enxerga a(s) sua(s).
 * Edvaldo é ADMIN global e enxerga as quatro. Ana também foi **convidada**
 * para a NexaTech (emp-003), então vê duas: uma própria + uma compartilhada.
 */
export const mockUsuarios: Usuario[] = [
  {
    id: '1',
    nome: 'Edvaldo Santiago',
    email: 'admin@markup.com.br',
    ativo: true,
    // ADMIN global não precisa de vínculo: o escopo global já autoriza tudo
    empresas: [],
    perfilGlobal: perfilAdminGlobal
  },
  {
    id: '2',
    nome: 'Ana Paula Santos',
    email: 'ana@docesdaana.com.br',
    ativo: true,
    empresas: [
      { empresaId: '1', perfilId: perfilProprietario.id, perfil: perfilProprietario },
      // compartilhada: convidada como contadora na NexaTech
      { empresaId: '3', perfilId: perfilContador.id, perfil: perfilContador },
    ]
  },
  {
    id: '3',
    nome: 'Marcos Souza',
    email: 'marcos@docesdaana.com.br',
    ativo: true,
    empresas: [{ empresaId: '1', perfilId: perfilGerente.id, perfil: perfilGerente }]
  },
  {
    id: '4',
    nome: 'Carla Lima',
    email: 'carla@docesdaana.com.br',
    ativo: true,
    empresas: [{ empresaId: '1', perfilId: perfilVendedor.id, perfil: perfilVendedor }]
  },
  {
    id: '5',
    nome: 'Ricardo Alves',
    email: 'contador@contabilidade.com.br',
    ativo: false,
    empresas: [{ empresaId: '1', perfilId: perfilContador.id, perfil: perfilContador }]
  },
  {
    id: '6',
    nome: 'Roberto Menezes',
    email: 'roberto@metalforte.com.br',
    ativo: true,
    empresas: [{ empresaId: '2', perfilId: perfilProprietario.id, perfil: perfilProprietario }]
  },
  {
    id: '7',
    nome: 'Juliana Ferraz',
    email: 'juliana@nexatech.com.br',
    ativo: true,
    empresas: [{ empresaId: '3', perfilId: perfilProprietario.id, perfil: perfilProprietario }]
  },
  {
    id: '8',
    nome: 'Diego Prado',
    email: 'diego@codelab.com.br',
    ativo: true,
    empresas: [{ empresaId: '4', perfilId: perfilProprietario.id, perfil: perfilProprietario }]
  },
]


// ─── Realismo: alíquota efetiva por faixa de faturamento ──────────────────────
// O DAS é único por empresa (baseado no RBT12), não por produto. Aqui aplicamos a
// alíquota EFETIVA aproximada da faixa de faturamento de cada empresa, sobrescrevendo
// a alíquota nominal de 1ª faixa usada inline nos produtos acima.
const aliquotaEfetivaPorEmpresa: Record<string, number> = {
  '1': 7.8,   // Confeitaria — Anexo II, faixa 3 (~R$ 624 mil/ano)
  '2': 12.3,  // Indústria — Anexo II, faixa 5 (~R$ 3,6 mi/ano)
  '3': 14.4,  // NexaTech — Anexo III, faixa 5 (~R$ 1,9 mi/ano), Fator R ≥ 28%
  '4': 19.3,  // CodeLab — Anexo V, faixa 4 (~R$ 1,44 mi/ano), Fator R < 28%
}
for (const p of mockProdutos) {
  const aliq = aliquotaEfetivaPorEmpresa[p.empresaId]
  if (aliq !== undefined) {
    p.impostos = p.impostos.map(pi => ({ ...pi, aliquotaPercentual: aliq }))
  }
}
