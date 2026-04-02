import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Settings, DollarSign, Activity, LayoutGrid } from 'lucide-react';

const CUSTO_AVE_CONVENCIONAL = 60;
const CUSTO_AVE_AUTOMATICO   = 100;
const OVOS_POR_BANDEJA       = 30;

const App = () => {
  const [areaTotal]                                = useState(6);
  const [custoProducao,     setCustoProducao]      = useState(10.50);
  const [precoVenda,        setPrecoVenda]         = useState(15.0);
  const [taxaPostura,       setTaxaPostura]        = useState(85);
  const [areaUtilizada,     setAreaUtilizada]      = useState(20);
  const [mortalidadeMensal, setMortalidadeMensal]  = useState(0.5);
  const [custoMaoObra,      setCustoMaoObra]       = useState(0);
  const [custoEnergia,      setCustoEnergia]       = useState(0);
  const [custoVeterinario,  setCustoVeterinario]   = useState(0);
  const [custoManutencao,   setCustoManutencao]    = useState(0);
  const [activeTab,         setActiveTab]          = useState('dashboard');
  const [totalInvestido,    setTotalInvestido]     = useState(2000000);
  const [densidadeConv,     setDensidadeConv]      = useState(10);
  const [densidadeAuto,     setDensidadeAuto]      = useState(35);
  const [areaSimulada,      setAreaSimulada]       = useState(20);

  const m2PorHectare = 10000;

  const fmt$ = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
  const fmtN = (v) => new Intl.NumberFormat('pt-BR').format(Math.floor(v || 0));

  // ── Função central — usada por todas as abas ──────────────────────────────
  const calcularSistema = (
    nome, numAves, custoPorAveEquip, numFuncionarios
  ) => {
    // FIX PRINCIPAL: mortalidade aplicada de forma consistente em todas as abas
    const mortesAoMes         = Math.floor(numAves * (mortalidadeMensal / 100));
    const avesProdutivasMedia = numAves - mortesAoMes / 2;
    const producaoDiariaOvos  = avesProdutivasMedia * (taxaPostura / 100);
    const bandejasMes         = (producaoDiariaOvos / OVOS_POR_BANDEJA) * 30;
    const ovosProducaoMensal  = producaoDiariaOvos * 30;
    const receitaMensal       = bandejasMes * precoVenda;
    const receitaAnual        = receitaMensal * 12;
    const custoRacaoMensal    = bandejasMes * custoProducao;
    const custoMaoObraTotal   = custoMaoObra * numFuncionarios;
    const custosTotaisMensais =
      custoRacaoMensal + custoMaoObraTotal + custoEnergia + custoVeterinario + custoManutencao;
    const lucroMensal         = receitaMensal - custosTotaisMensais;
    const lucroAnual          = lucroMensal * 12;
    const margemLucro         = receitaMensal > 0 ? (lucroMensal / receitaMensal) * 100 : 0;
    const investimentoTotal   = numAves * custoPorAveEquip;
    const paybackMeses        = lucroMensal > 0 ? investimentoTotal / lucroMensal : Infinity;
    const roiAnual            = investimentoTotal > 0 ? (lucroAnual / investimentoTotal) * 100 : 0;
    const pontoEquil          = precoVenda > 0 ? custosTotaisMensais / precoVenda : 0;
    const lucroPorAve         = numAves > 0 ? lucroMensal / numAves : 0;
    const lucroPorBandeja     = precoVenda - custoProducao;
    const lucroPorOvo         = lucroPorBandeja / OVOS_POR_BANDEJA;

    const projecao12Meses = Array.from({ length: 12 }, (_, i) => {
      const fator = Math.max(0, 1 - i * (mortalidadeMensal / 100));
      return {
        mes:     `M${i + 1}`,
        receita: receitaMensal * fator,
        custo:   custosTotaisMensais,
        lucro:   lucroMensal * fator,
      };
    });

    return {
      nome, numAves, mortesAoMes, bandejasMes, ovosProducaoMensal,
      receitaMensal, receitaAnual, custosTotaisMensais,
      lucroMensal, lucroAnual, margemLucro,
      investimentoTotal, paybackMeses, roiAnual,
      pontoEquilMensalBandejas: pontoEquil,
      lucroPorAve, lucroPorBandeja, lucroPorOvo,
      projecao12Meses,
    };
  };

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const dadosSistemas = useMemo(() => {
    const area = areaTotal * m2PorHectare * (areaUtilizada / 100);
    return [
      calcularSistema('Convencional (Piramidal)', Math.floor(area * 10),  CUSTO_AVE_CONVENCIONAL, 3),
      calcularSistema('Automático (Vertical)',     Math.floor(area * 35),  CUSTO_AVE_AUTOMATICO,   2),
    ];
  }, [areaTotal, custoProducao, precoVenda, taxaPostura, areaUtilizada,
      mortalidadeMensal, custoMaoObra, custoEnergia, custoVeterinario, custoManutencao]);

  // ── Investimento — CORRIGIDO ───────────────────────────────────────────────
  // FIX 1: usa calcularSistema (aplica mortalidade igual às outras abas)
  // FIX 2: mortalidadeMensal incluído nas dependências
  const simulacaoInvestimento = useMemo(() => {
    const conv = calcularSistema(
      'Convencional (Piramidal)',
      Math.floor(totalInvestido / CUSTO_AVE_CONVENCIONAL),
      CUSTO_AVE_CONVENCIONAL, 3
    );
    const auto = calcularSistema(
      'Automático (Vertical)',
      Math.floor(totalInvestido / CUSTO_AVE_AUTOMATICO),
      CUSTO_AVE_AUTOMATICO, 2
    );
    // Payback baseado no capital investido (não no investimentoTotal calculado por área)
    const convComPayback = {
      ...conv,
      paybackMeses: conv.lucroMensal > 0 ? totalInvestido / conv.lucroMensal : Infinity,
      roiAnual:     totalInvestido > 0   ? (conv.lucroAnual / totalInvestido) * 100 : 0,
    };
    const autoComPayback = {
      ...auto,
      paybackMeses: auto.lucroMensal > 0 ? totalInvestido / auto.lucroMensal : Infinity,
      roiAnual:     totalInvestido > 0   ? (auto.lucroAnual / totalInvestido) * 100 : 0,
    };
    return [
      { ...convComPayback, cor: '#f97316', custoPorAve: CUSTO_AVE_CONVENCIONAL },
      { ...autoComPayback, cor: '#3b82f6', custoPorAve: CUSTO_AVE_AUTOMATICO  },
    ];
  }, [totalInvestido, taxaPostura, precoVenda, custoProducao, mortalidadeMensal,
      custoMaoObra, custoEnergia, custoVeterinario, custoManutencao]);

  // ── Densidade ─────────────────────────────────────────────────────────────
  const simulacaoDensidade = useMemo(() => {
    const area = areaTotal * m2PorHectare * (areaSimulada / 100);

    const conv = calcularSistema(
      'Convencional (Piramidal)', Math.floor(area * densidadeConv), CUSTO_AVE_CONVENCIONAL, 3
    );
    const auto = calcularSistema(
      'Automático (Vertical)', Math.floor(area * densidadeAuto), CUSTO_AVE_AUTOMATICO, 2
    );

    const curvaComparada = Array.from({ length: 50 }, (_, i) => {
      const d     = i + 1;
      const avC   = Math.floor(area * d);
      const avA   = Math.floor(area * d);
      const sC    = calcularSistema('c', avC, CUSTO_AVE_CONVENCIONAL, 3);
      const sA    = calcularSistema('a', avA, CUSTO_AVE_AUTOMATICO,   2);
      return { densidade: d, convencional: sC.lucroMensal, automatico: sA.lucroMensal };
    });

    return { conv, auto, curvaComparada };
  }, [areaTotal, areaSimulada, densidadeConv, densidadeAuto,
      custoProducao, precoVenda, taxaPostura, mortalidadeMensal,
      custoMaoObra, custoEnergia, custoVeterinario, custoManutencao]);

  const cores = ['#f97316', '#3b82f6'];

  const tabs = [
    { id: 'dashboard',    label: 'Dashboard',    Icon: Activity   },
    { id: 'densidade',    label: 'Densidade',    Icon: LayoutGrid  },
    { id: 'investimento', label: 'Investimento', Icon: DollarSign  },
    { id: 'projecao',     label: 'Projeção',     Icon: TrendingUp  },
  ];

  const InputField = ({ label, value, onChange, prefix = 'R$', step = '0.01' }) => (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-2 text-slate-400 text-sm">{prefix}</span>}
        <input
          type="number" step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full ${prefix ? 'pl-10' : 'pl-4'} pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm`}
        />
      </div>
    </div>
  );

  const SliderField = ({ label, value, onChange, min, max, step = 1, unit = '', hexColor = '#2563eb' }) => (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <span className="text-sm font-bold" style={{ color: hexColor }}>{value} {unit}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
        style={{ accentColor: hexColor }}
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{min} {unit}</span><span>{max} {unit}</span>
      </div>
    </div>
  );

  const GradeAves = ({ densidade, cor, max = 60 }) => {
    const total  = Math.min(densidade, max);
    const extras = Math.max(0, densidade - max);
    return (
      <div>
        <div className="flex flex-wrap gap-[3px]">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: cor, opacity: 0.75 }} />
          ))}
        </div>
        {extras > 0 && <p className="text-xs text-slate-400 mt-1">+ {fmtN(extras)} fora da escala visual</p>}
      </div>
    );
  };

  const MetricRow = ({ label, value }) => (
    <div className="flex justify-between border-b border-slate-50 pb-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );

  return (
    
    <div className="min-h-screen w-full bg-slate-50 p-4 md:p-8 font-sans text-slate-800">

      <header className="max-w-screen-2xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Activity className="text-orange-500" />
          Simulador de Produção da THEO OVOS
        </h1>
        <p className="text-slate-500 mt-1">
          Unidade: <strong>bandeja de {OVOS_POR_BANDEJA} ovos</strong> — Referência CEASA Recife
          &nbsp;·&nbsp; Base: {areaTotal} hectares
        </p>
        <div className="flex gap-2 mt-4 flex-wrap">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={16} />{label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Painel de Controles ── */}
        <div className="lg:col-span-1 space-y-6">

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings size={20} className="text-blue-500" />
              Parâmetros Produtivos
            </h2>
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <p className="font-bold mb-1">Referência CEASA Recife</p>
                <p>Cx. 30 Dz (360 ovos) = R$ 180,00</p>
                <p>→ R$ 0,50/ovo → <strong>R$ 4,50/bandeja de 30 ovos</strong></p>
              </div>
              <InputField label="Preço de Venda (Bandeja 30 ovos)"    value={precoVenda}    onChange={setPrecoVenda}    step="0.10" />
              <InputField label="Custo de Produção (Bandeja 30 ovos)" value={custoProducao} onChange={setCustoProducao} step="0.10" />
              <div className={`rounded-xl p-3 text-sm text-center font-semibold ${
                precoVenda - custoProducao >= 0
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                Margem: {fmt$(precoVenda - custoProducao)}/bandeja
                &nbsp;·&nbsp;
                {fmt$((precoVenda - custoProducao) / OVOS_POR_BANDEJA)}/ovo
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Taxa de Postura (%)</label>
                <input type="number" min="50" max="100" step="1" value={taxaPostura}
                  onChange={(e) => setTaxaPostura(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Mortalidade Mensal (%)</label>
                <input type="number" min="0" max="5" step="0.1" value={mortalidadeMensal}
                  onChange={(e) => setMortalidadeMensal(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Área p/ Galpões: {areaUtilizada}% ({areaUtilizada * 600} m²)
                </label>
                <input type="range" min="5" max="50" step="1" value={areaUtilizada}
                  onChange={(e) => setAreaUtilizada(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>5%</span><span>50%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-green-500" />
              Custos Recorrentes / Mês
            </h2>
            <div className="space-y-4">
              <InputField label="Custo por Funcionário"  value={custoMaoObra}     onChange={setCustoMaoObra}     step="100" />
              <InputField label="Energia Elétrica"        value={custoEnergia}    onChange={setCustoEnergia}     step="100" />
              <InputField label="Veterinário / Sanidade"  value={custoVeterinario} onChange={setCustoVeterinario} step="50"  />
              <InputField label="Manutenção Geral"        value={custoManutencao} onChange={setCustoManutencao}  step="50"  />
            </div>
            <p className="text-xs text-slate-400 mt-4">* Piramidal: 3 funcionários. Automático: 2 funcionários.</p>
          </div>

          <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg">
            <h3 className="font-bold mb-2">Resumo da Área</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div className="bg-blue-700/50 p-3 rounded-xl">
                <p className="text-xs opacity-80 uppercase">Galpões</p>
                <p className="text-xl font-bold">{fmtN(areaTotal * 10000 * (areaUtilizada / 100))} m²</p>
              </div>
              <div className="bg-blue-700/50 p-3 rounded-xl">
                <p className="text-xs opacity-80 uppercase">Área Livre</p>
                <p className="text-xl font-bold">{fmtN(areaTotal * 10000 * (1 - areaUtilizada / 100))} m²</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Conteúdo Principal ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* ===== DASHBOARD ===== */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dadosSistemas.map((s, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10"
                      style={{ backgroundColor: cores[idx] }} />
                    <h3 className="text-lg font-bold mb-4">{s.nome}</h3>
                    <div className="space-y-3 text-sm">
                      <MetricRow label="Capacidade de Aves"        value={fmtN(s.numAves)} />
                      <MetricRow label="Mortes Est. / Mês"         value={fmtN(s.mortesAoMes) + ' aves'} />
                      <MetricRow label="Ovos Produzidos / Mês"     value={fmtN(s.ovosProducaoMensal) + ' ovos'} />
                      <MetricRow label="Bandejas Produzidas / Mês" value={fmtN(s.bandejasMes) + ' bandejas'} />
                      <MetricRow label="Receita Mensal"            value={fmt$(s.receitaMensal)} />
                      <MetricRow label="Custos Totais / Mês"       value={fmt$(s.custosTotaisMensais)} />
                      <MetricRow label="Margem de Lucro"           value={s.margemLucro.toFixed(1) + '%'} />
                      <MetricRow label="Lucro por Bandeja"         value={fmt$(s.lucroPorBandeja)} />
                      <MetricRow label="Lucro por Ovo"             value={fmt$(s.lucroPorOvo)} />
                      <MetricRow label="Lucro por Ave / Mês"       value={fmt$(s.lucroPorAve)} />
                      <MetricRow label="Ponto de Equilíbrio"       value={fmtN(s.pontoEquilMensalBandejas) + ' bandejas/mês'} />
                      <div className="flex justify-between pt-2">
                        <span className="text-slate-500">Lucro Líquido Mensal</span>
                        <span className={`font-bold text-xl ${s.lucroMensal >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {fmt$(s.lucroMensal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-500" />
                  Comparativo de Receita, Custo e Lucro Mensal
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosSistemas}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => fmt$(v)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }} />
                      <Legend />
                      <Bar dataKey="receitaMensal"       name="Receita" fill="#3b82f6" radius={[6,6,0,0]} />
                      <Bar dataKey="custosTotaisMensais" name="Custo"   fill="#f43f5e" radius={[6,6,0,0]} />
                      <Bar dataKey="lucroMensal"         name="Lucro"   fill="#10b981" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold mb-3">Análise Estratégica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                    <h4 className="font-bold text-orange-800 mb-2">Convencional (Piramidal)</h4>
                    <ul className="text-orange-700 space-y-1 list-disc ml-4">
                      <li>Custo de implantação: R$ {CUSTO_AVE_CONVENCIONAL}/ave.</li>
                      <li>Maior necessidade de mão de obra (3 funcionários).</li>
                      <li>Densidade técnica padrão: 10 aves/m².</li>
                      <li>Indicado para expansão gradual.</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <h4 className="font-bold text-blue-800 mb-2">Automático (Vertical)</h4>
                    <ul className="text-blue-700 space-y-1 list-disc ml-4">
                      <li>Custo de implantação: R$ {CUSTO_AVE_AUTOMATICO}/ave.</li>
                      <li>Coleta e alimentação automatizadas (2 funcionários).</li>
                      <li>Densidade técnica padrão: 35 aves/m² (5–6 andares).</li>
                      <li>Maior escalabilidade na mesma área.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== DENSIDADE ===== */}
          {activeTab === 'densidade' && (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <LayoutGrid size={20} className="text-purple-500" />
                  Simulação Interativa de Densidade
                </h2>
                <p className="text-sm text-slate-500 mb-5">
                  Ajuste a densidade de aves por m² em cada sistema e veja o impacto direto na produção e no lucro mensal.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SliderField label="Área utilizada p/ galpões" value={areaSimulada}  onChange={setAreaSimulada}  min={5}  max={50} unit="%" hexColor="#2563eb" />
                  <SliderField label="Densidade Convencional"    value={densidadeConv} onChange={setDensidadeConv} min={1}  max={20} unit="aves/m²" hexColor="#ea580c" />
                  <SliderField label="Densidade Automático"      value={densidadeAuto} onChange={setDensidadeAuto} min={1}  max={60} unit="aves/m²" hexColor="#2563eb" />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { d: densidadeConv, limite: 10, label: 'Convencional' },
                    { d: densidadeAuto, limite: 35, label: 'Automático'   },
                  ].map((item) => (
                    <div key={item.label} className={`p-3 rounded-xl text-xs text-center border ${
                      item.d <= item.limite     ? 'bg-green-50 border-green-200 text-green-700'
                      : item.d <= item.limite * 1.5 ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <p className="font-bold">{item.label}: {item.d} aves/m²</p>
                      <p className="mt-1">
                        {item.d <= item.limite
                          ? `✓ Dentro do limite técnico recomendado (≤ ${item.limite})`
                          : item.d <= item.limite * 1.5
                            ? '⚠ Acima do ideal — risco sanitário moderado'
                            : '✗ Superlotação — alto risco sanitário'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: 'Convencional (Piramidal)', densidade: densidadeConv, cor: '#f97316', dados: simulacaoDensidade.conv },
                  { label: 'Automático (Vertical)',    densidade: densidadeAuto, cor: '#3b82f6', dados: simulacaoDensidade.auto },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold mb-1" style={{ color: item.cor }}>{item.label}</h3>
                    <p className="text-xs text-slate-400 mb-4">
                      {item.densidade} aves/m² · {fmtN(areaTotal * m2PorHectare * (areaSimulada / 100))} m² construídos
                    </p>
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 mb-2">Representação visual (cada bloco = 1 ave/m²)</p>
                      <div className="bg-slate-50 p-3 rounded-xl min-h-[60px]">
                        <GradeAves densidade={item.densidade} cor={item.cor} max={60} />
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <MetricRow label="Total de Aves"         value={fmtN(item.dados.numAves)} />
                      <MetricRow label="Mortes Est. / Mês"     value={fmtN(item.dados.mortesAoMes) + ' aves'} />
                      <MetricRow label="Bandejas / Mês"        value={fmtN(item.dados.bandejasMes) + ' bandejas'} />
                      <MetricRow label="Ovos / Mês"            value={fmtN(item.dados.ovosProducaoMensal) + ' ovos'} />
                      <MetricRow label="Receita Mensal"        value={fmt$(item.dados.receitaMensal)} />
                      <MetricRow label="Custos Mensais"        value={fmt$(item.dados.custosTotaisMensais)} />
                      <MetricRow label="Margem"                value={item.dados.margemLucro.toFixed(1) + '%'} />
                      <MetricRow label="Investimento Estimado" value={fmt$(item.dados.investimentoTotal)} />
                      <MetricRow label="Payback"               value={item.dados.paybackMeses === Infinity ? '—' : item.dados.paybackMeses.toFixed(0) + ' meses'} />
                      <MetricRow label="ROI Anual"             value={item.dados.roiAnual.toFixed(1) + '%'} />
                      <div className="flex justify-between pt-2">
                        <span className="text-slate-500">Lucro Líquido Mensal</span>
                        <span className={`font-bold text-xl ${item.dados.lucroMensal >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {fmt$(item.dados.lucroMensal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-semibold mb-1">Curva de Lucro Mensal por Densidade (1 a 50 aves/m²)</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Área simulada: {areaSimulada}% ({fmtN(areaTotal * m2PorHectare * (areaSimulada / 100))} m²)
                </p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={simulacaoDensidade.curvaComparada}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="densidade" label={{ value: 'aves/m²', position: 'insideBottomRight', offset: -5, fontSize: 11 }} tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => fmt$(v)} labelFormatter={(l) => `${l} aves/m²`} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="convencional" name="Convencional (Piramidal)" stroke="#f97316" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="automatico"   name="Automático (Vertical)"    stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                    <p className="text-xs text-orange-500 font-bold uppercase">Convencional selecionado</p>
                    <p className="text-lg font-bold text-orange-700">{densidadeConv} aves/m²</p>
                    <p className="text-orange-600 font-semibold">{fmt$(simulacaoDensidade.conv.lucroMensal)}/mês</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                    <p className="text-xs text-blue-500 font-bold uppercase">Automático selecionado</p>
                    <p className="text-lg font-bold text-blue-700">{densidadeAuto} aves/m²</p>
                    <p className="text-blue-600 font-semibold">{fmt$(simulacaoDensidade.auto.lucroMensal)}/mês</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                <h3 className="font-semibold mb-4">Projeção de Lucro por Faixa de Densidade</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="pb-2 font-medium">Densidade</th>
                      <th className="pb-2 font-medium text-orange-600">Convencional — Lucro/mês</th>
                      <th className="pb-2 font-medium text-blue-600">Automático — Lucro/mês</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[2, 5, 10, 15, 20, 25, 30, 35, 40, 50].map((d) => {
                      const area  = areaTotal * m2PorHectare * (areaSimulada / 100);
                      const sC    = calcularSistema('c', Math.floor(area * d), CUSTO_AVE_CONVENCIONAL, 3);
                      const sA    = calcularSistema('a', Math.floor(area * d), CUSTO_AVE_AUTOMATICO,   2);
                      const ativo = d === densidadeConv || d === densidadeAuto;
                      return (
                        <tr key={d} className={ativo ? 'bg-blue-50 font-bold' : 'hover:bg-slate-50'}>
                          <td className="py-2 text-slate-600">{d} aves/m²</td>
                          <td className={`py-2 ${sC.lucroMensal >= 0 ? 'text-orange-600' : 'text-red-500'}`}>{fmt$(sC.lucroMensal)}</td>
                          <td className={`py-2 ${sA.lucroMensal >= 0 ? 'text-blue-600'   : 'text-red-500'}`}>{fmt$(sA.lucroMensal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-xs text-slate-400 mt-3">* Linhas destacadas correspondem às densidades selecionadas nos sliders acima.</p>
              </div>
            </>
          )}

          {/* ===== INVESTIMENTO ===== */}
          {activeTab === 'investimento' && (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                  <DollarSign size={20} className="text-green-500" />
                  Simulação por Capital Disponível
                </h2>
                <p className="text-sm text-slate-500 mb-5">
                  Informe o total que deseja investir e veja quantas aves cada sistema comporta,
                  além dos retornos esperados em bandejas de {OVOS_POR_BANDEJA} ovos.
                </p>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-600">Total a Investir</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-medium">R$</span>
                    <input
                      type="number" step="1000" min="0" value={totalInvestido}
                      onChange={(e) => setTotalInvestido(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold text-slate-800"
                    />
                  </div>
                  <input
                    type="range" min="10000" max="5000000" step="10000" value={totalInvestido}
                    onChange={(e) => setTotalInvestido(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>R$ 10 mil</span>
                    <span className="font-semibold text-blue-600">{fmt$(totalInvestido)}</span>
                    <span>R$ 5 milhões</span>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    { label: 'Convencional', custo: CUSTO_AVE_CONVENCIONAL, cls: 'bg-orange-50 border-orange-200 text-orange-700' },
                    { label: 'Automático',   custo: CUSTO_AVE_AUTOMATICO,   cls: 'bg-blue-50 border-blue-200 text-blue-700'       },
                  ].map((item) => (
                    <div key={item.label} className={`p-3 rounded-xl border text-center ${item.cls}`}>
                      <p className="text-xs font-bold uppercase opacity-70">{item.label}</p>
                      <p className="text-lg font-bold">R$ {item.custo}/ave</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {simulacaoInvestimento.map((s, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border-2 relative overflow-hidden"
                    style={{ borderColor: s.cor + '55' }}>
                    <div className="absolute top-0 right-0 w-28 h-28 -mr-10 -mt-10 rounded-full opacity-10"
                      style={{ backgroundColor: s.cor }} />
                    <h3 className="text-lg font-bold mb-1" style={{ color: s.cor }}>{s.nome}</h3>
                    <p className="text-xs text-slate-400 mb-4">R$ {s.custoPorAve} por ave implantada</p>

                    <div className="rounded-xl p-4 mb-4 text-center" style={{ backgroundColor: s.cor + '18' }}>
                      <p className="text-xs uppercase font-bold opacity-60" style={{ color: s.cor }}>
                        Aves Financiadas com {fmt$(totalInvestido)}
                      </p>
                      <p className="text-4xl font-extrabold mt-1" style={{ color: s.cor }}>
                        {fmtN(s.numAves)}
                      </p>
                      <p className="text-xs opacity-60 mt-1" style={{ color: s.cor }}>aves</p>
                    </div>

                    <div className="space-y-3 text-sm">
                      <MetricRow label="Mortes Est. / Mês"    value={fmtN(s.mortesAoMes) + ' aves'} />
                      <MetricRow label="Bandejas Est. / Mês"  value={fmtN(s.bandejasMes) + ' bandejas'} />
                      <MetricRow label="Receita Mensal Est."  value={fmt$(s.receitaMensal)} />
                      <MetricRow label="Custos Mensais"       value={fmt$(s.custosTotaisMensais)} />
                      <MetricRow label="Margem de Lucro"      value={s.margemLucro.toFixed(1) + '%'} />
                      <MetricRow label="Lucro Anual Est."     value={fmt$(s.lucroAnual)} />
                      <MetricRow label="ROI Anual Est."       value={s.roiAnual.toFixed(1) + '%'} />
                      <MetricRow label="Payback Est."         value={s.paybackMeses === Infinity ? '—' : s.paybackMeses.toFixed(0) + ' meses'} />
                      <div className="flex justify-between pt-2">
                        <span className="text-slate-500">Lucro Líquido Mensal</span>
                        <span className={`font-bold text-xl ${s.lucroMensal >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {fmt$(s.lucroMensal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-semibold mb-4">Comparativo Visual — Retorno Mensal por Sistema</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={simulacaoInvestimento}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => fmt$(v)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,.1)' }} />
                      <Legend />
                      <Bar dataKey="receitaMensal"       name="Receita Mensal" fill="#3b82f6" radius={[6,6,0,0]} />
                      <Bar dataKey="custosTotaisMensais" name="Custo Mensal"   fill="#f43f5e" radius={[6,6,0,0]} />
                      <Bar dataKey="lucroMensal"         name="Lucro Mensal"   fill="#10b981" radius={[6,6,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                <h3 className="font-semibold mb-4">Referência: Aves por Faixa de Investimento</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="pb-2 font-medium">Capital</th>
                      <th className="pb-2 font-medium text-orange-600">Convencional (R$ {CUSTO_AVE_CONVENCIONAL}/ave)</th>
                      <th className="pb-2 font-medium text-blue-600">Automático (R$ {CUSTO_AVE_AUTOMATICO}/ave)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[50000, 100000, 250000, 500000, 1000000, 2000000, 5000000].map((val) => (
                      <tr key={val} className={`transition-colors ${val === totalInvestido ? 'bg-blue-50 font-bold' : 'hover:bg-slate-50'}`}>
                        <td className="py-2 text-slate-600">{fmt$(val)}</td>
                        <td className="py-2 text-orange-600">{fmtN(val / CUSTO_AVE_CONVENCIONAL)} aves</td>
                        <td className="py-2 text-blue-600">{fmtN(val / CUSTO_AVE_AUTOMATICO)} aves</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-slate-400 mt-3">
                  * Valores de referência. O custo real por ave pode variar conforme fornecedor, região e escala.
                </p>
              </div>
            </>
          )}

          {/* ===== PROJEÇÃO ===== */}
          {activeTab === 'projecao' && (
            <>
              {dadosSistemas.map((s, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <h3 className="font-bold mb-1" style={{ color: cores[idx] }}>{s.nome}</h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Projeção de 12 meses com decaimento por mortalidade acumulada ({mortalidadeMensal}%/mês)
                  </p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={s.projecao12Meses}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => fmt$(v)} contentStyle={{ borderRadius: 12, border: 'none' }} />
                        <Legend />
                        <Line type="monotone" dataKey="receita" name="Receita" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="custo"   name="Custo"   stroke="#f43f5e" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="lucro"   name="Lucro"   stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                <h3 className="font-bold mb-4">Resumo Anual Comparativo</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="pb-2 font-medium">Métrica</th>
                      {dadosSistemas.map((s) => (
                        <th key={s.nome} className="pb-2 font-medium">{s.nome}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      ['Bandejas / Mês',     (s) => fmtN(s.bandejasMes)],
                      ['Receita Anual Est.', (s) => fmt$(s.receitaAnual)],
                      ['Lucro Anual Est.',   (s) => fmt$(s.lucroAnual)],
                      ['ROI Anual',         (s) => s.roiAnual.toFixed(1) + '%'],
                      ['Payback',           (s) => s.paybackMeses === Infinity ? '∞' : s.paybackMeses.toFixed(0) + ' meses'],
                      ['Margem de Lucro',   (s) => s.margemLucro.toFixed(1) + '%'],
                      ['Lucro por Ave/Mês', (s) => fmt$(s.lucroPorAve)],
                      ['Lucro por Bandeja', (s) => fmt$(s.lucroPorBandeja)],
                      ['Lucro por Ovo',     (s) => fmt$(s.lucroPorOvo)],
                    ].map(([label, fn]) => (
                      <tr key={label}>
                        <td className="py-2 text-slate-500">{label}</td>
                        {dadosSistemas.map((s) => (
                          <td key={s.nome} className="py-2 font-semibold">{fn(s)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
      </main>

      <footer className="max-w-screen-2xl mx-auto mt-12 pt-6 border-t border-slate-200 text-center text-slate-400 text-xs">
        <p>
          Preço de referência: CEASA Recife — Cx. 30 Dz (360 ovos) = R$ 180,00 → R$ 4,50/bandeja de 30 ovos.
          Valores reais podem variar conforme sazonalidade e canal de venda.
        </p>
      </footer>
    </div>
  );
};

export default App;
