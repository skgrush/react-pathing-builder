import * as React from 'react'
import {DataImporterProps as Props} from '../interfaces'

interface State {
  message: string
}

export class DataImporter extends React.Component<Props, State> {
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

  onClickOpen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {currentTarget} = e

    console.debug(currentTarget)
    if (currentTarget.files && currentTarget.files[0]) {
      const file = currentTarget.files[0]
      console.debug('opened', file.name, file.type)

      const fr = new FileReader()
      fr.onloadend = (ev: ProgressEvent) => {
        console.debug('loaded', fr.result, ev)
        if (this.textAreaRef.current && typeof fr.result === 'string') {
          this.textAreaRef.current.value = fr.result
        }
      }
      fr.readAsText(file)
    }
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
        <button
          disabled={readOnly}
          className="wrapper-button"
          onClick={e => (e.currentTarget.children[0] as any).click()}
        >
          Open File
          <input
            type="file"
            onChange={this.onClickOpen}
            disabled={readOnly}
            accept=".json,application/json"
            hidden
          />
        </button>
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
