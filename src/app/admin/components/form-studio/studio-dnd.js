import { MouseSensor, TouchSensor, defaultDropAnimationSideEffects, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { pruneConditions } from "./studio-schema";

const NO_DRAG = "input, textarea, select, button, a, [contenteditable]:not([contenteditable='false']), [data-no-drag]";

const canStart = (event) => !event.target?.closest?.(NO_DRAG);

class StudioMouseSensor extends MouseSensor {
  static activators = [{
    eventName: "onMouseDown",
    handler: ({ nativeEvent: event }, { onActivation }) => {
      if (event.button !== 0 || !canStart(event)) return false;
      onActivation?.({ event });
      return true;
    },
  }];
}

class StudioTouchSensor extends TouchSensor {
  static activators = [{
    eventName: "onTouchStart",
    handler: ({ nativeEvent: event }, { onActivation }) => {
      if (event.touches.length > 1 || !canStart(event)) return false;
      onActivation?.({ event });
      return true;
    },
  }];
}

export function useStudioSensors(distance = 5) {
  return useSensors(
    useSensor(StudioMouseSensor, { activationConstraint: { distance } }),
    useSensor(StudioTouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  );
}

export const DROP_ANIMATION = {
  duration: 200,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0" } } }),
};

export function slotOf(fields, activeId, overId) {
  const from = fields.findIndex((field) => field.id === activeId);
  const to = fields.findIndex((field) => field.id === overId);
  if (from < 0 || to < 0 || from === to) return null;
  return to > from ? to + 1 : to;
}

export function conditionLoss(fields, activeId, overId) {
  const from = fields.findIndex((field) => field.id === activeId);
  const to = fields.findIndex((field) => field.id === overId);
  if (from < 0 || to < 0 || from === to) return 0;
  return pruneConditions(arrayMove(fields, from, to)).removed;
}
