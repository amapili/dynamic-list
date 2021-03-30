import { useRef } from 'react'
import '@testing-library/jest-dom/extend-expect'
import DynamicList from '../src/DynamicList'
import { List } from 'immutable'
import { render, fireEvent } from '@testing-library/react'

declare var window: any

let renderRow = jest.fn((v: number) => {
    return <div>{'row ' + v}</div>
})

function checkVisibility(start: number, end: number) {
    return !((window.scrollTop + window.innerHeight > start * 100) || (end * 100 < window.scrollTop))
}

function ListTest({ data, incr }: { data: List<number>, incr?: number }) {
    const ref = useRef(null)
    return (
        <div ref={ref}>
            <DynamicList
                checkVisibility={checkVisibility}
                rows={data}
                container={ref}
                empty={<span>empty</span>}
                loading={<span>loading</span>}
                pageSize={incr}
            >{renderRow}</DynamicList>
        </div>
    )
}

test('check scroll rerendering behavior', async () => {
    let data = List([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])

    const { findByText, rerender } = render(<ListTest data={data} />)

    expect(await findByText('row 8')).toBeDefined()
    expect(renderRow.mock.calls.length).toBe(16)
    renderRow.mockClear()

    data = data.unshift(0, -1, -2)
    data = data.push(17, 18, 19, 20)
    rerender(<ListTest data={data} />)

    expect(await findByText('row 0')).toBeDefined()

    expect(renderRow.mock.calls.length).toBeLessThan(32)
    renderRow.mockClear()

    window.scrollY = 500
    fireEvent(window, new MouseEvent('scroll'))

    expect(await findByText('row 0')).toBeDefined()

    window.scrollY = 2000
    fireEvent(window, new MouseEvent('scroll'))

    expect(await findByText('row 20')).toBeDefined()
})

test('check load more', async () => {
    let data = List([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])

    const { findByText, rerender } = render(<ListTest data={data} incr={9} />)

    expect(await findByText('row 8')).toBeDefined()
    expect(renderRow.mock.calls.length).toBe(16)
    renderRow.mockClear()

    window.scrollY = 500
    fireEvent(window, new MouseEvent('scroll'))
    expect(await findByText('row 9')).toBeDefined()

    window.scrollY = 1600
    fireEvent(window, new MouseEvent('scroll'))
    expect(await findByText('row 16')).toBeDefined()

    data = data.push(17, 18, 19, 20)
    rerender(<ListTest data={data} incr={9} />)
    expect(await findByText('row 16')).toBeDefined()

    window.scrollY = 2100
    fireEvent(window, new MouseEvent('scroll'))
    expect(await findByText('row 20')).toBeDefined()

    expect(renderRow.mock.calls.length).toBeLessThan(100)
    renderRow.mockClear()

    data = data.unshift(0, -1, -2)
    rerender(<ListTest data={data} incr={9} />)

    expect(renderRow.mock.calls.length).toBeLessThan(24)
    renderRow.mockClear()

    window.scrollY = 0
    fireEvent(window, new MouseEvent('scroll'))
    expect(await findByText('row 0')).toBeDefined()
})

test('test empty message', async () => {
    let data = List([])
    const { findByText } = render(<ListTest data={data} />)

    expect(await findByText('empty')).toBeDefined()
})


beforeEach(() => {
    window.scrollY = 0
    renderRow.mockClear()
})

const raf = window.requestAnimationFrame

beforeAll(() => {
    window.requestAnimationFrame = (cb: () => void) => setTimeout(cb, 1)
    window.innerHeight = 100
    jest.useRealTimers()
})

afterAll(() => {
    window.requestAnimationFrame = raf
})