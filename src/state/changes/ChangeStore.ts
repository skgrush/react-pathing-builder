import CanvasStore from '../CanvasStore'
import Location, {LocationMutablePropName} from '../Location'
import Edge, {EdgeMutablePropName} from '../Edge'
import Change, {
  ChangeSubclass,
  ChangeAdd,
  ChangeRemove,
  ChangeMutateLoc,
  ChangeMutateEdge,
  ChangeGrab,
  ChangeDrop,
} from './change'
import {ChangeError} from '../../errors'
import {Pointed} from '../../interfaces'
import {equalPointed} from '../../utils'

export default class ChangeStore {
  /** stack of registered changes, never events on top */
  private readonly sequenceStack: Array<ChangeSubclass> = []
  /** stack of undone changes, ready to be redo-ne */
  private readonly redoStack: Array<ChangeSubclass> = []
  /** reference back to the parent CanvasStore instance */
  readonly canvasStore: CanvasStore
  /** counter for preventing undo's from adding new changes */
  private ignoreNext: number = 0
  /** external callback to update react parent */
  readonly updateReact: (cb?: () => void) => void

  get undoSize() {
    return this.sequenceStack.length
  }

  get redoSize() {
    return this.redoStack.length
  }

  constructor(
    canvasStore: CanvasStore,
    updateReact: (cb?: () => void) => void
  ) {
    this.canvasStore = canvasStore
    this.updateReact = updateReact
  }

  /**
   * Record an ChangeAdd in the store about a target being added.
   */
  newAdd = (target: Location | Edge) =>
    this._newChange(
      new Change.Add({action: 'add', timestamp: Date.now(), target})
    )

  /**
   * Record a ChangeRemove about a target being removed.
   */
  newRemove = (target: Location | Edge) =>
    this._newChange(
      new Change.Remove({action: 'remove', timestamp: Date.now(), target})
    )

  /**
   * Record a MutateLoc about a Location's property being modified.
   */
  newMutateLoc = (
    target: Location,
    property: LocationMutablePropName,
    oldValue: any,
    newValue: any
  ) =>
    this._newChange(
      new ChangeMutateLoc({
        action: 'mutate-loc',
        timestamp: Date.now(),
        target,
        property,
        oldValue,
        newValue,
      })
    )

  /**
   * Record a MutateEdge about an Edge's property being modified.
   */
  newMutateEdge = (
    target: Edge,
    property: EdgeMutablePropName,
    oldValue: any,
    newValue: any
  ) =>
    this._newChange(
      new ChangeMutateEdge({
        action: 'mutate-edge',
        timestamp: Date.now(),
        target,
        property,
        oldValue,
        newValue,
      })
    )

  newGrab = (target: Location, oldValue: Pointed) =>
    this._newChange(
      new ChangeGrab({action: 'grab', timestamp: Date.now(), target, oldValue})
    )

  newDrop = (target: Location, newValue: Pointed) => {
    const timestamp = Date.now()

    if (this.hasntMoved(target, newValue)) {
      return null
    }

    return this._newChange(
      new ChangeDrop({action: 'drop', timestamp, target, newValue})
    )
  }

