import Location, {LocationExport} from '../Location'
import {Change} from './Change'
import {ChangeSubclass} from './interfaces'
import {ChangeError} from '../../errors'
import {Shape} from '../../drawables/shapes'
import Edge, {EdgeExport} from '../Edge'

type _MutateChange = Change & {action: 'mutate-loc' | 'mutate-edge'}
type _DropChange = Change & {action: 'drop'}

/**
 * Object of Change-arrays for 'additions', 'removals', 'mutations', and
 * 'moves'.
 */
interface ChangeStruct {
  additions: Change[]
  removals: Change[]
  mutations: _MutateChange[]
  moves: _DropChange[]
}

type EitherExport = LocationExport | EdgeExport

export interface ExportStruct {
  added: EitherExport[]
  removed: EitherExport[]
  modded: _MutateChange[]
  moved: _DropChange[]
}

/**
 * Reduce a sequence of Changes to a minimal current-state description.
 * Returns an object containing newly-added and -removed Export objects,
 * as well as Change-object arrays for mutations and moves performed on
 * non-new Locations|Edges.
 * No side-effects and no modifications, just returns an ExportStruct.
 */
export function simplifyChanges(sequenceStack: ChangeSubclass[]) {
  return objectifyChanges(reduceChangeSequence(sequenceStack))
}

/**
 * Takes a sequence of Changes and sorts them into 'additions', 'removals',
 * 'mutations', and 'moves', while dropping any redundant Changes.
 * No Side-effects and no modifications, just returns a ChangeStruct.
 */
export function reduceChangeSequence(sequenceStack: ChangeSubclass[]) {
  const CS: ChangeStruct = {
    additions: [],
    removals: [],
    mutations: [],
    moves: [],
  }

  // add changes into the above arrays of changes
  for (const C of sequenceStack) {
    switch (C.action) {
      case 'add':
        reduceAddition(CS, C)
        break
      case 'remove':
        reduceRemoval(CS, C)
        break
      case 'mutate-loc':
      case 'mutate-edge':
        reduceMutation(CS, C)
        break
      case 'drop':
        reduceDrop(CS, C)
        break
      case 'grab':
        break
      default:
        console.warn('Unexpected Change.action:', (C as any).action, C)
        break
    }
  }
  return CS
}

/**
 * Take a ChangeStruct, produce simplified Objects for all new Locations|Edges
 * (with all moves/mutations applied) and filter move|mutate Changes to
 * only those describing non-newly-added Locations|Edges.
 */
export function objectifyChanges(CS: ChangeStruct): ExportStruct {
  const {additions, removals, moves, mutations} = CS

  const added = additions.map(objectifier)

  return {
    added,
    removed: removals.map(objectifier),
    modded: mutations.filter(processMutation.bind(void 0, added)),
    moved: moves.filter(processMove.bind(void 0, added)),
  }
}

const objectifier = (C: Change) => C.target.toObject()

function reduceAddition(CS: ChangeStruct, C: Change) {
  CS.additions.push(C)
}

function reduceRemoval(CS: ChangeStruct, C: Change) {
  // forget about events that happened to this target, since it's gone.
  // additions array helps us check if target is new
  const isNewAdd = CS.additions.some((C2, idx, ary) => {
    if (C.target !== C2.target) return false
    ary.splice(idx, 1)
    return true
  })
  CS.mutations = CS.mutations.filter(C2 => C.target !== C2.target)
  CS.moves = CS.moves.filter(C2 => C.target !== C2.target)
  // if the target is NOT a new addition, add the removal to the list
  if (!isNewAdd) {
    CS.removals.push(C)
  }
}

function reduceMutation(CS: ChangeStruct, C: _MutateChange) {
  // forget about similar events that this one overwrites.
  CS.mutations = CS.mutations.filter(
    C2 => C.target !== C2.target || C.property !== C2.property
  )
  CS.mutations.push(C)
}

function reduceDrop(CS: ChangeStruct, C: _DropChange) {
  CS.moves = CS.moves.filter(C2 => C.target !== C2.target)
  CS.moves.push(C)
}

/**
 * Update new 'added' Exports with change 'C' if-and-only-if it's added.
 *
 * Returns `true` for new Changes to un-added objects, `false` for Changes that
 * were used to update an Export in 'added'.
 * Basically a filter with side-effects.
 */
function processMutation(this: void, added: EitherExport[], C: _MutateChange) {
  if (!C.property)
    throw new ChangeError(`Bad ${C.action} as mutation with no property`)
  if (C.action !== 'mutate-loc' && C.action !== 'mutate-edge')
    throw new ChangeError(`Unexpected ${C.action} masquerading as mutation`)

  const C_added = added.find(val => val.key === C.target.key)

  // keep changes for pre-existing Locations/Edges
  if (!C_added) return true

  // for new Locations/Edges, apply changes and filter out mutation
  if ('neighborKeys' in C_added && C.target instanceof Location) {
    if (C_added[C.property] !== C.newValue) {
      if (C.property === 'shape' && C.newValue instanceof Shape) {
        C_added['shape'] = C.newValue.constructor.name
      } else {
        C_added[C.property] = C.newValue
      }
    }
  } else if ('weight' in C_added && C.target instanceof Edge) {
    if (C_added[C.property] !== C.newValue) {
      C_added[C.property] = C.newValue
    }
  } else {
    console.error('C:', C, 'C_added:', C_added)
    throw new ChangeError('processMutation expected ')
  }
  return false
}

/**
 * Update newly 'added' Exports with the move-Change 'C' if-and-only-if new.
 */
function processMove(this: void, added: EitherExport[], C: _DropChange) {
  if (C.action !== 'drop')
    throw new ChangeError(`Bad ${C.action}, expected a 'drop' in moves list`)

  const {key} = C.target
  const C_added = added.find(val => val.key === key)

  if (!C_added) {
    // keep moves for pre-existing Locations/Edges
    return true
  } else {
    // for new Locations/Edges, apply the move and filter it out
    const {x, y} = C.newValue
    Object.assign(C_added, {x, y})
    return false
  }
}
