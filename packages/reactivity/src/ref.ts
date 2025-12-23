import { toReactive } from "./reactive";
import { activeEffect, trackEffect, triggerEffects } from "./effect";
import { createDep } from "./reactiveEffect";
export function ref(value: any) {
  return createRef(value);
}

export function toRef(target: object, key: any) {
  return new ObjectRefIml(target, key);
}

export function toRefs(object: any) {
  const res = {};
  for (let key in object) {
    (res as any)[key] = toRef(object, key);
  }
  return res;
}
export function proxyRefs(object: any) {
  return new Proxy(object, {
    get(target, key, receiver) {
      let r = Reflect.get(target, key, receiver);
      return r.__v_isRef ? r.value : r;
    },
    set(target, key, value, receiver): any {
      const oldValue = target[key];
      console.log("oldValue", oldValue, value);
      if (oldValue.__v_isRef) {
        return (oldValue.value = value);
      } else {
        return Reflect.set(target, key, value, receiver);
      }
    },
  });
}
function createRef(value: any) {
  return new RefImpl(value);
}

class RefImpl {
  public __v_isRef = true;
  public _value;
  public deps: any[] = [];
  constructor(public rawValue: any) {
    this._value = toReactive(rawValue);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (newValue !== this.rawValue) {
      this.rawValue = newValue;
      this._value = newValue;
      triggerRefValue(this);
    }
  }
}
export function trackRefValue(ref: any) {
  if (activeEffect) {
    trackEffect(
      activeEffect,
      (ref.dep = createDep(() => (ref.dep = undefined), "undefined"))
    );
  }
}
export function triggerRefValue(ref: any) {
  let dep = ref.dep;
  if (dep) {
    triggerEffects(dep);
  }
}

class ObjectRefIml {
  public __v_isRef = true;
  constructor(public target: any, public key: any) {}
  get value() {
    return this.target[this.key];
  }
  set value(newValue) {
    this.target[this.key] = newValue;
  }
}
