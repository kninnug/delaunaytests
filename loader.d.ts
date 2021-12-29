export = DelaunayTests;

declare namespace DelaunayTests {

type P2 = [number, number];

interface Extent {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

interface TestFile {
	points: P2[];
	edges: P2[];
	error?: string;
	source?: string;
	name: string;
	
	extent: Extent;
}

export function loadFile(pth: string, dedupe: boolean): TestFile;
export function findTest(tests: TestFile[], name: string): TestFile | undefined;
export function loadTests(allowErrors?: boolean, dedupe?: boolean): TestFile[];

}
