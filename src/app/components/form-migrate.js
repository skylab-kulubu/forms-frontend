export function migrateField(field) {
  if (!field || typeof field !== "object") return field;

  if (field.type === "link") {
    const { allowMultiple = false, ...restProps } = field.props ?? {};
    return {
      ...field,
      type: "short_text",
      props: { ...restProps, inputType: "link", allowMultiple },
    };
  }

  return field;
}

export function migrateSchema(schema) {
  if (!Array.isArray(schema)) return [];
  let changed = false;
  const next = schema.map((field) => {
    const migrated = migrateField(field);
    if (migrated !== field) changed = true;
    return migrated;
  });
  return changed ? next : schema;
}
