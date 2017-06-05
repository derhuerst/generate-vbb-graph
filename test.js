'use strict'

const test = require('tape')
const fs = require('fs')
const path = require('path')
const {parse} = require('ndjson')
const stations = require('vbb-stations/full.json')

const read = (file) => {
	return fs.createReadStream(path.join(__dirname, file))
	.pipe(parse())
}

const isValidProduct = (p) => {
	return p === 'suburban'
	|| p === 'subway'
	|| p === 'regional'
	|| p === 'tram'
	|| p === 'bus'
}

test('nodes.ndjson', (t) => {
	read('nodes.ndjson')
	.on('error', t.ifError)
	.on('data', (node) => {
		t.equal(typeof node.id, 'string')
		t.ok(stations[node.id], 'invalid station id')
		t.equal(typeof node.label, 'string')
		t.ok(node.metadata, 'missing metadata')
		if ('number' === typeof node.metadata.x) {
			t.equal(typeof node.metadata.y, 'number')
		} else {
			t.equal(typeof node.metadata.latitude, 'number')
			t.equal(typeof node.metadata.longitude, 'number')
		}
	})
	.on('end', () => t.end())
})

test('edges.ndjson', (t) => {
	const isKnownStation = {}

	read('nodes.ndjson')
	.on('error', t.ifError)
	.on('data', (node) => {
		isKnownStation[node.id] = true
	})
	.on('end', () => {
		read('edges.ndjson')
		.on('error', t.ifError)
		.on('data', (edge) => {
			t.ok(isKnownStation[edge.source], 'invalid source id')
			t.ok(isKnownStation[edge.target], 'invalid target id')
			t.ok(isValidProduct(edge.relation), 'invalid product')
			t.ok(edge.metadata, 'missing metadata')
			t.ok(typeof edge.metadata.line, 'string')
			t.ok(typeof edge.metadata.time, 'number')
		})
		.on('end', () => t.end())
	})
})
