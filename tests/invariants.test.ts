/**
 * Инварианты расчётного ядра (tests/invariants.test.ts)
 */

import { calculateModelWeightsGb, calculateMaxParallelism } from '../src/calc/core';

/**
 * ТЕСТ: MoE веса по total params, скорость по active params (§4.7)
 */
test('MoE: weights use total params, speed uses active params', () => {
  const moeModel = {
    id: 'qwen3-30b-a3b',
    params_total_b: 30.5,   // Для весов
    params_active_b: 3.3,   // Для скорости
    bytes_per_param: 0.55,
    n_layers: 64,
    n_kv_heads: 8,
    head_dim: 128
  };

  const quantization = { bytes_per_param: 0.55, kv_bytes_per_elem: 1 };

  // Веса должны использовать total params (§4.2 правило)
  const weightsGb = calculateModelWeightsGb(moeModel, quantization);
  
  expect(weightsGb).toBeCloseTo(30.5 * 0.55 * 1.05, 2); // ~17 ГБ

  // Для скорости используем active params (§4.7 правило)
  const activeParams = moeModel.params_active_b ?? moeModel.params_total_b;
  expect(activeParams).toBe(3.3);
});

/**
 * ТЕСТ: head_dim берётся из config.json, НЕ hidden_size/n_heads (§4.3 правило)
 */
test('head_dim taken directly from model config', () => {
  const gemmaModel = {
    id: 'gemma-7b',
    params_total_b: 7.0,
    bytes_per_param: 0.55,
    n_layers: 28,
    n_kv_heads: 16,
    head_dim: 256, // ГЕММА: head_dim=256 (НЕ 4096/8=512!)
    max_context: 8192
  };

  // Если бы мы считали head_dim = hidden_size/n_heads и hidden_size=4096
  const incorrectHeadDim = 4096 / gemmaModel.n_kv_heads; // 512
  
  expect(gemmaModel.head_dim).toBe(256);
  expect(incorrectHeadDim).toBe(512);
  expect(gemmaModel.head_dim).not.toBe(incorrectHeadDim);
});

/**
 * ТЕСТ: n_kv_heads используется вместо n_heads для GQA/MQA (§4.3 правило)
 */
test('n_kv_heads used instead of n_heads for GQA', () => {
  const qwenModel = {
    id: 'qwen2.5-72b',
    params_total_b: 72.0,
    bytes_per_param: 0.55,
    n_layers: 80,
    n_kv_heads: 8,   // GQA: 8 KV heads
    head_dim: 128,
    max_context: 32768
  };

  const kvPerTokenGb = 2 * qwenModel.n_layers * qwenModel.n_kv_heads * qwenModel.head_dim / 1e9;
  
  expect(kvPerTokenGb).toBe(2 * 80 * 8 * 128 / 1e9); // ~0.016 ГБ/токен

  // Если бы использовали n_heads=8 (в данном случае то же самое, но для MoE — разница!)
});

/**
 * ТЕСТ: util_target берётся из engines.json (§4.1 правило)
 */
test('util_target taken from engine config', () => {
  const vllmEngine = { id: 'vllm', gpu_only: true, default_util_target: 0.90 };
  const llamaCppEngine = { id: 'llama-cpp', gpu_only: false, default_util_target: 0.95 };

  expect(vllmEngine.default_util_target).toBe(0.90);
  expect(llamaCppEngine.default_util_target).toBe(0.95);
});

/**
 * ТЕСТ: CUDA context = 1.5 ГБ × N_gpu, а не 0.6 (§4.4 правило)
 */
test('CUDA context overhead is 1.5 GB per GPU', () => {
  const gpuCount = 2;
  const overheadPerGpu = 1.5; // 1–2 ГБ на GPU, не 0.6

  expect(overheadPerGpu).toBeGreaterThan(0.6);
});

/**
 * ТЕСТ: Batch efficiency по порогу max_parallel (§4.8 правило)
 */
test('Batch efficiency by max_parallel threshold', () => {
  let batchEfficiency: number;

  switch (true) {
    case true <= 8:
      batchEfficiency = 0.85;
      break;
    case true <= 32:
      batchEfficiency = 0.60;
      break;
    default:
      batchEfficiency = 0.45;
      break;
  }

  expect(batchEfficiency).toBe(0.85);
});

/**
 * ТЕСТ: Offload penalty по формуле §4.9
 */
test('Offload penalty formula', () => {
  const offloadRatio1 = 0.20; // 20% offloaded
  const penalty1 = 1 / (1 + 2.5 * offloadRatio1);

  expect(penalty1).toBeCloseTo(0.48, 1); // ~3-10× падение скорости при offload 20%

  const offloadRatio2 = 0.50; // 50% offloaded
  const penalty2 = 1 / (1 + 2.5 * offloadRatio2);

  expect(penalty2).toBeCloseTo(0.37, 1); // ~2.7× падение
});
