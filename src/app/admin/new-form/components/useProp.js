export function useProp(prop, onPropChange) {
  if (!prop || !onPropChange) {
    throw new Error("useProp: Prop ve onPropChange zorunludur.");
  }

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