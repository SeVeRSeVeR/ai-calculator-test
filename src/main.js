import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Точка входа приложения (src/main.tsx)
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Глобальный объект для каталога (используется в компонентах)
const catalog = {};
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
    }
    catch (error) {
        const errorStr = error instanceof Error ? error.message : String(error);
        catalog.error = `Не удалось загрузить каталог: ${errorStr}`;
        console.error('Ошибка загрузки каталога:', errorStr);
    }
    return catalog;
}
// Рендер приложения после загрузки каталога
initCatalog().then(catalog => {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    // Проверяем, произошла ли ошибка при загрузке
    if (catalog.error) {
        root.render(_jsx(React.StrictMode, { children: _jsxs("div", { className: "app", children: [_jsxs("header", { className: "app-header", children: [_jsx("h1", { children: "LLM Server Calculator" }), _jsx("nav", { className: "mode-tabs", role: "tablist", children: _jsx("button", { className: `tab active`, onClick: () => { /* Перезагрузить страницу для сброса кеша */ window.location.reload(); }, "aria-selected": true, children: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0443" }) })] }), _jsx("main", { className: "app-main", children: _jsx("div", { className: "loading-catalog", children: catalog.error }) }), _jsx("footer", { className: "app-footer", children: _jsx("p", { style: { color: '#a0a0a0', fontSize: '0.9rem' }, children: catalog.error }) })] }) }));
    }
    else {
        root.render(_jsx(React.StrictMode, { children: _jsx(App, { gpus: catalog.gpus, models: catalog.models, quantizations: catalog.quantizations, engines: catalog.engines }) }));
    }
});
