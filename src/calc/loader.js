/**
 * Вспомогательные функции для загрузки JSON-каталогов - упрощённая версия для MVP
 */
import { gpusData, modelsData, quantizationsData, enginesData, cpusData } from '../data/loader';
/**
 * Вспомогательная функция: получаем GPU по ID
 */
export function getGpuById(id) {
    const allGpus = gpusData;
    return allGpus.find(gpu => gpu.id === id) || null;
}
/**
 * Вспомогательная функция: получаем Model по ID
 */
export function getModelById(id) {
    const allModels = modelsData;
    return allModels.find(model => model.id === id) || null;
}
/**
 * Вспомогательная функция: получаем Quantization по ID
 */
export function getQuantizationById(id) {
    const allQuantizations = quantizationsData;
    return allQuantizations.find(q => q.id === id) || null;
}
/**
 * Вспомогательная функция: получаем Engine по ID
 */
export function getEngineById(id) {
    const allEngines = enginesData;
    return allEngines.find(e => e.id === id) || null;
}
/**
 * Вспомогательная функция: получаем CPU по ID
 */
export function getCpuById(id) {
    const allCpus = cpusData;
    return allCpus.find(c => c.id === id) || null;
}
