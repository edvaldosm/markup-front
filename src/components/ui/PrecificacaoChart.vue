<script setup lang="ts">
/**
 * Visão estratégica — Custo base, Lucro Líquido e Preço de venda por produto,
 * com a evolução do lucro como linha sobreposta. SVG desenhado à mão (sem lib
 * de gráfico): o dado já vem pronto de `precificacaoStore.todos`, aqui só
 * projeta em coordenadas. Paleta e specs de marca seguem a skill `dataviz`
 * (ordem categórica fixa, barras ≤24px com ponta arredondada, linha 2px com
 * marcador em anel de superfície).
 */
import { computed, ref } from 'vue'

type ItemGrafico = { nome: string; custoBase: number; lucroLiquido: number; precoVenda: number }

const props = defineProps<{ itens: ItemGrafico[] }>()

const MARGIN = { top: 16, right: 16, bottom: 44, left: 64 }
const GROUP_W = 96
const BAR_W = 20
const BAR_GAP = 3
const PLOT_H = 260

const svgH = MARGIN.top + PLOT_H + MARGIN.bottom
const svgW = computed(() => MARGIN.left + MARGIN.right + Math.max(props.itens.length, 1) * GROUP_W)

/** Próximo número "redondo" acima do valor — eixo Y sem casas quebradas. */
function tetoAgradavel(valor: number): number {
  if (valor <= 0) return 10
  const grandeza = Math.pow(10, Math.floor(Math.log10(valor)))
  const passos = [1, 2, 2.5, 5, 10]
  for (const p of passos) {
    if (valor <= p * grandeza) return p * grandeza
  }
  return 10 * grandeza
}

const maxValor = computed(() =>
  props.itens.reduce((m, i) => Math.max(m, i.custoBase, i.lucroLiquido, i.precoVenda), 0),
)
const yMax = computed(() => tetoAgradavel(maxValor.value || 10))
const yTicks = computed(() => {
  const passos = 5
  return Array.from({ length: passos + 1 }, (_, i) => (yMax.value / passos) * i)
})

function y(valor: number): number {
  return MARGIN.top + PLOT_H - (valor / yMax.value) * PLOT_H
}

function xGrupo(idx: number): number {
  return MARGIN.left + idx * GROUP_W
}

const pontosLinha = computed(() =>
  props.itens.map((it, idx) => {
    const cx = xGrupo(idx) + GROUP_W / 2
    return `${cx},${y(it.lucroLiquido)}`
  }).join(' '),
)

const fmtEixo = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const fmtMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

function truncar(nome: string, max = 9): string {
  return nome.length > max ? `${nome.slice(0, max)}…` : nome
}

const hoverIdx = ref<number | null>(null)
const tooltip = ref<{ x: number; y: number } | null>(null)
const wrapperEl = ref<HTMLElement | null>(null)

function onHover(idx: number, evt: MouseEvent) {
  hoverIdx.value = idx
  const rect = wrapperEl.value?.getBoundingClientRect()
  if (!rect) return
  tooltip.value = { x: evt.clientX - rect.left, y: evt.clientY - rect.top }
}
function onLeave() {
  hoverIdx.value = null
  tooltip.value = null
}

const itemHover = computed(() => (hoverIdx.value != null ? props.itens[hoverIdx.value] : null))
</script>

