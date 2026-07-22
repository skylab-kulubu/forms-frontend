export function formatFieldAnswer(field, rawValue) {
  let val = rawValue;
  if (val === undefined || val === null) val = "";

  switch (field.type) {
    case "multi_choice":
      if (Array.isArray(val) && field.props?.choices) {
        const choices = field.props.choices;
        return val.map((idx) => {
          const n = Number(idx);
          if (!isNaN(n) && choices[n]) return choices[n];
          return idx;
        }).join(", ");
      }
      return Array.isArray(val) ? val.join(", ") : String(val);

    case "combobox":
      if (field.props?.choices) {
        const n = Number(val);
        if (val !== "" && !isNaN(n) && field.props.choices[n]) return field.props.choices[n];
        return String(val);
      }
      return String(val);

    case "file":
      return val ? String(val) : "";

    case "toggle":
      return val === true ? (field.props?.trueLabel || "Evet") : (field.props?.falseLabel || "Hayır");

    case "matrix":
      return (typeof val === "object" && val !== null) ? JSON.stringify(val) : String(val);

    default:
      return Array.isArray(val) ? val.join(", ") : String(val);
  }
}
