"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { cloneSchema, ensureEventIdentityFields, hasEventIdentity, identityKeyOf, isIdentityField, IDENTITY_EMAIL } from "@/lib/event-handoff";
import { REGISTRY } from "@/app/components/form-registry";
import { genFieldId } from "../form-editor/fieldId";
import { useFormEditor } from "../form-editor/FormEditorContext";
import { dropInvalidDependents, newFieldOf, pruneConditions, retypeField } from "./studio-schema";

function lockedMapOf(workflow) {
  if (!workflow?.isPublished) return new Map();
  return new Map((workflow.lockedQuestions ?? []).map((question) => [question.id, { values: Array.isArray(question.values) ? question.values : [] }]));
}

export function useFormActions({ eventLinked: forcedEventLinked = false } = {}) {
  const { state, dispatch } = useFormEditor();
  const schemaRef = useRef(state.schema);

  useLayoutEffect(() => {
    schemaRef.current = state.schema;
  }, [state.schema]);

  const eventLinked = forcedEventLinked || hasEventIdentity(state.schema);
  const lockedById = useMemo(() => lockedMapOf(state.workflow), [state.workflow]);

  const commit = useCallback((next) => {
    const wrapped = eventLinked ? ensureEventIdentityFields(next) : next;
    schemaRef.current = wrapped;
    dispatch({ type: "SET_SCHEMA", payload: wrapped });
  }, [dispatch, eventLinked]);

  const isProtected = useCallback((field) => Boolean(field) && (lockedById.has(field.id) || (eventLinked && isIdentityField(field))), [lockedById, eventLinked]);

  const isLockedChoice = useCallback((field, value) => (lockedById.get(field?.id)?.values ?? []).includes(value), [lockedById]);

  return useMemo(() => {
    const current = () => schemaRef.current;
    const find = (id) => current().find((field) => field.id === id);

    const updateField = (id, updates) => {
      const marking = !eventLinked && updates.props?.identity === IDENTITY_EMAIL;
      commit(current().map((field) => {
        if (field.id !== id) return marking && field.props?.identity ? { ...field, props: { ...field.props, identity: undefined } } : field;
        const next = { ...field, ...updates };
        const key = eventLinked && (identityKeyOf(field) || identityKeyOf(next));
        if (!key) return next;
        return { ...next, props: { ...(next.props ?? {}), identity: key, required: true, inputType: key === "email" ? "email" : "name" } };
      }));
    };

    const updateProps = (id, patch) => {
      const field = find(id);
      if (!field) return;
      updateField(id, { props: { ...(field.props ?? {}), ...patch } });
    };

    const insertAt = (index, type) => {
      const id = genFieldId();
      const next = [...current()];
      next.splice(Math.max(0, Math.min(index, next.length)), 0, newFieldOf(type, id));
      commit(next);
      return id;
    };

    const insertFields = (index, fields) => {
      const copies = cloneSchema(
        (fields ?? []).map((field) => ({ ...field, props: field.props ?? REGISTRY[field.type]?.defaults ?? {} })),
        genFieldId,
      );
      if (copies.length === 0) return [];
      const next = [...current()];
      next.splice(Math.max(0, Math.min(index, next.length)), 0, ...copies);
      commit(next);
      return copies.map((field) => field.id);
    };

    const duplicate = (ids) => {
      const fields = current();
      const sources = fields.filter((field) => ids.includes(field.id) && !(eventLinked && isIdentityField(field)));
      if (sources.length === 0) return [];
      const lastIndex = Math.max(...sources.map((field) => fields.indexOf(field)));
      const copies = sources.map((field) => ({ ...field, id: genFieldId(), props: { ...structuredClone(field.props ?? {}), identity: undefined } }));
      const next = [...fields];
      next.splice(lastIndex + 1, 0, ...copies);
      commit(next);
      return copies.map((field) => field.id);
    };

    const remove = (ids) => {
      const fields = current();
      const blocked = fields.filter((field) => ids.includes(field.id) && isProtected(field)).map((field) => field.id);
      const removable = ids.filter((id) => !blocked.includes(id));
      if (removable.length === 0) return { removed: 0, cleared: 0, blocked: blocked.length };

      let cleared = 0;
      const next = fields.filter((field) => !removable.includes(field.id)).map((field) => {
        if (!removable.includes(field.condition?.fieldId)) return field;
        const { condition, ...rest } = field;
        cleared += 1;
        return rest;
      });
      commit(next);
      return { removed: removable.length, cleared, blocked: blocked.length };
    };

    const move = (ids, direction) => {
      const fields = [...current()];
      const positions = fields.map((field, index) => (ids.includes(field.id) ? index : -1)).filter((index) => index >= 0);
      if (positions.length === 0) return 0;
      if (direction < 0 && positions[0] === 0) return 0;
      if (direction > 0 && positions[positions.length - 1] === fields.length - 1) return 0;
      const order = direction < 0 ? positions : [...positions].reverse();
      order.forEach((index) => {
        const target = index + direction;
        [fields[index], fields[target]] = [fields[target], fields[index]];
      });
      const pruned = pruneConditions(fields);
      commit(pruned.fields);
      return pruned.removed;
    };

    const reorder = (id, toIndex) => {
      const fields = [...current()];
      const from = fields.findIndex((field) => field.id === id);
      if (from < 0 || toIndex === from || toIndex === from + 1) return 0;
      const [item] = fields.splice(from, 1);
      fields.splice(toIndex > from ? toIndex - 1 : toIndex, 0, item);
      const pruned = pruneConditions(fields);
      commit(pruned.fields);
      return pruned.removed;
    };

    const retype = (id, type) => {
      const field = find(id);
      if (!field || field.type === type || isProtected(field)) return 0;
      const next = current().map((item) => (item.id === id ? retypeField(item, type) : item));
      const dropped = dropInvalidDependents(next, id);
      commit(dropped.fields);
      return dropped.removed;
    };

    const setCondition = (id, condition) => {
      const field = find(id);
      if (!field) return;
      if (condition) {
        updateField(id, { condition });
        return;
      }
      const { condition: removed, ...rest } = field;
      commit(current().map((item) => (item.id === id ? rest : item)));
    };

    const setRequired = (ids, value) => {
      commit(current().map((field) => {
        if (!ids.includes(field.id) || field.type === "separator") return field;
        if (eventLinked && isIdentityField(field)) return field;
        return { ...field, props: { ...(field.props ?? {}), required: value } };
      }));
    };

    const setChoice = (id, index, value) => {
      const field = find(id);
      const choices = [...(field?.props?.choices ?? [])];
      if (!field || isLockedChoice(field, choices[index])) return;
      choices[index] = value;
      updateField(id, { props: { ...field.props, choices, preset: null } });
    };

    const addChoice = (id, at) => {
      const field = find(id);
      if (!field) return;
      const choices = [...(field.props?.choices ?? [])];
      choices.splice(at, 0, `Seçenek ${choices.length + 1}`);
      updateField(id, { props: { ...field.props, choices, preset: null } });
    };

    const removeChoice = (id, index) => {
      const field = find(id);
      const choices = field?.props?.choices ?? [];
      if (!field || choices.length <= 1 || isLockedChoice(field, choices[index])) return false;
      updateField(id, { props: { ...field.props, choices: choices.filter((_, position) => position !== index), preset: null } });
      return true;
    };

    const pasteChoices = (id, index, lines) => {
      const field = find(id);
      const choices = [...(field?.props?.choices ?? [])];
      if (!field || isLockedChoice(field, choices[index])) return;
      choices.splice(index, 1, ...lines);
      updateField(id, { props: { ...field.props, choices, preset: null } });
    };

    const setListItem = (id, key, index, value) => {
      const field = find(id);
      if (!field) return;
      const list = [...(field.props?.[key] ?? [])];
      list[index] = value;
      updateField(id, { props: { ...field.props, [key]: list } });
    };

    const addListItem = (id, key, label) => {
      const field = find(id);
      if (!field) return;
      const list = [...(field.props?.[key] ?? [])];
      updateField(id, { props: { ...field.props, [key]: [...list, `${label} ${list.length + 1}`] } });
    };

    const removeListItem = (id, key, index) => {
      const field = find(id);
      const list = field?.props?.[key] ?? [];
      if (!field || list.length <= 1) return;
      updateField(id, { props: { ...field.props, [key]: list.filter((_, position) => position !== index) } });
    };

    const childrenOf = (field) => (Array.isArray(field?.props?.fields) ? field.props.fields : []);

    const updateChild = (id, childId, patch) => {
      const field = find(id);
      if (!field) return;
      const fields = childrenOf(field).map((child) => (child.id === childId ? { ...child, props: { ...(child.props ?? {}), ...patch } } : child));
      updateField(id, { props: { ...field.props, fields } });
    };

    const addChild = (id, type) => {
      const field = find(id);
      if (!field) return null;
      const childId = genFieldId();
      updateField(id, { props: { ...field.props, fields: [...childrenOf(field), newFieldOf(type, childId)] } });
      return childId;
    };

    const removeChild = (id, childId) => {
      const field = find(id);
      if (!field) return;
      updateField(id, { props: { ...field.props, fields: childrenOf(field).filter((child) => child.id !== childId) } });
    };

    return {
      eventLinked,
      lockedById,
      isProtected,
      isLockedChoice,
      updateField,
      updateProps,
      insertAt,
      insertFields,
      duplicate,
      remove,
      move,
      reorder,
      retype,
      setCondition,
      setRequired,
      setChoice,
      addChoice,
      removeChoice,
      pasteChoices,
      setListItem,
      addListItem,
      removeListItem,
      updateChild,
      addChild,
      removeChild,
      setTitle: (value) => dispatch({ type: "SET_TITLE", payload: value }),
      setDescription: (value) => dispatch({ type: "SET_DESCRIPTION", payload: value }),
      setTask: (task) => dispatch({ type: "SET_TASK", payload: task }),
      setSetting: (key, value) => dispatch({ type: "UPDATE_SETTINGS", payload: { key, value } }),
    };
  }, [commit, dispatch, eventLinked, isLockedChoice, isProtected, lockedById]);
}
