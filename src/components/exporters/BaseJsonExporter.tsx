import * as React from 'react'
import {BaseExporterProps} from '../../interfaces'
import {toJSON} from '../../utils'

export interface BaseState {
  dataString: string
}

const DOWNLOAD_OPTS: BlobPropertyBag = Object.freeze({
  type: 'application/json',
})

export abstract class BaseJsonExporter<
  Props extends BaseExporterProps = BaseExporterProps,
  State extends BaseState = BaseState
> extends React.Component<Props, State> {
  /** overloadable State default */
  state = {dataString: ''} as State
  /** react ref */
  buttonRef: React.RefObject<HTMLAnchorElement> = React.createRef()

  abstract get className(): string

  abstract get fileName(): string

  abstract get header(): React.ReactNode

  get footer(): React.ReactNode {
    return null
  }

  /**
   * Combination of non-BaseProps properties and this.defaultTextareaProps
   */
  get passProps() {
    const {lastChange, exportData, space, children, ...otherProps} = this.props

    return Object.assign(this.defaultTextareaProps, otherProps)
  }

  get defaultTextareaProps() {
    return {
      rows: 6,
    }
  }

  componentDidMount() {
    this.setState({dataString: this.getData()})
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.lastChange !== prevProps.lastChange)
      this.setState({
        dataString: this.getData(),
      })
  }

  private getData() {
    return this.stringify(this.props.exportData())
  }

  private stringify(value: any) {
    return toJSON(value, this.props.space || 2)
  }

  onClickDownload = (e: React.MouseEvent<HTMLInputElement>) => {
    const data = [this.state.dataString]
    const blob = new Blob(data, DOWNLOAD_OPTS)
    console.debug('data:', data, 'blob:', blob)

    const ref = this.buttonRef.current
    if (ref) {
      /** set up the anchor as a download link */
      ref.download = this.fileName
      ref.href = URL.createObjectURL(blob)
      ref.click()
      /** all done, now revoke it */
      URL.revokeObjectURL(ref.href)
      ref.download = ref.href = ''
    }
  }

  render() {
    return (
      <div className={this.className}>
        {this.header}
        <textarea readOnly value={this.state.dataString} {...this.passProps} />
        <input
          type="button"
          onClick={this.onClickDownload}
          value="Download"
          title={this.fileName}
        />
        <a ref={this.buttonRef} hidden />
        {this.footer}
      </div>
    )
  }
}
