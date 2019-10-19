#!/usr/bin/env node
'use strict';

const rollup = require('rollup');
const buble = require('rollup-plugin-buble');
const strip = require('rollup-plugin-strip');
const terser = require('rollup-plugin-terser');
const svelte = require('rollup-plugin-svelte');
const yargs = require('yargs');
const finder = require('./findfile.js');


const cli = yargs.usage('webrollup [options] input.js')
		.option('o', {
			alias: 'output',
			describe: 'Output file name',
			type: 'string',
		})
		.option('p', {
			alias: ['prod'],
			describe: 'Enable production mode, remove debugging and minify',
			boolean: true,
		})
		.option('v', {
			alias: 'verbose',
			describe: 'Print more verbose output',
			boolean: true,
		})
		.option('m', {
			alias: 'minify',
			describe: 'Minify the output file',
			boolean: true,
		})
		.option('s', {
			alias: 'strip',
			describe: 'Remove debugging constructs',
			boolean: true,
		})
		.option('map', {
			describe: 'Produce a sourcemap',
			implies: 'o',
			boolean: true,
		})
		.alias('h', 'help')
		.demandCommand(1)
		.argv;


const inOpts = {
	input: cli._[0],

	plugins: [
		finder.rollup_plugin_search_path(),
		svelte({
			css(css) {
			  css.write('res/css/comps.css');
      },
		}),
		buble({
			transforms: {
				dangerousForOf: true,
			}
		}),
	],
};

const outOpts = {
	format: 'iife',
};

function process_output_opts() {
	if (cli.output) {
		outOpts.file = cli.output;

		if (cli.map) {
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
		plugins.push(terser.terser());
	}

	if (cli.verbose) {

	}
}

async function build() {
	process_input_opts();
	process_output_opts();

	const bundle = await rollup.rollup(inOpts);

	if (outOpts.file === undefined) {
		const {code} = await bundle.generate(outOpts);
		process.stdout.write(code);
	} else {
		await bundle.write(outOpts);
	}
}

build().catch(err => {
	console.log(err)
});
