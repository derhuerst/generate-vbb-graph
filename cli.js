#!/usr/bin/env node
'use strict'

const mri = require('mri')
const {stringify} = require('ndjson')
const fs = require('fs')
const path = require('path')
const projections = require('projections')
const maxBy = require('lodash.maxby')
const stations = require('vbb-stations/full.json')

const pkg = require('./package.json')
const computeGraph = require('./compute-graph')

const argv = mri(process.argv.slice(2), {
	boolean: [
		'help', 'h',
		'version', 'v',
		'simple-lines', 's',
		'simple-deduplication', 'd',
		'lines-blacklist', 'b'
	]
})

if (argv.help || argv.h) {
	process.stdout.write(`
Usage:
    generate-vbb-graph [-p subway,tram]
Options:
    --products             -p  A list of products. These are available:
                               suburban, subway, regional, tram, ferry, bus
    --projection           -P  Wether and how to project the station coordinates.
                               See juliuste/projections for details.
    --simple-lines         -s  Use a heuristic to keep only the most "canonical"
                               variant of each line. Default: false
    --simple-deduplication -d  Deduplicate edges without taking the travel
                               time into account. Default: false
    --lines-blacklist      -b  Apply a blacklist of weird lines. Default: false
Examples:
    generate-vbb-graph -p subway,tram -P mercator
\n`)
	process.exit(0)
}

if (argv.version || argv.v) {
	process.stdout.write(`generate-vbb-graph v${pkg.version}\n`)
	process.exit(0)
}

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

const nodes = stringify()
nodes
.on('error', showError)
.pipe(fs.createWriteStream('nodes.ndjson'))
.on('error', showError)

const edges = stringify()
edges
.on('error', showError)
.pipe(fs.createWriteStream('edges.ndjson'))
.on('error', showError)

const opt = {}

let products = argv.products || argv.p
if (products) products = products.split(',').map((p) => p.trim())
else products = ['subway', 'suburban', 'regional', 'tram']

let linesBlacklist = []
if (argv['lines-blacklist'] || argv.b) {
	linesBlacklist = require('./lib/lines-blacklist.js')
}

const filterLines = (l) => {
	return !linesBlacklist.includes(l.id) && products.includes(l.product)
}
opt.filterLines = filterLines

const filterStations = (id) => !!stations[id]
opt.filterStations = filterStations

let projection = argv.projection || argv.P || null
if (projection) {
	if (projection in projections) opt.projection = projections[projection]
	else throw new Error('unknown projection ' + projection)
}

const simpleDeduplication = argv['simple-deduplication'] || argv.d || null
opt.simpleDeduplication = simpleDeduplication

if (argv['simple-lines'] || argv.s) {
	const deduplicateVariants = (line) => {
		// really really simple heuristic: pick the longest variant
		// todo: write a smarter heuristic that picks the longest variant from those with the highest number of stations common with the other ones
		// todo: publish an npm mobule for this
		return [maxBy(line.variants, (variant) => variant.length)]
	}
	opt.deduplicateVariants = deduplicateVariants
}

computeGraph(nodes, edges, (err) => {
	nodes.end()
	edges.end()
	if (err) showError(err)
}, opt)
