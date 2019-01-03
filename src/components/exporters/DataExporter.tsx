import * as React from 'react'
import ChangeStore from '../../state/changes/ChangeStore'
import CanvasStore from '../../state/CanvasStore'
import {BaseJsonExporter, BaseProps} from './BaseJsonExporter'

interface Props extends BaseProps {
  exportData: CanvasStore['exportData']
}

export class DataExporter extends BaseJsonExporter<Props> {
  get className() {
    return 'data-exporter'
  }

  get header() {
    return (
      <details>
        <summary>Data Export</summary>
        JSON export of the current state of the CanvasStore.
      </details>
    )
  }
}
