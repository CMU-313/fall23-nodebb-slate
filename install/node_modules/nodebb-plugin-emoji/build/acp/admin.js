define(['jquery', 'api', 'emoji', 'translator'], function (jQuery$1, api, emoji, translator) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var jQuery__default = /*#__PURE__*/_interopDefaultLegacy(jQuery$1);
    var api__default = /*#__PURE__*/_interopDefaultLegacy(api);

    var ajaxify$1 = ajaxify;

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update$1(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update$1($$) {
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

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    var app$1 = app;

    var config$1 = config;

    var utils$2 = utils;

    /* src\Emoji.svelte generated by Svelte v3.35.0 */

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[36] = list[i];
    	return child_ctx;
    }

    // (198:6) {#each aliases as a}
    function create_each_block_1$1(ctx) {
    	let button;
    	let t0_value = /*a*/ ctx[36] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[32](/*a*/ ctx[36]);
    	}

    	return {
    		c() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = text(" x");
    			attr(button, "class", "btn btn-info btn-xs");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t0);
    			append(button, t1);

    			if (!mounted) {
    				dispose = listen(button, "click", click_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*aliases*/ 4 && t0_value !== (t0_value = /*a*/ ctx[36] + "")) set_data(t0, t0_value);
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (213:6) {#each ascii as a}
    function create_each_block$3(ctx) {
    	let button;
    	let t0_value = /*a*/ ctx[36] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[34](/*a*/ ctx[36]);
    	}

    	return {
    		c() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = text(" x");
    			attr(button, "class", "btn btn-info btn-xs");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t0);
    			append(button, t1);

    			if (!mounted) {
    				dispose = listen(button, "click", click_handler_1);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*ascii*/ 8 && t0_value !== (t0_value = /*a*/ ctx[36] + "")) set_data(t0, t0_value);
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (228:4) {:else}
    function create_else_block$1(ctx) {
    	let button;
    	let i;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			button = element("button");
    			i = element("i");
    			attr(i, "class", "fa fa-trash");
    			attr(button, "class", "btn btn-warning");
    			attr(button, "type", "button");
    			button.disabled = button_disabled_value = /*deleting*/ ctx[12] || /*deleted*/ ctx[13];
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, i);

    			if (!mounted) {
    				dispose = listen(button, "click", /*onDelete*/ ctx[21]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*deleting, deleted*/ 12288 && button_disabled_value !== (button_disabled_value = /*deleting*/ ctx[12] || /*deleted*/ ctx[13])) {
    				button.disabled = button_disabled_value;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (219:4) {#if editing || empty}
    function create_if_block_5$1(ctx) {
    	let button;
    	let i;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			button = element("button");
    			i = element("i");
    			attr(i, "class", "fa fa-check");
    			attr(button, "class", "btn btn-success");
    			attr(button, "type", "button");
    			button.disabled = button_disabled_value = !/*canSave*/ ctx[11];
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, i);

    			if (!mounted) {
    				dispose = listen(button, "click", /*onSave*/ ctx[20]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*canSave*/ 2048 && button_disabled_value !== (button_disabled_value = !/*canSave*/ ctx[11])) {
    				button.disabled = button_disabled_value;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (241:0) {#if deleting || deleted}
    function create_if_block_4$1(ctx) {
    	let tr;
    	let td0;
    	let button0;
    	let t0;
    	let t1;
    	let td1;
    	let t3;
    	let td2;
    	let button1;
    	let t4;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			tr = element("tr");
    			td0 = element("td");
    			button0 = element("button");
    			t0 = text("Cancel");
    			t1 = space();
    			td1 = element("td");
    			td1.innerHTML = `<span class="help-block">Are you sure you want to delete this emoji?</span>`;
    			t3 = space();
    			td2 = element("td");
    			button1 = element("button");
    			t4 = text("Yes");
    			attr(button0, "class", "btn btn-default");
    			attr(button0, "type", "button");
    			button0.disabled = /*deleted*/ ctx[13];
    			attr(td1, "colspan", 3);
    			attr(button1, "class", "btn btn-danger");
    			attr(button1, "type", "button");
    			button1.disabled = /*deleted*/ ctx[13];
    			attr(tr, "class", "svelte-11gdgpc");
    			toggle_class(tr, "fadeout", /*deleted*/ ctx[13]);
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			append(td0, button0);
    			append(button0, t0);
    			append(tr, t1);
    			append(tr, td1);
    			append(tr, t3);
    			append(tr, td2);
    			append(td2, button1);
    			append(button1, t4);

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", /*cancelDelete*/ ctx[23]),
    					listen(button1, "click", /*confirmDelete*/ ctx[22])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*deleted*/ 8192) {
    				button0.disabled = /*deleted*/ ctx[13];
    			}

    			if (dirty[0] & /*deleted*/ 8192) {
    				button1.disabled = /*deleted*/ ctx[13];
    			}

    			if (dirty[0] & /*deleted*/ 8192) {
    				toggle_class(tr, "fadeout", /*deleted*/ ctx[13]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (255:0) {#if editing && failures.nameRequired}
    function create_if_block_3$1(ctx) {
    	let tr;

    	return {
    		c() {
    			tr = element("tr");
    			tr.innerHTML = `<td colspan="${5}"><span><strong>Name</strong> is required</span></td>`;
    			attr(tr, "class", "text-danger svelte-11gdgpc");
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    		}
    	};
    }

    // (263:0) {#if editing && failures.imageRequired}
    function create_if_block_2$1(ctx) {
    	let tr;

    	return {
    		c() {
    			tr = element("tr");
    			tr.innerHTML = `<td colspan="${5}"><span><strong>Image</strong> is required</span></td>`;
    			attr(tr, "class", "text-danger svelte-11gdgpc");
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    		}
    	};
    }

    // (271:0) {#if editing && failures.nameInvalid}
    function create_if_block_1$1(ctx) {
    	let tr;

    	return {
    		c() {
    			tr = element("tr");
    			tr.innerHTML = `<td colspan="${5}"><span><strong>Name</strong> can only contain letters, numbers, and <code>_-+.</code></span></td>`;
    			attr(tr, "class", "text-danger svelte-11gdgpc");
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    		}
    	};
    }

    // (279:0) {#if editing && failures.aliasInvalid}
    function create_if_block$2(ctx) {
    	let tr;

    	return {
    		c() {
    			tr = element("tr");
    			tr.innerHTML = `<td colspan="${5}"><span><strong>Aliases</strong> can only contain letters, numbers, and <code>_-+.</code></span></td>`;
    			attr(tr, "class", "text-danger svelte-11gdgpc");
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	let tr;
    	let td0;
    	let input0;
    	let t0;
    	let td1;
    	let button0;

    	let raw_value = emoji.buildEmoji({
    		character: "",
    		pack: "customizations",
    		keywords: [],
    		name: /*name*/ ctx[0],
    		aliases: /*aliases*/ ctx[2],
    		image: /*image*/ ctx[1]
    	}) + "";

    	let t1;
    	let form;
    	let input1;
    	let t2;
    	let input2;
    	let t3;
    	let td2;
    	let div1;
    	let input3;
    	let t4;
    	let div0;
    	let button1;
    	let t6;
    	let span0;
    	let t7;
    	let td3;
    	let div3;
    	let input4;
    	let t8;
    	let div2;
    	let button2;
    	let t10;
    	let span1;
    	let t11;
    	let td4;
    	let t12;
    	let t13;
    	let t14;
    	let t15;
    	let t16;
    	let if_block5_anchor;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*aliases*/ ctx[2];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*ascii*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*editing*/ ctx[5] || /*empty*/ ctx[18]) return create_if_block_5$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = (/*deleting*/ ctx[12] || /*deleted*/ ctx[13]) && create_if_block_4$1(ctx);
    	let if_block2 = /*editing*/ ctx[5] && /*failures*/ ctx[6].nameRequired && create_if_block_3$1();
    	let if_block3 = /*editing*/ ctx[5] && /*failures*/ ctx[6].imageRequired && create_if_block_2$1();
    	let if_block4 = /*editing*/ ctx[5] && /*failures*/ ctx[6].nameInvalid && create_if_block_1$1();
    	let if_block5 = /*editing*/ ctx[5] && /*failures*/ ctx[6].aliasInvalid && create_if_block$2();

    	return {
    		c() {
    			tr = element("tr");
    			td0 = element("td");
    			input0 = element("input");
    			t0 = space();
    			td1 = element("td");
    			button0 = element("button");
    			t1 = space();
    			form = element("form");
    			input1 = element("input");
    			t2 = space();
    			input2 = element("input");
    			t3 = space();
    			td2 = element("td");
    			div1 = element("div");
    			input3 = element("input");
    			t4 = space();
    			div0 = element("div");
    			button1 = element("button");
    			button1.textContent = "+";
    			t6 = space();
    			span0 = element("span");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t7 = space();
    			td3 = element("td");
    			div3 = element("div");
    			input4 = element("input");
    			t8 = space();
    			div2 = element("div");
    			button2 = element("button");
    			button2.textContent = "+";
    			t10 = space();
    			span1 = element("span");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t11 = space();
    			td4 = element("td");
    			if_block0.c();
    			t12 = space();
    			if (if_block1) if_block1.c();
    			t13 = space();
    			if (if_block2) if_block2.c();
    			t14 = space();
    			if (if_block3) if_block3.c();
    			t15 = space();
    			if (if_block4) if_block4.c();
    			t16 = space();
    			if (if_block5) if_block5.c();
    			if_block5_anchor = empty();
    			attr(input0, "type", "text");
    			attr(input0, "class", "form-control emoji-name svelte-11gdgpc");
    			attr(button0, "type", "button");
    			attr(button0, "class", "btn btn-default");
    			attr(input1, "type", "file");
    			attr(input1, "name", "emojiImage");
    			attr(input1, "accept", "image/*");
    			attr(input2, "type", "hidden");
    			attr(input2, "name", "fileName");
    			attr(form, "action", `${config$1.relative_path}/api/admin/plugins/emoji/upload`);
    			attr(form, "method", "post");
    			attr(form, "enctype", "multipart/form-data");
    			set_style(form, "display", "none");
    			attr(input3, "type", "text");
    			attr(input3, "class", "form-control");
    			attr(button1, "class", "btn btn-default");
    			attr(div0, "class", "input-group-addon");
    			attr(div1, "class", "input-group");
    			attr(input4, "type", "text");
    			attr(input4, "class", "form-control");
    			attr(button2, "class", "btn btn-default");
    			attr(div2, "class", "input-group-addon");
    			attr(div3, "class", "input-group");
    			attr(tr, "class", "svelte-11gdgpc");
    			toggle_class(tr, "fadeout", /*deleted*/ ctx[13]);
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			append(td0, input0);
    			set_input_value(input0, /*name*/ ctx[0]);
    			append(tr, t0);
    			append(tr, td1);
    			append(td1, button0);
    			button0.innerHTML = raw_value;
    			append(td1, t1);
    			append(td1, form);
    			append(form, input1);
    			/*input1_binding*/ ctx[28](input1);
    			append(form, t2);
    			append(form, input2);
    			/*input2_binding*/ ctx[29](input2);
    			/*form_binding*/ ctx[30](form);
    			append(tr, t3);
    			append(tr, td2);
    			append(td2, div1);
    			append(div1, input3);
    			set_input_value(input3, /*newAlias*/ ctx[4]);
    			append(div1, t4);
    			append(div1, div0);
    			append(div0, button1);
    			append(td2, t6);
    			append(td2, span0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(span0, null);
    			}

    			append(tr, t7);
    			append(tr, td3);
    			append(td3, div3);
    			append(div3, input4);
    			set_input_value(input4, /*newAscii*/ ctx[10]);
    			append(div3, t8);
    			append(div3, div2);
    			append(div2, button2);
    			append(td3, t10);
    			append(td3, span1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(span1, null);
    			}

    			append(tr, t11);
    			append(tr, td4);
    			if_block0.m(td4, null);
    			insert(target, t12, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, t13, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert(target, t14, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert(target, t15, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert(target, t16, anchor);
    			if (if_block5) if_block5.m(target, anchor);
    			insert(target, if_block5_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[27]),
    					listen(button0, "click", /*editImage*/ ctx[19]),
    					listen(input3, "input", /*input3_input_handler*/ ctx[31]),
    					listen(button1, "click", /*addAlias*/ ctx[15]),
    					listen(input4, "input", /*input4_input_handler*/ ctx[33]),
    					listen(button2, "click", /*addAscii*/ ctx[17])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*name*/ 1 && input0.value !== /*name*/ ctx[0]) {
    				set_input_value(input0, /*name*/ ctx[0]);
    			}

    			if (dirty[0] & /*name, aliases, image*/ 7 && raw_value !== (raw_value = emoji.buildEmoji({
    				character: "",
    				pack: "customizations",
    				keywords: [],
    				name: /*name*/ ctx[0],
    				aliases: /*aliases*/ ctx[2],
    				image: /*image*/ ctx[1]
    			}) + "")) button0.innerHTML = raw_value;
    			if (dirty[0] & /*newAlias*/ 16 && input3.value !== /*newAlias*/ ctx[4]) {
    				set_input_value(input3, /*newAlias*/ ctx[4]);
    			}

    			if (dirty[0] & /*removeAlias, aliases*/ 16388) {
    				each_value_1 = /*aliases*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(span0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*newAscii*/ 1024 && input4.value !== /*newAscii*/ ctx[10]) {
    				set_input_value(input4, /*newAscii*/ ctx[10]);
    			}

    			if (dirty[0] & /*removeAscii, ascii*/ 65544) {
    				each_value = /*ascii*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(span1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(td4, null);
    				}
    			}

    			if (dirty[0] & /*deleted*/ 8192) {
    				toggle_class(tr, "fadeout", /*deleted*/ ctx[13]);
    			}

    			if (/*deleting*/ ctx[12] || /*deleted*/ ctx[13]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_4$1(ctx);
    					if_block1.c();
    					if_block1.m(t13.parentNode, t13);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*editing*/ ctx[5] && /*failures*/ ctx[6].nameRequired) {
    				if (if_block2) ; else {
    					if_block2 = create_if_block_3$1();
    					if_block2.c();
    					if_block2.m(t14.parentNode, t14);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*editing*/ ctx[5] && /*failures*/ ctx[6].imageRequired) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block_2$1();
    					if_block3.c();
    					if_block3.m(t15.parentNode, t15);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*editing*/ ctx[5] && /*failures*/ ctx[6].nameInvalid) {
    				if (if_block4) ; else {
    					if_block4 = create_if_block_1$1();
    					if_block4.c();
    					if_block4.m(t16.parentNode, t16);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*editing*/ ctx[5] && /*failures*/ ctx[6].aliasInvalid) {
    				if (if_block5) ; else {
    					if_block5 = create_if_block$2();
    					if_block5.c();
    					if_block5.m(if_block5_anchor.parentNode, if_block5_anchor);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(tr);
    			/*input1_binding*/ ctx[28](null);
    			/*input2_binding*/ ctx[29](null);
    			/*form_binding*/ ctx[30](null);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if_block0.d();
    			if (detaching) detach(t12);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach(t13);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach(t14);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach(t15);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach(t16);
    			if (if_block5) if_block5.d(detaching);
    			if (detaching) detach(if_block5_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    const pattern$1 = /[^a-z\-.+0-9_]/i;

    function deepEquals$1(a, b) {
    	if (a === b) {
    		return true;
    	}

    	if (typeof a !== typeof b) {
    		return false;
    	}

    	if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    		return a.every((value, index) => deepEquals$1(value, b[index]));
    	}

    	if (Array.isArray(a) || Array.isArray(b)) {
    		return false;
    	}

    	if (typeof a === "object") {
    		const keys = Object.keys(a);

    		if (Object.keys(b).length !== keys.length) {
    			return false;
    		}

    		return keys.every(key => deepEquals$1(a[key], b[key]));
    	}

    	return false;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { emoji } = $$props;
    	let { id } = $$props;
    	let name = emoji.name;
    	let image = emoji.image;
    	let aliases = emoji.aliases.slice();
    	let ascii = emoji.ascii.slice();

    	function reset() {
    		$$invalidate(0, name = emoji.name);
    		$$invalidate(1, image = emoji.image);
    		$$invalidate(2, aliases = emoji.aliases.slice());
    		$$invalidate(3, ascii = emoji.ascii.slice());
    	}

    	let imageForm;
    	let imageInput;
    	let fileNameInput;
    	let newAlias = "";

    	function removeAlias(a) {
    		$$invalidate(2, aliases = aliases.filter(x => x !== a));
    	}

    	function addAlias() {
    		if (!newAlias || aliases.includes(newAlias)) {
    			return;
    		}

    		$$invalidate(2, aliases = [...aliases, newAlias]);
    		$$invalidate(4, newAlias = "");
    	}

    	let newAscii = "";

    	function removeAscii(a) {
    		$$invalidate(3, ascii = ascii.filter(x => x !== a));
    	}

    	function addAscii() {
    		if (!newAscii || ascii.includes(newAscii)) {
    			return;
    		}

    		$$invalidate(3, ascii = [...ascii, newAscii]);
    		$$invalidate(10, newAscii = "");
    	}

    	const empty = !emoji.name && !emoji.image && !emoji.aliases.length && !emoji.ascii.length;
    	let editing = false;

    	const failures = {
    		nameRequired: false,
    		imageRequired: false,
    		nameInvalid: false,
    		aliasInvalid: false,
    		any: false
    	};

    	let canSave = false;

    	function editImage() {
    		imageInput.click();

    		jQuery(imageInput).one("change", () => {
    			if (!imageInput.files.length) {
    				return;
    			}

    			const fileName = `${utils$2.generateUUID()}-${imageInput.files[0].name}`;
    			$$invalidate(9, fileNameInput.value = fileName, fileNameInput);

    			jQuery(imageForm).ajaxSubmit({
    				headers: { "x-csrf-token": config$1.csrf_token },
    				success: () => {
    					$$invalidate(1, image = fileName);
    					$$invalidate(8, imageInput.value = "", imageInput);
    				},
    				error: () => {
    					const err = Error("Failed to upload file");
    					console.error(err);
    					app$1.alertError(err);
    					$$invalidate(8, imageInput.value = "", imageInput);
    				}
    			});
    		});
    	}

    	const dispatch = createEventDispatcher();

    	function onSave() {
    		dispatch("save", {
    			id,
    			emoji: { name, image, aliases, ascii }
    		});
    	}

    	let deleting = false;
    	let deleted = false;

    	function onDelete() {
    		$$invalidate(12, deleting = true);
    	}

    	function confirmDelete() {
    		$$invalidate(12, deleting = false);
    		$$invalidate(13, deleted = true);

    		setTimeout(
    			() => {
    				dispatch("delete", { id });
    			},
    			250
    		);
    	}

    	function cancelDelete() {
    		$$invalidate(12, deleting = false);
    	}

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	function input1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			imageInput = $$value;
    			$$invalidate(8, imageInput);
    		});
    	}

    	function input2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			fileNameInput = $$value;
    			$$invalidate(9, fileNameInput);
    		});
    	}

    	function form_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			imageForm = $$value;
    			$$invalidate(7, imageForm);
    		});
    	}

    	function input3_input_handler() {
    		newAlias = this.value;
    		$$invalidate(4, newAlias);
    	}

    	const click_handler = a => removeAlias(a);

    	function input4_input_handler() {
    		newAscii = this.value;
    		$$invalidate(10, newAscii);
    	}

    	const click_handler_1 = a => removeAscii(a);

    	$$self.$$set = $$props => {
    		if ("emoji" in $$props) $$invalidate(24, emoji = $$props.emoji);
    		if ("id" in $$props) $$invalidate(25, id = $$props.id);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*name, image, aliases, ascii, emoji*/ 16777231) {
    			$$invalidate(5, editing = !deepEquals$1({ name, image, aliases, ascii }, emoji));
    		}

    		if ($$self.$$.dirty[0] & /*name*/ 1) {
    			$$invalidate(6, failures.nameRequired = !name, failures);
    		}

    		if ($$self.$$.dirty[0] & /*image*/ 2) {
    			$$invalidate(6, failures.imageRequired = !image, failures);
    		}

    		if ($$self.$$.dirty[0] & /*name*/ 1) {
    			$$invalidate(6, failures.nameInvalid = pattern$1.test(name), failures);
    		}

    		if ($$self.$$.dirty[0] & /*newAlias*/ 16) {
    			$$invalidate(6, failures.aliasInvalid = pattern$1.test(newAlias), failures);
    		}

    		if ($$self.$$.dirty[0] & /*failures*/ 64) {
    			$$invalidate(6, failures.any = failures.nameRequired || failures.imageRequired || failures.nameInvalid || failures.aliasInvalid, failures);
    		}

    		if ($$self.$$.dirty[0] & /*editing, failures*/ 96) {
    			$$invalidate(11, canSave = editing && !failures.any);
    		}
    	};

    	return [
    		name,
    		image,
    		aliases,
    		ascii,
    		newAlias,
    		editing,
    		failures,
    		imageForm,
    		imageInput,
    		fileNameInput,
    		newAscii,
    		canSave,
    		deleting,
    		deleted,
    		removeAlias,
    		addAlias,
    		removeAscii,
    		addAscii,
    		empty,
    		editImage,
    		onSave,
    		onDelete,
    		confirmDelete,
    		cancelDelete,
    		emoji,
    		id,
    		reset,
    		input0_input_handler,
    		input1_binding,
    		input2_binding,
    		form_binding,
    		input3_input_handler,
    		click_handler,
    		input4_input_handler,
    		click_handler_1
    	];
    }

    class Emoji extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { emoji: 24, id: 25, reset: 26 }, [-1, -1]);
    	}

    	get reset() {
    		return this.$$.ctx[26];
    	}
    }

    /* src\EmojiList.svelte generated by Svelte v3.35.0 */

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (45:4) {#each emojiList as item (item.id)}
    function create_each_block$2(key_1, ctx) {
    	let first;
    	let emoji;
    	let current;
    	const emoji_spread_levels = [/*item*/ ctx[9]];
    	let emoji_props = {};

    	for (let i = 0; i < emoji_spread_levels.length; i += 1) {
    		emoji_props = assign(emoji_props, emoji_spread_levels[i]);
    	}

    	emoji = new Emoji({ props: emoji_props });
    	emoji.$on("save", /*onEdit*/ ctx[3]);
    	emoji.$on("delete", /*onDelete*/ ctx[4]);

    	return {
    		key: key_1,
    		first: null,
    		c() {
    			first = empty();
    			create_component(emoji.$$.fragment);
    			this.first = first;
    		},
    		m(target, anchor) {
    			insert(target, first, anchor);
    			mount_component(emoji, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			const emoji_changes = (dirty & /*emojiList*/ 1)
    			? get_spread_update(emoji_spread_levels, [get_spread_object(/*item*/ ctx[9])])
    			: {};

    			emoji.$set(emoji_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(emoji.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(emoji.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(first);
    			destroy_component(emoji, detaching);
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	let table;
    	let thead;
    	let t4;
    	let tbody;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t5;
    	let tfoot;
    	let emoji;
    	let updating_reset;
    	let current;
    	let each_value = /*emojiList*/ ctx[0];
    	const get_key = ctx => /*item*/ ctx[9].id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	function emoji_reset_binding(value) {
    		/*emoji_reset_binding*/ ctx[7](value);
    	}

    	let emoji_props = { id: -1, emoji: /*newEmoji*/ ctx[2] };

    	if (/*resetNew*/ ctx[1] !== void 0) {
    		emoji_props.reset = /*resetNew*/ ctx[1];
    	}

    	emoji = new Emoji({ props: emoji_props });
    	binding_callbacks.push(() => bind(emoji, "reset", emoji_reset_binding));
    	emoji.$on("save", /*onAdd*/ ctx[5]);

    	return {
    		c() {
    			table = element("table");
    			thead = element("thead");
    			thead.innerHTML = `<tr><th>Name</th><th>Image</th><th>Aliases</th><th>ASCII patterns</th><th></th></tr>`;
    			t4 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			tfoot = element("tfoot");
    			create_component(emoji.$$.fragment);
    			attr(table, "class", "table");
    		},
    		m(target, anchor) {
    			insert(target, table, anchor);
    			append(table, thead);
    			append(table, t4);
    			append(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			append(table, t5);
    			append(table, tfoot);
    			mount_component(emoji, tfoot, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*emojiList, onEdit, onDelete*/ 25) {
    				each_value = /*emojiList*/ ctx[0];
    				group_outros();
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, tbody, outro_and_destroy_block, create_each_block$2, null, get_each_context$2);
    				check_outros();
    			}

    			const emoji_changes = {};
    			if (dirty & /*newEmoji*/ 4) emoji_changes.emoji = /*newEmoji*/ ctx[2];

    			if (!updating_reset && dirty & /*resetNew*/ 2) {
    				updating_reset = true;
    				emoji_changes.reset = /*resetNew*/ ctx[1];
    				add_flush_callback(() => updating_reset = false);
    			}

    			emoji.$set(emoji_changes);
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(emoji.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(emoji.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(table);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			destroy_component(emoji);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { emojis } = $$props;
    	let emojiList;

    	function onEdit(event) {
    		const { id, emoji } = event.detail;

    		api__default['default'].put(`/admin/plugins/emoji/customizations/emoji/${id}`, { item: emoji }).then(
    			() => {
    				$$invalidate(6, emojis = Object.assign(Object.assign({}, emojis), { [id]: emoji }));
    			},
    			() => app$1.alertError()
    		);
    	}

    	function onDelete(event) {
    		const { id } = event.detail;

    		api__default['default'].del(`/admin/plugins/emoji/customizations/emoji/${id}`, {}).then(
    			() => {
    				delete emojis[id];
    				$$invalidate(6, emojis = Object.assign({}, emojis));
    			},
    			() => app$1.alertError()
    		);
    	}

    	const blank = {
    		name: "",
    		image: "",
    		aliases: [],
    		ascii: []
    	};

    	let resetNew;
    	let newEmoji = Object.assign({}, blank);

    	function onAdd(event) {
    		const { emoji } = event.detail;

    		api__default['default'].post("/admin/plugins/emoji/customizations/emoji", { item: emoji }).then(
    			({ id }) => {
    				$$invalidate(6, emojis = Object.assign(Object.assign({}, emojis), { [id]: emoji }));
    				$$invalidate(2, newEmoji = Object.assign({}, blank));
    				resetNew();
    			},
    			() => app$1.alertError()
    		);
    	}

    	function emoji_reset_binding(value) {
    		resetNew = value;
    		$$invalidate(1, resetNew);
    	}

    	$$self.$$set = $$props => {
    		if ("emojis" in $$props) $$invalidate(6, emojis = $$props.emojis);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*emojis*/ 64) {
    			{
    				$$invalidate(0, emojiList = Object.keys(emojis).map(key => ({
    					id: parseInt(key, 10),
    					emoji: emojis[key]
    				})));
    			}
    		}
    	};

    	return [
    		emojiList,
    		resetNew,
    		newEmoji,
    		onEdit,
    		onDelete,
    		onAdd,
    		emojis,
    		emoji_reset_binding
    	];
    }

    class EmojiList extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { emojis: 6 });
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var eventemitter3 = createCommonjsModule(function (module) {

    var has = Object.prototype.hasOwnProperty
      , prefix = '~';

    /**
     * Constructor to create a storage for our `EE` objects.
     * An `Events` instance is a plain object whose properties are event names.
     *
     * @constructor
     * @private
     */
    function Events() {}

    //
    // We try to not inherit from `Object.prototype`. In some engines creating an
    // instance in this way is faster than calling `Object.create(null)` directly.
    // If `Object.create(null)` is not supported we prefix the event names with a
    // character to make sure that the built-in object properties are not
    // overridden or used as an attack vector.
    //
    if (Object.create) {
      Events.prototype = Object.create(null);

      //
      // This hack is needed because the `__proto__` property is still inherited in
      // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
      //
      if (!new Events().__proto__) prefix = false;
    }

    /**
     * Representation of a single event listener.
     *
     * @param {Function} fn The listener function.
     * @param {*} context The context to invoke the listener with.
     * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
     * @constructor
     * @private
     */
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }

    /**
     * Add a listener for a given event.
     *
     * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} context The context to invoke the listener with.
     * @param {Boolean} once Specify if the listener is a one-time listener.
     * @returns {EventEmitter}
     * @private
     */
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== 'function') {
        throw new TypeError('The listener must be a function');
      }

      var listener = new EE(fn, context || emitter, once)
        , evt = prefix ? prefix + event : event;

      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];

      return emitter;
    }

    /**
     * Clear event by name.
     *
     * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
     * @param {(String|Symbol)} evt The Event name.
     * @private
     */
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }

    /**
     * Minimal `EventEmitter` interface that is molded against the Node.js
     * `EventEmitter` interface.
     *
     * @constructor
     * @public
     */
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }

    /**
     * Return an array listing the events for which the emitter has registered
     * listeners.
     *
     * @returns {Array}
     * @public
     */
    EventEmitter.prototype.eventNames = function eventNames() {
      var names = []
        , events
        , name;

      if (this._eventsCount === 0) return names;

      for (name in (events = this._events)) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }

      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }

      return names;
    };

    /**
     * Return the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Array} The registered listeners.
     * @public
     */
    EventEmitter.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event
        , handlers = this._events[evt];

      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];

      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }

      return ee;
    };

    /**
     * Return the number of listeners listening to a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Number} The number of listeners.
     * @public
     */
    EventEmitter.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event
        , listeners = this._events[evt];

      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };

    /**
     * Calls each of the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Boolean} `true` if the event had listeners, else `false`.
     * @public
     */
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return false;

      var listeners = this._events[evt]
        , len = arguments.length
        , args
        , i;

      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

        switch (len) {
          case 1: return listeners.fn.call(listeners.context), true;
          case 2: return listeners.fn.call(listeners.context, a1), true;
          case 3: return listeners.fn.call(listeners.context, a1, a2), true;
          case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }

        for (i = 1, args = new Array(len -1); i < len; i++) {
          args[i - 1] = arguments[i];
        }

        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length
          , j;

        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

          switch (len) {
            case 1: listeners[i].fn.call(listeners[i].context); break;
            case 2: listeners[i].fn.call(listeners[i].context, a1); break;
            case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
            case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
            default:
              if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
                args[j - 1] = arguments[j];
              }

              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }

      return true;
    };

    /**
     * Add a listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };

    /**
     * Add a one-time listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };

    /**
     * Remove the listeners of a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn Only remove the listeners that match this function.
     * @param {*} context Only remove the listeners that have this context.
     * @param {Boolean} once Only remove one-time listeners.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }

      var listeners = this._events[evt];

      if (listeners.fn) {
        if (
          listeners.fn === fn &&
          (!once || listeners.once) &&
          (!context || listeners.context === context)
        ) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (
            listeners[i].fn !== fn ||
            (once && !listeners[i].once) ||
            (context && listeners[i].context !== context)
          ) {
            events.push(listeners[i]);
          }
        }

        //
        // Reset the array, or remove it completely if we have no more listeners.
        //
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }

      return this;
    };

    /**
     * Remove all listeners, or those of the specified event.
     *
     * @param {(String|Symbol)} [event] The event name.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;

      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }

      return this;
    };

    //
    // Alias methods names because people roll like that.
    //
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;

    //
    // Expose the prefix.
    //
    EventEmitter.prefixed = prefix;

    //
    // Allow `EventEmitter` to be imported as module namespace.
    //
    EventEmitter.EventEmitter = EventEmitter;

    //
    // Expose the module.
    //
    {
      module.exports = EventEmitter;
    }
    });

    var SearchResult_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SearchResult = void 0;
    const MAIN = /\$&/g;
    const PLACE = /\$(\d)/g;
    class SearchResult {
        constructor(data, term, strategy) {
            this.data = data;
            this.term = term;
            this.strategy = strategy;
        }
        getReplacementData(beforeCursor) {
            let result = this.strategy.replace(this.data);
            if (result == null)
                return null;
            let afterCursor = "";
            if (Array.isArray(result)) {
                afterCursor = result[1];
                result = result[0];
            }
            const match = this.strategy.match(beforeCursor);
            if (match == null || match.index == null)
                return null;
            const replacement = result
                .replace(MAIN, match[0])
                .replace(PLACE, (_, p) => match[parseInt(p)]);
            return {
                start: match.index,
                end: match.index + match[0].length,
                beforeCursor: replacement,
                afterCursor: afterCursor,
            };
        }
        replace(beforeCursor, afterCursor) {
            const replacement = this.getReplacementData(beforeCursor);
            if (replacement === null)
                return;
            afterCursor = replacement.afterCursor + afterCursor;
            return [
                [
                    beforeCursor.slice(0, replacement.start),
                    replacement.beforeCursor,
                    beforeCursor.slice(replacement.end),
                ].join(""),
                afterCursor,
            ];
        }
        render() {
            return this.strategy.renderTemplate(this.data, this.term);
        }
        getStrategyId() {
            return this.strategy.getId();
        }
    }
    exports.SearchResult = SearchResult;
    //# sourceMappingURL=SearchResult.js.map
    });

    var Strategy_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Strategy = exports.DEFAULT_INDEX = void 0;

    exports.DEFAULT_INDEX = 1;
    class Strategy {
        constructor(props) {
            this.props = props;
            this.cache = {};
        }
        destroy() {
            this.cache = {};
            return this;
        }
        replace(data) {
            return this.props.replace(data);
        }
        execute(beforeCursor, callback) {
            var _a;
            const match = this.matchWithContext(beforeCursor);
            if (!match)
                return false;
            const term = match[(_a = this.props.index) !== null && _a !== void 0 ? _a : exports.DEFAULT_INDEX];
            this.search(term, (results) => {
                callback(results.map((result) => new SearchResult_1.SearchResult(result, term, this)));
            }, match);
            return true;
        }
        renderTemplate(data, term) {
            if (this.props.template) {
                return this.props.template(data, term);
            }
            if (typeof data === "string")
                return data;
            throw new Error(`Unexpected render data type: ${typeof data}. Please implement template parameter by yourself`);
        }
        getId() {
            return this.props.id || null;
        }
        match(text) {
            return typeof this.props.match === "function"
                ? this.props.match(text)
                : text.match(this.props.match);
        }
        search(term, callback, match) {
            if (this.props.cache) {
                this.searchWithCach(term, callback, match);
            }
            else {
                this.props.search(term, callback, match);
            }
        }
        matchWithContext(beforeCursor) {
            const context = this.context(beforeCursor);
            if (context === false)
                return null;
            return this.match(context === true ? beforeCursor : context);
        }
        context(beforeCursor) {
            return this.props.context ? this.props.context(beforeCursor) : true;
        }
        searchWithCach(term, callback, match) {
            if (this.cache[term] != null) {
                callback(this.cache[term]);
            }
            else {
                this.props.search(term, (results) => {
                    this.cache[term] = results;
                    callback(results);
                }, match);
            }
        }
    }
    exports.Strategy = Strategy;
    //# sourceMappingURL=Strategy.js.map
    });

    var Completer_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Completer = void 0;


    class Completer extends eventemitter3.EventEmitter {
        constructor(strategyPropsList) {
            super();
            this.handleQueryResult = (searchResults) => {
                this.emit("hit", { searchResults });
            };
            this.strategies = strategyPropsList.map((p) => new Strategy_1.Strategy(p));
        }
        destroy() {
            this.strategies.forEach((s) => s.destroy());
            return this;
        }
        run(beforeCursor) {
            for (const strategy of this.strategies) {
                const executed = strategy.execute(beforeCursor, this.handleQueryResult);
                if (executed)
                    return;
            }
            this.handleQueryResult([]);
        }
    }
    exports.Completer = Completer;
    //# sourceMappingURL=Completer.js.map
    });

    var utils$1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createCustomEvent = void 0;
    const isCustomEventSupported = typeof window !== "undefined" && !!window.CustomEvent;
    const createCustomEvent = (type, options) => {
        if (isCustomEventSupported)
            return new CustomEvent(type, options);
        const event = document.createEvent("CustomEvent");
        event.initCustomEvent(type, 
        /* bubbles */ false, (options === null || options === void 0 ? void 0 : options.cancelable) || false, (options === null || options === void 0 ? void 0 : options.detail) || undefined);
        return event;
    };
    exports.createCustomEvent = createCustomEvent;
    //# sourceMappingURL=utils.js.map
    });

    var Dropdown_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Dropdown = exports.DEFAULT_DROPDOWN_ITEM_ACTIVE_CLASS_NAME = exports.DEFAULT_DROPDOWN_ITEM_CLASS_NAME = exports.DEFAULT_DROPDOWN_CLASS_NAME = exports.DEFAULT_DROPDOWN_PLACEMENT = exports.DEFAULT_DROPDOWN_MAX_COUNT = void 0;


    // Default constants for Dropdown
    exports.DEFAULT_DROPDOWN_MAX_COUNT = 10;
    exports.DEFAULT_DROPDOWN_PLACEMENT = "auto";
    exports.DEFAULT_DROPDOWN_CLASS_NAME = "dropdown-menu textcomplete-dropdown";
    // Default constants for DropdownItem
    exports.DEFAULT_DROPDOWN_ITEM_CLASS_NAME = "textcomplete-item";
    exports.DEFAULT_DROPDOWN_ITEM_ACTIVE_CLASS_NAME = `${exports.DEFAULT_DROPDOWN_ITEM_CLASS_NAME} active`;
    class Dropdown extends eventemitter3.EventEmitter {
        constructor(el, option) {
            super();
            this.el = el;
            this.option = option;
            this.shown = false;
            this.items = [];
            this.activeIndex = null;
        }
        static create(option) {
            const ul = document.createElement("ul");
            ul.className = option.className || exports.DEFAULT_DROPDOWN_CLASS_NAME;
            Object.assign(ul.style, {
                display: "none",
                position: "absolute",
                zIndex: "1000",
            }, option.style);
            const parent = option.parent || document.body;
            parent === null || parent === void 0 ? void 0 : parent.appendChild(ul);
            return new Dropdown(ul, option);
        }
        /**
         * Render the given search results. Previous results are cleared.
         *
         * @emits render
         * @emits rendered
         */
        render(searchResults, cursorOffset) {
            const event = (0, utils$1.createCustomEvent)("render", { cancelable: true });
            this.emit("render", event);
            if (event.defaultPrevented)
                return this;
            this.clear();
            if (searchResults.length === 0)
                return this.hide();
            this.items = searchResults
                .slice(0, this.option.maxCount || exports.DEFAULT_DROPDOWN_MAX_COUNT)
                .map((r, index) => { var _a; return new DropdownItem(this, index, r, ((_a = this.option) === null || _a === void 0 ? void 0 : _a.item) || {}); });
            this.setStrategyId(searchResults[0])
                .renderEdge(searchResults, "header")
                .renderItems()
                .renderEdge(searchResults, "footer")
                .show()
                .setOffset(cursorOffset)
                .activate(0);
            this.emit("rendered", (0, utils$1.createCustomEvent)("rendered"));
            return this;
        }
        destroy() {
            var _a;
            this.clear();
            (_a = this.el.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(this.el);
            return this;
        }
        /**
         * Select the given item
         *
         * @emits select
         * @emits selected
         */
        select(item) {
            const detail = { searchResult: item.searchResult };
            const event = (0, utils$1.createCustomEvent)("select", { cancelable: true, detail });
            this.emit("select", event);
            if (event.defaultPrevented)
                return this;
            this.hide();
            this.emit("selected", (0, utils$1.createCustomEvent)("selected", { detail }));
            return this;
        }
        /**
         * Show the dropdown element
         *
         * @emits show
         * @emits shown
         */
        show() {
            if (!this.shown) {
                const event = (0, utils$1.createCustomEvent)("show", { cancelable: true });
                this.emit("show", event);
                if (event.defaultPrevented)
                    return this;
                this.el.style.display = "block";
                this.shown = true;
                this.emit("shown", (0, utils$1.createCustomEvent)("shown"));
            }
            return this;
        }
        /**
         * Hide the dropdown element
         *
         * @emits hide
         * @emits hidden
         */
        hide() {
            if (this.shown) {
                const event = (0, utils$1.createCustomEvent)("hide", { cancelable: true });
                this.emit("hide", event);
                if (event.defaultPrevented)
                    return this;
                this.el.style.display = "none";
                this.shown = false;
                this.clear();
                this.emit("hidden", (0, utils$1.createCustomEvent)("hidden"));
            }
            return this;
        }
        /** Clear search results */
        clear() {
            this.items.forEach((i) => i.destroy());
            this.items = [];
            this.el.innerHTML = "";
            this.activeIndex = null;
            return this;
        }
        up(e) {
            return this.shown ? this.moveActiveItem("prev", e) : this;
        }
        down(e) {
            return this.shown ? this.moveActiveItem("next", e) : this;
        }
        moveActiveItem(direction, e) {
            if (this.activeIndex != null) {
                const activeIndex = direction === "next"
                    ? this.getNextActiveIndex()
                    : this.getPrevActiveIndex();
                if (activeIndex != null) {
                    this.activate(activeIndex);
                    e.preventDefault();
                }
            }
            return this;
        }
        activate(index) {
            if (this.activeIndex !== index) {
                if (this.activeIndex != null) {
                    this.items[this.activeIndex].deactivate();
                }
                this.activeIndex = index;
                this.items[index].activate();
            }
            return this;
        }
        isShown() {
            return this.shown;
        }
        getActiveItem() {
            return this.activeIndex != null ? this.items[this.activeIndex] : null;
        }
        setOffset(cursorOffset) {
            const doc = document.documentElement;
            if (doc) {
                const elementWidth = this.el.offsetWidth;
                if (cursorOffset.left) {
                    const browserWidth = this.option.dynamicWidth
                        ? doc.scrollWidth
                        : doc.clientWidth;
                    if (cursorOffset.left + elementWidth > browserWidth) {
                        cursorOffset.left = browserWidth - elementWidth;
                    }
                    this.el.style.left = `${cursorOffset.left}px`;
                }
                else if (cursorOffset.right) {
                    if (cursorOffset.right - elementWidth < 0) {
                        cursorOffset.right = 0;
                    }
                    this.el.style.right = `${cursorOffset.right}px`;
                }
                let forceTop = false;
                const placement = this.option.placement || exports.DEFAULT_DROPDOWN_PLACEMENT;
                if (placement === "auto") {
                    const dropdownHeight = this.items.length * cursorOffset.lineHeight;
                    forceTop =
                        cursorOffset.clientTop != null &&
                            cursorOffset.clientTop + dropdownHeight > doc.clientHeight;
                }
                if (placement === "top" || forceTop) {
                    this.el.style.bottom = `${doc.clientHeight - cursorOffset.top + cursorOffset.lineHeight}px`;
                    this.el.style.top = "auto";
                }
                else {
                    this.el.style.top = `${cursorOffset.top}px`;
                    this.el.style.bottom = "auto";
                }
            }
            return this;
        }
        getNextActiveIndex() {
            if (this.activeIndex == null)
                throw new Error();
            return this.activeIndex < this.items.length - 1
                ? this.activeIndex + 1
                : this.option.rotate
                    ? 0
                    : null;
        }
        getPrevActiveIndex() {
            if (this.activeIndex == null)
                throw new Error();
            return this.activeIndex !== 0
                ? this.activeIndex - 1
                : this.option.rotate
                    ? this.items.length - 1
                    : null;
        }
        renderItems() {
            const fragment = document.createDocumentFragment();
            for (const item of this.items) {
                fragment.appendChild(item.el);
            }
            this.el.appendChild(fragment);
            return this;
        }
        setStrategyId(searchResult) {
            const id = searchResult.getStrategyId();
            if (id)
                this.el.dataset.strategy = id;
            return this;
        }
        renderEdge(searchResults, type) {
            const option = this.option[type];
            const li = document.createElement("li");
            li.className = `textcomplete-${type}`;
            li.innerHTML =
                typeof option === "function"
                    ? option(searchResults.map((s) => s.data))
                    : option || "";
            this.el.appendChild(li);
            return this;
        }
    }
    exports.Dropdown = Dropdown;
    class DropdownItem {
        constructor(dropdown, index, searchResult, props) {
            this.dropdown = dropdown;
            this.index = index;
            this.searchResult = searchResult;
            this.props = props;
            this.active = false;
            this.onClick = (e) => {
                e.preventDefault();
                this.dropdown.select(this);
            };
            this.className = this.props.className || exports.DEFAULT_DROPDOWN_ITEM_CLASS_NAME;
            this.activeClassName =
                this.props.activeClassName || exports.DEFAULT_DROPDOWN_ITEM_ACTIVE_CLASS_NAME;
            const li = document.createElement("li");
            li.className = this.active ? this.activeClassName : this.className;
            const span = document.createElement("span");
            span.tabIndex = -1;
            span.innerHTML = this.searchResult.render();
            li.appendChild(span);
            li.addEventListener("click", this.onClick);
            this.el = li;
        }
        destroy() {
            var _a;
            const li = this.el;
            (_a = li.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(li);
            li.removeEventListener("click", this.onClick, false);
            return this;
        }
        activate() {
            if (!this.active) {
                this.active = true;
                this.el.className = this.activeClassName;
                this.dropdown.el.scrollTop = this.el.offsetTop;
            }
            return this;
        }
        deactivate() {
            if (this.active) {
                this.active = false;
                this.el.className = this.className;
            }
            return this;
        }
    }
    //# sourceMappingURL=Dropdown.js.map
    });

    var Editor_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Editor = void 0;


    class Editor extends eventemitter3.EventEmitter {
        /**
         * Finalize the editor object.
         *
         * It is called when associated textcomplete object is destroyed.
         */
        destroy() {
            return this;
        }
        /**
         * It is called when a search result is selected by a user.
         */
        applySearchResult(_searchResult) {
            throw new Error("Not implemented.");
        }
        /**
         * The input cursor's absolute coordinates from the window's left
         * top corner.
         */
        getCursorOffset() {
            throw new Error("Not implemented.");
        }
        /**
         * Editor string value from head to the cursor.
         * Returns null if selection type is range not cursor.
         */
        getBeforeCursor() {
            throw new Error("Not implemented.");
        }
        /**
         * Emit a move event, which moves active dropdown element.
         * Child class must call this method at proper timing with proper parameter.
         *
         * @see {@link Textarea} for live example.
         */
        emitMoveEvent(code) {
            const moveEvent = (0, utils$1.createCustomEvent)("move", {
                cancelable: true,
                detail: {
                    code: code,
                },
            });
            this.emit("move", moveEvent);
            return moveEvent;
        }
        /**
         * Emit a enter event, which selects current search result.
         * Child class must call this method at proper timing.
         *
         * @see {@link Textarea} for live example.
         */
        emitEnterEvent() {
            const enterEvent = (0, utils$1.createCustomEvent)("enter", { cancelable: true });
            this.emit("enter", enterEvent);
            return enterEvent;
        }
        /**
         * Emit a change event, which triggers auto completion.
         * Child class must call this method at proper timing.
         *
         * @see {@link Textarea} for live example.
         */
        emitChangeEvent() {
            const changeEvent = (0, utils$1.createCustomEvent)("change", {
                detail: {
                    beforeCursor: this.getBeforeCursor(),
                },
            });
            this.emit("change", changeEvent);
            return changeEvent;
        }
        /**
         * Emit a esc event, which hides dropdown element.
         * Child class must call this method at proper timing.
         *
         * @see {@link Textarea} for live example.
         */
        emitEscEvent() {
            const escEvent = (0, utils$1.createCustomEvent)("esc", { cancelable: true });
            this.emit("esc", escEvent);
            return escEvent;
        }
        /**
         * Helper method for parsing KeyboardEvent.
         *
         * @see {@link Textarea} for live example.
         */
        getCode(e) {
            return e.keyCode === 9 // tab
                ? "ENTER"
                : e.keyCode === 13 // enter
                    ? "ENTER"
                    : e.keyCode === 27 // esc
                        ? "ESC"
                        : e.keyCode === 38 // up
                            ? "UP"
                            : e.keyCode === 40 // down
                                ? "DOWN"
                                : e.keyCode === 78 && e.ctrlKey // ctrl-n
                                    ? "DOWN"
                                    : e.keyCode === 80 && e.ctrlKey // ctrl-p
                                        ? "UP"
                                        : "OTHER";
        }
    }
    exports.Editor = Editor;
    //# sourceMappingURL=Editor.js.map
    });

    var Textcomplete_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Textcomplete = void 0;



    const PASSTHOUGH_EVENT_NAMES = [
        "show",
        "shown",
        "render",
        "rendered",
        "selected",
        "hidden",
        "hide",
    ];
    class Textcomplete extends eventemitter3.EventEmitter {
        constructor(editor, strategies, option) {
            super();
            this.editor = editor;
            this.isQueryInFlight = false;
            this.nextPendingQuery = null;
            this.handleHit = ({ searchResults, }) => {
                if (searchResults.length) {
                    this.dropdown.render(searchResults, this.editor.getCursorOffset());
                }
                else {
                    this.dropdown.hide();
                }
                this.isQueryInFlight = false;
                if (this.nextPendingQuery !== null)
                    this.trigger(this.nextPendingQuery);
            };
            this.handleMove = (e) => {
                e.detail.code === "UP" ? this.dropdown.up(e) : this.dropdown.down(e);
            };
            this.handleEnter = (e) => {
                const activeItem = this.dropdown.getActiveItem();
                if (activeItem) {
                    this.dropdown.select(activeItem);
                    e.preventDefault();
                }
                else {
                    this.dropdown.hide();
                }
            };
            this.handleEsc = (e) => {
                if (this.dropdown.isShown()) {
                    this.dropdown.hide();
                    e.preventDefault();
                }
            };
            this.handleChange = (e) => {
                if (e.detail.beforeCursor != null) {
                    this.trigger(e.detail.beforeCursor);
                }
                else {
                    this.dropdown.hide();
                }
            };
            this.handleSelect = (selectEvent) => {
                this.emit("select", selectEvent);
                if (!selectEvent.defaultPrevented) {
                    this.editor.applySearchResult(selectEvent.detail.searchResult);
                }
            };
            this.handleResize = () => {
                if (this.dropdown.isShown()) {
                    this.dropdown.setOffset(this.editor.getCursorOffset());
                }
            };
            this.completer = new Completer_1.Completer(strategies);
            this.dropdown = Dropdown_1.Dropdown.create((option === null || option === void 0 ? void 0 : option.dropdown) || {});
            this.startListening();
        }
        destroy(destroyEditor = true) {
            this.completer.destroy();
            this.dropdown.destroy();
            if (destroyEditor)
                this.editor.destroy();
            this.stopListening();
            return this;
        }
        isShown() {
            return this.dropdown.isShown();
        }
        hide() {
            this.dropdown.hide();
            return this;
        }
        trigger(beforeCursor) {
            if (this.isQueryInFlight) {
                this.nextPendingQuery = beforeCursor;
            }
            else {
                this.isQueryInFlight = true;
                this.nextPendingQuery = null;
                this.completer.run(beforeCursor);
            }
            return this;
        }
        startListening() {
            var _a;
            this.editor
                .on("move", this.handleMove)
                .on("enter", this.handleEnter)
                .on("esc", this.handleEsc)
                .on("change", this.handleChange);
            this.dropdown.on("select", this.handleSelect);
            for (const eventName of PASSTHOUGH_EVENT_NAMES) {
                this.dropdown.on(eventName, (e) => this.emit(eventName, e));
            }
            this.completer.on("hit", this.handleHit);
            (_a = this.dropdown.el.ownerDocument.defaultView) === null || _a === void 0 ? void 0 : _a.addEventListener("resize", this.handleResize);
        }
        stopListening() {
            var _a;
            (_a = this.dropdown.el.ownerDocument.defaultView) === null || _a === void 0 ? void 0 : _a.removeEventListener("resize", this.handleResize);
            this.completer.removeAllListeners();
            this.dropdown.removeAllListeners();
            this.editor
                .removeListener("move", this.handleMove)
                .removeListener("enter", this.handleEnter)
                .removeListener("esc", this.handleEsc)
                .removeListener("change", this.handleChange);
        }
    }
    exports.Textcomplete = Textcomplete;
    //# sourceMappingURL=Textcomplete.js.map
    });

    var dist$3 = createCommonjsModule(function (module, exports) {
    var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() { return m[k]; } };
        }
        Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(Completer_1, exports);
    __exportStar(Dropdown_1, exports);
    __exportStar(Editor_1, exports);
    __exportStar(SearchResult_1, exports);
    __exportStar(Strategy_1, exports);
    __exportStar(Textcomplete_1, exports);
    __exportStar(utils$1, exports);
    //# sourceMappingURL=index.js.map
    });

    function update(el, headToCursor, cursorToTail) {
        const curr = el.value; // strA + strB1 + strC
        const next = headToCursor + (cursorToTail || ""); // strA + strB2 + strC
        const activeElement = document.activeElement;
        //  Calculate length of strA and strC
        let aLength = 0;
        let cLength = 0;
        while (aLength < curr.length && aLength < next.length && curr[aLength] === next[aLength]) {
            aLength++;
        }
        while (curr.length - cLength - 1 >= 0 &&
            next.length - cLength - 1 >= 0 &&
            curr[curr.length - cLength - 1] === next[next.length - cLength - 1]) {
            cLength++;
        }
        aLength = Math.min(aLength, Math.min(curr.length, next.length) - cLength);
        // Select strB1
        el.setSelectionRange(aLength, curr.length - cLength);
        // Get strB2
        const strB2 = next.substring(aLength, next.length - cLength);
        // Replace strB1 with strB2
        el.focus();
        if (!document.execCommand("insertText", false, strB2)) {
            // Document.execCommand returns false if the command is not supported.
            // Firefox and IE returns false in this case.
            el.value = next;
            // Dispatch input event. Note that `new Event("input")` throws an error on IE11
            const event = document.createEvent("Event");
            event.initEvent("input", true, true);
            el.dispatchEvent(event);
        }
        // Move cursor to the end of headToCursor
        el.setSelectionRange(headToCursor.length, headToCursor.length);
        activeElement.focus();
        return el;
    }

    function wrapCursor(el, before, after) {
        const initEnd = el.selectionEnd;
        const headToCursor = el.value.substr(0, el.selectionStart) + before;
        const cursorToTail = el.value.substring(el.selectionStart, initEnd) + (after || "") + el.value.substr(initEnd);
        update(el, headToCursor, cursorToTail);
        el.selectionEnd = initEnd + before.length;
        return el;
    }

    var dist$2 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        update: update,
        wrapCursor: wrapCursor
    });

    /* jshint browser: true */

    var textareaCaret = createCommonjsModule(function (module) {
    (function () {

    // We'll copy the properties below into the mirror div.
    // Note that some browsers, such as Firefox, do not concatenate properties
    // into their shorthand (e.g. padding-top, padding-bottom etc. -> padding),
    // so we have to list every single property explicitly.
    var properties = [
      'direction',  // RTL support
      'boxSizing',
      'width',  // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
      'height',
      'overflowX',
      'overflowY',  // copy the scrollbar for IE

      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
      'borderStyle',

      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',

      // https://developer.mozilla.org/en-US/docs/Web/CSS/font
      'fontStyle',
      'fontVariant',
      'fontWeight',
      'fontStretch',
      'fontSize',
      'fontSizeAdjust',
      'lineHeight',
      'fontFamily',

      'textAlign',
      'textTransform',
      'textIndent',
      'textDecoration',  // might not make a difference, but better be safe

      'letterSpacing',
      'wordSpacing',

      'tabSize',
      'MozTabSize'

    ];

    var isBrowser = (typeof window !== 'undefined');
    var isFirefox = (isBrowser && window.mozInnerScreenX != null);

    function getCaretCoordinates(element, position, options) {
      if (!isBrowser) {
        throw new Error('textarea-caret-position#getCaretCoordinates should only be called in a browser');
      }

      var debug = options && options.debug || false;
      if (debug) {
        var el = document.querySelector('#input-textarea-caret-position-mirror-div');
        if (el) el.parentNode.removeChild(el);
      }

      // The mirror div will replicate the textarea's style
      var div = document.createElement('div');
      div.id = 'input-textarea-caret-position-mirror-div';
      document.body.appendChild(div);

      var style = div.style;
      var computed = window.getComputedStyle ? window.getComputedStyle(element) : element.currentStyle;  // currentStyle for IE < 9
      var isInput = element.nodeName === 'INPUT';

      // Default textarea styles
      style.whiteSpace = 'pre-wrap';
      if (!isInput)
        style.wordWrap = 'break-word';  // only for textarea-s

      // Position off-screen
      style.position = 'absolute';  // required to return coordinates properly
      if (!debug)
        style.visibility = 'hidden';  // not 'display: none' because we want rendering

      // Transfer the element's properties to the div
      properties.forEach(function (prop) {
        if (isInput && prop === 'lineHeight') {
          // Special case for <input>s because text is rendered centered and line height may be != height
          style.lineHeight = computed.height;
        } else {
          style[prop] = computed[prop];
        }
      });

      if (isFirefox) {
        // Firefox lies about the overflow property for textareas: https://bugzilla.mozilla.org/show_bug.cgi?id=984275
        if (element.scrollHeight > parseInt(computed.height))
          style.overflowY = 'scroll';
      } else {
        style.overflow = 'hidden';  // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'
      }

      div.textContent = element.value.substring(0, position);
      // The second special handling for input type="text" vs textarea:
      // spaces need to be replaced with non-breaking spaces - http://stackoverflow.com/a/13402035/1269037
      if (isInput)
        div.textContent = div.textContent.replace(/\s/g, '\u00a0');

      var span = document.createElement('span');
      // Wrapping must be replicated *exactly*, including when a long word gets
      // onto the next line, with whitespace at the end of the line before (#7).
      // The  *only* reliable way to do that is to copy the *entire* rest of the
      // textarea's content into the <span> created at the caret position.
      // For inputs, just '.' would be enough, but no need to bother.
      span.textContent = element.value.substring(position) || '.';  // || because a completely empty faux span doesn't render at all
      div.appendChild(span);

      var coordinates = {
        top: span.offsetTop + parseInt(computed['borderTopWidth']),
        left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
        height: parseInt(computed['lineHeight'])
      };

      if (debug) {
        span.style.backgroundColor = '#aaa';
      } else {
        document.body.removeChild(div);
      }

      return coordinates;
    }

    {
      module.exports = getCaretCoordinates;
    }

    }());
    });

    var calculateElementOffset_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.calculateElementOffset = void 0;
    /**
     * Get the current coordinates of the `el` relative to the document.
     */
    const calculateElementOffset = (el) => {
        const rect = el.getBoundingClientRect();
        const owner = el.ownerDocument;
        if (owner == null) {
            throw new Error("Given element does not belong to document");
        }
        const { defaultView, documentElement } = owner;
        if (defaultView == null) {
            throw new Error("Given element does not belong to window");
        }
        const offset = {
            top: rect.top + defaultView.pageYOffset,
            left: rect.left + defaultView.pageXOffset,
        };
        if (documentElement) {
            offset.top -= documentElement.clientTop;
            offset.left -= documentElement.clientLeft;
        }
        return offset;
    };
    exports.calculateElementOffset = calculateElementOffset;
    //# sourceMappingURL=calculateElementOffset.js.map
    });

    var getLineHeightPx_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getLineHeightPx = void 0;
    const CHAR_CODE_ZERO = "0".charCodeAt(0);
    const CHAR_CODE_NINE = "9".charCodeAt(0);
    const isDigit = (charCode) => CHAR_CODE_ZERO <= charCode && charCode <= CHAR_CODE_NINE;
    const getLineHeightPx = (el) => {
        const computedStyle = getComputedStyle(el);
        const lineHeight = computedStyle.lineHeight;
        // If the char code starts with a digit, it is either a value in pixels,
        // or unitless, as per:
        // https://drafts.csswg.org/css2/visudet.html#propdef-line-height
        // https://drafts.csswg.org/css2/cascade.html#computed-value
        if (isDigit(lineHeight.charCodeAt(0))) {
            const floatLineHeight = parseFloat(lineHeight);
            // In real browsers the value is *always* in pixels, even for unit-less
            // line-heights. However, we still check as per the spec.
            return isDigit(lineHeight.charCodeAt(lineHeight.length - 1))
                ? floatLineHeight * parseFloat(computedStyle.fontSize)
                : floatLineHeight;
        }
        // Otherwise, the value is "normal".
        // If the line-height is "normal", calculate by font-size
        return calculateLineHeightPx(el.nodeName, computedStyle);
    };
    exports.getLineHeightPx = getLineHeightPx;
    /**
     * Returns calculated line-height of the given node in pixels.
     */
    const calculateLineHeightPx = (nodeName, computedStyle) => {
        const body = document.body;
        if (!body)
            return 0;
        const tempNode = document.createElement(nodeName);
        tempNode.innerHTML = "&nbsp;";
        Object.assign(tempNode.style, {
            fontSize: computedStyle.fontSize,
            fontFamily: computedStyle.fontFamily,
            padding: "0",
        });
        body.appendChild(tempNode);
        // Make sure textarea has only 1 row
        if (tempNode instanceof HTMLTextAreaElement) {
            tempNode.rows = 1;
        }
        // Assume the height of the element is the line-height
        const height = tempNode.offsetHeight;
        body.removeChild(tempNode);
        return height;
    };
    //# sourceMappingURL=getLineHeightPx.js.map
    });

    var isSafari_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isSafari = void 0;
    const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    exports.isSafari = isSafari;
    //# sourceMappingURL=isSafari.js.map
    });

    var dist$1 = createCommonjsModule(function (module, exports) {
    var __createBinding = (commonjsGlobal && commonjsGlobal.__createBinding) || (Object.create ? (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() { return m[k]; } };
        }
        Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
    }));
    var __exportStar = (commonjsGlobal && commonjsGlobal.__exportStar) || function(m, exports) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(calculateElementOffset_1, exports);
    __exportStar(getLineHeightPx_1, exports);
    __exportStar(isSafari_1, exports);
    //# sourceMappingURL=index.js.map
    });

    var undate_1 = /*@__PURE__*/getAugmentedNamespace(dist$2);

    var TextareaEditor_1 = createCommonjsModule(function (module, exports) {
    var __importDefault = (commonjsGlobal && commonjsGlobal.__importDefault) || function (mod) {
        return (mod && mod.__esModule) ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextareaEditor = void 0;

    const textarea_caret_1 = __importDefault(textareaCaret);


    class TextareaEditor extends dist$3.Editor {
        constructor(el) {
            super();
            this.el = el;
            this.onInput = () => {
                this.emitChangeEvent();
            };
            this.onKeydown = (e) => {
                const code = this.getCode(e);
                let event;
                if (code === "UP" || code === "DOWN") {
                    event = this.emitMoveEvent(code);
                }
                else if (code === "ENTER") {
                    event = this.emitEnterEvent();
                }
                else if (code === "ESC") {
                    event = this.emitEscEvent();
                }
                if (event && event.defaultPrevented) {
                    e.preventDefault();
                }
            };
            this.startListening();
        }
        destroy() {
            super.destroy();
            this.stopListening();
            return this;
        }
        /**
         * @implements {@link Editor#applySearchResult}
         */
        applySearchResult(searchResult) {
            const beforeCursor = this.getBeforeCursor();
            if (beforeCursor != null) {
                const replace = searchResult.replace(beforeCursor, this.getAfterCursor());
                this.el.focus(); // Clicking a dropdown item removes focus from the element.
                if (Array.isArray(replace)) {
                    (0, undate_1.update)(this.el, replace[0], replace[1]);
                    if (this.el) {
                        this.el.dispatchEvent((0, dist$3.createCustomEvent)("input"));
                    }
                }
            }
        }
        /**
         * @implements {@link Editor#getCursorOffset}
         */
        getCursorOffset() {
            const elOffset = (0, dist$1.calculateElementOffset)(this.el);
            const elScroll = this.getElScroll();
            const cursorPosition = this.getCursorPosition();
            const lineHeight = (0, dist$1.getLineHeightPx)(this.el);
            const top = elOffset.top - elScroll.top + cursorPosition.top + lineHeight;
            const left = elOffset.left - elScroll.left + cursorPosition.left;
            const clientTop = this.el.getBoundingClientRect().top;
            if (this.el.dir !== "rtl") {
                return { top, left, lineHeight, clientTop };
            }
            else {
                const right = document.documentElement
                    ? document.documentElement.clientWidth - left
                    : 0;
                return { top, right, lineHeight, clientTop };
            }
        }
        /**
         * @implements {@link Editor#getBeforeCursor}
         */
        getBeforeCursor() {
            return this.el.selectionStart !== this.el.selectionEnd
                ? null
                : this.el.value.substring(0, this.el.selectionEnd);
        }
        getAfterCursor() {
            return this.el.value.substring(this.el.selectionEnd);
        }
        getElScroll() {
            return { top: this.el.scrollTop, left: this.el.scrollLeft };
        }
        /**
         * The input cursor's relative coordinates from the textarea's left
         * top corner.
         */
        getCursorPosition() {
            return (0, textarea_caret_1.default)(this.el, this.el.selectionEnd);
        }
        startListening() {
            this.el.addEventListener("input", this.onInput);
            this.el.addEventListener("keydown", this.onKeydown);
        }
        stopListening() {
            this.el.removeEventListener("input", this.onInput);
            this.el.removeEventListener("keydown", this.onKeydown);
        }
    }
    exports.TextareaEditor = TextareaEditor;
    //# sourceMappingURL=TextareaEditor.js.map
    });

    var dist = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TextareaEditor = void 0;

    Object.defineProperty(exports, "TextareaEditor", { enumerable: true, get: function () { return TextareaEditor_1.TextareaEditor; } });
    //# sourceMappingURL=index.js.map
    });

    /* src\Adjunct.svelte generated by Svelte v3.35.0 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	return child_ctx;
    }

    // (135:4) {#if emoji}
    function create_if_block_6(ctx) {
    	let html_tag;
    	let raw_value = emoji.buildEmoji(/*emoji*/ ctx[10]) + "";
    	let html_anchor;

    	return {
    		c() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert(target, html_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*emoji*/ 1024 && raw_value !== (raw_value = emoji.buildEmoji(/*emoji*/ ctx[10]) + "")) html_tag.p(raw_value);
    		},
    		d(detaching) {
    			if (detaching) detach(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};
    }

    // (149:6) {#each aliases as a}
    function create_each_block_1(ctx) {
    	let button;
    	let t0_value = /*a*/ ctx[31] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[27](/*a*/ ctx[31]);
    	}

    	return {
    		c() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = text(" x");
    			attr(button, "class", "btn btn-info btn-xs");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t0);
    			append(button, t1);

    			if (!mounted) {
    				dispose = listen(button, "click", click_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*aliases*/ 2 && t0_value !== (t0_value = /*a*/ ctx[31] + "")) set_data(t0, t0_value);
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (164:6) {#each ascii as a}
    function create_each_block$1(ctx) {
    	let button;
    	let t0_value = /*a*/ ctx[31] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[29](/*a*/ ctx[31]);
    	}

    	return {
    		c() {
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = text(" x");
    			attr(button, "class", "btn btn-info btn-xs");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t0);
    			append(button, t1);

    			if (!mounted) {
    				dispose = listen(button, "click", click_handler_1);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*ascii*/ 4 && t0_value !== (t0_value = /*a*/ ctx[31] + "")) set_data(t0, t0_value);
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (179:4) {:else}
    function create_else_block(ctx) {
    	let button;
    	let i;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			button = element("button");
    			i = element("i");
    			attr(i, "class", "fa fa-trash");
    			attr(button, "class", "btn btn-warning");
    			attr(button, "type", "button");
    			button.disabled = button_disabled_value = /*deleting*/ ctx[8] || /*deleted*/ ctx[9];
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, i);

    			if (!mounted) {
    				dispose = listen(button, "click", /*onDelete*/ ctx[18]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*deleting, deleted*/ 768 && button_disabled_value !== (button_disabled_value = /*deleting*/ ctx[8] || /*deleted*/ ctx[9])) {
    				button.disabled = button_disabled_value;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (170:4) {#if editing || empty}
    function create_if_block_5(ctx) {
    	let button;
    	let i;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			button = element("button");
    			i = element("i");
    			attr(i, "class", "fa fa-check");
    			attr(button, "class", "btn btn-success");
    			attr(button, "type", "button");
    			button.disabled = button_disabled_value = !/*canSave*/ ctx[11];
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, i);

    			if (!mounted) {
    				dispose = listen(button, "click", /*onSave*/ ctx[17]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*canSave*/ 2048 && button_disabled_value !== (button_disabled_value = !/*canSave*/ ctx[11])) {
    				button.disabled = button_disabled_value;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (192:0) {#if deleting || deleted}
    function create_if_block_4(ctx) {
    	let tr;
    	let td0;
    	let button0;
    	let t0;
    	let t1;
    	let td1;
    	let t3;
    	let td2;
    	let button1;
    	let t4;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			tr = element("tr");
    			td0 = element("td");
    			button0 = element("button");
    			t0 = text("Cancel");
    			t1 = space();
    			td1 = element("td");
    			td1.innerHTML = `<span class="help-block">Are you sure you want to delete this extension?</span>`;
    			t3 = space();
    			td2 = element("td");
    			button1 = element("button");
    			t4 = text("Yes");
    			attr(button0, "class", "btn btn-default");
    			attr(button0, "type", "button");
    			button0.disabled = /*deleted*/ ctx[9];
    			attr(td1, "colspan", 3);
    			attr(button1, "class", "btn btn-danger");
    			attr(button1, "type", "button");
    			button1.disabled = /*deleted*/ ctx[9];
    			attr(tr, "class", "svelte-11gdgpc");
    			toggle_class(tr, "fadeout", /*deleted*/ ctx[9]);
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			append(td0, button0);
    			append(button0, t0);
    			append(tr, t1);
    			append(tr, td1);
    			append(tr, t3);
    			append(tr, td2);
    			append(td2, button1);
    			append(button1, t4);

    			if (!mounted) {
    				dispose = [
    					listen(button0, "click", /*cancelDelete*/ ctx[20]),
    					listen(button1, "click", /*confirmDelete*/ ctx[19])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*deleted*/ 512) {
    				button0.disabled = /*deleted*/ ctx[9];
    			}

    			if (dirty[0] & /*deleted*/ 512) {
    				button1.disabled = /*deleted*/ ctx[9];
    			}

    			if (dirty[0] & /*deleted*/ 512) {
    				toggle_class(tr, "fadeout", /*deleted*/ ctx[9]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (206:0) {#if editing && failures.nameRequired}
    function create_if_block_3(ctx) {
    	let tr;

    	return {
    		c() {
    			tr = element("tr");
    			tr.innerHTML = `<td colspan="${5}"><span><strong>Name</strong> is required</span></td>`;
    			attr(tr, "class", "text-danger svelte-11gdgpc");
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    		}
    	};
    }

    // (214:0) {#if editing && failures.nameInvalid}
    function create_if_block_2(ctx) {
    	let tr;

    	return {
    		c() {
    			tr = element("tr");
    			tr.innerHTML = `<td colspan="${5}"><span><strong>Name</strong> must be an existing emoji</span></td>`;
    			attr(tr, "class", "text-danger svelte-11gdgpc");
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    		}
    	};
    }

    // (222:0) {#if editing && failures.aliasInvalid}
    function create_if_block_1(ctx) {
    	let tr;

    	return {
    		c() {
    			tr = element("tr");
    			tr.innerHTML = `<td colspan="${5}"><span><strong>Aliases</strong> can only contain letters, numbers, and <code>_-+.</code></span></td>`;
    			attr(tr, "class", "text-danger svelte-11gdgpc");
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    		}
    	};
    }

    // (230:0) {#if editing && failures.noChange}
    function create_if_block$1(ctx) {
    	let tr;

    	return {
    		c() {
    			tr = element("tr");
    			tr.innerHTML = `<td colspan="${5}"><span>Must provide at least one <strong>Alias</strong> or <strong>ASCII Pattern</strong>.</span></td>`;
    			attr(tr, "class", "text-danger svelte-11gdgpc");
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let tr;
    	let td0;
    	let input0;
    	let t0;
    	let td1;
    	let t1;
    	let td2;
    	let div1;
    	let input1;
    	let t2;
    	let div0;
    	let button0;
    	let t4;
    	let span0;
    	let t5;
    	let td3;
    	let div3;
    	let input2;
    	let t6;
    	let div2;
    	let button1;
    	let t8;
    	let span1;
    	let t9;
    	let td4;
    	let t10;
    	let t11;
    	let t12;
    	let t13;
    	let t14;
    	let if_block6_anchor;
    	let mounted;
    	let dispose;
    	let if_block0 = /*emoji*/ ctx[10] && create_if_block_6(ctx);
    	let each_value_1 = /*aliases*/ ctx[1];
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*ascii*/ ctx[2];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*editing*/ ctx[5] || /*empty*/ ctx[12]) return create_if_block_5;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);
    	let if_block2 = (/*deleting*/ ctx[8] || /*deleted*/ ctx[9]) && create_if_block_4(ctx);
    	let if_block3 = /*editing*/ ctx[5] && /*failures*/ ctx[4].nameRequired && create_if_block_3();
    	let if_block4 = /*editing*/ ctx[5] && /*failures*/ ctx[4].nameInvalid && create_if_block_2();
    	let if_block5 = /*editing*/ ctx[5] && /*failures*/ ctx[4].aliasInvalid && create_if_block_1();
    	let if_block6 = /*editing*/ ctx[5] && /*failures*/ ctx[4].noChange && create_if_block$1();

    	return {
    		c() {
    			tr = element("tr");
    			td0 = element("td");
    			input0 = element("input");
    			t0 = space();
    			td1 = element("td");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			td2 = element("td");
    			div1 = element("div");
    			input1 = element("input");
    			t2 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "+";
    			t4 = space();
    			span0 = element("span");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t5 = space();
    			td3 = element("td");
    			div3 = element("div");
    			input2 = element("input");
    			t6 = space();
    			div2 = element("div");
    			button1 = element("button");
    			button1.textContent = "+";
    			t8 = space();
    			span1 = element("span");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			td4 = element("td");
    			if_block1.c();
    			t10 = space();
    			if (if_block2) if_block2.c();
    			t11 = space();
    			if (if_block3) if_block3.c();
    			t12 = space();
    			if (if_block4) if_block4.c();
    			t13 = space();
    			if (if_block5) if_block5.c();
    			t14 = space();
    			if (if_block6) if_block6.c();
    			if_block6_anchor = empty();
    			attr(input0, "type", "text");
    			attr(input0, "class", "form-control emoji-name svelte-11gdgpc");
    			attr(input1, "type", "text");
    			attr(input1, "class", "form-control");
    			attr(button0, "class", "btn btn-default");
    			attr(div0, "class", "input-group-addon");
    			attr(div1, "class", "input-group");
    			attr(input2, "type", "text");
    			attr(input2, "class", "form-control");
    			attr(button1, "class", "btn btn-default");
    			attr(div2, "class", "input-group-addon");
    			attr(div3, "class", "input-group");
    			attr(tr, "class", "svelte-11gdgpc");
    			toggle_class(tr, "fadeout", /*deleted*/ ctx[9]);
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);
    			append(tr, td0);
    			append(td0, input0);
    			set_input_value(input0, /*name*/ ctx[0]);
    			/*input0_binding*/ ctx[25](input0);
    			append(tr, t0);
    			append(tr, td1);
    			if (if_block0) if_block0.m(td1, null);
    			append(tr, t1);
    			append(tr, td2);
    			append(td2, div1);
    			append(div1, input1);
    			set_input_value(input1, /*newAlias*/ ctx[3]);
    			append(div1, t2);
    			append(div1, div0);
    			append(div0, button0);
    			append(td2, t4);
    			append(td2, span0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(span0, null);
    			}

    			append(tr, t5);
    			append(tr, td3);
    			append(td3, div3);
    			append(div3, input2);
    			set_input_value(input2, /*newAscii*/ ctx[6]);
    			append(div3, t6);
    			append(div3, div2);
    			append(div2, button1);
    			append(td3, t8);
    			append(td3, span1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(span1, null);
    			}

    			append(tr, t9);
    			append(tr, td4);
    			if_block1.m(td4, null);
    			insert(target, t10, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert(target, t11, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert(target, t12, anchor);
    			if (if_block4) if_block4.m(target, anchor);
    			insert(target, t13, anchor);
    			if (if_block5) if_block5.m(target, anchor);
    			insert(target, t14, anchor);
    			if (if_block6) if_block6.m(target, anchor);
    			insert(target, if_block6_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[24]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[26]),
    					listen(button0, "click", /*addAlias*/ ctx[14]),
    					listen(input2, "input", /*input2_input_handler*/ ctx[28]),
    					listen(button1, "click", /*addAscii*/ ctx[16])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*name*/ 1 && input0.value !== /*name*/ ctx[0]) {
    				set_input_value(input0, /*name*/ ctx[0]);
    			}

    			if (/*emoji*/ ctx[10]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					if_block0.m(td1, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty[0] & /*newAlias*/ 8 && input1.value !== /*newAlias*/ ctx[3]) {
    				set_input_value(input1, /*newAlias*/ ctx[3]);
    			}

    			if (dirty[0] & /*removeAlias, aliases*/ 8194) {
    				each_value_1 = /*aliases*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(span0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*newAscii*/ 64 && input2.value !== /*newAscii*/ ctx[6]) {
    				set_input_value(input2, /*newAscii*/ ctx[6]);
    			}

    			if (dirty[0] & /*removeAscii, ascii*/ 32772) {
    				each_value = /*ascii*/ ctx[2];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(span1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(td4, null);
    				}
    			}

    			if (dirty[0] & /*deleted*/ 512) {
    				toggle_class(tr, "fadeout", /*deleted*/ ctx[9]);
    			}

    			if (/*deleting*/ ctx[8] || /*deleted*/ ctx[9]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_4(ctx);
    					if_block2.c();
    					if_block2.m(t11.parentNode, t11);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*editing*/ ctx[5] && /*failures*/ ctx[4].nameRequired) {
    				if (if_block3) ; else {
    					if_block3 = create_if_block_3();
    					if_block3.c();
    					if_block3.m(t12.parentNode, t12);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (/*editing*/ ctx[5] && /*failures*/ ctx[4].nameInvalid) {
    				if (if_block4) ; else {
    					if_block4 = create_if_block_2();
    					if_block4.c();
    					if_block4.m(t13.parentNode, t13);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*editing*/ ctx[5] && /*failures*/ ctx[4].aliasInvalid) {
    				if (if_block5) ; else {
    					if_block5 = create_if_block_1();
    					if_block5.c();
    					if_block5.m(t14.parentNode, t14);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*editing*/ ctx[5] && /*failures*/ ctx[4].noChange) {
    				if (if_block6) ; else {
    					if_block6 = create_if_block$1();
    					if_block6.c();
    					if_block6.m(if_block6_anchor.parentNode, if_block6_anchor);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(tr);
    			/*input0_binding*/ ctx[25](null);
    			if (if_block0) if_block0.d();
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			if_block1.d();
    			if (detaching) detach(t10);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach(t11);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach(t12);
    			if (if_block4) if_block4.d(detaching);
    			if (detaching) detach(t13);
    			if (if_block5) if_block5.d(detaching);
    			if (detaching) detach(t14);
    			if (if_block6) if_block6.d(detaching);
    			if (detaching) detach(if_block6_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    const pattern = /[^a-z\-.+0-9_]/i;

    function deepEquals(a, b) {
    	if (a === b) {
    		return true;
    	}

    	if (typeof a !== typeof b) {
    		return false;
    	}

    	if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) {
    		return a.every((value, index) => deepEquals(value, b[index]));
    	}

    	if (Array.isArray(a) || Array.isArray(b)) {
    		return false;
    	}

    	if (typeof a === "object") {
    		const keys = Object.keys(a);

    		if (Object.keys(b).length !== keys.length) {
    			return false;
    		}

    		return keys.every(key => deepEquals(a[key], b[key]));
    	}

    	return false;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let emoji$1;
    	let editing;
    	let canSave;
    	let { item } = $$props;
    	let { id } = $$props;
    	let name = item.name;
    	let aliases = item.aliases.slice();
    	let ascii = item.ascii.slice();

    	function reset() {
    		$$invalidate(0, name = item.name);
    		$$invalidate(1, aliases = item.aliases.slice());
    		$$invalidate(2, ascii = item.ascii.slice());
    	}

    	const empty = !item.name && !item.aliases.length && !item.ascii.length;
    	let newAlias = "";

    	function removeAlias(a) {
    		$$invalidate(1, aliases = aliases.filter(x => x !== a));
    	}

    	function addAlias() {
    		if (!newAlias || aliases.includes(newAlias)) {
    			return;
    		}

    		$$invalidate(1, aliases = [...aliases, newAlias]);
    		$$invalidate(3, newAlias = "");
    	}

    	let newAscii = "";

    	function removeAscii(a) {
    		$$invalidate(2, ascii = ascii.filter(x => x !== a));
    	}

    	function addAscii() {
    		if (!newAscii || ascii.includes(newAscii)) {
    			return;
    		}

    		$$invalidate(2, ascii = [...ascii, newAscii]);
    		$$invalidate(6, newAscii = "");
    	}

    	const failures = {
    		nameRequired: false,
    		nameInvalid: false,
    		aliasInvalid: false,
    		noChange: false,
    		any: false
    	};

    	let nameInput;

    	onMount(() => {
    		const editor = new dist.TextareaEditor(nameInput);

    		const completer = new dist$3.Textcomplete(editor,
    		[
    				Object.assign(Object.assign({}, emoji.strategy), {
    					replace: data => data.name,
    					match: /^(.+)$/
    				})
    			],
    		{ dropdown: { style: { zIndex: 20000 } } });

    		completer.on("selected", () => {
    			$$invalidate(0, name = nameInput.value);
    		});
    	});

    	const dispatch = createEventDispatcher();

    	function onSave() {
    		dispatch("save", { id, item: { name, aliases, ascii } });
    	}

    	let deleting = false;
    	let deleted = false;

    	function onDelete() {
    		$$invalidate(8, deleting = true);
    	}

    	function confirmDelete() {
    		$$invalidate(8, deleting = false);
    		$$invalidate(9, deleted = true);

    		setTimeout(
    			() => {
    				dispatch("delete", { id });
    			},
    			250
    		);
    	}

    	function cancelDelete() {
    		$$invalidate(8, deleting = false);
    	}

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	function input0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			nameInput = $$value;
    			$$invalidate(7, nameInput);
    		});
    	}

    	function input1_input_handler() {
    		newAlias = this.value;
    		$$invalidate(3, newAlias);
    	}

    	const click_handler = a => removeAlias(a);

    	function input2_input_handler() {
    		newAscii = this.value;
    		$$invalidate(6, newAscii);
    	}

    	const click_handler_1 = a => removeAscii(a);

    	$$self.$$set = $$props => {
    		if ("item" in $$props) $$invalidate(21, item = $$props.item);
    		if ("id" in $$props) $$invalidate(22, id = $$props.id);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*name*/ 1) {
    			$$invalidate(10, emoji$1 = name && emoji.table[name]);
    		}

    		if ($$self.$$.dirty[0] & /*name, aliases, ascii, item*/ 2097159) {
    			$$invalidate(5, editing = !deepEquals({ name, aliases, ascii }, item));
    		}

    		if ($$self.$$.dirty[0] & /*name*/ 1) {
    			$$invalidate(4, failures.nameRequired = !name, failures);
    		}

    		if ($$self.$$.dirty[0] & /*name*/ 1) {
    			$$invalidate(4, failures.nameInvalid = !emoji.table[name], failures);
    		}

    		if ($$self.$$.dirty[0] & /*newAlias*/ 8) {
    			$$invalidate(4, failures.aliasInvalid = pattern.test(newAlias), failures);
    		}

    		if ($$self.$$.dirty[0] & /*aliases, ascii*/ 6) {
    			$$invalidate(4, failures.noChange = !aliases.length && !ascii.length, failures);
    		}

    		if ($$self.$$.dirty[0] & /*failures*/ 16) {
    			$$invalidate(4, failures.any = failures.nameRequired || failures.nameInvalid || failures.aliasInvalid || failures.noChange, failures);
    		}

    		if ($$self.$$.dirty[0] & /*editing, failures*/ 48) {
    			$$invalidate(11, canSave = editing && !failures.any);
    		}
    	};

    	return [
    		name,
    		aliases,
    		ascii,
    		newAlias,
    		failures,
    		editing,
    		newAscii,
    		nameInput,
    		deleting,
    		deleted,
    		emoji$1,
    		canSave,
    		empty,
    		removeAlias,
    		addAlias,
    		removeAscii,
    		addAscii,
    		onSave,
    		onDelete,
    		confirmDelete,
    		cancelDelete,
    		item,
    		id,
    		reset,
    		input0_input_handler,
    		input0_binding,
    		input1_input_handler,
    		click_handler,
    		input2_input_handler,
    		click_handler_1
    	];
    }

    class Adjunct extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { item: 21, id: 22, reset: 23 }, [-1, -1]);
    	}

    	get reset() {
    		return this.$$.ctx[23];
    	}
    }

    /* src\ItemList.svelte generated by Svelte v3.35.0 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (45:4) {#each list as item (item.id)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let adjunct;
    	let current;
    	const adjunct_spread_levels = [/*item*/ ctx[10]];
    	let adjunct_props = {};

    	for (let i = 0; i < adjunct_spread_levels.length; i += 1) {
    		adjunct_props = assign(adjunct_props, adjunct_spread_levels[i]);
    	}

    	adjunct = new Adjunct({ props: adjunct_props });
    	adjunct.$on("save", /*onEdit*/ ctx[3]);
    	adjunct.$on("delete", /*onDelete*/ ctx[4]);

    	return {
    		key: key_1,
    		first: null,
    		c() {
    			first = empty();
    			create_component(adjunct.$$.fragment);
    			this.first = first;
    		},
    		m(target, anchor) {
    			insert(target, first, anchor);
    			mount_component(adjunct, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			const adjunct_changes = (dirty & /*list*/ 1)
    			? get_spread_update(adjunct_spread_levels, [get_spread_object(/*item*/ ctx[10])])
    			: {};

    			adjunct.$set(adjunct_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(adjunct.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(adjunct.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(first);
    			destroy_component(adjunct, detaching);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	let table;
    	let thead;
    	let t4;
    	let tbody;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t5;
    	let tfoot;
    	let adjunct;
    	let updating_reset;
    	let current;
    	let each_value = /*list*/ ctx[0];
    	const get_key = ctx => /*item*/ ctx[10].id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	function adjunct_reset_binding(value) {
    		/*adjunct_reset_binding*/ ctx[8](value);
    	}

    	let adjunct_props = { id: -1, item: /*newItem*/ ctx[2] };

    	if (/*resetNew*/ ctx[1] !== void 0) {
    		adjunct_props.reset = /*resetNew*/ ctx[1];
    	}

    	adjunct = new Adjunct({ props: adjunct_props });
    	binding_callbacks.push(() => bind(adjunct, "reset", adjunct_reset_binding));
    	adjunct.$on("save", /*onAdd*/ ctx[5]);

    	return {
    		c() {
    			table = element("table");
    			thead = element("thead");
    			thead.innerHTML = `<tr><th>Name</th><th>Image</th><th>Aliases</th><th>ASCII patterns</th><th></th></tr>`;
    			t4 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			tfoot = element("tfoot");
    			create_component(adjunct.$$.fragment);
    			attr(table, "class", "table");
    		},
    		m(target, anchor) {
    			insert(target, table, anchor);
    			append(table, thead);
    			append(table, t4);
    			append(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			append(table, t5);
    			append(table, tfoot);
    			mount_component(adjunct, tfoot, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*list, onEdit, onDelete*/ 25) {
    				each_value = /*list*/ ctx[0];
    				group_outros();
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, tbody, outro_and_destroy_block, create_each_block, null, get_each_context);
    				check_outros();
    			}

    			const adjunct_changes = {};
    			if (dirty & /*newItem*/ 4) adjunct_changes.item = /*newItem*/ ctx[2];

    			if (!updating_reset && dirty & /*resetNew*/ 2) {
    				updating_reset = true;
    				adjunct_changes.reset = /*resetNew*/ ctx[1];
    				add_flush_callback(() => updating_reset = false);
    			}

    			adjunct.$set(adjunct_changes);
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(adjunct.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(adjunct.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(table);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			destroy_component(adjunct);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { type = "adjunct" } = $$props;
    	let { record } = $$props;
    	let list;

    	function onEdit(event) {
    		const { id, item } = event.detail;

    		api__default['default'].put(`/admin/plugins/emoji/customizations/${type}/${id}`, { item }).then(
    			() => {
    				$$invalidate(6, record = Object.assign(Object.assign({}, record), { [id]: item }));
    			},
    			() => app$1.alertError()
    		);
    	}

    	function onDelete(event) {
    		const { id } = event.detail;

    		api__default['default'].del(`/admin/plugins/emoji/customizations/${type}/${id}`, {}).then(
    			() => {
    				delete record[id];
    				$$invalidate(6, record = Object.assign({}, record));
    			},
    			() => app$1.alertError()
    		);
    	}

    	const blank = { name: "", aliases: [], ascii: [] };
    	let resetNew;
    	let newItem = Object.assign({}, blank);

    	function onAdd(event) {
    		const { item } = event.detail;

    		api__default['default'].post(`/admin/plugins/emoji/customizations/${type}`, { item }).then(
    			({ id }) => {
    				$$invalidate(6, record = Object.assign(Object.assign({}, record), { [id]: item }));
    				$$invalidate(2, newItem = Object.assign({}, blank));
    				resetNew();
    			},
    			() => app$1.alertError()
    		);
    	}

    	function adjunct_reset_binding(value) {
    		resetNew = value;
    		$$invalidate(1, resetNew);
    	}

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(7, type = $$props.type);
    		if ("record" in $$props) $$invalidate(6, record = $$props.record);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*record*/ 64) {
    			{
    				$$invalidate(0, list = Object.keys(record).map(key => ({ id: parseInt(key, 10), item: record[key] })));
    			}
    		}
    	};

    	return [
    		list,
    		resetNew,
    		newItem,
    		onEdit,
    		onDelete,
    		onAdd,
    		record,
    		type,
    		adjunct_reset_binding
    	];
    }

    class ItemList extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { type: 7, record: 6 });
    	}
    }

    /* src\Customize.svelte generated by Svelte v3.35.0 */

    function create_fragment$2(ctx) {
    	let div8;
    	let div7;
    	let div6;
    	let div0;
    	let t3;
    	let div5;
    	let p;
    	let t7;
    	let div2;
    	let div1;
    	let t9;
    	let emojilist;
    	let t10;
    	let div4;
    	let div3;
    	let t12;
    	let itemlist;
    	let t13;
    	let link;
    	let current;

    	emojilist = new EmojiList({
    			props: { emojis: /*data*/ ctx[0].emojis }
    		});

    	itemlist = new ItemList({
    			props: { record: /*data*/ ctx[0].adjuncts }
    		});

    	return {
    		c() {
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");

    			div0.innerHTML = `<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button> 
        <h4 class="modal-title" id="editModalLabel">Customize Emoji</h4>`;

    			t3 = space();
    			div5 = element("div");
    			p = element("p");

    			p.innerHTML = `Below you can add custom emoji, and also add new aliases
          and ASCII patterns for existing emoji. While this list is
          edited live, you must still <strong>Build Emoji Assets</strong>
          to actually use these customizations.`;

    			t7 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div1.innerHTML = `<h3 class="panel-title">Custom Emoji</h3>`;
    			t9 = space();
    			create_component(emojilist.$$.fragment);
    			t10 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div3.innerHTML = `<h3 class="panel-title">Custom Extensions</h3>`;
    			t12 = space();
    			create_component(itemlist.$$.fragment);
    			t13 = space();
    			link = element("link");
    			attr(div0, "class", "modal-header");
    			attr(div1, "class", "panel-heading");
    			attr(div2, "class", "panel panel-default");
    			attr(div3, "class", "panel-heading");
    			attr(div4, "class", "panel panel-default");
    			attr(div5, "class", "modal-body");
    			attr(div6, "class", "modal-content");
    			attr(div7, "class", "modal-dialog modal-lg");
    			attr(div8, "class", "modal fade");
    			attr(div8, "tabindex", "-1");
    			attr(div8, "role", "dialog");
    			attr(div8, "aria-labelledby", "editModalLabel");
    			attr(div8, "aria-hidden", "true");
    			attr(link, "rel", "stylesheet");
    			attr(link, "href", `${config$1.assetBaseUrl}/plugins/nodebb-plugin-emoji/emoji/styles.css?${config$1["cache-buster"]}`);
    		},
    		m(target, anchor) {
    			insert(target, div8, anchor);
    			append(div8, div7);
    			append(div7, div6);
    			append(div6, div0);
    			append(div6, t3);
    			append(div6, div5);
    			append(div5, p);
    			append(div5, t7);
    			append(div5, div2);
    			append(div2, div1);
    			append(div2, t9);
    			mount_component(emojilist, div2, null);
    			append(div5, t10);
    			append(div5, div4);
    			append(div4, div3);
    			append(div4, t12);
    			mount_component(itemlist, div4, null);
    			/*div8_binding*/ ctx[3](div8);
    			insert(target, t13, anchor);
    			append(document.head, link);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const emojilist_changes = {};
    			if (dirty & /*data*/ 1) emojilist_changes.emojis = /*data*/ ctx[0].emojis;
    			emojilist.$set(emojilist_changes);
    			const itemlist_changes = {};
    			if (dirty & /*data*/ 1) itemlist_changes.record = /*data*/ ctx[0].adjuncts;
    			itemlist.$set(itemlist_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(emojilist.$$.fragment, local);
    			transition_in(itemlist.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(emojilist.$$.fragment, local);
    			transition_out(itemlist.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div8);
    			destroy_component(emojilist);
    			destroy_component(itemlist);
    			/*div8_binding*/ ctx[3](null);
    			if (detaching) detach(t13);
    			detach(link);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { data } = $$props;
    	let modal;

    	function show() {
    		jQuery__default['default'](modal).modal("show");
    	}

    	function div8_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			modal = $$value;
    			$$invalidate(1, modal);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("data" in $$props) $$invalidate(0, data = $$props.data);
    	};

    	return [data, modal, show, div8_binding];
    }

    class Customize extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { data: 0, show: 2 });
    	}

    	get show() {
    		return this.$$.ctx[2];
    	}
    }

    /* src\Translate.svelte generated by Svelte v3.35.0 */

    function create_catch_block$1(ctx) {
    	return { c: noop, m: noop, p: noop, d: noop };
    }

    // (6:50)  {@html translated}
    function create_then_block$1(ctx) {
    	let html_tag;
    	let raw_value = /*translated*/ ctx[2] + "";
    	let html_anchor;

    	return {
    		c() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert(target, html_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*src*/ 1 && raw_value !== (raw_value = /*translated*/ ctx[2] + "")) html_tag.p(raw_value);
    		},
    		d(detaching) {
    			if (detaching) detach(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};
    }

    // (1:0) <script lang="ts">import { Translator }
    function create_pending_block$1(ctx) {
    	return { c: noop, m: noop, p: noop, d: noop };
    }

    function create_fragment$1(ctx) {
    	let await_block_anchor;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 2
    	};

    	handle_promise(promise = /*translator*/ ctx[1].translate(/*src*/ ctx[0]), info);

    	return {
    		c() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m(target, anchor) {
    			insert(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    		},
    		p(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*src*/ 1 && promise !== (promise = /*translator*/ ctx[1].translate(/*src*/ ctx[0])) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[2] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const translator$1 = translator.Translator.create();
    	let { src } = $$props;

    	$$self.$$set = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    	};

    	return [src, translator$1];
    }

    class Translate extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { src: 0 });
    	}
    }

    /* src\Settings.svelte generated by Svelte v3.35.0 */

    function create_if_block(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 11,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*customizationsData*/ ctx[2], info);

    	return {
    		c() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m(target, anchor) {
    			insert(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*customizationsData*/ 4 && promise !== (promise = /*customizationsData*/ ctx[2]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[11] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};
    }

    // (1:0) <script lang="ts">import api from 'api';  import app from 'app';  import { init as initEmoji }
    function create_catch_block(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (64:47)  <Customize bind:show={openCustomize}
    function create_then_block(ctx) {
    	let customize;
    	let updating_show;
    	let current;

    	function customize_show_binding(value) {
    		/*customize_show_binding*/ ctx[9](value);
    	}

    	let customize_props = { data: /*customizations*/ ctx[11] };

    	if (/*openCustomize*/ ctx[1] !== void 0) {
    		customize_props.show = /*openCustomize*/ ctx[1];
    	}

    	customize = new Customize({ props: customize_props });
    	binding_callbacks.push(() => bind(customize, "show", customize_show_binding));

    	return {
    		c() {
    			create_component(customize.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(customize, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const customize_changes = {};
    			if (dirty & /*customizationsData*/ 4) customize_changes.data = /*customizations*/ ctx[11];

    			if (!updating_show && dirty & /*openCustomize*/ 2) {
    				updating_show = true;
    				customize_changes.show = /*openCustomize*/ ctx[1];
    				add_flush_callback(() => updating_show = false);
    			}

    			customize.$set(customize_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(customize.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(customize.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(customize, detaching);
    		}
    	};
    }

    // (1:0) <script lang="ts">import api from 'api';  import app from 'app';  import { init as initEmoji }
    function create_pending_block(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    function create_fragment(ctx) {
    	let form;
    	let div6;
    	let div3;
    	let div0;
    	let label0;
    	let input0;
    	let t0;
    	let translate0;
    	let t1;
    	let div1;
    	let label1;
    	let input1;
    	let t2;
    	let translate1;
    	let t3;
    	let div2;
    	let label2;
    	let input2;
    	let t4;
    	let translate2;
    	let t5;
    	let div5;
    	let div4;
    	let button0;
    	let translate3;
    	let t6;
    	let p;
    	let translate4;
    	let t7;
    	let t8;
    	let button1;
    	let t10;
    	let button2;
    	let current;
    	let mounted;
    	let dispose;

    	translate0 = new Translate({
    			props: {
    				src: "[[admin/plugins/emoji:settings.parseAscii]]"
    			}
    		});

    	translate1 = new Translate({
    			props: {
    				src: "[[admin/plugins/emoji:settings.parseNative]]"
    			}
    		});

    	translate2 = new Translate({
    			props: {
    				src: "[[admin/plugins/emoji:settings.customFirst]]"
    			}
    		});

    	translate3 = new Translate({
    			props: { src: "[[admin/plugins/emoji:build]]" }
    		});

    	translate4 = new Translate({
    			props: {
    				src: "[[admin/plugins/emoji:build_description]]"
    			}
    		});

    	let if_block = /*customizationsData*/ ctx[2] && create_if_block(ctx);

    	return {
    		c() {
    			form = element("form");
    			div6 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			input0 = element("input");
    			t0 = space();
    			create_component(translate0.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			label1 = element("label");
    			input1 = element("input");
    			t2 = space();
    			create_component(translate1.$$.fragment);
    			t3 = space();
    			div2 = element("div");
    			label2 = element("label");
    			input2 = element("input");
    			t4 = space();
    			create_component(translate2.$$.fragment);
    			t5 = space();
    			div5 = element("div");
    			div4 = element("div");
    			button0 = element("button");
    			create_component(translate3.$$.fragment);
    			t6 = space();
    			p = element("p");
    			create_component(translate4.$$.fragment);
    			t7 = space();
    			if (if_block) if_block.c();
    			t8 = space();
    			button1 = element("button");
    			button1.innerHTML = `<i class="material-icons">save</i>`;
    			t10 = space();
    			button2 = element("button");
    			button2.innerHTML = `<i class="material-icons">edit</i>`;
    			attr(input0, "id", "emoji-parseAscii");
    			attr(input0, "type", "checkbox");
    			attr(label0, "for", "emoji-parseAscii");
    			attr(div0, "class", "form-group");
    			attr(input1, "id", "emoji-parseNative");
    			attr(input1, "type", "checkbox");
    			attr(label1, "for", "emoji-parseNative");
    			attr(div1, "class", "form-group");
    			attr(input2, "id", "emoji-customFirst");
    			attr(input2, "type", "checkbox");
    			attr(label2, "for", "emoji-customFirst");
    			attr(div2, "class", "form-group");
    			attr(div3, "class", "panel-body");
    			attr(button0, "type", "button");
    			attr(button0, "class", "btn btn-primary");
    			attr(button0, "aria-describedby", "emoji-build_description");
    			attr(p, "id", "emoji-build_description");
    			attr(p, "class", "help-block");
    			attr(div4, "class", "form-group");
    			attr(div5, "class", "panel-footer");
    			attr(div6, "class", "panel panel-default");
    			attr(form, "id", "emoji-settings");
    			attr(button1, "class", "floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored");
    			attr(button2, "class", "edit floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored svelte-rv4t0s");
    		},
    		m(target, anchor) {
    			insert(target, form, anchor);
    			append(form, div6);
    			append(div6, div3);
    			append(div3, div0);
    			append(div0, label0);
    			append(label0, input0);
    			input0.checked = /*settings*/ ctx[0].parseAscii;
    			append(label0, t0);
    			mount_component(translate0, label0, null);
    			append(div3, t1);
    			append(div3, div1);
    			append(div1, label1);
    			append(label1, input1);
    			input1.checked = /*settings*/ ctx[0].parseNative;
    			append(label1, t2);
    			mount_component(translate1, label1, null);
    			append(div3, t3);
    			append(div3, div2);
    			append(div2, label2);
    			append(label2, input2);
    			input2.checked = /*settings*/ ctx[0].customFirst;
    			append(label2, t4);
    			mount_component(translate2, label2, null);
    			append(div6, t5);
    			append(div6, div5);
    			append(div5, div4);
    			append(div4, button0);
    			mount_component(translate3, button0, null);
    			append(div4, t6);
    			append(div4, p);
    			mount_component(translate4, p, null);
    			insert(target, t7, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, t8, anchor);
    			insert(target, button1, anchor);
    			insert(target, t10, anchor);
    			insert(target, button2, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(input0, "change", /*input0_change_handler*/ ctx[6]),
    					listen(input1, "change", /*input1_change_handler*/ ctx[7]),
    					listen(input2, "change", /*input2_change_handler*/ ctx[8]),
    					listen(button0, "click", /*buildAssets*/ ctx[4]),
    					listen(button1, "click", /*updateSettings*/ ctx[3]),
    					listen(button2, "click", /*showCustomize*/ ctx[5])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*settings*/ 1) {
    				input0.checked = /*settings*/ ctx[0].parseAscii;
    			}

    			if (dirty & /*settings*/ 1) {
    				input1.checked = /*settings*/ ctx[0].parseNative;
    			}

    			if (dirty & /*settings*/ 1) {
    				input2.checked = /*settings*/ ctx[0].customFirst;
    			}

    			if (/*customizationsData*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*customizationsData*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t8.parentNode, t8);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(translate0.$$.fragment, local);
    			transition_in(translate1.$$.fragment, local);
    			transition_in(translate2.$$.fragment, local);
    			transition_in(translate3.$$.fragment, local);
    			transition_in(translate4.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(translate0.$$.fragment, local);
    			transition_out(translate1.$$.fragment, local);
    			transition_out(translate2.$$.fragment, local);
    			transition_out(translate3.$$.fragment, local);
    			transition_out(translate4.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(form);
    			destroy_component(translate0);
    			destroy_component(translate1);
    			destroy_component(translate2);
    			destroy_component(translate3);
    			destroy_component(translate4);
    			if (detaching) detach(t7);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(t8);
    			if (detaching) detach(button1);
    			if (detaching) detach(t10);
    			if (detaching) detach(button2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { settings } = $$props;

    	function updateSettings() {
    		api__default['default'].put("/admin/plugins/emoji/settings", settings).then(() => app$1.alertSuccess(), err => app$1.alertError(err));
    	}

    	function buildAssets() {
    		api__default['default'].put("/admin/plugins/emoji/build", {}).then(() => app$1.alertSuccess(), err => app$1.alertError(err));
    	}

    	let openCustomize;
    	let customizationsData;

    	function getCustomizations() {
    		return api__default['default'].get("/admin/plugins/emoji/customizations", {});
    	}

    	function showCustomize() {
    		$$invalidate(2, customizationsData = customizationsData || Promise.all([getCustomizations(), emoji.init()]).then(([data]) => data));
    		customizationsData.then(() => setTimeout(() => openCustomize(), 0));
    	}

    	function input0_change_handler() {
    		settings.parseAscii = this.checked;
    		$$invalidate(0, settings);
    	}

    	function input1_change_handler() {
    		settings.parseNative = this.checked;
    		$$invalidate(0, settings);
    	}

    	function input2_change_handler() {
    		settings.customFirst = this.checked;
    		$$invalidate(0, settings);
    	}

    	function customize_show_binding(value) {
    		openCustomize = value;
    		$$invalidate(1, openCustomize);
    	}

    	$$self.$$set = $$props => {
    		if ("settings" in $$props) $$invalidate(0, settings = $$props.settings);
    	};

    	return [
    		settings,
    		openCustomize,
    		customizationsData,
    		updateSettings,
    		buildAssets,
    		showCustomize,
    		input0_change_handler,
    		input1_change_handler,
    		input2_change_handler,
    		customize_show_binding
    	];
    }

    class Settings extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, { settings: 0 });
    	}
    }

    jQuery__default['default'](window).on('action:ajaxify.end', () => {
        if (ajaxify$1.data.template['admin/plugins/emoji']) {
            // eslint-disable-next-line no-new
            new Settings({
                target: document.getElementById('content'),
                props: {
                    settings: ajaxify$1.data.settings,
                },
            });
        }
    });

});
