import { isFunction } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { DirtyLevels } from "./constants";
import { trackRefValue, triggerRefValue } from "./ref";
class ComputedRefImpl<T> {
  public _value: any;
  public effect;
  public dep: any;
  constructor(public getter: (v: any) => T, public setter: (v: any) => void) {
    this.effect = new ReactiveEffect(
      () => getter(this._value),
      () => {
        triggerRefValue(this);
      }
    );
  }

  get value() {
    if (this.effect.dirty) {
      this._value = this.effect.run();
      trackRefValue(this);
      console.log("this", this);
    }
    return this._value;
  }
  set value(newValue) {
    this.setter(newValue);
  }
}
export function computed(getterOptions: any) {
  let onlyGetter = isFunction(getterOptions);
  let getter, setter;
  if (onlyGetter) {
    console.log("是个对象");
    getter = getterOptions;
    setter = () => {};
  } else {
    console.log("是个函数");
    getter = getterOptions.get;
    setter = getterOptions.set;
  }
  return new ComputedRefImpl(getter, setter);
}
