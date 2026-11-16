/**
 * Основные формулы расчёта (§4) - упрощённая версия для MVP
 */
/**
 * §4.2: model_weighted_gb — вес модели в ГБ с учётом offload
 */
export function calculateModelWeightedGb(paramsTotalB, bytesPerParam, offloadRatio = 0) {
    return paramsTotalB * bytesPerParam * (1 - offloadRatio);
}
/**
 * §4.2: kv_per_token_gb — KV память на токен в ГБ (§4.1)
 */
export function calculateKVPerTokenGb(model, quantization) {
    const headDim = model.head_dim || (model.hidden_size || 4096) / (model.n_heads || 32);
    const nLayers = model.n_layers;
    const nKvHeads = model.n_kv_heads || model.n_heads || 32;
    const kvCacheBytesPerToken = (nLayers * headDim * 2 * quantization.bytes_per_param) / nKvHeads;
    return kvCacheBytesPerToken / 1e9;
}
/**
 * §4.3: tok_s_per_seq — токены/сек/seq на одну GPU (§4.3)
 */
export function calculateTokensPerSecond(gpus, model, quantization, useNvlink) {
    const totalBwGbs = gpus.reduce((sum, gpu) => sum + (gpu.bandwidth_gbs ?? 0), 0);
    const tpFactor = useNvlink ? 0.65 : (gpus.length > 1 ? 0.35 : 1.0);
    const bwEffectiveGbs = totalBwGbs * tpFactor;
    const paramsToUse = model.params_total_b;
    const bytesActive = paramsToUse * quantization.bytes_per_param * 1e9;
    const efficiency = gpus.length === 1 && !useNvlink ? 0.55 : (useNvlink ? 0.65 : 0.40);
    const tokSPerSeq = (bwEffectiveGbs * 1e9 * efficiency) / bytesActive;
    return tokSPerSeq;
}
/**
 * §4.3: VRAM_required — требуемая VRAM на GPU (§4.3)
 */
export function calculateVramRequired(modelWeightedGb, kvPoolGb, overheadGb) {
    return modelWeightedGb + kvPoolGb + overheadGb;
}
/**
 * §4.3: kv_pool_gb — размер KV пула в ГБ (§4.3)
 */
export function calculateKVPoolGb(kvPerTokenGb, contextEffective, tokensPerSeq) {
    return kvPerTokenGb * contextEffective / Math.max(tokensPerSeq, 1e-9);
}
/**
 * §4.3: контекстные токены (эффективные)
 */
export function getContextEffectiveTokens(contextTokens, modelMaxContext) {
    return Math.min(contextTokens, modelMaxContext);
}
/**
 * Суммарная VRAM в массиве GPU
 */
export function calculateTotalVram(gpus) {
    return gpus.reduce((sum, gpu) => sum + (gpu.vram_gb ?? 0), 0);
}
/**
 * Средняя bandwidth по массиву GPU
 */
export function calculateAverageBandwidthGbs(gpus) {
    const totalBw = gpus.reduce((sum, gpu) => sum + (gpu.bandwidth_gbs ?? 0), 0);
    return gpus.length > 0 ? totalBw / gpus.length : 0;
}
