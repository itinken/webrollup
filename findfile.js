const path = require('path');
const fs = require('fs');

function searcher(envname, ext) {
	const filepath = process.env[envname] || '.';
	const dirs = filepath.split(':');

	return {
		find: function(name) {

			if (ext !== undefined && !name.endsWith(ext))
				name = `${name}.${ext}`;

			if (name.startsWith('./') || name.startsWith('../') || name.startsWith('/'))
				return name;

			for (i = 0; i < dirs.length; i++) {
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

function rollup_plugin_search_path() {
	const js_search = searcher('JS_PATH', 'js');
	return {
		name: 'search_path',
		
		resolveId: function (tee, ter) {
			return js_search.find(tee);
		}

	}
}

module.exports = {
	rollup_plugin_search_path,
};
