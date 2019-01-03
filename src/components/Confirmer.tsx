import * as React from 'react'

interface Props {
  value: string
  type: 'submit' | 'reset' | 'button'
  onConfirm?: () => void
  className?: string
}

interface State {
  didClick: boolean
}

export class Confirmer extends React.Component<Props, State> {
  state: State = {didClick: false}

  onConfirm = (e: React.MouseEvent<HTMLInputElement>) => {
    this.setState({didClick: false})
    if (this.props.onConfirm) this.props.onConfirm()
  }

  render() {
    const className = `confirmer ${this.props.className || ''}`

    return (
      <div className={className}>
        <input
          className="confirmer-btn-0"
          type="button"
          hidden={this.state.didClick}
          onClick={() => this.setState({didClick: true})}
          value={this.props.value}
        />
        <div hidden={!this.state.didClick} className="confirmer-confirmbox">
          <p>Are you sure?</p>
          <input
            className="confirmer-btn-affirm"
            type={this.props.type}
            onClick={this.onConfirm}
            value={this.props.value}
          />
          <input
            className="confirmer-btn-reject"
            type="button"
            onClick={() => this.setState({didClick: false})}
            value="No"
          />
        </div>
      </div>
    )
  }
}
