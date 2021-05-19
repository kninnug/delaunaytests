import fs from 'fs';
import path from 'path';

function dedupePoints(points){
	const seen = new Set,
		ret = [];
	for(const pnt of points){
		const [x, y] = pnt,
			key = '' + x + ',' + y;
		if(seen.has(key)){
			continue;
		}
		seen.add(key);
		ret.push(pnt);
	}
	console.log('dup', points.length - seen.size);
	return ret;
}

/**
 * Compute the extent of a list of points.
 *
 * @param {array:array:number} points The points as an array of coordinates:
 *        [[x, y], [x, y], ...].
 * @return {object} The extent/bounds of the points as {minX, minY, maxX, maxY}.
 */
function pointsExtent(points){
	let minX = Infinity,
		minY = Infinity,
		maxX = -Infinity,
		maxY = -Infinity;
	
	for(const [x, y] of points){
		minX = Math.min(minX, x);
		minY = Math.min(minY, y);
		maxX = Math.max(maxX, x);
		maxY = Math.max(maxY, y);
	}
	
	return {minX, minY, maxX, maxY};
}

/**
 * Scale the coordinates of a list of points to fit in a given width & height,
 * optionally with an offset.
 *
 * @param {array:array:number} points The points as an array of coordinates:
 *        [[x, y], [x, y], ...].
 * @param {number} width The width to fit into.
 * @param {number} height The height to fit into.
 * @param {number} offX The x offset to add to the resulting coordinates.
 * @param {number} offY The y offset to add to the resulting coordinates.
 * @return {array:array:number} The points, scaled and translated.
 */
function scalePoints(points, width, height, offX = 0, offY = offX){
	const bnd = pointsExtent(points),
		curWidth = bnd.maxX - bnd.minX,
		curHeight = bnd.maxY - bnd.minY,
		scaleX = width / curWidth,
		scaleY = height / curHeight,
		scale = Math.min(scaleX, scaleY);
	
	return points.map(([x, y]) => [
		(x - bnd.minX) * scale + offX,
		(y - bnd.minY) * scale + offY
	]);
}

/**
 * A Delaunay test file.
 */
class Test {
	constructor({points, edges, source = null, error = null}, pth, dedupe){
		this.points = dedupe ? dedupePoints(points) : points;
		this.edges = edges;
		this.source = source;
		this.error = error;
		this.name = path.relative(relapath('./files/').pathname, pth.pathname).replace(/\\/g, '/');
		
		this.extent = pointsExtent(points);
	}
}

/**
 * Make an absolute path from the directory this file is in.
 *
 * @param {string} pth The relative path from the current directory.
 * @return {URL} The absolute path.
 */
function relapath(pth){
	return new URL(pth, import.meta.url);
}

/**
 * Collect all the regular files under the given directory, recursively down the
 * directory tree.
 *
 * @param {URL} dir The directory.
 * @return {array:URL} The files.
 */
function collectFiles(dir){
	const ents = fs.readdirSync(dir, {encoding: 'utf8', withFileTypes: true}),
		files = ents.filter(ent => ent.isFile()).map(e => new URL(dir + '/' + e.name)),
		children = ents.filter(ent => ent.isDirectory())
				.map(d => collectFiles(new URL(dir + '/' + d.name)));
	return files.concat(...children);
}

/**
 * Load a test file from the given absolute path.
 *
 * @param {URL} pth The path to the test file.
 * @return {Test} The test object.
 */
function loadFile(pth, dedupe){
	//console.log('load', pth.pathname);
	const ret = JSON.parse(fs.readFileSync(pth, 'utf8'));
	return new Test(ret, pth, dedupe);
}

/**
 * Load all the test files, except the ones that (should) cause an error at
 * constraining.
 *
 * @param {boolean} allowErrors If true, also load tests that cause
 *        Constrainautor to throw an error.
 * @return {array:Test} The loaded tests.
 */
function loadTests(allowErrors = false, dedupe = false){
	const ret = collectFiles(relapath('./files')).map(p => loadFile(p, dedupe));
	return ret.filter(test => allowErrors ? true : !test.error);
}

/**
 * Find a test with the given name.
 *
 * @param {array:Test} tests The test files to look through.
 * @param {string} name The name to match.
 * @return {Test|undefined} The test, or undefined if there are none with that
 *         name.
 */
function findTest(tests, name){
	return tests.find(t => t.name.includes(name));
}

export {
	Test,
	loadFile,
	findTest,
	loadTests
};
