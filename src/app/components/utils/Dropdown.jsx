import { Select } from "@skylab-kulubu/skylcn-ui";

const isObject = (option) => typeof option === "object" && option !== null;
const valueOf = (option) => (isObject(option) ? option.value : option);
const labelOf = (option) => (isObject(option) ? option.label : option);
// Select works in strings; forms also passes numbers, so options are keyed as strings and mapped back
const keyOf = (value) => String(value ?? "");

export function Dropdown({ value, onChange, options = [], placeholder = "Seçiniz...", className = "", renderOption, size = "md", tone = "", variant = "box" }) {
    const items = options.map((option) => ({
        value: keyOf(valueOf(option)),
        // Select's value box clips a long label mid-letter; the label's own span draws the ellipsis
        label: <span className="truncate">{labelOf(option)}</span>,
        disabled: isObject(option) ? Boolean(option.disabled) : false,
        hint: isObject(option) ? option.hint : null,
        option,
    }));
    const selected = options.find((option) => valueOf(option) === value);

    return (
        <Select options={items} value={selected === undefined ? null : keyOf(valueOf(selected))}
            onValueChange={(key) => {
                const item = items.find((entry) => entry.value === key);
                if (item) onChange(valueOf(item.option));
            }}
            placeholder={placeholder} variant={variant === "inline" ? "inline" : "box"} size={size === "sm" ? "sm" : "md"}
            tone={tone || undefined} renderOption={renderOption ? (item) => renderOption(item.option) : undefined} className={className}
        />
    );
}
