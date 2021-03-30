import { ReactNode, useState, RefObject, useEffect, useMemo, useRef } from 'react'
import { Seq } from 'immutable'
import TreeNode from './TreeNode'
import useObserver from './useObserver'

const DEFAULT_PAD = 400,
    DEFAULT_PAGE = 20,
    DEFAULT_BRANCH = 5

export interface DynamicListProps<Row> {
    pageSize?: number
    branch?: number
    container: RefObject<any>
    rows: Iterable<Row>
    load?: { hasMore(): boolean, loadMore(): Promise<void>, onVisibilityChange?: (min: number, max: number) => void }
    children: (row: Row, index: number) => JSX.Element | null
    checkVisibility?: (start: number, end: number) => boolean
    loading?: ReactNode
    empty?: ReactNode
    dummy?: ReactNode
    padding?: number
}

export default function DynamicList<Row>({ load: loadProp, rows: rowData, checkVisibility, padding = DEFAULT_PAD, pageSize = DEFAULT_PAGE, branch = DEFAULT_BRANCH, children, container, loading, empty, dummy }: DynamicListProps<Row>) {
    const [visibility, isVisible] = useObserver({ checkVisibility, container, padding, branch }),
        rootSize = useMemo(() => Math.pow(branch, branch - 1), [branch]),
        rows = useMemo(() => Seq.Indexed(rowData), [rowData]),
        length = useRef(0),
        load = useRef(loadProp),
        [done, setDone] = useState(() => !loadProp?.hasMore()),
        loadingMore = useRef(false),
        [err, setErr] = useState<any>()

    length.current = rows.count()
    load.current = loadProp

    useEffect(() => {
        const done = !load.current?.hasMore()
        setDone(done)
        let valid = true
        if (!done && !loadingMore.current && visibility.max + 1 >= length.current) {
            loadingMore.current = true
            new Promise(r => r(load.current?.loadMore()))
                .then(() => { }, e => valid && setErr(e))
                .finally(() => loadingMore.current = false)
        }
        return () => { valid = false }
    }, [rows, visibility.max])

    useEffect(() => {
        const { min, max } = visibility
        if (isFinite(min))
            load.current?.onVisibilityChange?.call(load.current, min, max)
    }, [visibility])

    if (err) throw err

    return (
        <>
            <TreeNode
                size={rootSize}
                branch={branch}
                length={(done ? 0 : pageSize) + length.current}
                isVisible={isVisible}
                visible={true}
                rows={rows}
                render={children}
                loading={loading}
                dummy={dummy}
            />
            {done && length.current === 0 && empty}
        </>
    )
}
