import CanvasStore from '../state/CanvasStore'
import Location from '../state/Location'
import {addPointed} from './pointMath'

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

/**
 * Check if the KeyboardEvent is an Undo event for the given platform.
 */
export function isUndo(e: KeyboardEvent, platform?: string | null) {
  const mods = modifiers(e)

  if (e.key === 'Undo') return true
  if (e.key === 'z') {
    if (platform === 'mac' && mods === modifiers.metaKey) return true
    if (platform !== 'mac' && mods === modifiers.ctrlKey) return true
  }
  return false
}

export function isRedo(e: KeyboardEvent, platform?: string | null) {
  const mods = modifiers(e)

  if (e.key === 'Redo') return true
  if (e.key === 'y') {
    if (platform === 'mac' && mods === modifiers.metaKey) return true
    if (platform !== 'mac' && mods === modifiers.ctrlKey) return true
  }
  if (e.key === 'z') {
    if (platform === 'mac' && mods === modifiers.metaKey + modifiers.shiftKey)
      return true
  }
  return false
}

export function handleArrowKey(
  e: KeyboardEvent,
  sel: Location,
  modify: CanvasStore['modLoc']
) {
  const mods = modifiers(e)
  const vector = {
    x: e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0,
    y: e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0,
  }

  if (mods === 0) {
    // just one pixel
  } else {
    return
  }

  const dest = addPointed(sel, vector)

  modify(sel, dest)
}
