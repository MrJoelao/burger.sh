import { options } from 'preact';

const DEBUG_PREFIX = '[render-debug]';
const installed = Symbol.for('burger.sh.render-debug-installed');

function componentName(type) {
  if (typeof type === 'string') return type;
  if (type?.displayName) return type.displayName;
  if (type?.name) return type.name;
  return '<anonymous>';
}

function isVNode(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    Object.hasOwn(value, 'type') &&
    Object.hasOwn(value, 'props')
  );
}

function isComponentInstance(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !isVNode(value) &&
    Object.hasOwn(value, '__')
  );
}

function describeValue(value) {
  if (Array.isArray(value)) {
    return {
      kind: 'array',
      length: value.length,
      values: value.map(describeValue)
    };
  }

  if (isVNode(value)) {
    return {
      kind: 'vnode',
      type: componentName(value.type),
      key: value.key ?? null
    };
  }

  if (isComponentInstance(value)) {
    return {
      kind: 'component-instance',
      constructor: componentName(value.constructor),
      keys: Object.keys(value)
    };
  }

  if (value && typeof value === 'object') {
    return {
      kind: 'object',
      constructor: componentName(value.constructor),
      keys: Object.keys(value)
    };
  }

  return {
    kind: typeof value,
    value
  };
}

function inspectChildren(children, parentType, path = 'children') {
  if (Array.isArray(children)) {
    children.forEach((child, index) => {
      inspectChildren(child, parentType, `${path}[${index}]`);
    });
    return;
  }

  if (isComponentInstance(children) || (
    children &&
    typeof children === 'object' &&
    !isVNode(children) &&
    !('then' in children)
  )) {
    console.error(`${DEBUG_PREFIX} invalid child candidate`, {
      parent: parentType,
      path,
      value: describeValue(children),
      rawValue: children,
      route: window.location.pathname
    });
    console.groupCollapsed(`${DEBUG_PREFIX} invalid child candidate`);
    console.log('parent:', parentType);
    console.log('path:', path);
    console.log('value:', describeValue(children));
    console.log('raw value:', children);
    console.trace('creation/diff trace');
    console.groupEnd();
  }
}

function collectInvalidChildren(value, path = 'children', result = []) {
  if (Array.isArray(value)) {
    value.forEach((child, index) => {
      collectInvalidChildren(child, `${path}[${index}]`, result);
    });
    return result;
  }

  if (
    value &&
    typeof value === 'object' &&
    !isVNode(value) &&
    !('then' in value)
  ) {
    result.push({ path, value, description: describeValue(value) });
  }

  return result;
}

export function installRenderDebug() {
  if (!import.meta.env.DEV || globalThis[installed]) return;

  globalThis[installed] = true;
  const previousDiff = options._diff;
  const previousDiffed = options.diffed;
  options._diff = (vnode) => {
    const parentType = componentName(vnode.type);
    inspectChildren(vnode.props?.children, parentType);
    previousDiff?.(vnode);
  };
  options.diffed = (vnode) => {
    const invalidChildren = collectInvalidChildren(vnode._children || []);

    if (invalidChildren.length > 0) {
      console.error(`${DEBUG_PREFIX} invalid rendered child`, {
        parent: componentName(vnode.type),
        props: vnode.props,
        children: invalidChildren,
        route: window.location.pathname
      });
      console.trace(`${DEBUG_PREFIX} invalid rendered child trace`);
    }

    try {
      previousDiffed?.(vnode);
    } catch (error) {
      console.error(`${DEBUG_PREFIX} diff hook threw`, {
        error,
        parent: componentName(vnode.type),
        props: vnode.props,
        renderedChildren: vnode._children,
        route: window.location.pathname
      });
      throw error;
    }
  };

  window.addEventListener('error', (event) => {
    console.groupCollapsed(`${DEBUG_PREFIX} window error`);
    console.log('message:', event.message);
    console.log('source:', event.filename, event.lineno, event.colno);
    console.log('error:', event.error);
    console.log('route:', window.location.pathname);
    console.groupEnd();
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.groupCollapsed(`${DEBUG_PREFIX} unhandled rejection`);
    console.log('reason:', event.reason);
    console.log('route:', window.location.pathname);
    console.groupEnd();
  });

  console.info(`${DEBUG_PREFIX} enabled`, {
    route: window.location.pathname,
    mode: import.meta.env.MODE
  });
}
