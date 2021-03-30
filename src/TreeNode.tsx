import { Fragment, ReactNode, memo, useRef } from 'react'
import { Range, Seq } from 'immutable'
import Leaf from './Leaf'

interface TreeNodeProps {
    size: number
    branch: number
    length: number
    start?: number
    end?: number
    rows: Seq.Indexed<unknown>
    render: (id: unknown, index: number) => JSX.Element | null
    visible: boolean
    isVisible: (start: number, end: number) => boolean
    loading?: ReactNode
    dummy?: ReactNode
}

const TreeNode = memo(function Node({ start: st, end: nd, size, length: totalLength, branch, isVisible, visible, dummy, ...others }: TreeNodeProps): JSX.Element {
    const start = st || 0,
        end = nd || totalLength,
        length = end - start
    if (!length) return <Fragment />
    if (size === 1) {
        if (!visible)
            return <>{Range(0, length).map(i => <Fragment key={i}>{dummy}</Fragment>)}</>
        return (
            <Leaf
                start={start}
                end={end}
                {...others}
            />
        )
    }

    const children = Math.ceil(length / size),
        out = new Array(children),
        childSize = size / branch
    for (let i = 0, childStart = start; i < children; i++, childStart += size) {
        const childEnd = Math.min(childStart + size, end)
        out[i] = <TreeNode
            key={i}
            size={childSize}
            branch={branch}
            start={childStart}
            end={childEnd}
            length={totalLength}
            visible={isVisible(childStart, childEnd)}
            isVisible={isVisible}
            dummy={dummy}
            {...others}
        />
    }

    return <>{out}</>
}, (prev, props) => {
    if (props.start !== prev.start || props.end !== prev.end)
        return false
    return props.visible ? false : prev.visible === false
})

export default TreeNode