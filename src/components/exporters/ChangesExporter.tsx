import * as React from 'react'

import ChangeStore from '../../state/changes/ChangeStore'
import {BaseJsonExporter} from './BaseJsonExporter'
import {ChangesExporterProps as Props} from '../../interfaces'

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
