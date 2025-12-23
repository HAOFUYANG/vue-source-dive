import { reactive } from "./reactive";
import { isObject } from "@vue/shared";
import { track, trigger } from "./reactiveEffect";
import { ReactiveFlags } from "./constants";
export const mutableHandlers: ProxyHandler<object> = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    //依赖收集
    track(target, key);
    let res = Reflect.get(target, key, receiver);
    // 递归代理
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    let oldValue = (target as any)[key];
    let result = Reflect.set(target, key, value, receiver);
    trigger(target, key, value, oldValue);
    return result;
  },
};
