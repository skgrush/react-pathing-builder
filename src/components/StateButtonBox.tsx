import * as React from 'react'

import {StateButtonBoxProps} from '../interfaces'

export class StateButtonBox extends React.Component<StateButtonBoxProps> {
  constructor(props: StateButtonBoxProps) {
    super(props)
  }
  render() {
    return (
      <div className="pathing-builder-statebtnbox">
        <button
          className="pathing-builder-undo"
          disabled={this.props.undoCount === 0}
          onClick={this.props.onClickUndo}
        >
          Undo
        </button>
        <button
          className="pathing-builder-redo"
          disabled={this.props.redoCount === 0}
          onClick={this.props.onClickRedo}
          value="Redo"
        >
          Redo
        </button>
      </div>
    )
  }
}
