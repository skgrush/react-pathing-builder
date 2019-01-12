import * as React from 'react'

import Edge from '../../state/Edge'

interface Props {
  selected: Readonly<Edge>
}

const EdgeProperties: React.SFC<Props> = props => {
  const {key, start, end, weight} = props.selected
  return (
    <dl>
      <dt>key</dt>
      <dd>
        <var>{key}</var>
      </dd>

      <dt>start</dt>
      <dd>
        <var>{start.describe()}</var>
      </dd>

      <dt>end</dt>
      <dd>
        <var>{end.describe()}</var>
      </dd>

      <dt>weight</dt>
      <dd>
        <var>{weight}</var>
      </dd>
    </dl>
  )
}

export {EdgeProperties}
