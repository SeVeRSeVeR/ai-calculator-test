/**
 * Карточка модели для режима A - упрощённая версия для MVP
 */

import React from 'react';
import type { Model, Quantization } from '../data/loader';
import { checkGpuFit } from '../calc/calculate';
import { calculateTokensPerSecond, calculateKVPerTokenGb } from '../calc/configs';

/**
 * Props для карточки модели
 */
export interface ModelCardProps {
  model: Model;
  selected?: boolean;
  onSelectModel: (modelId: string) => void;
}

/**
 * Компонент карточки модели
 */
export const ModelCard: React.FC<ModelCardProps> = ({ 
  model, 
  selected, 
  onSelectModel
}) => {
  return (
    <div 
      className={`model-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelectModel(model.id)}
    >
      <div className="model-header">
        <h3>{model.name}</h3>
        <span className="family-badge">{model.family}</span>
      </div>
      
      <div className="model-stats">
        <div className="stat">
          <span className="stat-label">Всего параметров:</span>
          <span className="stat-value">
            {(model.params_total_b / 1e9).toFixed(2)}B
          </span>
        </div>
        
        <div className="stat">
          <span className="stat-label">Вес модели (FP16):</span>
          <span className="stat-value">
            {(model.params_total_b * 1.5).toFixed(2)} ГБ
          </span>
        </div>
        
        <div className="stat">
          <span className="stat-label">Макс. контекст:</span>
          <span className="stat-value">{model.max_context.toLocaleString()} токенов</span>
        </div>
      </div>
    </div>
  );
};

export default ModelCard;
