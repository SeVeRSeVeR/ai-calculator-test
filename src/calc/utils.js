/**
 * Модуль общих утилит для расчётов и валидации
 */
/**
 * Валидация GPU ID (§8)
 */
export function validateGpuId(gpuIds, selectedId) {
    const errors = {};
    if (!selectedId) {
        errors.gpu = ['GPU не выбран'];
        return { valid: false, errors };
    }
    // Проверка формата (lowercase, slug format)
    if (!/^[a-z0-9-]+$/.test(selectedId)) {
        errors.gpu = [`Некорректный формат GPU ID: ${selectedId}`];
    }
    return { valid: Object.keys(errors).length === 0, errors };
}
/**
 * Валидация количества GPU (§8)
 */
export function validateGpuCount(count) {
    if (count < 1 || count > 8) {
        return { valid: false, error: 'Количество GPU должно быть от 1 до 8' };
    }
    return { valid: true };
}
/**
 * Валидация контекста в токенах (§8)
 */
export function validateContextTokens(context) {
    const min = 512;
    const max = 1000000;
    if (context < min) {
        return { valid: false, error: `Контекст должен быть ≥ ${min} токенов` };
    }
    if (context > max) {
        return { valid: false, error: `Контекст не может превышать ${max} токенов` };
    }
    // Предупреждение для контекста < 1K (не блокирует)
    if (context < 4096) {
        return { valid: true, warning: 'Малый контекст может снизить качество' };
    }
    return { valid: true };
}
/**
 * Валидация количества пользователей (§8)
 */
export function validateUserCount(count) {
    if (count < 1 || count > 10000) {
        return { valid: false, error: 'Количество пользователей должно быть от 1 до 10000' };
    }
    // Предупреждение для > 1K (не реалистично)
    if (count > 1000) {
        return { valid: true, warning: '>1K пользователей — нереалистичная нагрузка' };
    }
    return { valid: true };
}
/**
 * Общее форматирование числа с локализованным разделителем тысяч
 */
export function formatNumber(num) {
    return num.toLocaleString('ru-RU', { maximumFractionDigits: 1 });
}
/**
 * Форматирование GPU ID для отображения (из lowercase slug в читаемый вид)
 */
export function formatGpuId(id) {
    // Преобразуем rtx-4090 в GeForce RTX 4090
    const replacements = {
        'rtx-5090': 'GeForce RTX 5090',
        'rtx-5080': 'GeForce RTX 5080',
        'rtx-5070-ti': 'GeForce RTX 5070 Ti',
        'rtx-4090': 'GeForce RTX 4090',
        'rtx-3090': 'GeForce RTX 3090',
        'rtx-3060': 'GeForce RTX 3060',
        'rtx-pro-6000-blackwell': 'RTX PRO 6000 Blackwell',
        'rtx-a6000': 'RTX A6000',
        'l40s': 'L40S',
        'h100-sxm': 'H100 SXM',
        'h200-sxm': 'H200 SXM',
        'b200-sxm': 'B200 SXM',
        'mi300x': 'Instinct MI300X',
        'mi325x': 'Instinct MI325X',
        'rx-7900-xtx': 'Radeon RX 7900 XTX',
        'rx-9070-xt': 'Radeon RX 9070 XT',
        'mac-studio-m4-max': 'Mac Studio M4 Max'
    };
    return replacements[id] ?? id;
}
/**
 * Сортировка статусов fit (FITS_FULL > FITS_TIGHT > FITS_WITH_RAM > NO_FIT)
 */
export function sortFitStatuses(items, compareFn) {
    const priority = {
        'FITS_FULL': 3,
        'FITS_TIGHT': 2,
        'FITS_WITH_RAM': 1,
        'NO_FIT': 0
    };
    return [...items].sort((a, b) => {
        const pA = priority[a.status] ?? -Infinity;
        const pB = priority[b.status] ?? -Infinity;
        return compareFn ? (pA === pB ? compareFn(a, b) : 0) : pB - pA;
    });
}
/**
 * Определение типа интерконнекта для мульти-GPU (§5.4)
 */
export function getInterconnectType(gpus) {
    const hasNvlink = gpus.some(g => g.nvlink === true);
    if (hasNvlink) {
        return 'NVLink';
    }
    // Если все карты consumer — NVLink недоступен
    return 'PCIe';
}
/**
 * Форматирование памяти с суффиксами
 */
export function formatBytes(bytesPerToken) {
    if (bytesPerToken >= 1e9) {
        return `${(bytesPerToken / 1e9).toFixed(2)} ГБ/токен`;
    }
    if (bytesPerToken >= 1e6) {
        return `${(bytesPerToken / 1e6).toFixed(2)} МБ/токен`;
    }
    return `${bytesPerToken.toFixed(3)} МБ/токен`;
}
