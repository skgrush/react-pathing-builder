import * as React from 'react'
import {ClassNames} from '../utils'

interface Props {
  canvasRef: Exclude<React.RefObject<HTMLCanvasElement>, null | undefined>
  baseClassName: string
  width?: number
  height?: number
}

interface State {
  className: string
}

export class PBCanvas extends React.Component<Props, State> {
  readonly defaultClassSuffix = '-canvas'
  state = {className: ''}

  componentDidMount() {
    this.setState(ClassNames.updateSubcomponent(this))
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.baseClassName !== this.props.baseClassName) {
      this.setState(ClassNames.updateSubcomponent(this))
    }
  }

  render() {
    return (
      <canvas
        ref={this.props.canvasRef}
        className={this.state.className}
        width={this.props.width}
        height={this.props.height}
        tabIndex={0}
      />
    )
  }
}
