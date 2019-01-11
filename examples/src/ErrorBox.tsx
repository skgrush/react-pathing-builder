import * as React from 'react'

interface Props {}

interface State {
  keys: Set<number>
  list: ReadonlyArray<React.ReactNode>
}

export class ErrorBox extends React.Component<Props, State> {
  state: State = {
    list: [],
    keys: new Set(),
  }

  componentDidMount() {
    //document.addEventListener('error', this.onError)
    if (!window.onerror) window.onerror = this.onError
    else this.insertNew(Date.now(), '`window.onerror` already set')

    console.info('ErrorBox mounted', this)
  }

  componentWillUnmount() {
    //document.removeEventListener('error', this.onError)
  }

  onError = (
    msg: Event | string,
    src?: string,
    lineNo?: number,
    colNo?: number,
    error?: Error | string
  ): void => {
    let time = Date.now()
    while (this.state.keys.has(time)) time += 0.1
    this.state.keys.add(time)

    if (this.state)
      if (typeof msg !== 'string') {
        //msg = String(msg)
        try {
          msg = JSON.stringify(msg, undefined, 2)
        } catch (err) {
          this.onError(
            'Error while stringifying previous error message',
            'ErrorBox.tsx',
            undefined,
            undefined,
            err
          )
        }
      }

    if (
      error instanceof Error &&
      (lineNo === undefined || colNo === undefined)
    ) {
      if (lineNo === undefined) lineNo = (error as any).line
      if (colNo === undefined) colNo = (error as any).column
    }

    if (typeof error !== 'string') {
      if (error instanceof Error) error = String(error)
      else
        try {
          error = JSON.stringify(error, undefined, 2)
        } catch (err) {
          this.onError(
            'Error while stringifying previous error object',
            'ErrorBox.tsx',
            undefined,
            undefined,
            err
          )
          error = String(error)
        }
    }

    this.insertNew(
      time,
      <table key="1">
        <tbody>
          <tr>
            <td>time</td>
            <td>
              <time dateTime={new Date(time).toISOString()}>{time / 1000}</time>
            </td>
          </tr>

          <tr hidden={!msg}>
            <td>msg</td>
            <td>
              <pre>{msg}</pre>
            </td>
          </tr>

          <tr hidden={!src}>
            <td>src</td>
            <td>
              <var>{String(src)}</var>
            </td>
          </tr>

          <tr hidden={lineNo === undefined}>
            <td>lineNo</td>
            <td>{String(lineNo)}</td>
          </tr>

          <tr hidden={colNo === undefined}>
            <td>colNo</td>
            <td>{String(colNo)}</td>
          </tr>

          <tr>
            <td>error</td>
            <td>
              <pre>{error}</pre>
            </td>
          </tr>
        </tbody>
      </table>
    )
  }

  insertNew(time: number, contents: React.ReactNode, args: {} = {}) {
    const newThing = (
      <li value={time} className="error-li" key={time} {...args}>
        {contents}
      </li>
    )

    this.setState({
      list: [...this.state.list, newThing],
    })
  }

  render() {
    return (
      <ol className="error-box" reversed>
        {this.state.list}
        <style>
          {`
            .error-li td {
              border: 1px solid black;
            }
            .error-li dl dd {
              text-align: right;
            }
            .error-li pre {
              margin: 0;
            }
        `}
        </style>
      </ol>
    )
  }
}
