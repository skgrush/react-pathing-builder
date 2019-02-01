import * as React from 'react'
import {StyleSetterProps as Props, StyleUpdaterArg} from '../interfaces'
import {
  DEFAULT_SELECTION_STROKE,
  DEFAULT_LABEL_FILL,
  DEFAULT_LOC_FILL,
  DEFAULT_FONT,
} from '../utils/defaults'
import {SUPPORTS_COLOR_PICKER} from '../utils'

const COLOR_RE = /^#[A-Fa-f0-9]{6}$/
const HEX_S_RE = /^[a-f0-9]{3}$/i
const HEX_L_RE = /^[a-f0-9]{6}$/i

function format_color(txt: string) {
  if (COLOR_RE.test(txt)) return txt

  txt = txt.trim().toLowerCase()
  if (txt.startsWith('#')) txt = txt.substring(1)
  if (HEX_S_RE.test(txt)) {
    const [a, b, c] = txt
    txt = a + a + b + b + c + c
  }
  if (HEX_L_RE.test(txt)) {
    return `#${txt}`
  }
  return null
}

type StyleName = 'selectionStroke' | 'labelFill' | 'locFill'

const SUPPORT_CLASS = SUPPORTS_COLOR_PICKER ? 'yes-picker' : 'no-picker'

interface State {
  selectionStroke: string
  labelFill: string
  locFill: string
}

export class StyleSetter extends React.Component<Props, State> {
  state = this.defaultState()

  defaultState() {
    return {
      selectionStroke: DEFAULT_SELECTION_STROKE,
      labelFill: DEFAULT_LABEL_FILL,
      locFill: DEFAULT_LOC_FILL,
    }
  }

  onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.persist()
    console.debug('StyleSetter:', e)
    const update: StyleUpdaterArg = {
      selectionStroke: this.state.selectionStroke,
      labelStyleGetter: loc => ({
        fill: this.state.labelFill,
        font: DEFAULT_FONT,
      }),
      locStyleGetter: loc => ({
        fill: this.state.locFill,
      }),
    }
    this.props.styleUpdater(update)
  }

  reset = () => this.setState(this.defaultState())

  onColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.currentTarget.name as StyleName
    const {value} = e.currentTarget

    if (COLOR_RE.test(value) && name in this.state) {
      const o = {} as State
      o[name] = value
      this.setState(o)
      // if (e.currentTarget.type === 'text') {
      //   e.currentTarget.style.color = value
      // }
    }
  }

  render() {
    const sharedArgs = {
      maxLength: 7,
      size: 7,
      pattern: COLOR_RE.source,
      onChange: this.onColorChange,
    }

    return (
      <form
        className={`style-setter ${SUPPORT_CLASS}`}
        onSubmit={this.onSubmit}
        onReset={this.reset}
      >
        <details>
          <summary>Style Setter</summary>
          If no color picker is present, Color elements must match the{' '}
          <code>#FFFFFF</code> format, where <code>F</code> is a hexadecimal
          value.
        </details>
        <label>
          <span style={{backgroundColor: this.state.selectionStroke}}>
            <input
              type="color"
              name="selectionStroke"
              defaultValue={DEFAULT_SELECTION_STROKE}
              {...sharedArgs}
            />
          </span>
          selectionStroke
        </label>
        <label>
          <span style={{backgroundColor: this.state.labelFill}}>
            <input
              type="color"
              name="labelFill"
              defaultValue={DEFAULT_LABEL_FILL}
              {...sharedArgs}
            />
          </span>
          labelFill
        </label>
        <label>
          <span style={{backgroundColor: this.state.locFill}}>
            <input
              type="color"
              name="locFill"
              defaultValue={DEFAULT_LOC_FILL}
              {...sharedArgs}
            />
          </span>
          locFill
        </label>
        <input type="submit" value="Set" />
        <input type="reset" />
      </form>
    )
  }
}
