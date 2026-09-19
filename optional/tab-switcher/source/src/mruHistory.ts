type ActiveTimeLeaf = {
    activeTime: number;
};

export function captureActiveTimes<T extends ActiveTimeLeaf>(
    leaves: T[],
): Map<T, number> {
    return new Map(leaves.map((leaf) => [leaf, leaf.activeTime]));
}

export function restoreAndCommitActiveTime<T extends ActiveTimeLeaf>(
    snapshot: ReadonlyMap<T, number>,
    finalLeaf: T | undefined,
    now = Date.now(),
): void {
    let newestOriginalTime = 0;

    for (const [leaf, activeTime] of snapshot) {
        leaf.activeTime = activeTime;
        newestOriginalTime = Math.max(newestOriginalTime, activeTime);
    }

    if (finalLeaf) {
        finalLeaf.activeTime = Math.max(now, newestOriginalTime + 1);
    }
}
