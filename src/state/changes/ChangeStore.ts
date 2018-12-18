import CanvasStore from '../CanvasStore'
import Location from '../Location'
import Edge from '../Edge'
import Change, {ActionType} from './change'
import {ChangeError} from '../../errors'
import {Pointed} from '../../interfaces'

export default class ChangeStore {
  private readonly sequenceStack: Array<Change> = []
  private readonly undoneStack: Array<Change> = []
  readonly canvasStore: CanvasStore
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
      this.undoneStack.length = 0 // remove undo stack when new change happens
      this.sequenceStack.push(C)
      this.ignoreNext = 0
    } else {
      this.ignoreNext -= 1
    }
  }

  undo = () => {
    const C = this.sequenceStack.pop()
    if (!C) {
      throw new ChangeError('Failed to undo: empty sequenceStack')
    }
    this.undoneStack.push(C)
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
    if (C.target instanceof Location) {
      this.ignoreNext += C.target.neighborNames.length + 1
      return this.canvasStore.removeLoc(C.target.name) !== false
    } else if (C.target instanceof Edge) {
      this.ignoreNext += 1
      return this.canvasStore.removeEdge(C.target.start, C.target.end)
    } else {
      console.error('Change Error on:', C)
      throw new ChangeError('Unexpected change target to _undoAdd()')
    }
  }

  private _undoRemove = (C: Change) => {
    if (C.target instanceof Location) {
      this.ignoreNext += 1
      return this.canvasStore.addLoc(C.target)
    } else if (C.target instanceof Edge) {
      this.ignoreNext += 1
      return this.canvasStore.createEdge(
        C.target.start,
        C.target.end,
        C.target.weight
      )
    } else {
      console.error('Change Error on:', C)
      throw new ChangeError('Unexpected change target to _undoRemove()')
    }
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
    return Object.assign(C.target, {x, y})
  }

  private _undoDrop = (C: Change) => {
    if (!(C.target instanceof Location)) {
      console.error('Change Error on:', C)
      throw new ChangeError('Unexpected non-Location _undoGrab() target')
    }
    const C_grab = this.sequenceStack[this.sequenceStack.length - 1]
    if (!C_grab || C_grab.action !== 'grab' || C.target !== C_grab.target) {
      console.error('Change Error on:', C, C_grab)
      throw new ChangeError('Unexpected lack of corresponding grab for drop')
    }
    // last action confirmed to be corresponding grab; now undo it
    this.undo()
  }
}
