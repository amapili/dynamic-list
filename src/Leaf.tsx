/// <reference types="react/experimental" />
import { ReactNode, Suspense, unstable_SuspenseList, Fragment, memo } from 'react'
import { Range, Seq } from 'immutable'

const SuspenseList = typeof unstable_SuspenseList === 'undefined' ? (({ children }: { children: ReactNode }) => <>{children}</>) : unstable_SuspenseList

interface LeafProps {
    rows: Seq.Indexed<unknown>
    start: number
    end: number
    render: (id: unknown, index: number) => JSX.Element | null
    loading?: ReactNode
}

export default function Leaf({ rows, start, end, render, loading }: LeafProps) {
    const ids = rows.slice(start, end),
        pending = start + ids.count() < end
    return (
        <>
            <SuspenseList revealOrder="forwards">
                {ids.map((id, i) => (
                    <Suspense fallback={loading ?? <Fragment />} key={i}>
                        <Single render={render} id={id} i={i} />
                    </Suspense>
                ))}
            </SuspenseList>
            {pending && Range(0, end - start).map(i => <Fragment key={i}>{loading}</Fragment>)}
        </>
    )
}

const Single = memo(function ({ render, id, i }: Pick<LeafProps, 'render'> & { id: unknown, i: number }) {
    return render(id, i)
})
