import * as React from 'react'
import ChangeStore from '../state/changes/ChangeStore'
import CanvasStore from '../state/CanvasStore'

interface Props {
  lastChange: ChangeStore['lastChange']
  importData: CanvasStore['loadData']
  space?: number
}

interface State {
  message: string
}

export default class DataImporter extends React.Component<Props, State> {
  textAreaRef: React.RefObject<HTMLTextAreaElement>
  constructor(props: Props) {
    super(props)

    this.textAreaRef = React.createRef()
    this.state = {
      message: '',
    }
  }

  get readOnly() {
    return this.props.lastChange !== null
  }

  onClickFormat = () => {
    if (!this.textAreaRef.current) return

    try {
      this.textAreaRef.current.value = JSON.stringify(
        JSON.parse(this.textAreaRef.current.value),
        null,
        this.props.space || 2
      )
      this.setState({message: 'Formatted'})
    } catch (e) {
      this.errorHandler(e)
      return
    }
  }

  onClickImport = () => {
    if (!this.textAreaRef.current) return

    let value = []
    try {
      value = JSON.parse(this.textAreaRef.current.value)
    } catch (e) {
      this.errorHandler(e)
      return
    }
    const [success, total] = this.props.importData(value)

    let message = ''
    if (total <= 0) {
      message = 'Nothing Loaded.'
    }
    // total > 0
    else if (success === total) {
      message = 'Success!'
    }
    // success < total
    else {
      message = `Only ${success} of ${total} objects loaded. See console for details.`
    }
    this.setState({message})
  }

  errorHandler = (e?: Error) => {
    if (e instanceof Error) {
      this.setState({message: e.message})
    } else {
      console.error('errorHandler received non-error:', e)
      this.setState({message: String(e)})
    }
  }

  render() {
    const {readOnly} = this
    return (
      <div className="data-importer">
        <details>
          <summary>Data Importer</summary>
        </details>
        <textarea
          readOnly={readOnly}
          ref={this.textAreaRef}
          rows={6}
          defaultValue={''}
        />
        <input
          type="button"
          value="format"
          onClick={this.onClickFormat}
          disabled={readOnly}
        />
        <input
          type="button"
          value="import"
          onClick={this.onClickImport}
          disabled={readOnly}
        />
        <div className="status-message">{this.state.message}</div>
      </div>
    )
  }
}
