import  { Component, Fragment, EMPTY_OBJ,  createComponentVNode as createComponentVNodeo, createFragment, createPortal, createRef, createRenderer, createTextVNode, createVNode, forwardRef, directClone, findDOMfromVNode, getFlagsForElementVnode, linkEvent, normalizeProps, options, render, rerender, version, 
// Internal methods, used by hydration
_CI, _HI, _M, _MCCC,_ME,_MFCC,_MR, _MP, __render, _RFC } from './infernopack'; 
//import { eq } from './eq'; 
 
import { VNodeFlags } from 'inferno-vnode-flags'; 
 
export function shallowEqual (a, b) { 
 
    for (let i in a) if (i !== '__source' && !(i in b)) return true;
	for (let i in b) if (i !== '__source' && a[i]!==b[i]) return true;
    return false;
}

/**
 * currentComponent tracks hook state for the currently rendering component.
 * When an xferno component is rendered, its hook state tracker becomes currentComponent.
 * When rendering is complete, the previous tracker, if any, is restored.
 */
let currentComponent,prevTracker;
const emptyProps={}
function renderChild(component, {child, ...childProps}, context) {
  // Push ourselves onto the hook stack
   prevTracker = currentComponent;
  currentComponent = component;

  try {  
  //  console.log("flags",childProps,childProps&&!!childProps.flags & 32768 /* ForwardRef */)
    return child(childProps || emptyProps, context);
  } finally { 
    console.log("finqlly")
		//if (currentComponent._pendingEffects?.length) 
    // Pop ourselves off of the hook stack 
    afterPaint(); 
    //currentComponent = prevTracker?prevTracker:currentComponent;
    currentComponent = prevTracker? prevTracker:{};
  }
}
function eq(a, b) {
  if (a === b) {
    return true;
  }
  else if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => x === b[i]);
  }
 return !!b 
}
function createTracker(component) {
  // Used to generate sshallowEqualuential hook ids for this component
  // the sshallowEqualuenial rshallowEqualuirement is why hooks can't be in conditionals.
  let nextId = 0;

  // The list of hooks which have been instantiated for this component,
  // this is keyed by hook id. Hook instances are used to determine if
  // the hook value has changed, as well as to track cleanup rshallowEqualuirements.
  const hookInstances = [];

  // Used if useSelector is ever invoked. We have a single Redux-like
  // store subscription per component, and we clean it up when we're done.
  let unsubscribeFromStore = undefined;

  // Determines whether or not the component should update.
  let shouldUpdate = true;

  // Setup the component's state so we can use it for useState and useSelector.
  component.state = {};

  function nextHook(watchList) {
    const id = nextId++;
    let hook = hookInstances[id];

    if (hook && eq(hook.watchList, watchList)) {
      hook.isNew = false;
      return hook;
    }

    if (hook && hook.dispose) {
      hook.dispose();
    }

    hook = {
      id,
      isNew: true,
      watchList,
    };

    hookInstances[id] = hook;
    return hook;
  }

  const tracker = {
    // We pre-render in shouldComponentUpdate, in order to avoid v-dom diffs.
    // This is the result of that render, and will be our return value from our
    // render.
    renderResult: undefined,

    /**
     * Get the state of the Redux store (context.store.getState()). This
     * has a side-effect of ensuring that we are subscribed to the store
     * so that we re-render if one of our subscriptions changes, even if
     * a parent component's shouldComponentUpdate returns false.
     */
    getStoreState() {
      if (!unsubscribeFromStore) {
        const store = component.context.store;
        component.state.storeState = store.getState();
        unsubscribeFromStore = store.subscribe(() => {
          component.setState((s) => {
            s.storeState = store.getState();
            return s;
          });
        });
      }

      return component.state.storeState;
    },

    /**
     * Get the next hook in the hook sshallowEqualuence.
     * @param {*} watchList An item which is used to determine if the hook needs to be re-initialized
     */
    getHook(watchList, fn) {
      const hook = nextHook(watchList);
      const value = hook.value;
      fn(hook);
      shouldUpdate = shouldUpdate || !eq(hook.value, value);
      return hook;
    },

    shouldComponentUpdate(nextProps, nextState, context) {
      // We'll always update if the child props change.
      shouldUpdate = !shallowEqual(component.props, nextProps)
      // ||    !shallowEqual(component.state, nextState);

      // This ensures that any calls to useState will get the latest state.
       component.state = nextState;

      // When we begin a render pass, we need to reset our hook ids,
      // so that the sshallowEqualuence is consistent between render calls.
       nextId = 0; 
      // We only want to set this.renderResult if we are updating. Because otherwise, it's
      // a boolean (bypassing the possibly expensive v-dom generation).
      if (shouldUpdate) {    
      const renderResult = renderChild(component, nextProps, context);

            // We cache the result of the render, so that we don't *double* render.
        tracker.renderResult = renderResult;
      }

      return shouldUpdate;
    },

    dispose() {
      // Clean our Redux subscription.
      tracker.renderResult = null
      if (unsubscribeFromStore) {
        unsubscribeFromStore();
      }

      // If any hooks have a dispose, we will clean them up.
      hookInstances.forEach((hook) => {
        return hook && hook.dispose && hook.dispose();
      });
    },
  };

  return tracker;
}

