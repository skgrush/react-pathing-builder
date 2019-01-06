import * as React from 'react'

interface Props {}

interface State {
  list: ReadonlyArray<React.ReactNode>
}

const keyset = new Set()

export class ErrorBox extends React.Component<Props, State> {
  state: State = {list: []}

  componentDidMount() {
    //document.addEventListener('error', this.onError)
    if (!window.onerror) window.onerror = this.onError
    else this.insertNew(new Date(), '`window.onerror` already set')

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
    const time = new Date()

    if (typeof msg !== 'string') {
      msg = String(msg)
      try {
        msg = JSON.stringify(msg, undefined, 2)
      } catch (err) {
        this.onError(
          'Error while stringifying first arg `msg`',
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
            'Error while stringifying fifth arg `error`',
            'ErrorBox.tsx',
            undefined,
            undefined,
            err
          )
          error = String(error)
        }
    }

    const isoTime = time.toISOString()
    this.insertNew(
      time,
      <table key="1">
        <tbody>
          <tr>
            <td>time</td>
            <td>
              <time dateTime={time.toISOString()}>{time.getTime() / 1000}</time>
            </td>
          </tr>

          <tr hidden={!msg}>
            <td>msg</td>
            <td>
              <pre>{msg}</pre>
            </td>
          </tr>

          <tr>
            <td>src</td>
            <td>
              <var>{String(src)}</var>
            </td>
          </tr>

          <tr>
            <td>lineNo</td>
            <td>{String(lineNo)}</td>
          </tr>

          <tr>
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

  insertNew(time: Date, contents: React.ReactNode, args: {} = {}) {
    let val = time.getTime()
    if (keyset.has(val)) val += 0.1
    console.info(val)
    keyset.add(val)
    const newThing = (
      <li value={val} className="error-li" key={val} {...args}>
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
