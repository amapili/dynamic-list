import { RefObject, useCallback, useMemo, useRef, useState } from "react"

export default function useObserver({ checkVisibility, container, padding, branch }: { checkVisibility?: ((start: number, end: number) => boolean), container: RefObject<HTMLElement>, padding: number, branch: number }) {
    const [visibility, setVisibility] = useState({ min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY }),
        visibilityRef = useRef(visibility),
        observer = useMemo(() => {
            if (checkVisibility || typeof IntersectionObserver === 'undefined')
                return undefined as never
            const visibilitySet = new WeakMap<HTMLElement, boolean>(),
                vis: { [k: number]: boolean | undefined } = {},
                observer = new IntersectionObserver((set) => {
                    set.forEach(entry => {
                        const el = entry.target as HTMLElement,
                            parent = container.current
                        if (!el.isConnected || !parent)
                            return observer.unobserve(el)
                        visibilitySet.set(el, entry.isIntersecting)
                    })
                    const parent = container.current
                    if (!parent) return
                    let min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY
                    const add: Array<HTMLElement> = []
                    Array.prototype.forEach.call(parent.children, (child: HTMLElement, i: number) => {
                        if (visibilitySet.has(child)) {
                            vis[i] = visibilitySet.get(child)
                        } else {
                            add.push(child)
                        }
                    })
                    Array.prototype.forEach.call(parent.children, (child: HTMLElement, i: number) => {
                        if (vis[i]) {
                            min = Math.min(i, min)
                            max = Math.max(i, max)
                        }
                    })
                    setTimeout(() => add.forEach(a => observer.observe(a)), 1)
                    setVisibility(v => v.max === max && v.min === min ? v : { min, max })
                }, { root: null, threshold: [0, 0.1], rootMargin: `${padding}px 0px ${padding}px 0px` })
            return observer
        }, [checkVisibility, padding]),
        isVisible = useCallback((start: number, end: number) => {
            if (checkVisibility)
                return checkVisibility(start, end)

            const { min, max } = visibilityRef.current,
                parent = container.current
            
            if (parent && end - start === branch) {
                for (let i = start; i < end; i++) {
                    const child = parent.children[i]
                    child && observer.observe(child)
                }
            }
            return min === Number.POSITIVE_INFINITY ? true : !(start > max + 1 || end < min - 1)
        }, [padding, branch, checkVisibility])

    visibilityRef.current = visibility

    return [visibility, isVisible] as const
}
