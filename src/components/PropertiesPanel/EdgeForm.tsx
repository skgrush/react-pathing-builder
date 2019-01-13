import * as React from 'react'

import Edge from '../../state/Edge'
import {EdgeProperties} from './EdgeProperties'
import {Confirmer} from '../Confirmer'

interface Props {
  selected: Readonly<Edge>
  deleteEdge: (edge: Readonly<Edge>) => boolean
}

interface State {
  clickedDelete: boolean
}

export class EdgeForm extends React.Component<Props, State> {
  state = {clickedDelete: false}

  onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (this.state.clickedDelete) {
      this.props.deleteEdge(this.props.selected)
      return
    }

    console.error('onSubmit unexpected submission')
  }

  render() {
    return (
      <form onSubmit={this.onSubmit} name="prop-panel-edge-form">
        <EdgeProperties selected={this.props.selected} />
        <div>
          <p>Delete Edge?</p>
          <Confirmer
            type="submit"
            value="Delete"
            onConfirm={() => this.setState({clickedDelete: true})}
          />
        </div>
      </form>
    )
  }
}
