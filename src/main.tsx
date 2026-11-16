/**
 * Точка входа приложения (src/main.tsx)
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import type { GPU, Model, Quantization, Engine } from './data/loader';
import { gpusData, modelsData, quantizationsData, enginesData } from './data/loader';

// Глобальный объект для каталога (используется в компонентах)
const catalog: any = {};

/**
 * Инициализация каталога данных
 */
async function initCatalog() {
  try {
    // Для MVP — заглушки с пустыми массивами
    catalog.gpus = [];
    catalog.models = [];
    catalog.quantizations = [];
    catalog.engines = [];
    catalog.cpus = [];

  } catch (error: unknown) {
    const errorStr = error instanceof Error ? error.message : String(error);
    
    catalog.error = `Не удалось загрузить каталог: ${errorStr}`;
    
    console.error('Ошибка загрузки каталога:', errorStr);
  }

  return catalog;
}

// Рендер приложения после загрузки каталога
initCatalog().then(catalog => {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  
  // Проверяем, произошла ли ошибка при загрузке
  if (catalog.error) {
    root.render(
      <React.StrictMode>
        <div className="app">
          <header className="app-header">
            <h1>LLM Server Calculator</h1>
            <nav className="mode-tabs" role="tablist">
              <button 
                className={`tab active`}
                onClick={() => { /* Перезагрузить страницу для сброса кеша */ window.location.reload(); }}
                aria-selected={true}
              >
                Повторить загрузку
              </button>
            </nav>
          </header>

          <main className="app-main">
            <div className="loading-catalog">
              {catalog.error}
            </div>
          </main>

          <footer className="app-footer">
            <p style={{ color: '#a0a0a0', fontSize: '0.9rem' }}>{catalog.error}</p>
          </footer>
        </div>
      </React.StrictMode>
    );
  } else {
    root.render(
      <React.StrictMode>
        <App 
          gpus={catalog.gpus}
          models={catalog.models}
          quantizations={catalog.quantizations}
          engines={catalog.engines}
        />
      </React.StrictMode>
    );
  }
});
