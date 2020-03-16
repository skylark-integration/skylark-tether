define(['./utils/type-check'], function (typecheck) {
    'use strict';
    class Evented {
        on(event, handler, ctx, once = false) {
            if (typecheck.isUndefined(this.bindings)) {
                this.bindings = {};
            }
            if (typecheck.isUndefined(this.bindings[event])) {
                this.bindings[event] = [];
            }
            this.bindings[event].push({
                handler,
                ctx,
                once
            });
            return this;
        }
        once(event, handler, ctx) {
            return this.on(event, handler, ctx, true);
        }
        off(event, handler) {
            if (typecheck.isUndefined(this.bindings) || typecheck.isUndefined(this.bindings[event])) {
                return this;
            }
            if (typecheck.isUndefined(handler)) {
                delete this.bindings[event];
            } else {
                this.bindings[event].forEach((binding, index) => {
                    if (binding.handler === handler) {
                        this.bindings[event].splice(index, 1);
                    }
                });
            }
            return this;
        }
        trigger(event, ...args) {
            if (!typecheck.isUndefined(this.bindings) && this.bindings[event]) {
                this.bindings[event].forEach((binding, index) => {
                    const {ctx, handler, once} = binding;
                    const context = ctx || this;
                    handler.apply(context, args);
                    if (once) {
                        this.bindings[event].splice(index, 1);
                    }
                });
            }
            return this;
        }
    }
    return { Evented: Evented };
});