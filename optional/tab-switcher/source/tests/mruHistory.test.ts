import { describe, expect, test } from "bun:test";
import {
    captureActiveTimes,
    restoreAndCommitActiveTime,
} from "../src/mruHistory";

type TestLeaf = {
    name: string;
    activeTime: number;
};

function sortedNames(leaves: TestLeaf[]): string[] {
    return [...leaves]
        .sort((a, b) => b.activeTime - a.activeTime)
        .map((leaf) => leaf.name);
}

describe("held MRU cycling", () => {
    test("A -> B -> C -> D commits D with A still previous", () => {
        const leaves: TestLeaf[] = [
            { name: "A", activeTime: 40 },
            { name: "B", activeTime: 30 },
            { name: "C", activeTime: 20 },
            { name: "D", activeTime: 10 },
        ];
        const snapshot = captureActiveTimes(leaves);

        leaves[1]!.activeTime = 50;
        leaves[2]!.activeTime = 60;
        leaves[3]!.activeTime = 70;
        restoreAndCommitActiveTime(snapshot, leaves[3], 80);

        expect(sortedNames(leaves)).toEqual(["D", "A", "B", "C"]);
    });

    test("B -> C -> D commits D with B still previous", () => {
        const leaves: TestLeaf[] = [
            { name: "B", activeTime: 40 },
            { name: "C", activeTime: 30 },
            { name: "D", activeTime: 20 },
            { name: "A", activeTime: 10 },
        ];
        const snapshot = captureActiveTimes(leaves);

        leaves[1]!.activeTime = 50;
        leaves[2]!.activeTime = 60;
        restoreAndCommitActiveTime(snapshot, leaves[2], 70);

        expect(sortedNames(leaves)).toEqual(["D", "B", "C", "A"]);
    });
});
