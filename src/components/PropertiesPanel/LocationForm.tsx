import * as React from 'react'

import CanvasStore from '../../state/CanvasStore'
import Location, {
  LocationLike,
  LocationMutableProps,
} from '../../state/Location'
import {LocationProperties} from './LocationProperties'
import {ShapeSelect} from '../ShapeSelect'
import {Confirmer} from '../Confirmer'

interface Props {
  selected: Readonly<Location>
  modifyLocation: (
    loc: Readonly<Location>,
    diff: LocationMutableProps
  ) => boolean
  deleteLocation: (loc: Readonly<Location>) => boolean
}

interface State {
  initialName: string
  initialX: number
  initialY: number
  initialShape: string
  clickedDelete: boolean
}

export class LocationForm extends React.Component<Props, State> {
  inputName: React.RefObject<HTMLInputElement>
  inputX: React.RefObject<HTMLInputElement>
  inputY: React.RefObject<HTMLInputElement>
  inputSelect: React.RefObject<ShapeSelect>

  get nameValue() {
    return this.inputName.current
      ? this.inputName.current.value
      : this.state.initialName
  }

  get xValue() {
    return Number((this.inputX.current || {value: this.state.initialX}).value)
  }

  get yValue() {
    return Number((this.inputY.current || {value: this.state.initialY}).value)
  }

  get shapeValue() {
    return (this.inputSelect.current || {value: this.state.initialShape}).value
  }

  constructor(props: Props) {
    super(props)

    this.inputName = React.createRef()
    this.inputX = React.createRef()
    this.inputY = React.createRef()
    this.inputSelect = React.createRef()

    const {name, x, y, shape} = this.props.selected
    this.state = {
      initialName: name,
      initialX: x,
      initialY: y,
      initialShape: shape && shape.constructor.name,
      clickedDelete: false,
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (
      !this.inputName.current ||
      !this.inputX.current ||
      !this.inputY.current ||
      !this.inputSelect.current
    )
      return

    const {name, x, y, shape} = this.props.selected
    let doUpdate = false

    if (name !== this.state.initialName) {
      Object.assign(this.inputName.current, {
        defaultValue: name,
        value: name,
      })
      doUpdate = true
    }
    if (x !== this.state.initialX) {
      Object.assign(this.inputX.current, {
        defaultValue: x,
        value: x,
      })
      doUpdate = true
    }
    if (y !== this.state.initialY) {
      Object.assign(this.inputY.current, {
        defaultValue: y,
        value: y,
      })
      doUpdate = true
    }
    if (shape.constructor.name !== this.state.initialShape) {
      this.inputSelect.current.value = shape.constructor.name
      doUpdate = true
    }
    if (doUpdate) {
      this.setState({
        initialName: name,
        initialX: x,
        initialY: y,
        initialShape: shape.constructor.name,
        clickedDelete: false,
      })
    }
  }

  onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.persist()

    if (this.state.clickedDelete) {
      console.debug('Submitted via delete, deleting', this.props.selected)
      this.props.deleteLocation(this.props.selected)
      return
    }

    console.log('Submitted via update button', [e])

    const {nameValue, xValue, yValue, shapeValue} = this
    const diff: LocationMutableProps = {}
    if (this.state.initialName !== nameValue) diff.name = nameValue
    if (this.state.initialX !== xValue) diff.x = xValue
    if (this.state.initialY !== yValue) diff.y = yValue
    if (this.state.initialShape !== shapeValue) diff.shape = shapeValue

    this.setState({clickedDelete: false})
    this.props.modifyLocation(this.props.selected, diff)
  }

  render() {
    const selected = this.props.selected
    const {canvasDimensions} = this.props.selected.store
    return (
      <form onSubmit={this.onSubmit} name="prop-panel-loc-form">
        <LocationProperties selected={selected} />
        <table>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>name</td>
              <td>
                <input
                  ref={this.inputName}
                  name="name"
                  type="text"
                  defaultValue={selected.name}
                />
              </td>
            </tr>
            <tr>
              <td>x</td>
              <td>
                <input
                  ref={this.inputX}
                  name="x"
                  type="number"
                  min={0}
                  max={canvasDimensions.x}
                  defaultValue={selected.x.toString()}
                />
              </td>
            </tr>
            <tr>
              <td>y</td>
              <td>
                <input
                  ref={this.inputY}
                  name="y"
                  type="number"
                  min={0}
                  max={canvasDimensions.y}
                  defaultValue={selected.y.toString()}
                />
              </td>
            </tr>
            <tr>
              <td>shape</td>
              <td>
                <ShapeSelect
                  ref={this.inputSelect}
                  defaultValue={selected.shape.constructor.name}
                />
              </td>
            </tr>
            <tr>
              <td />
              <td>
                <input type="submit" value="Update" />
              </td>
            </tr>
          </tbody>
        </table>
        <div>
          <p>Delete Location?</p>
          <Confirmer
            type="submit"
            value="Delete"
            onConfirm={() => this.setState({clickedDelete: true})}
          />
        </div>
      </form>
    )
  }
}
