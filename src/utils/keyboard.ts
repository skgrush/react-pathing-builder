import CanvasStore from '../state/CanvasStore'
import Location from '../state/Location'
import {addPointed, dotPointed, boundPointed} from './pointMath'
import {nativePlatform} from './platform'

/** KeyboardEvent#key values of modifiers */
const MODIFIER_KEYS = Object.freeze([
  'Alt',
  'AltGraph',
  'CapsLock',
  'Control',
  'Fn',
  'Hyper',
  'Meta',
  'Shift',
  'Super',
])
export {MODIFIER_KEYS}

/** KeyboardEvent and MouseEvent boolean property names for modifiers */
export type ClickModifier = 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'
const CLICK_MODIFIERS = Object.freeze([
  'altKey',
  'ctrlKey',
  'metaKey',
  'shiftKey',
] as ClickModifier[])
export {CLICK_MODIFIERS}

interface ClickModifiersBitMap {
  ['altKey']: 1
  ['ctrlKey']: 2
  ['metaKey']: 4
  ['shiftKey']: 8
}
interface modifiers extends ClickModifiersBitMap {
  (e: MouseEvent | KeyboardEvent): number
}

/**
 * Return a number whose bits correspond to moddifier keypresses
 * based on the modifiers position in CLICK_MODIFIERS.
 * Therefore return value is an integer in [0, 15]
 */
const modifiers: modifiers = (() => {
  function modifiers(e: MouseEvent | KeyboardEvent) {
    return CLICK_MODIFIERS.map((mod, i) => (e[mod] ? 2 ** i : 0)).reduce(
      (prev, curr) => prev + curr
    )
  }
  return Object.assign(modifiers, {
    altKey: 1,
    ctrlKey: 2,
    metaKey: 4,
    shiftKey: 8,
  } as ClickModifiersBitMap)
})()

export {modifiers}

/** modifier used in Undo/Redo. Depends on if Mac or not. */
const UNDO_MOD =
  nativePlatform === 'mac' ? modifiers.metaKey : modifiers.ctrlKey
/** modifier for coarse movements */
const COARSE_MOD = modifiers.shiftKey
/** modifier for fine movements */
const FINE_MOD = nativePlatform === 'mac' ? modifiers.altKey : modifiers.ctrlKey

/**
 * Check if the KeyboardEvent is an Undo event for the given platform.
 */
export function isUndo(e: KeyboardEvent) {
  const mods = modifiers(e)

  if (e.key === 'Undo') return true
  if (e.key === 'z' && mods === UNDO_MOD) {
    return true
  }
  return false
}

/**
 * KeyboardEvent.key is 'Redo' or a native redo key-combo.
 * cmd+Y / ctrl+Y, or
 */
export function isRedo(e: KeyboardEvent) {
  const mods = modifiers(e)

  if (e.key === 'Redo') return true
  if (e.key === 'y' && mods === UNDO_MOD) {
    return true
  }
  if (e.key === 'z' && mods === UNDO_MOD + modifiers.shiftKey) {
    return true
  }
  return false
}

/**
 * handle an arrow key event, moving the selected Location.
 *
 * Modifier:
 *  - none: 5-pixels
 *  - opt/ctrl: 1-pixels
 *  - shift: 20-pixels
 */
export function handleArrowKey(
  e: KeyboardEvent,
  sel: Location,
  modify: CanvasStore['modLoc'],
  bounds: CanvasStore['canvasDimensions']
) {
  const mods = modifiers(e)
  const vector = {
    x: e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0,
    y: e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0,
  }

  if (mods === 0) {
    // move 5 pixels
    dotPointed({x: 5, y: 5}, vector, vector)
  } else if (mods === COARSE_MOD) {
    // move 20 pixels
    dotPointed({x: 50, y: 50}, vector, vector)
  } else if (mods === FINE_MOD) {
    // just one pixel
  } else {
    console.debug('unexpected arrow key combo', e)
    return
  }

  const dest = addPointed(sel, vector)
  boundPointed(dest, bounds)

  modify(sel, dest)
}
