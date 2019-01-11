import * as React from 'react'

import {ShapeSymbolMap} from '../../drawables'
import Location from '../../state/Location'

interface Props {
  selected: Readonly<Location>
}

function toJSON(data: object) {
  try {
    return JSON.stringify(data)
  } catch {
    return data
  }
}

const LocationProperties: React.SFC<Props> = (props: Props) => {
  const {shape} = props.selected
  const sname = shape && shape.constructor.name
  return (
    <dl>
      <dt>key</dt>
      <dd>
        <var>{props.selected.key}</var>
      </dd>

      <dt>name</dt>
      <dd>
        <var>{props.selected.name}</var>
      </dd>

      <dt>(x, y)</dt>
      <dd>
        (<var>{props.selected.x}</var>, <var>{props.selected.y}</var>)
      </dd>

      <dt>shape</dt>
      <dd>{sname}</dd>
      <dd>{sname && ShapeSymbolMap[sname]}</dd>

      <dt>data</dt>
      <dd className="json">{toJSON(props.selected.data)}</dd>
    </dl>
  )
}

export {LocationProperties}
