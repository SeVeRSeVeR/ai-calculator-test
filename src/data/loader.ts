/**
 * Каталог данных - упрощённая версия для MVP
 */

export interface GPU {
  id: string;
  vendor: string;
  name: string;
  vram_gb: number;
  tdp_w: number;
  bandwidth_gbs?: number;
  nvlink?: boolean;
}

export interface Model {
  id: string;
  family: string;
  name: string;
  params_total_b: number;
  bytes_per_param: number;
  n_layers: number;
  n_kv_heads: number;
  head_dim: number;
  hidden_size?: number;
  n_heads?: number;
  max_context: number;
}

export interface Quantization {
  id: string;
  name: string;
  bytes_per_param: number;
  context_compression_ratio: number;
}

export interface Engine {
  id: string;
  name: string;
  default_util_target: number;
  overhead_gb: number;
  gpu_only: boolean;
  kv_bytes_per_elem: number;
  supports_tp?: boolean;
}

export interface CPU {
  id: string;
  vendor: string;
  model: string;
  cores: number;
  threads: number;
  tdp_w: number;
  class: string;
  rdtsc_cycles_per_sec: number;
}

// Экспорт каталогов из JSON-файлов (для MVP — заглушки)
export const gpusData = [] as any;
export const modelsData = [] as any;
export const quantizationsData = [] as any;
export const enginesData = [] as any;
export const cpusData = [] as any;

// Вспомогательные функции для получения по ID (для MVP — заглушки)
export function getGpuById(id: string): GPU | null { return null; }
export function getModelById(id: string): Model | null { return null; }
export function getQuantizationById(id: string): Quantization | null { return null; }
export function getEngineById(id: string): Engine | null { return null; }
export function getCpuById(id: string): CPU | null { return null; }
