import { activeEffect, trackEffect, triggerEffects } from "./effect";

const targetMap = new WeakMap();
export const createDep = (cleanup?: any, key?: any) => {
  const dep = new Map() as any;
  dep.cleanup = cleanup;
  dep.name = key;
  return dep;
};
export function track(target: object, key: any) {
  if (activeEffect) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
      depsMap = new Map();
      targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
      depsMap.set(key, (dep = createDep(() => depsMap.delete(key), key)));
    }
    trackEffect(activeEffect, dep);
  }
}

export function trigger(
  target: object,
  key: any,
  newValue?: any,
  oldValue?: any
) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  if (dep) {
    triggerEffects(dep);
  }
}
