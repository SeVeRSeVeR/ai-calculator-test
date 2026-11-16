import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const ValidatedInput = ({ id, label, type, placeholder, options, onChange, value, errors, min, max, step }) => {
    const isValid = (newValue) => {
        if (!newValue)
            return false;
        switch (type) {
            case 'number':
                return typeof newValue === 'number' && !isNaN(newValue) && isFinite(newValue);
            case 'select':
                return options?.some(opt => opt.value === newValue) || true;
            default:
                return String(newValue).trim() !== '';
        }
    };
    const getError = (newValue) => {
        if (!errors)
            return undefined;
        switch (type) {
            case 'number':
                if (!isValid(newValue))
                    return 'Введите числовое значение';
                if (min !== undefined && newValue < min)
                    return `Минимум ${min}`;
                if (max !== undefined && newValue > max)
                    return `Максимум ${max}`;
                return errors[id];
            case 'select':
                const selectedOption = options?.find(opt => opt.value === newValue);
                return selectedOption ? errors[id] : errors[id];
            default:
                return errors[id];
        }
    };
    if (type !== 'select') {
        return (_jsxs("div", { className: "validated-input", children: [label && _jsx("label", { htmlFor: id, children: label }), _jsx("input", { id: id, type: type, value: value ?? '', onChange: (e) => onChange(type === 'number' ? parseFloat(e.target.value) || null : e.target.value), placeholder: placeholder, min: min, max: max, step: step }), _jsx("span", { className: "error-message", style: { display: getError(value) ? 'block' : 'none' }, children: getError(value) })] }));
    }
    if (options && options.length > 0) {
        return (_jsxs("div", { className: "validated-input", children: [label && _jsx("label", { htmlFor: id, children: label }), _jsxs("select", { id: id, value: value ?? '', onChange: (e) => onChange(e.target.value), children: [_jsx("option", { value: "", children: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435" }), options.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value)))] }), _jsx("span", { className: "error-message", style: { display: getError(value) ? 'block' : 'none' }, children: getError(value) })] }));
    }
    return null;
};
export default ValidatedInput;
