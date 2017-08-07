# generate-vbb-graph

**Berlin & Brandenburg public transport as [JGF](http://jsongraphformat.info) file.** See [`vbb-graph`](https://github.com/derhuerst/vbb-graph) for published prebuilt data.

[![npm version](https://img.shields.io/npm/v/generate-vbb-graph.svg)](https://www.npmjs.com/package/generate-vbb-graph)
[![build status](https://img.shields.io/travis/derhuerst/generate-vbb-graph.svg)](https://travis-ci.org/derhuerst/generate-vbb-graph)
![ISC-licensed](https://img.shields.io/github/license/derhuerst/generate-vbb-graph.svg)
[![chat on gitter](https://badges.gitter.im/derhuerst.svg)](https://gitter.im/derhuerst)


## Installing

```shell
npm install -g generate-vbb-graph
```


## Usage

```
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
```

This tool generates data in the [JSON Graph Format](https://github.com/jsongraph/json-graph-specification/blob/master/README.rst#json-graph-specification). Note that instead of storing all nodes and edges in one JSON file, **it will create `nodes.ndjson` and `edges.ndjson`. These are [ndjson](http://ndjson.org)-encoded lists of all nodes and edges**, respectively.

A node from `nodes.ndjson` looks like this:

```json
{
	"id": "900000029101",
	"label": "S Spandau",
	"metadata": {
		"x": 536.66,
		"y": 326.25
	}
}
```

An edge from `edges.ndjson` looks like this:

```json
{
	"source": "900000100001",
	"target": "900000003201",
	"relation": "regional",
	"metadata": {
		"line": "RB22",
		"time": 180
	}
}
```


## Contributing

If you **have a question**, **found a bug** or want to **propose a feature**, have a look at [the issues page](https://github.com/derhuerst/generate-vbb-graph/issues).
