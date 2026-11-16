/**
 * Вспомогательные функции для загрузки JSON-каталогов - упрощённая версия для MVP
 */

import type { GPU, Model, Quantization, Engine, CPU } from '../data/loader';
import { gpusData, modelsData, quantizationsData, enginesData, cpusData } from '../data/loader';

/**
 * Вспомогательная функция: получаем GPU по ID
 */
export function getGpuById(id: string): GPU | null {
  const allGpus = gpusData;
  return allGpus.find(gpu => gpu.id === id) || null;
}

/**
 * Вспомогательная функция: получаем Model по ID
 */
export function getModelById(id: string): Model | null {
  const allModels = modelsData;
  return allModels.find(model => model.id === id) || null;
}

/**
 * Вспомогательная функция: получаем Quantization по ID
 */
export function getQuantizationById(id: string): Quantization | null {
  const allQuantizations = quantizationsData;
  return allQuantizations.find(q => q.id === id) || null;
}

/**
 * Вспомогательная функция: получаем Engine по ID
 */
export function getEngineById(id: string): Engine | null {
  const allEngines = enginesData;
  return allEngines.find(e => e.id === id) || null;
}

/**
 * Вспомогательная функция: получаем CPU по ID
 */
export function getCpuById(id: string): CPU | null {
  const allCpus = cpusData;
  return allCpus.find(c => c.id === id) || null;
}
