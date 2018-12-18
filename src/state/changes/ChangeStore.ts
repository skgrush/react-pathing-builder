import CanvasStore from '../CanvasStore'
import Location from '../Location'
import Edge from '../Edge'
import Change, {ActionType} from './change'
import {ChangeError} from '../../errors'
import {Pointed} from '../../interfaces'

/** create a new Change in the opposite type of Change from the input */
function flipChange(C: Change) {
  const ts = Date.now()
  let {action, target, property, oldValue, newValue} = C

  if (action === 'add') action = 'remove'
  else if (action === 'remove') action = 'add'
  else if (action === 'grab') action = 'drop'
  else if (action === 'drop') action = 'grab'

  // flip newValue and oldValue
  return new Change(action, ts, target, property, newValue, oldValue)
}

export default class ChangeStore {
  /** stack of registered changes, never events on top */
  private readonly sequenceStack: Array<Change> = []
  /** stack of undone changes, ready to be redo-ne */
  private readonly redoStack: Array<Change> = []
  /** reference back to the parent CanvasStore instance */
  readonly canvasStore: CanvasStore
  /** counter for preventing undo's from adding new changes */
  private ignoreNext: number = 0

  constructor(canvasStore: CanvasStore) {
    this.canvasStore = canvasStore
  }

  newAdd = (target: Location | Edge) =>
    this._newChange('add', Date.now(), target)

  newRemove = (target: Location | Edge) =>
    this._newChange('remove', Date.now(), target)

  newMutate = (
    target: Location | Edge,
    prop: keyof Location | keyof Edge,
    oldValue: any,
    newValue: any
  ) => {
    const ts = Date.now()

    if (oldValue === undefined || newValue === undefined) {
      console.error('Change Error on:', arguments)
      throw new ChangeError('oldValue|newValue unset in newMutate()')
    }
    if (
      (target instanceof Location && prop !== 'name' && prop !== 'shape') ||
      (target instanceof Edge && prop !== 'weight')
    ) {
      console.error('Change Error on:', arguments)
      throw new ChangeError(`Bad property '${prop}' in newMutate()`)
    }
    this._newChange('mutate', ts, target, prop, oldValue, newValue)
  }

  newGrab = (target: Location, coords: Pointed) =>
    this._newChange('grab', Date.now(), target, 'point', coords)

  newDrop = (target: Location, coords: Pointed) =>
    this._newChange('drop', Date.now(), target, 'point', undefined, coords)

  private _newChange = (
    action: ActionType,
    ts: number,
    target: Location | Edge,
    property?: string,
    oldValue?: any,
    newValue?: any
  ) => {
    const C = new Change(action, ts, target, property, oldValue, newValue)
    if (this.ignoreNext <= 0) {
      this.redoStack.length = 0 // remove undo stack when new change happens
      this.sequenceStack.push(C)
      this.ignoreNext = 0
    } else {
      this.ignoreNext -= 1
    }
  }

  redo = () => {
    const C = this.redoStack.pop()
    if (!C) {
      console.debug('Empty redo stack')
      return false
    }

    if (C.action !== 'grab') {
      this.sequenceStack.push(C)
      return this._undo(flipChange(C))
    }

    const C2 = this.redoStack.pop()
    if (!C2 || C2.action !== 'drop') {
      console.error('Change Error on:', C)
      if (C2) this.redoStack.push(C2)
      throw new ChangeError('Missing corresponding drop for grab redo')
    }
    this.sequenceStack.push(C, C2)
    return this._undoGrab(flipChange(C2))
  }

  undo = () => {
    const C = this.sequenceStack.pop()
    if (!C) {
      console.debug('Empty undo stack')
      return false
    }
    this.redoStack.push(C)
    return this._undo(C)
  }

  private _undo = (C: Change) => {
    switch (C.action) {
      case 'add':
        return this._undoAdd(C)
      case 'remove':
        return this._undoRemove(C)
      case 'mutate':
        return this._undoMutate(C)
      case 'grab':
        return this._undoGrab(C)
      case 'drop':
        return this._undoDrop(C)
      default:
        console.error('Change Error on:', C)
        throw new ChangeError(`Unexpected change action ${C.action}`)
    }
  }

  private _undoAdd = (C: Change) => {
    const prevIgnoreNext = this.ignoreNext
    let ret
    if (C.target instanceof Location) {
      this.ignoreNext += C.target.neighborNames.length + 1
      ret = this.canvasStore.removeLoc(C.target.name)
    } else if (C.target instanceof Edge) {
      this.ignoreNext += 1
      ret = this.canvasStore.removeEdge(C.target.start, C.target.end)
    } else {
      console.error('Change Error on:', C)
      throw new ChangeError('Unexpected change target to _undoAdd()')
    }

    if (!ret) this.ignoreNext = prevIgnoreNext
    return ret
  }

  private _undoRemove = (C: Change) => {
    const prevIgnoreNext = this.ignoreNext
    let ret
    if (C.target instanceof Location) {
      this.ignoreNext += 1
      ret = this.canvasStore.addLoc(C.target)
    } else if (C.target instanceof Edge) {
      this.ignoreNext += 1
      ret = this.canvasStore.createEdge(
        C.target.start,
        C.target.end,
        C.target.weight
      )
    } else {
      console.error('Change Error on:', C)
      throw new ChangeError('Unexpected change target to _undoRemove()')
    }

    if (!ret) this.ignoreNext = prevIgnoreNext
    return ret
  }

  private _undoMutate = (C: Change) => {
    const {target, property, oldValue, newValue} = C
    if (!property || oldValue === undefined || newValue === undefined) {
      console.error('Change Error on:', C)
      throw new ChangeError('Missing property/oldValue/newValue on a mutation')
    }
    if ((target as any)[property] !== newValue) {
      console.error('Change Error on:', C)
      throw new ChangeError(`Undo inconsistency on ${property} property`)
    }

    if (target instanceof Location) {
      switch (property) {
        case 'name':
          target.name = oldValue
          return true
        case 'shape':
          target.shape = oldValue
          return true
      }
    } else if (target instanceof Edge) {
      switch (property) {
        case 'weight':
          target.weight = oldValue
          return true
      }
    } else {
      console.error('Change Error on:', C)
      throw new ChangeError('Unexpected change target to _undoMutate()')
    }
    throw new ChangeError(`Unexpected mutate property ${property}`)
  }

  private _undoGrab = (C: Change) => {
    if (!(C.target instanceof Location)) {
      console.error('Change Error on:', C)
      throw new ChangeError('Unexpected non-Location _undoGrab() target')
    }
    if (C.property !== 'point' || !C.oldValue) {
      console.error('Change Error on:', C)
      throw new ChangeError('Unexpected values on _undoGrab() object')
    }
    const {x, y} = C.oldValue as Pointed
    Object.assign(C.target, {x, y})
    return true
    // TODO: is there anything to check against that I missed?
  }

  private _undoDrop = (C: Change): boolean => {
    if (!(C.target instanceof Location)) {
      console.error('Change Error on:', C)
      throw new ChangeError('Unexpected non-Location _undoGrab() target')
    }
    const C_grab = this.sequenceStack.pop()
    if (!C_grab || C_grab.action !== 'grab' || C.target !== C_grab.target) {
      if (C_grab) this.sequenceStack.push(C_grab) // whoops reverse it
      console.error('Change Error on:', C, C_grab)
      throw new ChangeError('Unexpected lack of corresponding grab for drop')
    }
    // last action confirmed to be corresponding grab; now undo it
    this.redoStack.push(C_grab)
    return this._undo(C_grab)
  }
}
