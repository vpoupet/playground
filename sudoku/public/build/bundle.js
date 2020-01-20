
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.17.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Cell.svelte generated by Svelte v3.17.1 */

    const { console: console_1 } = globals;
    const file = "src/Cell.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    // (55:4) {:else}
    function create_else_block(ctx) {
    	let each_1_anchor;
    	let each_value = /*annotations*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*onPointerDown, onPointerUp, onPointerLeave, annotations*/ 450) {
    				each_value = /*annotations*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(55:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (51:4) {#if value !== undefined}
    function create_if_block(ctx) {
    	let div;
    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*value*/ ctx[0]);
    			attr_dev(div, "class", "big");
    			add_location(div, file, 51, 8, 1323);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			dispose = listen_dev(div, "click", /*clearValue*/ ctx[5], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*value*/ 1) set_data_dev(t, /*value*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(51:4) {#if value !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (62:16) {#if annotation}
    function create_if_block_1(ctx) {
    	let t_value = /*i*/ ctx[18] + 1 + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(62:16) {#if annotation}",
    		ctx
    	});

    	return block;
    }

    // (56:8) {#each annotations as annotation, i}
    function create_each_block(ctx) {
    	let div;
    	let t;
    	let dispose;
    	let if_block = /*annotation*/ ctx[16] && create_if_block_1(ctx);

    	function pointerdown_handler(...args) {
    		return /*pointerdown_handler*/ ctx[14](/*i*/ ctx[18], ...args);
    	}

    	function pointerup_handler(...args) {
    		return /*pointerup_handler*/ ctx[15](/*i*/ ctx[18], ...args);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			attr_dev(div, "class", "small");
    			add_location(div, file, 56, 12, 1467);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t);

    			dispose = [
    				listen_dev(div, "pointerdown", pointerdown_handler, false, false, false),
    				listen_dev(div, "pointerup", pointerup_handler, false, false, false),
    				listen_dev(div, "pointerleave", /*onPointerLeave*/ ctx[8], false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*annotation*/ ctx[16]) {
    				if (!if_block) {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(56:8) {#each annotations as annotation, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let div_class_value;

    	function select_block_type(ctx, dirty) {
    		if (/*value*/ ctx[0] !== undefined) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", div_class_value = "cell R" + /*row*/ ctx[4] + " C" + /*col*/ ctx[3] + " " + (/*isLocked*/ ctx[2] ? "locked" : ""));
    			add_location(div, file, 49, 0, 1225);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (dirty & /*isLocked*/ 4 && div_class_value !== (div_class_value = "cell R" + /*row*/ ctx[4] + " C" + /*col*/ ctx[3] + " " + (/*isLocked*/ ctx[2] ? "locked" : ""))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { value } = $$props;
    	let { annotations } = $$props;
    	let { index } = $$props;
    	let { isLocked } = $$props;
    	let dispatch = createEventDispatcher();
    	let pointerTimer = undefined;
    	let pointerValue = undefined;
    	let col = index % 9;
    	let row = ~~(index / 9);

    	function clearPointerTimer() {
    		clearTimeout(pointerTimer);
    		pointerValue = undefined;
    	}

    	function clearValue() {
    		if (!isLocked) {
    			dispatch("setCellValue", { index, value: undefined });
    		}
    	}

    	function onPointerDown(i) {
    		if (!isLocked) {
    			if (pointerTimer !== undefined) {
    				clearPointerTimer();
    			}

    			pointerTimer = setTimeout(
    				() => {
    					console.log(i);
    					dispatch("setCellValue", { index, value: i + 1 });
    					clearPointerTimer();
    				},
    				250
    			);
    		}
    	}

    	function onPointerUp(i) {
    		if (pointerTimer !== undefined) {
    			clearPointerTimer();
    			dispatch("toggleAnnotation", { index, value: i });
    		}
    	}

    	function onPointerLeave() {
    		clearPointerTimer();
    	}

    	const writable_props = ["value", "annotations", "index", "isLocked"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Cell> was created with unknown prop '${key}'`);
    	});

    	const pointerdown_handler = i => onPointerDown(i);
    	const pointerup_handler = i => onPointerUp(i);

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("annotations" in $$props) $$invalidate(1, annotations = $$props.annotations);
    		if ("index" in $$props) $$invalidate(9, index = $$props.index);
    		if ("isLocked" in $$props) $$invalidate(2, isLocked = $$props.isLocked);
    	};

    	$$self.$capture_state = () => {
    		return {
    			value,
    			annotations,
    			index,
    			isLocked,
    			dispatch,
    			pointerTimer,
    			pointerValue,
    			col,
    			row
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("annotations" in $$props) $$invalidate(1, annotations = $$props.annotations);
    		if ("index" in $$props) $$invalidate(9, index = $$props.index);
    		if ("isLocked" in $$props) $$invalidate(2, isLocked = $$props.isLocked);
    		if ("dispatch" in $$props) dispatch = $$props.dispatch;
    		if ("pointerTimer" in $$props) pointerTimer = $$props.pointerTimer;
    		if ("pointerValue" in $$props) pointerValue = $$props.pointerValue;
    		if ("col" in $$props) $$invalidate(3, col = $$props.col);
    		if ("row" in $$props) $$invalidate(4, row = $$props.row);
    	};

    	return [
    		value,
    		annotations,
    		isLocked,
    		col,
    		row,
    		clearValue,
    		onPointerDown,
    		onPointerUp,
    		onPointerLeave,
    		index,
    		pointerTimer,
    		pointerValue,
    		dispatch,
    		clearPointerTimer,
    		pointerdown_handler,
    		pointerup_handler
    	];
    }

    class Cell extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			value: 0,
    			annotations: 1,
    			index: 9,
    			isLocked: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cell",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console_1.warn("<Cell> was created without expected prop 'value'");
    		}

    		if (/*annotations*/ ctx[1] === undefined && !("annotations" in props)) {
    			console_1.warn("<Cell> was created without expected prop 'annotations'");
    		}

    		if (/*index*/ ctx[9] === undefined && !("index" in props)) {
    			console_1.warn("<Cell> was created without expected prop 'index'");
    		}

    		if (/*isLocked*/ ctx[2] === undefined && !("isLocked" in props)) {
    			console_1.warn("<Cell> was created without expected prop 'isLocked'");
    		}
    	}

    	get value() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get annotations() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set annotations(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isLocked() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isLocked(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Grid.svelte generated by Svelte v3.17.1 */
    const file$1 = "src/Grid.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[14] = i;
    	return child_ctx;
    }

    // (115:8) {#each cellValues as value, i}
    function create_each_block$1(ctx) {
    	let current;

    	const cell = new Cell({
    			props: {
    				value: /*value*/ ctx[12],
    				annotations: /*cellAnnotations*/ ctx[1][/*i*/ ctx[14]],
    				isLocked: /*cellLocks*/ ctx[2][/*i*/ ctx[14]],
    				index: /*i*/ ctx[14]
    			},
    			$$inline: true
    		});

    	cell.$on("toggleAnnotation", /*onToggleAnnotation*/ ctx[6]);
    	cell.$on("setCellValue", /*onSetCellValue*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(cell.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cell, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const cell_changes = {};
    			if (dirty & /*cellValues*/ 1) cell_changes.value = /*value*/ ctx[12];
    			if (dirty & /*cellAnnotations*/ 2) cell_changes.annotations = /*cellAnnotations*/ ctx[1][/*i*/ ctx[14]];
    			if (dirty & /*cellLocks*/ 4) cell_changes.isLocked = /*cellLocks*/ ctx[2][/*i*/ ctx[14]];
    			cell.$set(cell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(115:8) {#each cellValues as value, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let button0;
    	let t1_value = (/*worker*/ ctx[3] === undefined ? "Generate" : "Stop") + "";
    	let t1;
    	let t2;
    	let button1;
    	let t4;
    	let button2;
    	let t6;
    	let button3;
    	let t8;
    	let button4;
    	let current;
    	let dispose;
    	let each_value = /*cellValues*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div1 = element("div");
    			button0 = element("button");
    			t1 = text(t1_value);
    			t2 = space();
    			button1 = element("button");
    			button1.textContent = "Clear";
    			t4 = space();
    			button2 = element("button");
    			button2.textContent = `${/*isIdle*/ ctx[4]() ? "Solve" : "Stop"}`;
    			t6 = space();
    			button3 = element("button");
    			button3.textContent = "Lock";
    			t8 = space();
    			button4 = element("button");
    			button4.textContent = "Unlock";
    			attr_dev(div0, "class", "grid");
    			add_location(div0, file$1, 113, 4, 3357);
    			add_location(button0, file$1, 125, 8, 3741);
    			add_location(button1, file$1, 126, 8, 3831);
    			add_location(button2, file$1, 127, 8, 3879);
    			add_location(button3, file$1, 128, 8, 3951);
    			add_location(button4, file$1, 129, 8, 3997);
    			attr_dev(div1, "id", "buttons");
    			add_location(div1, file$1, 124, 4, 3714);
    			add_location(div2, file$1, 112, 0, 3347);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(button0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, button1);
    			append_dev(div1, t4);
    			append_dev(div1, button2);
    			append_dev(div1, t6);
    			append_dev(div1, button3);
    			append_dev(div1, t8);
    			append_dev(div1, button4);
    			current = true;

    			dispose = [
    				listen_dev(button0, "click", /*generate*/ ctx[9], false, false, false),
    				listen_dev(button1, "click", /*clear*/ ctx[11], false, false, false),
    				listen_dev(button2, "click", /*solve*/ ctx[10], false, false, false),
    				listen_dev(button3, "click", /*lock*/ ctx[7], false, false, false),
    				listen_dev(button4, "click", /*unlock*/ ctx[8], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cellValues, cellAnnotations, cellLocks, onToggleAnnotation, onSetCellValue*/ 103) {
    				each_value = /*cellValues*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if ((!current || dirty & /*worker*/ 8) && t1_value !== (t1_value = (/*worker*/ ctx[3] === undefined ? "Generate" : "Stop") + "")) set_data_dev(t1, t1_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let cellValues = Array(81).fill(undefined);
    	let cellAnnotations = Array(81);

    	for (let i = 0; i < 81; i++) {
    		cellAnnotations[i] = Array(9).fill(false);
    	}

    	let cellLocks = Array(81).fill(false);
    	let worker = undefined;

    	function isIdle() {
    		return worker === undefined;
    	}

    	function onSetCellValue(e) {
    		$$invalidate(0, cellValues[e.detail.index] = e.detail.value, cellValues);
    	}

    	function onToggleAnnotation(e) {
    		$$invalidate(1, cellAnnotations[e.detail.index][e.detail.value] = !cellAnnotations[e.detail.index][e.detail.value], cellAnnotations);
    	}

    	function lock() {
    		for (let i = 0; i < 81; i++) {
    			$$invalidate(2, cellLocks[i] = cellValues[i] !== undefined, cellLocks);
    		}
    	}

    	function unlock() {
    		for (let i = 0; i < 81; i++) {
    			$$invalidate(2, cellLocks[i] = false, cellLocks);
    		}
    	}

    	function generate() {
    		if (isIdle()) {
    			$$invalidate(3, worker = new Worker("./solver.js"));
    			worker.postMessage({ command: "generate" });

    			$$invalidate(
    				3,
    				worker.onmessage = event => {
    					if (event.data !== undefined) {
    						$$invalidate(0, cellValues = event.data);
    						lock();
    					}

    					worker.terminate();
    					$$invalidate(3, worker = undefined);
    				},
    				worker
    			);
    		} else {
    			worker.terminate();
    			$$invalidate(3, worker = undefined);
    		}
    	}

    	function solve() {
    		if (isIdle()) {
    			$$invalidate(3, worker = new Worker("./solver.js"));
    			worker.postMessage({ command: "solve", values: cellValues });

    			$$invalidate(
    				3,
    				worker.onmessage = event => {
    					if (event.data !== undefined) {
    						$$invalidate(0, cellValues = event.data);
    					}

    					worker.terminate();
    					$$invalidate(3, worker = undefined);
    				},
    				worker
    			);
    		} else {
    			worker.terminate();
    			$$invalidate(3, worker = undefined);
    		}
    	}

    	function clear() {
    		for (let i = 0; i < 81; i++) {
    			if (!cellLocks[i]) {
    				$$invalidate(0, cellValues[i] = undefined, cellValues);
    			}

    			$$invalidate(1, cellAnnotations[i] = Array(9).fill(false), cellAnnotations);
    		}
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("cellValues" in $$props) $$invalidate(0, cellValues = $$props.cellValues);
    		if ("cellAnnotations" in $$props) $$invalidate(1, cellAnnotations = $$props.cellAnnotations);
    		if ("cellLocks" in $$props) $$invalidate(2, cellLocks = $$props.cellLocks);
    		if ("worker" in $$props) $$invalidate(3, worker = $$props.worker);
    	};

    	return [
    		cellValues,
    		cellAnnotations,
    		cellLocks,
    		worker,
    		isIdle,
    		onSetCellValue,
    		onToggleAnnotation,
    		lock,
    		unlock,
    		generate,
    		solve,
    		clear
    	];
    }

    class Grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grid",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.17.1 */
    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	let h1;
    	let t1;
    	let t2;
    	let div;
    	let h2;
    	let t4;
    	let ul2;
    	let li2;
    	let t5;
    	let ul0;
    	let li0;
    	let t7;
    	let li1;
    	let t9;
    	let li3;
    	let t10;
    	let strong0;
    	let t12;
    	let t13;
    	let li4;
    	let t14;
    	let strong1;
    	let t16;
    	let t17;
    	let li5;
    	let t18;
    	let strong2;
    	let t20;
    	let t21;
    	let li6;
    	let t22;
    	let strong3;
    	let t24;
    	let t25;
    	let li11;
    	let t26;
    	let strong4;
    	let t28;
    	let ul1;
    	let li7;
    	let t30;
    	let li8;
    	let t32;
    	let li9;
    	let t34;
    	let li10;
    	let current;
    	const grid = new Grid({ $$inline: true });

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Sudoku";
    			t1 = space();
    			create_component(grid.$$.fragment);
    			t2 = space();
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Instructions";
    			t4 = space();
    			ul2 = element("ul");
    			li2 = element("li");
    			t5 = text("Interaction with cells is done by clicking on one of the 3x3 subcells each representing a value from 1\n            to 9:\n            ");
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "Long-click on a cell's subcell to place a value in the cell";
    			t7 = space();
    			li1 = element("li");
    			li1.textContent = "Short-click on a cell's subcell to toggle a pencil annotation";
    			t9 = space();
    			li3 = element("li");
    			t10 = text("The ");
    			strong0 = element("strong");
    			strong0.textContent = "Generate";
    			t12 = text(" button clears the grid and generates a new proper Sudoku (single solution, all hints\n            required)");
    			t13 = space();
    			li4 = element("li");
    			t14 = text("The ");
    			strong1 = element("strong");
    			strong1.textContent = "Clear";
    			t16 = text(" button clears the value of all non-locked cells");
    			t17 = space();
    			li5 = element("li");
    			t18 = text("The ");
    			strong2 = element("strong");
    			strong2.textContent = "Lock";
    			t20 = text(" button locks all cells with a value");
    			t21 = space();
    			li6 = element("li");
    			t22 = text("The ");
    			strong3 = element("strong");
    			strong3.textContent = "Unlock";
    			t24 = text(" button unlocks all cells");
    			t25 = space();
    			li11 = element("li");
    			t26 = text("The ");
    			strong4 = element("strong");
    			strong4.textContent = "Solve";
    			t28 = text(" button searches for a solution of the current grid\n            ");
    			ul1 = element("ul");
    			li7 = element("li");
    			li7.textContent = "Cell values cannot be changed while solver is running";
    			t30 = space();
    			li8 = element("li");
    			li8.textContent = "Solver can be interrupted by clicking on the same button (labeled \"Stop\" during computation)";
    			t32 = space();
    			li9 = element("li");
    			li9.textContent = "If a solution is found, values are displayed";
    			t34 = space();
    			li10 = element("li");
    			li10.textContent = "If no solution exists, the solver ends (button labeled \"Solve\" again) but cells are not\n                    modified";
    			add_location(h1, file$2, 4, 0, 58);
    			add_location(h2, file$2, 7, 4, 102);
    			add_location(li0, file$2, 12, 16, 299);
    			add_location(li1, file$2, 13, 16, 384);
    			add_location(ul0, file$2, 11, 12, 278);
    			add_location(li2, file$2, 9, 8, 141);
    			add_location(strong0, file$2, 16, 16, 503);
    			add_location(li3, file$2, 16, 8, 495);
    			add_location(strong1, file$2, 19, 16, 666);
    			add_location(li4, file$2, 19, 8, 658);
    			add_location(strong2, file$2, 20, 16, 758);
    			add_location(li5, file$2, 20, 8, 750);
    			add_location(strong3, file$2, 21, 16, 837);
    			add_location(li6, file$2, 21, 8, 829);
    			add_location(strong4, file$2, 22, 16, 907);
    			add_location(li7, file$2, 24, 16, 1014);
    			add_location(li8, file$2, 25, 16, 1093);
    			add_location(li9, file$2, 27, 16, 1228);
    			add_location(li10, file$2, 28, 16, 1298);
    			add_location(ul1, file$2, 23, 12, 993);
    			add_location(li11, file$2, 22, 8, 899);
    			add_location(ul2, file$2, 8, 4, 128);
    			attr_dev(div, "id", "info");
    			add_location(div, file$2, 6, 0, 82);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(grid, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, h2);
    			append_dev(div, t4);
    			append_dev(div, ul2);
    			append_dev(ul2, li2);
    			append_dev(li2, t5);
    			append_dev(li2, ul0);
    			append_dev(ul0, li0);
    			append_dev(ul0, t7);
    			append_dev(ul0, li1);
    			append_dev(ul2, t9);
    			append_dev(ul2, li3);
    			append_dev(li3, t10);
    			append_dev(li3, strong0);
    			append_dev(li3, t12);
    			append_dev(ul2, t13);
    			append_dev(ul2, li4);
    			append_dev(li4, t14);
    			append_dev(li4, strong1);
    			append_dev(li4, t16);
    			append_dev(ul2, t17);
    			append_dev(ul2, li5);
    			append_dev(li5, t18);
    			append_dev(li5, strong2);
    			append_dev(li5, t20);
    			append_dev(ul2, t21);
    			append_dev(ul2, li6);
    			append_dev(li6, t22);
    			append_dev(li6, strong3);
    			append_dev(li6, t24);
    			append_dev(ul2, t25);
    			append_dev(ul2, li11);
    			append_dev(li11, t26);
    			append_dev(li11, strong4);
    			append_dev(li11, t28);
    			append_dev(li11, ul1);
    			append_dev(ul1, li7);
    			append_dev(ul1, t30);
    			append_dev(ul1, li8);
    			append_dev(ul1, t32);
    			append_dev(ul1, li9);
    			append_dev(ul1, t34);
    			append_dev(ul1, li10);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			destroy_component(grid, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
