'use strict'

const {stringify} = require('ndjson')
const fs = require('fs')
const path = require('path')

const computeGraph = require('./compute-graph')

const showError = (err) => {
	console.error(err)
	process.exit(1)
}

const nodes = stringify()
nodes
.on('error', showError)
.pipe(fs.createWriteStream(path.join(__dirname, 'nodes.ndjson')))
.on('error', showError)

const edges = stringify()
edges
.on('error', showError)
.pipe(fs.createWriteStream(path.join(__dirname, 'edges.ndjson')))
.on('error', showError)

computeGraph(nodes, edges)
.catch((err) => {
	nodes.end()
	edges.end()
	showError(err)
})
