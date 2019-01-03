import * as React from 'react'
import {BaseJsonExporter} from './BaseJsonExporter'
import {DataExporterProps as Props} from '../../interfaces'

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
