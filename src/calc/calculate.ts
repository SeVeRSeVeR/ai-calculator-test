/**
 * Модуль расчёта GPU fit (§4.5) - упрощённая версия для MVP
 */

import type { GPU, Model, Quantization, Engine } from '../data/loader';

/**
 * §4.5: Проверка fit модели на GPU с учётом TP
 */
export interface GpuFitResult {
  fitStatus: 'FITS_FULL' | 'FITS_TIGHT' | 'FITS_WITH_RAM' | 'NO_FIT';
  requiredVramGb: number;
  availableVramGb: number;
  vramHeadroomPercent: number;
  recommendations?: string[];
}

/**
 * §4.5: Проверка fit модели на одной GPU
 */
export function checkGpuFit(
  gpu: GPU,
  model: Model,
  quantization: Quantization,
  engine: Engine,
  contextTokens: number
): GpuFitResult {
  const availableVramGb = gpu.vram_gb || 0;
  
  // Упрощённый расчёт для MVP — считаем что модель помещается
  const modelWeightedGb = model.params_total_b * quantization.bytes_per_param;
  const overheadGb = engine.overhead_gb || 0.2;
  const requiredVramGb = modelWeightedGb + overheadGb;
  
  if (requiredVramGb <= availableVramGb * 0.95) {
    return {
      fitStatus: 'FITS_FULL',
      requiredVramGb,
      availableVramGb,
      vramHeadroomPercent: ((availableVramGb - requiredVramGb) / availableVramGb) * 100
    };
  }
  
  if (requiredVramGb <= availableVramGb * 1.05) {
    return {
      fitStatus: 'FITS_TIGHT',
      requiredVramGb,
      availableVramGb,
      vramHeadroomPercent: ((availableVramGb - requiredVramGb) / availableVramGb) * 100
    };
  }
  
  if (requiredVramGb <= availableVramGb * 1.40) {
    return {
      fitStatus: 'FITS_WITH_RAM',
      requiredVramGb,
      availableVramGb,
      vramHeadroomPercent: ((availableVramGb - requiredVramGb) / availableVramGb) * 100,
      recommendations: [
        `Используется ${((requiredVramGb - availableVramGb) / modelWeightedGb * 100).toFixed(1)}% весов в RAM`
      ]
    };
  }
  
  return {
    fitStatus: 'NO_FIT',
    requiredVramGb,
    availableVramGb,
    vramHeadroomPercent: -100,
    recommendations: [
      `Модель требует ${requiredVramGb.toFixed(2)} ГБ VRAM, доступно только ${availableVramGb.toFixed(2)} ГБ`
    ]
  };
}

/**
 * §4.5: Проверка fit на пер-GPU (для многокарточных систем)
 */
export function checkMultiGpuFit(
  gpus: GPU[],
  model: Model,
  quantization: Quantization,
  engine: Engine,
  contextTokens: number
): GpuFitResult {
  const totalVramGb = gpus.reduce((sum, gpu) => sum + (gpu.vram_gb || 0), 0);
  
  const requiredVramGb = model.params_total_b * quantization.bytes_per_param;
  
  if (requiredVramGb <= totalVramGb * 0.95) {
    return {
      fitStatus: 'FITS_FULL',
      requiredVramGb,
      availableVramGb: totalVramGb,
      vramHeadroomPercent: ((totalVramGb - requiredVramGb) / totalVramGb) * 100
    };
  }
  
  if (requiredVramGb <= totalVramGb * 1.05) {
    return {
      fitStatus: 'FITS_TIGHT',
      requiredVramGb,
      availableVramGb: totalVramGb,
      vramHeadroomPercent: ((totalVramGb - requiredVramGb) / totalVramGb) * 100
    };
  }
  
  if (requiredVramGb <= totalVramGb * 1.40) {
    return {
      fitStatus: 'FITS_WITH_RAM',
      requiredVramGb,
      availableVramGb: totalVramGb,
      vramHeadroomPercent: ((totalVramGb - requiredVramGb) / totalVramGb) * 100
    };
  }
  
  return {
    fitStatus: 'NO_FIT',
    requiredVramGb,
    availableVramGb: totalVramGb,
    vramHeadroomPercent: -100
  };
}

/**
 * §4.5: Определение лучшей GPU для модели
 */
export function findBestGpuForModel(
  model: Model,
  quantization: Quantization,
  engine: Engine,
  contextTokens: number,
  gpus: GPU[]
): GpuFitResult | null {
  const sortedGpus = [...gpus].sort((a, b) => (b.vram_gb || 0) - (a.vram_gb || 0));

  for (const gpu of sortedGpus) {
    const result = checkGpuFit(gpu, model, quantization, engine, contextTokens);
    
    if (result.fitStatus !== 'NO_FIT') {
      return result;
    }
  }

  const bestGpu = sortedGpus[0] || gpus[0];
  const lastFit = checkGpuFit(bestGpu, model, quantization, engine, contextTokens);
  
  return lastFit;
}