class HookComponent extends Component {
  constructor(props, context) {
    super(props, context); 
    currentComponent=this
  }

  dispose() {
    if (this.tracker) {
      this.tracker.dispose();
    }
    this.state = undefined;
    this.tracker = undefined;
  }

  componentWillReceiveProps({ child }) {
    // We're switching components, so we need to do a full reset...
    //if (!shallowEqual(this.props.child, child)){
    if(child !== this.props.child) {
    this.dispose();
    }
  }
 
  componentWillUnmount() {
 this.dispose();
  }

  getHook(watchList, fn) {
    if (!this.tracker) {
      this.tracker = createTracker(this);
    }
    return this.tracker.getHook(watchList, fn);
  }  
/** 
   * We do some tomfoolery to determine if we really need to re-render. We need
   * to run the hooks in order to know if re-rendering is necessary, and the
   * hooks only run when we *render* the child. So we actually need to render
   * the child.
   */
  shouldComponentUpdate(nextProps, nextState, context) {
    //if(!nextProps.childProps)
    //return true
    if (!this.tracker) {
      return (!shallowEqual(this.props, nextProps)
      ||!shallowEqual(this.state, nextState));
    }
    return this.tracker.shouldComponentUpdate(nextProps, nextState, context);
  }

  render() {
    return this.tracker ? this.tracker.renderResult : renderChild(this, this.props, this.context);
  }
}


/**
 * Here, we override inferno's createComponentVNode if the node being created
 * is a functional component. In that case we wrap it in our HookComponent.
 */
export function createComponentVNode(flags, type, props, key, ref) {
  var l=type.prototype; 
  if (!l) {
    return createComponentVNodeo(flags, type, props, key, ref);
  }
    if (type.prototype instanceof Component ) {
    return createComponentVNodeo(flags, type, props, key, ref);
  }
   // console.log(type,flags)
 // if ((type.prototype instanceof Function)){ 
   //console.log("flags",!!flags & 32768 /* ForwardRef */) 
  return createComponentVNodeo(
    VNodeFlags.ComponentUnknown,
    HookComponent,
    { child: type,  ...props },
    key,
    ref,
  ); 
}


/**
 * @param {import('./index').Reducer<any, any>} reducer
 * @param {import('./index').StateUpdater<any>} initialState
 * @param {(initialState: any) => void} [init]
 * @returns {[ any, (state: any) => void ]}
 */
function invokeOrReturn(arg, f) {
	return typeof f == 'function' ? f(arg) : f;
}
export function useState(initialState) { 
	return useReducer(invokeOrReturn, initialState);
}
 
/**
 * Returns a stateful value, and a function to update it.
 * @param {T|() => T} initialState - The initial state or a function which returns the initial state.
 * @returns {[T, (T|(T) => T)]} An array [state, setState]
 */
export function useReducer(reducer, initialState, init) { 
  console.log("LI",currentComponent.$LI)

  //return setTimeout(()=>useReducer(reducer, initialState, init),100)
  return currentComponent.getHook(0, (hook) => {
    if (hook.isNew) {
      currentComponent.state[hook.id] = 
      !init ? invokeOrReturn(undefined, initialState) : init(initialState); 
       const component = currentComponent;
      hook.$setState = (setter) => {  
        const currentstate = component.state[hook.id];
        const nextState = reducer(currentstate, setter);
        
       // const nextState = typeof setter === 'function' ? setter(s[hook.id]) : setter;
        // Exit early if the state is unchanged. This means we don't
        // really support state mutation.
        if (currentstate === nextState) { 
          return;
        }  
         if(!component.$LI)
   return [, ()=>{}];
   console.log("setState",nextState)
    //    component.$BR=true
        // We mutate here, purely as a micro optimization, probably not necessary, but
        // the way we've written this, it's fine.
        return component.setState((s) => {
          s[hook.id] = nextState;
          return s;
        });
      };
    }

    hook.value = [currentComponent.state[hook.id], hook.$setState];
  }).value
}


/** @type {Array<import('./internal').Component>} */
let afterPaintEffects = [];

let EMPTY = []; 

const RAF_TIMEOUT = 100;
let prevRaf;
let HAS_RAF = typeof requestAnimationFrame == 'function';

function afterNextFrame(callback) {
	const done = () => {
		clearTimeout(timeout);
		if (HAS_RAF) cancelAnimationFrame(raf);
		setTimeout(callback);
	};
	const timeout = setTimeout(done, RAF_TIMEOUT);

	let raf;
	if (HAS_RAF) {
		raf = requestAnimationFrame(done);
	}
}
/**
 * @param {import('./internal').EffectHookState} hook
 */
