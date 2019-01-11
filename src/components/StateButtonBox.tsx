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
          className="statebtnbox-undo"
          disabled={this.props.undoCount === 0}
          onClick={this.props.onClickUndo}
        >
          Undo
        </button>
        <button
          className="statebtnbox-redo"
          disabled={this.props.redoCount === 0}
          onClick={this.props.onClickRedo}
          value="Redo"
        >
          Redo
        </button>
        <button
          className="statebtnbox-clear"
          disabled={this.props.isEmpty && this.props.redoCount === 0}
          onClick={this.props.onClickClear}
          value="Clear"
        >
          Clear
        </button>
      </div>
    )
  }
}
