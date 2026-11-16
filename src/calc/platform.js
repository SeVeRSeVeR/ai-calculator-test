/**
 * Модуль рекомендаций платформы (§4.11–4.14)
 * CPU / RAM / NVMe / PSU + охлаждение
 */
/**
 * Округление вверх до стандартного модуля RAM (§4.11 правило)
 */
function roundUpToRamModule(gb) {
    const modules = [8, 16, 32, 64, 128, 256, 512];
    for (const module of modules) {
        if (module >= gb) {
            return module;
        }
    }
    return 512; // Fallback
}
/**
 * Определяет минимальный CPU (§4.12)
 */
export function calculateMinCPU(gpuCount, offloadRatio, cpus, cpuClass) {
    // §4.12 cores_min = max(8, 2 × N_gpu); при offload_ratio > 0 → cores_min += 4
    let coresMin = Math.max(8, 2 * gpuCount);
    if (offloadRatio > 0) {
        coresMin += 4;
    }
    // §4.12 required_pcie_lanes: 16 × N_gpu (consumer) или 8 × N_gpu (datacenter)
    const requiredPcielanes = gpuCount * 16; // Упрощение: всегда consumer-level
    // Ищем подходящую CPU
    let recommendedCpuId = null;
    let bestMatchCores = Infinity;
    for (const cpu of cpus) {
        if (cpu.cores >= coresMin && (cpu.pcie_lanes ?? 64) >= requiredPcielanes) {
            // Предпочитаем workstation/server, если нужно больше ядер
            const priority = cpu.class === 'budget' ? 3 :
                cpu.class === 'mid-range' ? 2 :
                    cpu.class === 'workstation' ? 1 :
                        0;
            if (priority < bestMatchCores) {
                bestMatchCores = priority;
                recommendedCpuId = cpu.id;
            }
        }
    }
    // Явный дисклеймер про роль CPU (§4.12)
    const reason = `CPU обеспечивает ${coresMin}+ ядер для токенизации и prefill. При полном размещении в VRAM CPU не влияет на скорость генерации.`;
    return { minCores: coresMin, minPcielanes: requiredPcielanes, recommendedCpuId, reason };
}
/**
 * §4.13 PSU: (Σ TDP_gpu + TDP_cpu + 150) × 1.3 (запас 30%), округлить до стандартного
 */
export function calculatePSU(gpus, cpuTdp) {
    const totalGpuTdp = gpus.reduce((sum, gpu) => sum + gpu.tdp_w, 0);
    const totalTdp = totalGpuTdp + (cpuTdp ?? 150) + 150;
    const psuWatts = Math.ceil(totalTdp * 1.3);
    // Стандартные модули PSU
    const modules = [650, 850, 1000, 1200, 1600];
    let recommendedWatts = 650;
    for (const module of modules) {
        if (module >= psuWatts) {
            recommendedWatts = module;
            break;
        }
    }
    // Класс PSU
    const psuClass = recommendedWatts <= 850 ? 'consumer' : recommendedWatts <= 1200 ? 'workstation' : 'datacenter';
    return { watts: recommendedWatts, psuClass };
}
/**
 * §4.14 NVMe: max(1024, W_weights_gb × N_models_expected × 1.2)
 */
export function calculateNVMeGb(modelWeightsGb, expectedModelsCount = 5) {
    const nvmeGb = Math.max(1024, modelWeightsGb * expectedModelsCount * 1.2);
    return nvmeGb;
}
/**
 * Охлаждение: воздух / СЖО по Σ TDP (§4.13)
 */
export function getCoolingRecommendation(totalTdp) {
    const sumTdp = totalTdp;
    // ASSUMPTION: B200 SXM требует жидкостного охлаждения по spec (§4.13)
    if (sumTdp >= 1100) {
        return 'liquid';
    }
    // Для карт > 450W TDP — гибридная система
    if (sumTdp >= 900) {
        return 'hybrid';
    }
    // Иначе — воздух достаточно
    return 'air';
}
/**
 * §4.11 RAM для full VRAM сценария
 */
export function calculateRAMForFullVRAM(vramTotalGb) {
    // Для full VRAM: RAM не критична, но берём минимум
    return vramTotalGb > 96 ? roundUpToRamModule(vramTotalGb * 0.2) : 32;
}
/**
 * Проверяет, что RAM достаточен для offload-сценария (§4.11 правило)
 */
export function isRAMBudgetSatisfied(availableRamGb, requiredMinGb) {
    if (availableRamGb === null) {
        return { satisfied: true }; // Не знаем ограничений
    }
    // §4.11 для offload: RAM_min_gb ≥ 1.3 × W_offloaded_gb
    const requiredWithMargin = 1.3 * requiredMinGb;
    if (availableRamGb >= requiredWithMargin) {
        return { satisfied: true };
    }
    return {
        satisfied: false,
        deficitGb: Math.ceil(requiredWithMargin - availableRamGb)
    };
}
