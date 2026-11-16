/**
 * Компонент карточки конфигурации для режима B - упрощённая версия для MVP
 */

import React from 'react';

interface ConfigCardProps {
  config: {
    type: 'MIN' | 'OPTIMAL' | 'MAX';
    gpuCount: number;
    vramBudgetGb: number;
    kvPoolGb: number;
    fits: boolean;
    maxParallel: number;
    tokensPerSeq: number;
    offloadRatio?: number;
    speedPenalty?: number;
  };
  modelWeightsGb: number;
  kvPerTokenGb: number;
  targetTokS: number;
}

interface PlatformRecommendation {
  cpu: 'Intel Xeon 16-cores' | null;
  ramRequiredGb: number;
  nvmeGb: number;
  psuWatts: number;
  cooling: 'air' | 'liquid';
}

function formatNumber(num: number): string {
  return num.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export default function ConfigCard({ config, modelWeightsGb, kvPerTokenGb, targetTokS }: ConfigCardProps) {
  const configName = config.type === 'MIN' ? 'MIN (минимальная)' : 
                     config.type === 'OPTIMAL' ? 'OPTIMAL (оптимальная)' : 
                     'MAX (максимальная)';

  // Вычисление offload % для MIN конфигурации
  const offloadPercent = Math.round((config.offloadRatio ?? 0) * 100);
  
  // Оценка падения скорости из-за offload
  const speedDrop = config.speedPenalty 
    ? ((1 - config.speedPenalty!).toFixed(1)) 
    : '—';

  return (
    <div className="config-card">
      <div className="config-header">
        <span className={`config-badge ${config.type.toLowerCase()}`}>
          {configName}
        </span>
        {config.type === 'OPTIMAL' && (
          <span className="optimal-badge">✓ Оптимальная конфигурация</span>
        )}
      </div>

      <div className="config-gpu-section">
        <h4 className="section-title">GPU конфигурация:</h4>
        
        <ul className="gpu-specs">
          <li>
            <span className="spec-label">VRAM бюджет:</span>
            <span className="spec-value">{formatNumber(config.vramBudgetGb)} ГБ</span>
          </li>
          
          <li>
            <span className="spec-label">KV-пул:</span>
            <span className={`spec-value ${config.kvPoolGb > 0 ? '' : 'warning'}`}>
              {config.kvPoolGb > 0 ? formatNumber(config.kvPoolGb) : '—'} ГБ
            </span>
          </li>
          
          {offloadPercent > 0 && (
            <li className="offload-warning">
              <span className="spec-label">Offload:</span>
              <span className={`spec-value warning`}>
                {offloadPercent}% весов в RAM (~{speedDrop}× падение скорости)
              </span>
            </li>
          )}
          
          {config.fits && (
            <>
              <li>
                <span className="spec-label">Max Parallel:</span>
                <span className="spec-value">{config.maxParallel}</span>
              </li>
              
              <li>
                <span className="spec-label">Tok/s/seq:</span>
                <span className="spec-value">~{formatNumber(config.tokensPerSeq)}</span>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* Рекомендация платформы для MIN/OPTIMAL */}
      {config.type !== 'MIN' && (
        <div className="platform-recommendation">
          <h4 className="section-title">Рекомендуемая платформа:</h4>
          
          <ul className="platform-specs">
            <li>
              <span className="spec-label">CPU:</span>
              <span className="spec-value">Intel Xeon 16-cores или AMD EPYC</span>
            </li>
            
            <li>
              <span className="spec-label">RAM:</span>
              <span className="spec-value">
                {formatNumber(config.vramBudgetGb * 0.25)}–{formatNumber(config.vramBudgetGb * 0.35)} ГБ
                (достаточно при полном размещении в VRAM)
              </span>
            </li>
            
            <li>
              <span className="spec-label">NVMe:</span>
              <span className="spec-value">{formatNumber(modelWeightsGb * 3)} ГБ</span>
            </li>
            
            <li>
              <span className="spec-label">PSU:</span>
              <span className="spec-value">850–1200 Вт (для RTX 4090)</span>
            </li>
            
            <li>
              <span className="spec-label">Охлаждение:</span>
              <span className={`spec-value ${config.vramBudgetGb > 96 ? 'liquid' : 'air'}`}>
                {config.vramBudgetGb > 96 ? 'СЖО (жидкое охлаждение)' : 'Воздушное'}
              </span>
            </li>

            <li className="cpu-disclaimer">
              <span className="spec-label">Примечание:</span>
              <span className={`spec-value ${config.vramBudgetGb > 96 ? '' : 'note'}`}>
                CPU не влияет на скорость генерации при полном размещении в VRAM. 
                Он важен для prefill, токенизации и при offload.
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* Предупреждение о невозможности */}
      {!config.fits && (
        <div className="warning-box">
          Недостаточно памяти для всех пользователей при заданных параметрах
        </div>
      )}
    </div>
  );
}
