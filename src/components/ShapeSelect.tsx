import * as React from 'react'

import {Shape, ShapeMap, ShapeSymbolMap} from '../drawables'

interface PropsControlled {
  value: string // selected Shape name
  defaultValue?: undefined
  onChange: (value: string) => void
}

interface PropsUncontrolled {
  value?: undefined
  defaultValue: string // default selected Shape name
  onChange?: (value: string) => void
}

type NaughtyProps = PropsControlled & PropsUncontrolled

type Props = PropsControlled | PropsUncontrolled

interface State {
  value: string
}

/** helper functions */
function propsToValue(props: Props) {
  return props.value || props.defaultValue || ''
}

export class ShapeSelect extends React.Component<Props, State> {
  selectRef: React.RefObject<HTMLSelectElement>

  get value() {
    return this.state.value
    /*
    if (this.props.value) return this.props.value
    if (this.selectRef.current)
      return this.selectRef.current.value || this.props.defaultValue
    return null
    */
  }

  set value(value: string) {
    this.setState({value})
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      value: propsToValue(props),
    }

    this.selectRef = React.createRef()
  }

  componentDidUpdate(prevProps: NaughtyProps) {
    const {value, defaultValue} = this.props as NaughtyProps
    if (
      (value && value !== this.state.value) ||
      (!value && defaultValue !== prevProps.defaultValue)
    ) {
      this.setState({value})
    }
  }

  generateOptions(selectedName?: string) {
    const list: React.ReactNode[] = []

    for (const name in ShapeMap) {
      if (ShapeMap.hasOwnProperty(name)) {
        list.push(
          <option key={name} value={name}>
            {name} {ShapeSymbolMap[name]}
          </option>
        )
      }
    }
    return list
  }

  onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    //
    const value =
      (this.selectRef.current && this.selectRef.current.value) ||
      e.currentTarget.value

    console.debug('ShapeSelect.oC:', value, e)
    this.setState({value: value}, () => {
      if (this.props.onChange) this.props.onChange(value)
      console.debug('sS oC cb bb')
    })
  }

  render() {
    return (
      <select
        className="shape-select"
        ref={this.selectRef}
        onChange={this.onChange}
        value={this.state.value}
      >
        {this.generateOptions()}
      </select>
    )
  }
}
