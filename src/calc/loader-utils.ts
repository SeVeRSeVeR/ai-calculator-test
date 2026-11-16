/**
 * Вспомогательные функции для загрузки данных - упрощённая версия для MVP
 */

import type { GPU, Model, Quantization, Engine, CPU } from '../data/loader';

/**
 * Преобразует массив ID GPU в объекты GPU
 */
export function gpuIdsToGpus(gpuIds: string[]): GPU[] {
  return []; // Для MVP — заглушка
}

/**
 * Преобразует массив ID моделей в объекты Model
 */
export function modelIdsToModels(modelIds: string[]): Model[] {
  return []; // Для MVP — заглушка
}

/**
 * Преобразует массив ID квантизаций в объекты Quantization
 */
export function quantizationIdsToQuantizations(quantizationIds: string[]): Quantization[] {
  return []; // Для MVP — заглушка
}

/**
 * Преобразует массив ID движков в объекты Engine
 */
export function engineIdsToEngines(engineIds: string[]): Engine[] {
  return []; // Для MVP — заглушка
}

/**
 * Преобразует массив ID CPU в объекты CPU
 */
export function cpuIdsToCpus(cpuIds: string[]): CPU[] {
  return []; // Для MVP — заглушка
}
