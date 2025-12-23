import { isObject } from "@vue/shared";
import { mutableHandlers } from "./baseHandler";
import { ReactiveFlags } from "./constants";
const reactiveMap = new WeakMap();

export function reactive(target: object) {
  return createReactiveObject(target);
}

function createReactiveObject(target: any) {
  if (!isObject(target)) {
    return;
  }
  // 如何解决嵌套代理的问题-判断是否是响应式对象
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }
  // 如何解决重复代理的问题-建立映射关系表缓存
  const existProxy = reactiveMap.get(target);
  if (existProxy) {
    return existProxy;
  }

  let proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}

export function toReactive(value: any) {
  return isObject(value) ? reactive(value) : value;
}
