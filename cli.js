#!/usr/bin/env node
'use strict'

const minimist = require('minimist')
const {stringify} = require('ndjson')
const fs = require('fs')
const path = require('path')
const projections = require('projections')
const stations = require('vbb-stations/full.json')

const pkg = require('./package.json')
const computeGraph = require('./compute-graph')

const argv = minimist(process.argv.slice(2))

if (argv.help || argv.h) {
	process.stdout.write(`
Usage:
    generate-vbb-graph [-p subway,tram]
Options:
    --products    -p  A list of products. These are available:
                      suburban, subway, regional, tram, ferry, bus
    --projection  -P  Wether and how to project the station coordinates.
                      See juliuste/projections for details.
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

let products = argv.products || argv.p
if (products) products = products.split(',').map((p) => p.trim())
else products = ['subway', 'suburban', 'regional', 'tram']
const filterLines = (l) => products.includes(l.product)

let projection = argv.projection || argv.P || null
if (projection) {
	if (projection in projections) projection = projections[projection]
	else throw new Error('unknown projection ' + projection)
}

const filterStations = (id) => !!stations[id]

computeGraph(nodes, edges, (err) => {
	nodes.end()
	edges.end()
	if (err) showError(err)
}, {filterLines, filterStations, projection})
