/**
 * Модуль определений трёх конфигураций (§6) - упрощённая версия для MVP
 * MIN / OPTIMAL / MAX
 */

import type { GPU, Model, Quantization, Engine } from '../data/loader';

/** Определяет три конфигурации для заданной модели (§6) */
export interface ConfigOptions {
  min?: GPU[];
  optimal?: GPU[];
  max?: GPU[];
  status?: 'MIN_OK' | 'OPTIMAL_OK' | 'MAX_OK' | 'IMPOSSIBLE';
  recommendations?: string[];
  optimalEqualsMax?: boolean;
}

/** Определяет MIN конфигурацию (§6) - упрощённая версия для MVP */
export function determineMinConfig(
  model: Model,
  quantization: Quantization,
  contextTokens: number,
  users: number,
  targetTokS: number,
  gpus: GPU[],
  engine: Engine
): ConfigOptions | null {
  const sortedGpus = [...gpus].sort((a, b) => (b.vram_gb ?? 0) - (a.vram_gb ?? 0));
  const bestGpu = sortedGpus[0] || gpus[0];

  const minConfig: GPU[] = [bestGpu];

  return {
    min: minConfig,
    status: 'MIN_OK'
  };
}

/** Определяет OPTIMAL конфигурацию (§6) - упрощённая версия для MVP */
export function determineOptimalConfig(
  model: Model,
  quantization: Quantization,
  contextTokens: number,
  users: number,
  targetTokS: number,
  gpus: GPU[],
  engine: Engine
): ConfigOptions | null {
  const sortedGpus = [...gpus].sort((a, b) => (b.vram_gb ?? 0) - (a.vram_gb ?? 0));
  const bestGpu = sortedGpus[0] || gpus[0];

  const optimalConfig: GPU[] = [bestGpu];

  return {
    optimal: optimalConfig,
    status: 'OPTIMAL_OK'
  };
}

/** Определяет MAX конфигурацию (§6) - упрощённая версия для MVP */
export function determineMaxConfig(
  model: Model,
  quantization: Quantization,
  contextTokens: number,
  users: number,
  targetTokS: number,
  gpus: GPU[],
  engine: Engine
): ConfigOptions | null {
  const optimalConfig = determineOptimalConfig(model, quantization, contextTokens, users, targetTokS, gpus, engine);
  
  if (!optimalConfig || !optimalConfig.optimal) {
    return null;
  }

  const maxConfig: GPU[] = [...optimalConfig.optimal];

  const optimalVramSingle = sumGpuVram(optimalConfig.optimal);
  const maxVramSingle = sumGpuVram(maxConfig);

  const optimalEqualsMax = Math.abs(optimalVramSingle - maxVramSingle) < 0.01;

  return {
    max: maxConfig,
    optimalEqualsMax
  };
}

function sumGpuVram(gpus: GPU[]): number {
  return gpus.reduce((sum, gpu) => sum + (gpu.vram_gb ?? 0), 0);
}

/** Вычисляет статус IMPOSSIBLE и рекомендации (§6.4) */
export function determineImpossibleStatus(model: Model): ConfigOptions | null {
  const recommendations = [
    `Попробуйте уменьшить контекст до ${Math.floor(model.max_context * 0.7)} токенов`,
    `Попробуйте более низкую квантизацию: q3_k_m, q4_k_m или fp8`,
    model.family === 'Llama' || model.family === 'Gemma' 
      ? 'Рассмотрите Llama 3.1 8B (llama3.1-8b)' 
      : '',
    model.family === 'Qwen' 
      ? 'Рассмотрите Qwen3 8B (qwen3-8b)' 
      : ''
  ].filter(Boolean) as string[];

  return {
    status: 'IMPOSSIBLE',
    recommendations
  };
}

/** Вычисляет токены/сек для массива GPU - упрощённая версия */
export function calculateTokensPerSecond(
  gpus: GPU[], 
  model: Model, 
  quantization: Quantization, 
  useNvlink: boolean | null
): number {
  const totalBwGbs = gpus.reduce((sum, gpu) => sum + (gpu.bandwidth_gbs ?? 0), 0);
  const tpFactor = useNvlink ? 0.65 : (gpus.length > 1 ? 0.35 : 1.0);
  const bwEffectiveGbs = totalBwGbs * tpFactor;

  const paramsToUse = model.params_total_b;
  const bytesActive = paramsToUse * quantization.bytes_per_param * 1e9;

  const efficiency = gpus.length === 1 && !useNvlink ? 0.55 : (useNvlink ? 0.65 : 0.40);
  const tokSPerSeq = (bwEffectiveGbs * 1e9 * efficiency) / bytesActive;

  return tokSPerSeq;
}

/** Вычисляет KV память на токен в ГБ - упрощённая версия */
export function calculateKVPerTokenGb(model: Model, quantization: Quantization): number {
  const headDim = model.head_dim || (model.hidden_size || 4096) / (model.n_heads || 32);
  
  const nLayers = model.n_layers;
  const nKvHeads = model.n_kv_heads || model.n_heads || 32;
  
  const kvCacheBytesPerToken = 
    (nLayers * headDim * 2 * quantization.bytes_per_param) / nKvHeads;
  
  return kvCacheBytesPerToken / 1e9;
}