  private _newChange = (C: ChangeSubclass) => {
    if (this.ignoreNext <= 0) {
      this.redoStack.length = 0 // remove undo stack when new change happens
      this.sequenceStack.push(C)
      this.updateReact()
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
      return this._undo(Change.flip(C))
    }

    const C_drop = this.redoStack.pop()
    if (!C_drop || C_drop.action !== 'drop') {
      console.error('Change Error on:', C)
      if (C_drop) this.redoStack.push(C_drop)
      throw new ChangeError('Missing corresponding drop for grab redo')
    }
    this.sequenceStack.push(C, C_drop)
    return this._undoGrab(ChangeDrop.flip(C_drop))
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

  private _undo = (C: ChangeSubclass) => {
    this.updateReact()
    switch (C.action) {
      case 'add':
        return this._undoAdd(C)
      case 'remove':
        return this._undoRemove(C)
      case 'mutate-loc':
      case 'mutate-edge':
        return this._undoMutate(C)
      case 'grab':
        return this._undoGrab(C)
      case 'drop':
        return this._undoDrop(C)
      default:
        //console.error('Change Error on:', C)
        //throw new ChangeError(`Unexpected change action ${C.action}`)
        throw ChangeError.assertNever(C, `Unexpected change action in _undo()`)
    }
  }

  private _undoAdd = (C: ChangeAdd) => {
    const prevIgnoreNext = this.ignoreNext
    let ret
    if (C.target instanceof Location) {
      this.ignoreNext += C.target.neighborNames.length + 1
      ret = this.canvasStore.removeLoc(C.target)
    } else if (C.target instanceof Edge) {
      this.ignoreNext += 1
      ret = this.canvasStore.removeEdge(C.target)
    } else {
      console.error('Change Error on:', C)
      throw new ChangeError('Unexpected change target to _undoAdd()')
    }

    if (!ret) this.ignoreNext = prevIgnoreNext
    return ret
  }

  private _undoRemove = (C: ChangeRemove) => {
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

  private _undoMutate = (C: ChangeMutateLoc | ChangeMutateEdge) => {
    const {target, property, oldValue, newValue} = C
    if (!property || oldValue === undefined || newValue === undefined) {
      console.error('Change Error on:', C)
      throw new ChangeError('Missing property/oldValue/newValue on a mutation')
    }
    if ((target as any)[property] !== newValue) {
      console.error('Change Error on:', C)
      throw new ChangeError(`Undo inconsistency on ${property} property`)
    }

    this.canvasStore.redraw()
    if (C instanceof ChangeMutateLoc) {
      C.target[C.property] = C.oldValue
      return true
    } else if (C instanceof ChangeMutateEdge) {
      C.target[C.property] = C.oldValue
      return true
    } else {
      throw ChangeError.assertNever(C, 'Unexpected target to _undoMutate()')
      //console.error('Change Error on:', C)
      //throw new ChangeError('Unexpected change target to _undoMutate()')
    }
    //throw ChangeError.assertNever(C, `Unexpected mutate property ${property}`)
  }

  private _undoGrab = (C: ChangeGrab) => {
    if (!(C.target instanceof Location)) {
      console.error('Change Error on:', C)
      throw new ChangeError('Unexpected non-Location _undoGrab() target')
    }
    if (!C.oldValue) {
      console.error('Change Error on:', C)
      throw new ChangeError('Unexpected values on _undoGrab() object')
    }
    const {x, y} = C.oldValue as Pointed
    Object.assign(C.target, {x, y})
    this.canvasStore.redraw()
    return true
    // TODO: is there anything to check against that I missed?
  }

  private _undoDrop = (C: ChangeDrop): boolean => {
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

  simplifyChanges = () => {
    const additions: Change[] = []
    const removals: Change[] = []
    const mutations: Change[] = []
    const moves: Change[] = []

    for (const C of this.sequenceStack) {
      switch (C.action) {
        case 'add':
          additions.push(C)
          break

        case 'remove':
          // forget about events that happened to this target, since it's gone.
          // additions array helps us check if target is new
          const isNewAdd = additions.some((C2, idx) => {
            if (C.target !== C2.target) return false
            additions.splice(idx, 1)
            return true
          })
          ;[mutations, moves].forEach(ary =>
            ary.forEach((C2, idx) => {
              if (C.target !== C2.target) return false
              ary.splice(idx, 1)
            })
          )
          // if the target is NOT a new addition, add the removal to the list
          if (!isNewAdd) {
            removals.push(C)
          }
          break

        case 'mutate-loc':
        case 'mutate-edge':
      }
    }
  }

  /**
   * Checks if the preceding 'grab' was at the same place.
   * If so, also removes the preceding grab from the stack.
   *
   * NOTE: Should only be called during a 'drop'!
   */
  private hasntMoved(target: Location, coords: Pointed) {
    const prev = this.sequenceStack[this.sequenceStack.length - 1]

    if (
      prev &&
      prev.action === 'add' &&
      prev.target instanceof Edge &&
      prev.target.end === target
    ) {
      // we added a new node, so just abort the drop procedure
      return true
    }
    if (!prev || prev.action !== 'grab' || prev.target !== target) {
      console.error('previous sequence Change:', prev, 'target:', target)
      throw new ChangeError("hasntMoved() called out of sequence of 'grab'")
    }
    if (equalPointed(prev.oldValue, coords)) {
      // the target didn't move; just remove the previous 'grab'
      this.sequenceStack.pop()
      return true
    }

    return false
  }
}