function invokeCleanup(hook) {
	// A hook cleanup can introduce a call to render which creates a new root, this will call options.vnode
	// and move the currentComponent away.
	const comp = currentComponent;
	let cleanup = hook._cleanup;
	if (typeof cleanup == 'function') {
		hook._cleanup = undefined;
		cleanup();
	}

	currentComponent = comp;
}

/**
 * Invoke a Hook's effect
 * @param {import('./internal').EffectHookState} hook
 */
function invokeEffect(hook) {
	// A hook call can introduce a call to render which creates a new root, this will call options.vnode
	// and move the currentComponent away. 
	 const comp = currentComponent;
   
	hook._cleanup = hook.value();
	 currentComponent = comp;
} 

function flushAfterPaintEffects() {
	let component;
	while ((component = afterPaintEffects.shift())) {
		if (!component._pendingEffects) continue;
		try {
	 //	component._pendingEffects.forEach(invokeCleanup);
			component._pendingEffects.forEach(invokeEffect);
			component._pendingEffects = [];
		} catch (e) {
			component._pendingEffects = [];
		}
	}
}

// Note: if someone used options.debounceRendering = requestAnimationFrame,
// then effects will ALWAYS run on the NEXT frame instead of the current one, incurring a ~16ms delay.
// Perhaps this is not such a big deal.
/**
 * Schedule afterPaintEffects flush after the browser paints
 * @param {number} newQueueLength
 */
function afterPaint(newQueueLength) {
//	if (newQueueLength === 1 ) { 
	 afterNextFrame(flushAfterPaintEffects);
//	}
}
/**
 * Run the specified effect anytime watchList changes.
 * @param {function} fn - The effect to be run
 * @param {*} watchList - The value or array of values to be watched. fn will be re-run if this changes.
 */
export function useEffect(fn, watchList) {   
  return currentComponent.getHook(watchList, (hook) => {
    if (hook.isNew) {
      hook.dispose = fn();
    }
  }).value
}
export function useLayoutEffect(fn, watchList) { 
  function value(){
    return currentComponent.getHook(watchList, (hook) => {
    if (hook.isNew) {
      hook.dispose = fn();
    }
  })}
  const hookpending={
  //  _cleanup:fn,
    value
    }
  
  currentComponent._pendingEffects = currentComponent._pendingEffects || [];
		currentComponent._pendingEffects.push(hookpending);
    afterPaintEffects.push(currentComponent)
}

export function useCallback(callback, args) { 
	return useMemo(() => callback, args);
}

/**
 * Run the specified function any time watchList changes, memoize and return the result.
 * @param {() => T} fn - The function to be run
 * @param {*} watchList - The value or array of values to be watched. fn will be re-run if this changes.
 * @returns {T} the result of calling fn()
 */
export function useMemo(fn, watchList) {
  return  currentComponent.getHook(watchList, (hook) => {
    if (hook.isNew) {
      hook.value = fn();
    }
  }).value
}
 
export function useRef(initialValue) {
	return useMemo(() => ({ current: initialValue }), []);
} 

export { Component, Fragment, EMPTY_OBJ, createFragment, createPortal, createRef, createRenderer, createTextVNode, createVNode, forwardRef, directClone, findDOMfromVNode, getFlagsForElementVnode, linkEvent, normalizeProps, options, render, rerender, version, 
// Internal methods, used by hydration
_CI, _HI, _M, _MCCC,_ME,_MFCC,_MR, _MP, __render, _RFC }
/**
 * Run the specified function any time watchList changes, memoize and return result.value.
 * The return result's dispose function will be called whenever fn is reinvoked and / or
 * when the component is disposed.
 * @param {() => { value: T, dispose: function }} fn - The function which will return the disposable value
 * @param {*} watchList - The value or array of values to be watched. fn will be re-run if this changes.
 * @returns {T} the .value property of result of calling fn()
 */
export function useDisposable(fn, watchList) {
  return currentComponent.getHook(watchList, (hook) => {
    if (hook.isNew) {
      const result = fn();
      hook.value = result.value;
      hook.dispose = result.dispose;
    }
  }).value;
}
/**
 * Get a subset of Redux (or similar state manager store) state.
 * @param {(TState) => TResult} fn - A function taking Redux state, and returning the desired subset.
 * @returns {TResult} the result of calling fn with the current Redux state.
 */
export function useSelector(fn) {
  return currentComponent.getHook(0, (hook) => {
    hook.value = fn(currentComponent.tracker.getStoreState());
  }).value;
}

/**
 * Get the Redux (or similar state manager store) dispatch function.
 * @returns {Dispatch} The Redux (or Redux-like store) dispatch function.
 */
export function useDispatch() {
  return currentComponent.context.store.dispatch;
}
