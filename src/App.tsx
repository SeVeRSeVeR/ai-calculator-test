/**
 * Главный компонент приложения (src/App.tsx) — роутинг и навигация между режимами
 */

import { useEffect, useState } from 'react';
import './App.css';
import ModeA from './ui/ModeA';
import ModeB from './ui/ModeB';
import Disclaimer from './ui/Disclaimer';

import type { GPU, Model, Quantization, Engine } from './data/loader';

interface Props {
  gpus: GPU[];
  models: Model[];
  quantizations: Quantization[];
  engines: Engine[];
}

function App({ gpus, models, quantizations, engines }: Props) {
  const [catalogError, setCatalogError] = useState<string | null>(null);
  
  // Сохраняем каталог в глобальный state (для доступа из компонентов)
  useEffect(() => {
    const globalCatalog = window['__AI_CALCULATOR_CATALOG__'] as any;
    
    if (!globalCatalog || !globalCatalog.gpus || !globalCatalog.models) {
      return; // Каталог ещё не загружен — будет после загрузки данных в main.tsx
    }

    // Сброс каталога для обновления данных (чтобы сбросить cache)
    globalCatalog.reset();
    
    window['__AI_CALCULATOR_CATALOG__'] = {
      gpus,
      models,
      quantizations,
      engines
    };
  }, [gpus, models, quantizations, engines]);

  // Проверка доступности каталога перед рендерингом компонентов
  const catalogAvailable = window['__AI_CALCULATOR_CATALOG__'] !== undefined;

  if (!catalogAvailable) {
    return (
      <div className="app">
        <div className="loading-catalog">
          Загрузка каталога данных...
        </div>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<'gpu' | 'model'>();

  return (
    <div className="app">
      <header className="app-header">
        <h1>LLM Server Calculator</h1>
        <nav className="mode-tabs" role="tablist">
          <button 
            className={`tab ${activeTab === 'gpu' ? 'active' : ''}`}
            onClick={() => setActiveTab('gpu')}
            aria-selected={activeTab === 'gpu'}
            id="tab-gpu"
          >
            Режим A: От железа к модели
          </button>
          <button 
            className={`tab ${activeTab === 'model' ? 'active' : ''}`}
            onClick={() => setActiveTab('model')}
            aria-selected={activeTab === 'model'}
            id="tab-model"
          >
            Режим B: От модели к железу
          </button>
        </nav>
      </header>

      <main className="app-main">
        <div 
          className={`content-section ${activeTab}`}
          role="tabpanel"
          aria-labelledby={activeTab === 'gpu' ? 'tab-gpu' : 'tab-model'}
        >
          {activeTab === 'gpu' && (
            <ModeA
              gpus={gpus}
              models={models}
              quantizations={quantizations}
              engines={engines}
              onError={(error: string) => setCatalogError(error)}
            />
          )}

          {activeTab === 'model' && (
            <ModeB
              gpus={gpus}
              models={models}
              quantizations={quantizations}
              engines={engines}
              onError={(error: string) => setCatalogError(error)}
            />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <Disclaimer version="2026.11" />
        
        {catalogError && (
          <div className="error-message" role="alert">
            <strong>Ошибка:</strong> {catalogError}
            <button onClick={() => setCatalogError(null)}>Закрыть</button>
          </div>
        )}

        <noscript>
          Этот калькулятор требует JavaScript. Пожалуйста, включите скрипты в вашем браузере.
        </noscript>
      </footer>
    </div>
  );
}

export default App;
