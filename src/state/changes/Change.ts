import Location from '../Location'
import Edge from '../Edge'

export type ActionType = 'add' | 'remove' | 'mutate' | 'grab' | 'drop'

/**
 * Properties that are required for action types:
 *  add|remove: only target
 *  mutate: target, property, oldValue, and newValue
 *  grab: target, property = "point", oldValue = Pointed object of grab coords
 *  drop: target, property = "point", newValue = Pointed object of drop coords
 */

export default class Change {
  readonly action: ActionType
  readonly timestamp: number
  readonly target: Location | Edge
  readonly property?: string
  readonly oldValue?: any
  readonly newValue?: any

  constructor(
    action: ActionType,
    timestamp: number,
    target: Location | Edge,
    property?: string,
    oldValue?: any,
    newValue?: any
  ) {
    this.action = action
    this.timestamp = timestamp
    this.target = target
    this.property = property
    this.oldValue = oldValue
    this.newValue = newValue
  }
}
