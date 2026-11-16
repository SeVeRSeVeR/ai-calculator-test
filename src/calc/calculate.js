/**
 * Модуль расчёта GPU fit (§4.5) - упрощённая версия для MVP
 */
/**
 * §4.5: Проверка fit модели на одной GPU
 */
export function checkGpuFit(gpu, model, quantization, engine, contextTokens) {
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
export function checkMultiGpuFit(gpus, model, quantization, engine, contextTokens) {
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
export function findBestGpuForModel(model, quantization, engine, contextTokens, gpus) {
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