<template>
  <div class="pc" ref="wrapperEl">
    <div class="pc__scroll">
      <svg :viewBox="`0 0 ${svgW} ${svgH}`" :width="svgW" :height="svgH" class="pc__svg" role="img" aria-label="Custo base, lucro líquido e preço de venda por produto">
        <!-- Gridlines + eixo Y -->
        <g class="pc__grid">
          <line
            v-for="(t, i) in yTicks" :key="i"
            :x1="MARGIN.left" :x2="svgW - MARGIN.right"
            :y1="y(t)" :y2="y(t)"
            class="pc__gridline"
          />
          <text
            v-for="(t, i) in yTicks" :key="'lbl'+i"
            :x="MARGIN.left - 10" :y="y(t)"
            text-anchor="end" dominant-baseline="middle"
            class="pc__axis-label"
          >{{ fmtEixo.format(t) }}</text>
        </g>

        <!-- Grupos de barras -->
        <g v-for="(it, idx) in itens" :key="it.nome">
          <rect
            :x="xGrupo(idx)" :y="MARGIN.top" :width="GROUP_W" :height="PLOT_H"
            fill="transparent"
            class="pc__hit"
            @mouseenter="onHover(idx, $event)"
            @mousemove="onHover(idx, $event)"
            @mouseleave="onLeave"
          />
          <rect v-if="hoverIdx === idx" :x="xGrupo(idx)" :y="MARGIN.top" :width="GROUP_W" :height="PLOT_H" class="pc__hit-highlight" />

          <rect
            :x="xGrupo(idx) + GROUP_W / 2 - (BAR_W * 1.5 + BAR_GAP)" :y="y(it.custoBase)"
            :width="BAR_W" :height="Math.max(MARGIN.top + PLOT_H - y(it.custoBase), 0)"
            rx="3" class="pc__bar pc__bar--custo"
          />
          <rect
            :x="xGrupo(idx) + GROUP_W / 2 - BAR_W / 2" :y="y(it.lucroLiquido)"
            :width="BAR_W" :height="Math.max(MARGIN.top + PLOT_H - y(it.lucroLiquido), 0)"
            rx="3" class="pc__bar pc__bar--lucro"
          />
          <rect
            :x="xGrupo(idx) + GROUP_W / 2 + BAR_GAP + BAR_W / 2" :y="y(it.precoVenda)"
            :width="BAR_W" :height="Math.max(MARGIN.top + PLOT_H - y(it.precoVenda), 0)"
            rx="3" class="pc__bar pc__bar--preco"
          />

          <text
            :x="xGrupo(idx) + GROUP_W / 2" :y="MARGIN.top + PLOT_H + 20"
            text-anchor="middle" class="pc__axis-label"
          >{{ truncar(it.nome) }}<title>{{ it.nome }}</title></text>
        </g>

        <!-- Linha: evolução do lucro -->
        <polyline :points="pontosLinha" class="pc__linha" />
        <g v-for="(it, idx) in itens" :key="'m'+it.nome">
          <circle :cx="xGrupo(idx) + GROUP_W / 2" :cy="y(it.lucroLiquido)" r="6" class="pc__marker-ring" />
          <rect
            :x="xGrupo(idx) + GROUP_W / 2 - 4" :y="y(it.lucroLiquido) - 4"
            width="8" height="8" class="pc__marker"
          />
        </g>
      </svg>
    </div>

    <!-- Legenda -->
    <div class="pc__legend">
      <span class="pc__legend-item"><i class="pc__swatch pc__swatch--custo" />Custo base</span>
      <span class="pc__legend-item"><i class="pc__swatch pc__swatch--lucro" />Lucro líquido</span>
      <span class="pc__legend-item"><i class="pc__swatch pc__swatch--preco" />Preço de venda</span>
      <span class="pc__legend-item"><i class="pc__swatch pc__swatch--linha" />Evolução do lucro</span>
    </div>

    <!-- Tooltip -->
    <div v-if="itemHover && tooltip" class="pc__tooltip" :style="{ left: tooltip.x + 12 + 'px', top: tooltip.y + 12 + 'px' }">
      <strong>{{ itemHover.nome }}</strong>
      <span><i class="pc__swatch pc__swatch--custo" />Custo base: {{ fmtMoeda.format(itemHover.custoBase) }}</span>
      <span><i class="pc__swatch pc__swatch--lucro" />Lucro líquido: {{ fmtMoeda.format(itemHover.lucroLiquido) }}</span>
      <span><i class="pc__swatch pc__swatch--preco" />Preço de venda: {{ fmtMoeda.format(itemHover.precoVenda) }}</span>
    </div>
  </div>
</template>

<style scoped>
.pc { position: relative; }
.pc__scroll { overflow-x: auto; }
.pc__svg { display: block; }

.pc__gridline { stroke: #e1e0d9; stroke-width: 1; }
.pc__axis-label { fill: #898781; font-size: 11px; }

.pc__bar--custo { fill: #2a78d6; }
.pc__bar--lucro { fill: #1baf7a; }
.pc__bar--preco { fill: #4a3aa7; }

.pc__hit { cursor: pointer; }
.pc__hit-highlight { fill: rgba(11,11,11,.04); }

.pc__linha { fill: none; stroke: #0b0b0b; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.pc__marker-ring { fill: var(--color-surface); }
.pc__marker { fill: #0b0b0b; }

.pc__legend { display: flex; flex-wrap: wrap; gap: var(--space-4); justify-content: center; padding-top: var(--space-3); }
.pc__legend-item { display: inline-flex; align-items: center; gap: 6px; font-size: .75rem; color: var(--color-text-muted); }
.pc__swatch { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
.pc__swatch--custo { background: #2a78d6; }
.pc__swatch--lucro { background: #1baf7a; }
.pc__swatch--preco { background: #4a3aa7; }
.pc__swatch--linha { background: #0b0b0b; }

.pc__tooltip {
  position: absolute;
  z-index: 5;
  pointer-events: none;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
  padding: var(--space-2) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: .75rem;
  color: var(--color-text);
  white-space: nowrap;
}
.pc__tooltip strong { font-size: .8125rem; margin-bottom: 2px; }
.pc__tooltip span { display: flex; align-items: center; gap: 6px; color: var(--color-text-muted); }
</style>
