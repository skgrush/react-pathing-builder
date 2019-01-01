import * as React from 'react'
import {ChangeInstance} from '../interfaces'
import ChangeStore from '../state/changes/ChangeStore'

interface Props {
  changelog: ChangeStore
}

interface State {
  lastChange: ChangeInstance | null
  dataString: string
}

export default class ChangesExporter extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      lastChange: this.props.changelog.lastChange,
      dataString: this.getData(),
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.changelog.lastChange !== this.state.lastChange)
      this.setState({
        lastChange: this.props.changelog.lastChange,
        dataString: this.getData(),
      })
  }

  private getData() {
    return JSON.stringify(this.props.changelog.exportData(), null, 2)
  }

  render() {
    return (
      <div className="change-exporter">
        <details>
          <summary>Change Export</summary>
          JSON export of additions, removals, and modifications to the Imported
          Data.
        </details>
        <textarea readOnly value={this.state.dataString} />
      </div>
    )
  }
}
