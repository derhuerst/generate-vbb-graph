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
    --products  -p  A list of products. These are available:
                    suburban, subway, regional, tram, ferry, bus
Examples:
    generate-vbb-graph -p subway,tram
```

This tool generates data in the [JSON Graph Format](https://github.com/jsongraph/json-graph-specification/blob/master/README.rst#json-graph-specification). Note that instead of storing all nodes and edges in one JSON file, **it will create `nodes.ndjson` and `edges.ndjson`. These are [ndjson](http://ndjson.org)-encoded lists of all nodes and edges**, respectively.


## Contributing

If you **have a question**, **found a bug** or want to **propose a feature**, have a look at [the issues page](https://github.com/derhuerst/generate-vbb-graph/issues).
