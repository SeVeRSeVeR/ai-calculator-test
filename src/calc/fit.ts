/**
 * Модуль определения статусов fit (§4.10)
 * 
 * Статусы:
 * - FITS_FULL: per-GPU fit выполняется и запас VRAM ≥ 15%
 * - FITS_TIGHT: per-GPU fit выполняется и запас 0–15%
 * - FITS_WITH_RAM: offload_ratio ≤ 0.50 и RAM-бюджет выдержан
 * - NO_FIT: offload_ratio > 0.50 или RAM-бюджет превышен
 */

// ASSUMPTION: запас VRAM = KV_pool_gb / VRAM_total_gb
// ASSUMPTION: порог FITS_FULL — запас ≥ 15%, FITS_TIGHT — 0–15%
export type FitStatus = 'FITS_FULL' | 'FITS_TIGHT' | 'FITS_WITH_RAM' | 'NO_FIT';

/**
 * Данные для определения статуса fit
 */
interface FitData {
  perGpuFootprintGb: number;       // §4.5 footprint на одну GPU
  vramOneGb: number;                // VRAM одной карты в ГБ
  kvPoolGb: number;                 // §4.4 доступный пул KV
  vramTotalGb: number;              // суммарная VRAM
  offloadRatio: number;             // §4.9 отношение offloaded весов
  ramBudgetGb?: number;             // бюджет RAM для offload-сценария
}

/**
 * Определяет статус fit по данным модели и GPU (§4.10)
 */
export function determineFitStatus(data: FitData): FitStatus {
  const { perGpuFootprintGb, vramOneGb, kvPoolGb, vramTotalGb, offloadRatio, ramBudgetGb } = data;

  // §4.5 Проверка per-GPU fit
  const gpuFit = perGpuFootprintGb <= vramOneGb;

  if (!gpuFit) {
    return 'NO_FIT';
  }

  // §4.10 запас VRAM
  const headroomRatio = kvPoolGb / vramTotalGb;

  // FITS_FULL: пер-GPU fit выполняется и запас ≥ 15%
  if (headroomRatio >= 0.15) {
    return 'FITS_FULL';
  }

  // FITS_TIGHT: per-GPU fit выполняется и запас 0–15%
  if (headroomRatio >= 0) {
    return 'FITS_TIGHT';
  }

  // Если дошли сюда — значит offload или RAM issue
  if (ramBudgetGb !== undefined && ramBudgetGb !== null) {
    // §4.10 RAM-бюджет выдержан
    if (offloadRatio <= 0.50) {
      return 'FITS_WITH_RAM';
    } else {
      return 'NO_FIT';
    }
  }

  // Если offload_ratio > 0.5 без RAM бюджетa — NO_FIT
  if (offloadRatio > 0.5) {
    return 'NO_FIT';
  }

  // Фолбек для edge-кейса
  return 'NO_FIT';
}

/**
 * Проверка: является ли статус fit положительным
 */
export function isFitPositive(status: FitStatus): boolean {
  return status !== 'NO_FIT';
}

/**
 * Получает причину отказа fit (для отображения в UI)
 */
export function getFitFailureReason(data: FitData, status: FitStatus): string | null {
  if (status === 'FITS_FULL' || status === 'FITS_TIGHT') {
    return null;
  }

  // NO_FIT может быть по двум причинам:
  // 1. per-GPU footprint > VRAM карты
  // 2. offload_ratio > 0.5 или RAM-бюджет превышен
  if (status === 'NO_FIT') {
    // Проверка по offload (если есть ramBudget)
    if (data.ramBudgetGb !== undefined && data.ramBudgetGb !== null) {
      if (data.offloadRatio > 0.5) {
        return `Offload ${Math.round(data.offloadRatio * 100)}% весов превышает лимит 50%.`;
      }
      // RAM budget превышен — но как это вычислить в клиенте? Пока просто сообщение
      return 'Недостаточно памяти в RAM для offload-слоев.';
    }

    if (data.offloadRatio > 0.5) {
      return `Offload ${Math.round(data.offloadRatio * 100)}% весов превышает лимит 50%`;
    }
  }

  // Если дошли сюда — вероятно per-GPU check failed
  return 'Модель не помещается на одной видеокарте.';
}
