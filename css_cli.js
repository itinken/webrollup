#!/usr/bin/env node
'use strict';

const yargs = require('yargs');
const fs = require('fs');
const chalk = require('chalk');
const fileExists = require('file-exists');
const postcss = require('postcss');
const cssnano = require('cssnano');
const queries = require('css-mqpacker');
const perfect = require('perfectionist');
const prefixer = require('autoprefixer');
const atImport = require('postcss-import');
const media = require('postcss-custom-media');
const vars = require('postcss-css-variables');
const extend = require('postcss-extend-rule');
const conditionals = require('postcss-conditionals');
const rmComments = require('postcss-discard-comments');
const calc = require('postcss-calc');


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
		.option('map', {
			describe: 'Produce a sourcemap',
			implies: 'o',
			boolean: true,
		})
		.option('preserve-variables', {
			describe: 'Preserve variables in the output',
			boolean: true,
		})
		.alias('h', 'help')
		.demandCommand(1)
		.strict(true)
		.argv;

const log = console.log;

if (cli.prod) {
	cli.minify = true;
}

const inputFile = cli._[0];
const outputFile = cli.output;

if (!fileExists(inputFile)) {
  console.error(chalk.red('File does not exist ' + inputFile));
  console.log(cli.help);
  process.exit(1);
}


const getPlugins = function (options) {
  options = options || {};

  const perfectionistOptions = options.perfectionist || {
    format: 'compact',
    trimTrailingZeros: false
  };

  const atImportOptions = options.atImport || {};

  const plugins = [
    atImport(atImportOptions),
		conditionals(),
		media(),
		queries(),
		perfect(perfectionistOptions),
    prefixer(),
		extend()
  ];

  if (!options.preserveVariables) {
    plugins.splice(1, 0, calc());
    plugins.splice(1, 0, vars())
  }

  if (options.minify) {
    plugins.push(cssnano());
    plugins.push(rmComments())
  }

  if (options.plugins) {
    options.plugins.forEach(plugin => plugins.push(plugin))
  }

  return plugins
};

function tachyonsBuildCss(css, options) {
  const plugins = getPlugins(options);

  return postcss(plugins).process(css, options)
}


function cssPath() {
	const pstr = process.env['CSS_PATH'];
	if (pstr) {
		return pstr.split(':');
	}
	return undefined;
}

const input = fs.readFileSync(inputFile, 'utf8');
const options = {
	from: inputFile,
	to: outputFile,
	atImport: {path: cssPath()},
	minify: cli.minify,
	preserveVariables: cli.preserveVariables,
};

if (cli.map) {
	options.map = true;
	options.mapFilename = outputFile + '.map'
}

tachyonsBuildCss(input, options)
		.then(function (result) {
			if (outputFile) {
				fs.writeFileSync(outputFile, result.css);
				if (result.map)
					fs.writeFileSync(outputFile + '.map', result.map.toString());
			} else {
				process.stdout.write(result.css);
			}
		})
		.catch(function(msg) {
			log(msg);
		});
