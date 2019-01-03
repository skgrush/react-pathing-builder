import * as React from 'react'

export interface BaseProps {
  lastChange: object | null
  exportData: () => object
  space?: number
}

export interface BaseState {
  dataString: string
}

export abstract class BaseJsonExporter<
  Props extends BaseProps = BaseProps,
  State extends BaseState = BaseState
> extends React.Component<Props, State> {
  /** overloadable State default */
  state = {dataString: ''} as State

  abstract get className(): string

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
    return JSON.stringify(value, null, this.props.space || 2)
  }

  render() {
    return (
      <div className={this.className}>
        {this.header}
        <textarea readOnly value={this.state.dataString} {...this.passProps} />
        {this.footer}
      </div>
    )
  }
}
