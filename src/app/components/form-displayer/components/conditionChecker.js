function checkCondition(condition, responses, schema) {
    if (!condition || !condition.fieldId) return true;

    const { fieldId, operator, value: targetValue } = condition;

    let answer = responses[fieldId];

    const isAnswerEmpty = answer === undefined || answer === null || answer === "" || (Array.isArray(answer) && answer.length === 0);

    if (operator === "is_set") return !isAnswerEmpty;
    if (operator === "is_empty") return isAnswerEmpty;

    if (isAnswerEmpty) return false;

    const targetField = schema?.find(f => f.id === fieldId);

    if (targetField?.props?.choices && answer !== undefined && answer !== null) {
        const choices = targetField.props.choices;

        if (Array.isArray(answer)) {
            answer = answer.map(val => {
                const idx = Number(val);
                return (!isNaN(idx) && choices[idx]) ? choices[idx] : val;
            });
        } else {
            const idx = Number(answer);
            if (!isNaN(idx) && choices[idx]) {
                answer = choices[idx];
            }
        }
    }

    if (Array.isArray(answer)) {
        switch (operator) {
            case "equals": return answer.includes(targetValue);
            case "not_equals": return !answer.includes(targetValue);
            default: return false;
        }
    }

    const strAnswer = String(answer);
    const strTarget = String(targetValue);

    const isDate = /^\d{4}-\d{2}-\d{2}$/.test(strAnswer);
    const isTime = /^\d{2}:\d{2}$/.test(strAnswer);

    if (isDate || isTime) {
        switch (operator) {
            case "equals": return strAnswer === strTarget;
            case "not_equals": return strAnswer !== strTarget;
            case "before": return strAnswer < strTarget;
            case "after": return strAnswer > strTarget;
            default: return false;
        }
    }

    const cleanAnswer = strAnswer.toLowerCase();
    const cleanTarget = strTarget.toLowerCase();

    switch (operator) {
        case "equals": return cleanAnswer === cleanTarget;
        case "not_equals": return cleanAnswer !== cleanTarget;
        case "contains": return cleanAnswer.includes(cleanTarget);
        case "starts_with": return cleanAnswer.startsWith(cleanTarget);
        case "ends_with": return cleanAnswer.endsWith(cleanTarget);
        default: return true;
    }
}

export function getVisibleFields(schema, responses) {
    if (!schema) return [];
    return schema.filter(field => checkCondition(field.condition, responses, schema));
}