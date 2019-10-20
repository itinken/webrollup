const path = require('path');
const fs = require('fs');

// Search for a js file on a path.
function searcher(envname, ext) {
	const filepath = process.env[envname] || '.';
	const dirs = filepath.split(':');

	return {
		find: function(name) {
			if (ext !== undefined && !name.endsWith(ext))
				name = `${name}.${ext}`;

			if (name.startsWith('./') || name.startsWith('../') || name.startsWith('/'))
				return undefined;

			for (let i = 0; i < dirs.length; i++) {
				const dir = dirs[i];
				const pathname = path.join(dir, name);
				if (fs.existsSync(pathname)) {
					return pathname;
				}
			}

			return undefined;
		}
	}
}

// Resolve a path within the webrollup's node_modules directory.  This is mainly to
// deal with svelte imports.  This could import undesired packages, but the js path is
// tested first so your own packages should always be found first.
function node_resolve(importee, importer) {
	if (importee === "")
		return undefined;

	// Check if the file just exists
	if (fs.existsSync(importee) && fs.lstatSync(importee).isFile())
		return undefined;

	// If relative path then resolve it and call this again
	if (importee[0] === '.') {
		const pathname = path.join(path.dirname(importer), importee);
		return node_resolve(pathname, importer);
	}

	const base = path.join(__dirname, 'node_modules');
	for (let x of ['index.mjs', 'index.js']) {
		// Using resolve, deals with the case where 'importee' is absolute.
		const pn = path.resolve(base, importee, x);
		if (fs.existsSync(pn))
			return pn;
	}

	return undefined;
}

function rollup_plugin_search_path() {
	const js_search = searcher('JS_PATH', 'js');
	return {
		name: 'search_path',

		resolveId: function (importee, importer) {
			let res = js_search.find(importee);
			if (res)
				return res;

			return node_resolve(importee, importer);
		}
	}
}

module.exports = {
	rollup_plugin_search_path,
};
