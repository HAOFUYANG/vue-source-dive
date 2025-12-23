import { waitForDebugger } from "inspector/promises";
import { DirtyLevels } from "./constants";
export function effect(fn: () => void, options: any = {}) {
  const _effect = new ReactiveEffect(fn, () => {
    _effect.run();
  });
  _effect.run();
  if (options) {
    Object.assign(_effect, options);
  }

  const runner = _effect.run.bind(_effect) as (() => void) & {
    effect: ReactiveEffect;
  };
  runner.effect = _effect;
  return runner;
}
function preCleanEffect(effect: ReactiveEffect) {
  effect._depsLength = 0;
  effect._trackId++;
}
function postCleanEffect(effect: ReactiveEffect) {
  if (effect.deps.length > effect._depsLength) {
    for (let i = effect._depsLength; i < effect.deps.length; i++) {
      cleanupDepEffect(effect.deps[i], effect);
    }
    effect.deps.length = effect._depsLength;
  }
}
function cleanupDepEffect(dep: any, effect: ReactiveEffect) {
  dep.delete(effect);
  if (dep.size === 0) {
    dep.cleanup();
  }
}
export let activeEffect: ReactiveEffect | undefined; //全局变量 ，指向 当前正在执行的副作用实例 ，是 Vue 3 响应式系统 依赖收集的核心枢纽 。

export class ReactiveEffect<T = any> {
  _trackId = 0; //记录当前effect执行了几次
  _depsLength = 0;
  _running = 0;
  _dirtyLevel = DirtyLevels.Dirty;
  deps: any[] = [];
  public active = true;
  constructor(public fn: () => T, public scheduler: () => void) {
    // console.log("fn :>> ", fn);
    // console.log("scheduler :>> ", scheduler);
  }
  public get dirty() {
    return this._dirtyLevel === DirtyLevels.Dirty;
  }
  public set dirty(v) {
    this._dirtyLevel = v ? DirtyLevels.Dirty : DirtyLevels.NoDirty;
  }
  run() {
    this._dirtyLevel = DirtyLevels.NoDirty;
    if (!this.active) {
      console.log("不是响应式数据");
      return this.fn();
    }
    let lastEffect = activeEffect; //临时变量 ，用于 保存上一个活跃的副作用实例 ，确保嵌套副作用执行后能正确恢复上下文
    try {
      // 这个this指向的是当前的effect实例
      activeEffect = this;
      this._running++;
      preCleanEffect(this);
      return this.fn();
    } finally {
      this._running--;
      postCleanEffect(this);
      activeEffect = lastEffect;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
    }
  }
}
export function trackEffect(effect: ReactiveEffect, dep: any) {
  //只收集一次
  // console.log("effect", effect);
  if (dep.get(effect) !== effect._trackId) {
    dep.set(effect, effect._trackId);
    const oldDep = effect.deps[effect._depsLength];
    if (oldDep !== dep) {
      if (oldDep) {
        cleanupDepEffect(oldDep, effect);
      }
      effect.deps[effect._depsLength++] = dep;
    } else {
      effect._depsLength++;
    }
  }
}

export function triggerEffects(dep: any) {
  for (const effect of dep.keys()) {
    if (effect._dirtyLevel < DirtyLevels.Dirty) {
      effect._dirtyLevel = DirtyLevels.Dirty;
    }
    if (!effect._running) {
      if (effect.scheduler) {
        // 如果不是正在执行，才能执行
        effect.scheduler(); // -> effect.run()
      }
    }
  }
}
