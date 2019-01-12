import * as React from 'react'

import Location from '../../state/Location'
import Edge from '../../state/Edge'
import {LocationForm} from './LocationForm'

import {PropertiesPanelProps} from '../../interfaces'
import {EdgeProperties} from './EdgeProperties'
import {EdgeForm} from './EdgeForm'

interface PropertiesPanelState {
  which: 'Location' | 'Edge' | ''
}

function whichClassName(w?: Readonly<Location | Edge> | null) {
  if (!w) return ''
  if (w instanceof Location) return 'Location'
  if (w instanceof Edge) return 'Edge'
  console.debug('Unexpected input to which:', w)
  return ''
}

export class PropertiesPanel extends React.Component<
  PropertiesPanelProps,
  PropertiesPanelState
> {
  constructor(props: PropertiesPanelProps) {
    super(props)

    this.state = {
      which: whichClassName(props.selected),
    }
  }

  componentDidUpdate(prevProps: PropertiesPanelProps) {
    if (this.props.selected !== prevProps.selected)
      this.setState({
        which: whichClassName(this.props.selected),
      })
  }

  private inner = () => {
    if (this.props.selected instanceof Location) {
      return (
        <LocationForm
          selected={this.props.selected}
          modifyLocation={this.props.modifyLocation}
          deleteLocation={this.props.deleteLocation}
        />
      )
    }
    if (this.props.selected instanceof Edge) {
      return (
        <EdgeForm
          selected={this.props.selected}
          deleteEdge={this.props.deleteEdge}
        />
      )
    }
    return null
  }

  render() {
    return (
      <div className="pathing-builder-propertiespanel">
        <section>
          <header>
            <h5>{String(this.props.selected || 'no selection')}</h5>
          </header>
          {this.inner()}
        </section>
      </div>
    )
  }
}
