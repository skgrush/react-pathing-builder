import Location, {
  LocationMutablePropName,
  LocationMutablePropType,
} from '../Location'
import Edge, {EdgeMutablePropName, EdgeMutablePropType} from '../Edge'
import {Shape} from '../../drawables'
import {Pointed} from '../../interfaces'
import {ChangeError} from '../../errors'
import {
  ActionType,
  ChangeLike,
  ChangeAddLike,
  ChangeDropLike,
  ChangeGrabLike,
  ChangeSubclass,
  ChangeRemoveLike,
  ChangeMutateLocLike,
  ChangeMutateEdgeLike,
} from './interfaces'

// export type Change = {
//   Add: typeof ChangeAdd
//   Remove: typeof ChangeRemove
//   MutateLoc: typeof ChangeMutateLoc
//   MutateEdge: typeof ChangeMutateEdge
//   Grab: typeof ChangeGrab
//   Drop: typeof ChangeDrop
// }

/**
 * The abstract Change class itself.
 * The `Change.new()` method constructs an appropriate subclass from
 * a change-like object.
 *
 * Constructing a class shouldn't have any side effects other than adding
 * a reference to the member properties.
 */
export abstract class Change {
  readonly action: ActionType
  readonly timestamp: number
  readonly target: Location | Edge
  readonly property?: string
  readonly oldValue?: any
  readonly newValue?: any

  constructor({
    action,
    timestamp,
    target,
    property,
    oldValue,
    newValue,
  }: ChangeLike) {
    this.action = action
    this.timestamp = timestamp
    this.target = target
    this.property = property
    this.oldValue = oldValue
    this.newValue = newValue
  }

  static Add: typeof ChangeAdd
  static Remove: typeof ChangeRemove
  static MutateLoc: typeof ChangeMutateLoc
  static MutateEdge: typeof ChangeMutateEdge
  static Grab: typeof ChangeGrab
  static Drop: typeof ChangeDrop

  static new(C: ChangeAddLike): ChangeAdd
  static new(C: ChangeRemoveLike): ChangeRemove
  static new(C: ChangeMutateLocLike): ChangeMutateLoc
  static new(C: ChangeMutateEdgeLike): ChangeMutateEdge
  static new(C: ChangeDropLike): ChangeDrop
  static new(C: ChangeGrabLike): ChangeGrab
  // generate a new Change based on the 'action' key
  static new(C: ChangeLike): ChangeSubclass {
    switch (C.action) {
      case 'add':
        return new ChangeAdd(C)
      case 'remove':
        return new ChangeRemove(C)
      case 'mutate-loc':
        return new ChangeMutateLoc(C)
      case 'mutate-edge':
        return new ChangeMutateEdge(C)
      case 'grab':
        return new ChangeGrab(C)
      case 'drop':
        return new ChangeDrop(C)
      default:
        throw ChangeError.assertNever(C, 'Unexpected action value')
    }
  }

  /** create a new Change in the opposite type of Change from the input */
  static flip(C: ChangeLike | ChangeSubclass) {
    switch (C.action) {
      case 'add':
        return ChangeAdd.flip(C)
      case 'remove':
        return ChangeRemove.flip(C)
      case 'mutate-edge':
        return ChangeMutateEdge.flip(C)
      case 'mutate-loc':
        return ChangeMutateLoc.flip(C)
      case 'grab':
        return ChangeGrab.flip(C)
      case 'drop':
        return ChangeDrop.flip(C)
    }

    ChangeError.assertNever(C, `Unexpected action ${(<any>C).action}`)
  }
}

export class ChangeAdd extends Change implements ChangeAddLike {
  readonly action = 'add'
  readonly property = undefined
  readonly oldValue = undefined
  readonly newValue = undefined

  constructor(C: ChangeAddLike) {
    super(C)
  }

  static flip(C: ChangeAdd | ChangeAddLike): ChangeRemove {
    return Change.new({
      action: 'remove',
      timestamp: Date.now(),
      target: C.target,
    })
  }
}
Change.Add = ChangeAdd

export class ChangeRemove extends Change implements ChangeRemoveLike {
  readonly action = 'remove'
  readonly property = undefined
  readonly oldValue = undefined
  readonly newValue = undefined

  constructor(C: ChangeRemoveLike) {
    super(C)
  }

  static flip(C: ChangeRemove | ChangeRemoveLike) {
    return Change.new({
      action: 'add',
      timestamp: Date.now(),
      target: C.target,
    })
  }
}
Change.Remove = ChangeRemove

export class ChangeMutateLoc extends Change implements ChangeMutateLocLike {
  readonly action = 'mutate-loc'
  readonly target: Location
  readonly property: LocationMutablePropName
  readonly oldValue: LocationMutablePropType
  readonly newValue: LocationMutablePropType

  constructor(C: ChangeMutateLocLike) {
    super(C)
    this.target = C.target
    this.property = C.property
    this.oldValue = C.oldValue
    this.newValue = C.newValue
  }

  static flip(C: ChangeMutateLoc | ChangeMutateLocLike) {
    return Change.new({
      timestamp: Date.now(),
      action: 'mutate-loc',
      target: C.target,
      property: C.property,
      oldValue: C.newValue, // swap old
      newValue: C.oldValue, // with new
    })
  }
}
Change.MutateLoc = ChangeMutateLoc

export class ChangeMutateEdge extends Change implements ChangeMutateEdgeLike {
  readonly action = 'mutate-edge'
  readonly target: Edge
  readonly property: EdgeMutablePropName
  readonly oldValue: EdgeMutablePropType
  readonly newValue: EdgeMutablePropType

  constructor(C: ChangeMutateEdgeLike) {
    super(C)
    this.target = C.target
    this.property = C.property
    this.oldValue = C.oldValue
    this.newValue = C.newValue
  }

  static flip(C: ChangeMutateEdge | ChangeMutateEdgeLike) {
    return Change.new({
      timestamp: Date.now(),
      action: 'mutate-edge',
      target: C.target,
      property: C.property,
      oldValue: C.newValue, // swap old
      newValue: C.oldValue, // with new
    })
  }
}
Change.MutateEdge = ChangeMutateEdge

export class ChangeGrab extends Change implements ChangeGrabLike {
  readonly action = 'grab'
  readonly target: Location
  readonly property = undefined
  readonly oldValue: Pointed
  readonly newValue = undefined

  constructor(C: ChangeGrabLike) {
    super(C)
    this.target = C.target
    const {x, y} = C.oldValue
    this.oldValue = {x, y}
  }

  static flip(C: ChangeGrab | ChangeGrabLike) {
    return Change.new({
      timestamp: Date.now(),
      action: 'drop',
      target: C.target,
      newValue: C.oldValue,
    })
  }
}
Change.Grab = ChangeGrab

export class ChangeDrop extends Change implements ChangeDropLike {
  readonly action = 'drop'
  readonly target: Location
  readonly property = undefined
  readonly oldValue = undefined
  readonly newValue: Pointed

  constructor(C: ChangeDropLike) {
    super(C)
    this.target = C.target
    const {x, y} = C.newValue
    this.newValue = {x, y}
  }

  static flip(C: ChangeDrop | ChangeDropLike) {
    return Change.new({
      timestamp: Date.now(),
      action: 'grab',
      target: C.target,
      oldValue: C.newValue,
    })
  }
}
Change.Drop = ChangeDrop
