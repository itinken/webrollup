#!/usr/bin/env node
'use strict';

const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const strip = require('rollup-plugin-strip');
const uglify = require('rollup-plugin-uglify');


const cli = require('yargs')
		.usage('jsrollup [-m] input.js')
		.describe('p', 'Production remove debugging and minify')
		.describe('s', 'Remove debuging')
		.describe('m', 'Minify the output file')
		.describe('o', 'Output file')
		.describe('skip-map', 'No source map')
		.describe('verbose', 'Verbose output')
		.alias('m', 'minify')
		.alias('s', 'strip')
		.alias('p', 'prod')
		.alias('o', 'output')
		.alias('v', 'verbose')
		.boolean(['prod', 'strip', 'minify', 'skip-map', 'verbose'])
		.alias('h', 'help')
		.argv;


const inOpts = {
	input: cli._[0],

	plugins: [
		babel({
			babelrc: false,
			exclude: 'node_modules/**',
			presets: [
				"@babel/preset-env"
			],
		}),
	],
};

const outOpts = {
	format: 'iife',
};

function process_output_opts() {
	if (cli.output) {
		outOpts.file = cli.output;

		if (!cli.skipMap) {
			outOpts.sourcemap = true;
		}
	}
}

function process_input_opts() {
	const plugins = inOpts.plugins;


	if (cli.prod || cli.strip) {
		plugins.push(
				strip({functions: ['console.log', 'assert.*', 'debug', 'alert'],})
		);
	}

	if (cli.prod || cli.minify) {
		plugins.push(uglify.uglify());
	}

	if (cli.verbose) {
	}
}

async function build() {
	process_input_opts();
	process_output_opts();

	const bundle = await rollup.rollup(inOpts);

	if (outOpts.file === undefined) {
		const {code, map} = await bundle.generate(outOpts);
		process.stdout.write(code);
	} else {
		await bundle.write(outOpts);
	}
}

build().catch(err => {
	console.log(err)
});
