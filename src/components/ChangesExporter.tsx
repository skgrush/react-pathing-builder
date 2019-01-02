import * as React from 'react'
import {ChangeInstance} from '../interfaces'
import ChangeStore from '../state/changes/ChangeStore'

interface Props {
  lastChange: ChangeStore['lastChange']
  exportData: ChangeStore['exportChanges']
  space?: number
}

interface State {
  dataString: string
}

export default class ChangesExporter extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      dataString: this.getData(),
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.lastChange !== prevProps.lastChange)
      this.setState({
        dataString: this.getData(),
      })
  }

  private getData() {
    return JSON.stringify(this.props.exportData(), null, this.props.space || 2)
  }

  render() {
    return (
      <div className="change-exporter">
        <details>
          <summary>Change Export</summary>
          JSON export of additions, removals, and modifications to the Imported
          Data.
        </details>
        <textarea readOnly value={this.state.dataString} rows={6} />
      </div>
    )
  }
}
