const DELIM_RE = /\s+/

interface UpdatableComp extends React.Component<{className?: string}> {
  defaultClassName: string
}
interface UpdatableSub extends React.Component<{baseClassName?: string}> {
  defaultClassSuffix: string
}

/**
 * Return an updated className string for a Component based on `props.className`
 * and `defaultClassName`. Pass isSubComponent=true to use
 * `props.baseClassName` and `defaultClassSuffix`.
 */
export function updateComponent(up: UpdatableComp) {
  const nameList = split(up.defaultClassName, up.props.className)
  return {
    //classNames: nameList,
    className: nameList.join(' '),
  }
}

/**
 * Return updated className for a Subcomponent.
 */
export function updateSubcomponent(up: UpdatableSub) {
  const nameList = suffix(
    split(undefined, up.props.baseClassName),
    up.defaultClassSuffix
  )
  return {
    //classNames: nameList,
    className: nameList.join(' '),
  }
}

/**
 * Split an element className and include a default base className.
 *
 * split(                      ) -> []
 * split('one'                 ) -> ['one']
 * split('one',     'two three') -> ['one', 'two', 'three']
 * split(undefined, 'two three') -> ['two', 'three']
 */
export function split(baseClassName?: string, className?: string) {
  if (baseClassName && !className) {
    return [baseClassName]
  }
  if (!className) {
    return []
  }
  const splitted = className.split(DELIM_RE)
  return baseClassName ? [baseClassName].concat(splitted) : splitted
}

/**
 * Append a given suffix to a copy of each value in a given iterator.
 */
export function suffix(classNames: string[] | DOMTokenList, suffix: string) {
  return [...classNames].map(N => `${N}${suffix}`)
}
