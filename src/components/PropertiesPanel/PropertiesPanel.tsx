import * as React from 'react'

import Location from '../../state/Location'
import Edge from '../../state/Edge'
import LocationForm from './LocationForm'

import {PropertiesPanelProps} from '../../interfaces'

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

export default class PropertiesPanel extends React.Component<
  PropertiesPanelProps,
  PropertiesPanelState
> {
  constructor(props: PropertiesPanelProps) {
    super(props)

    this.state = {
      which: whichClassName(props.selected),
    }
  }

  componentDidUpdate(prevProps: PropertiesPanelProps) {}

  get name() {
    if (!this.props.selected) return ''
    switch (this.state.which) {
      case 'Location':
        return (this.props.selected as Readonly<Location>).name
      case 'Edge':
        return (this.props.selected as Readonly<Edge>).key
      default:
        return ''
    }
  }

  render() {
    return (
      <div className="pathing-builder-propertiespanel">
        <section>
          <header>
            <h6>{this.name}</h6>
            <p>{this.state.which}</p>
          </header>
          {this.props.selected instanceof Location ? (
            <LocationForm
              selected={this.props.selected}
              modifyLocation={this.props.modifyLocation}
              deleteLocation={this.props.deleteLocation}
            />
          ) : null}
          {this.props.selected instanceof Edge
            ? 'Nope, not implemented, sorry'
            : null}
        </section>
      </div>
    )
  }
}
