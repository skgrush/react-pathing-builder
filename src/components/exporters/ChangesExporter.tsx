import * as React from 'react'

import ChangeStore from '../../state/changes/ChangeStore'
import {BaseJsonExporter, BaseProps} from './BaseJsonExporter'

interface Props extends BaseProps {
  exportData: ChangeStore['exportChanges']
}

export class ChangesExporter extends BaseJsonExporter<Props> {
  get className() {
    return 'change-exporter'
  }

  get header() {
    return (
      <details>
        <summary>Change Export</summary>
        JSON export of additions, removals, and modifications to the Imported
        Data.
      </details>
    )
  }
}
