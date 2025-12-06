export function useProp(prop, onPropChange, readOnly = false) {
  if (!prop) throw new Error("useProp: Prop zorunlu");
  if (!onPropChange && !readOnly) throw new Error("useProp: onPropChange zorunlu (readOnly değilse)");

  const patch = (next) => {
    onPropChange({ ...prop, ...next });
  };

  const bind = (key) => ({
    value: prop[key] ?? "",
    onChange: (e) => patch({ [key]: e.target.value }),
  });

  const toggle = (key, val) => patch({ [key]: val });

  return { prop, patch, bind, toggle };
}