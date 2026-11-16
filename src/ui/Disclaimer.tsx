/**
 * Компонент дисклеймера и версионирования (§7.6)
 */

interface DisclaimerProps {
  version: string;
}

export default function Disclaimer({ version }: DisclaimerProps) {
  return (
    <div className="disclaimer">
      <div className="disclaimer-section">
        <h4>Версия каталога:</h4>
        <span>v{version}</span>
      </div>

      <div className="disclaimer-section">
        <h4>Формулы расчёта:</h4>
        <span>calc v1.0 (соответствует спецификации §4)</span>
      </div>

      <div className="disclaimer-section">
        <h4>Дата сбора каталога:</h4>
        <span>2026-11-16</span>
      </div>

      <div className="disclaimer-section">
        <h4>Раскрытие:</h4>
        <span className="disclaimer-warning">
          ⚠ Расчёт оценочный (±15%). Не учитывает фрагментацию VRAM, драйверы, thermal throttling, 
          особенности версии движка. Проверяйте на реальном железе.
        </span>
      </div>

      <div className="disclaimer-section">
        <h4>Источники данных:</h4>
        <ul className="data-sources-list">
          <li>
            <a href="https://www.techpowerup.com/gpulist" target="_blank" rel="noopener noreferrer">
              TechPowerUp GPU Database
            </a>
          </li>
          <li>
            <a href="https://nvidia.com/data-center" target="_blank" rel="noopener noreferrer">
              NVIDIA Data Center
            </a>
          </li>
          <li>
            <a href="https://huggingface.co/models" target="_blank" rel="noopener noreferrer">
              Hugging Face Models
            </a>
          </li>
        </ul>
      </div>

      <div className="disclaimer-section">
        <h4>Лицензия:</h4>
        <span>MIT License — свободное использование</span>
      </div>

      <div className="disclaimer-section">
        <h4>Документация:</h4>
        <ul className="documentation-links">
          <li><a href="./DATA_SOURCES.md" target="_blank" rel="noopener noreferrer">DATA_SOURCES.md — Источники данных</a></li>
          <li><a href="./ASSUMPTIONS.md" target="_blank" rel="noopener noreferrer">ASSUMPTIONS.md — Инженерные оценки</a></li>
        </ul>
      </div>

      <div className="disclaimer-section">
        <h4>GitHub:</h4>
        <span><a href="https://github.com/sever/AI_calculator_1" target="_blank" rel="noopener noreferrer">AI Calculator GitHub</a></span>
      </div>
    </div>
  );
}
