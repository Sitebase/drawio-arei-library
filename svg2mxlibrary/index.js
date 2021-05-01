#!/usr/bin/env node
'use strict'

const yargs = require('yargs')
  .scriptName('svg2mxlibrary')
  .usage('$0 [options] <SVG files...>')
  .help()
  .options({
    out: { alias: 'o', default: 'mxlibrary.xml', describe: 'output file', type: 'string' },
    size: { alias: 's', default: 80, describe: 'icon size', type: 80 }
  })
const argv = yargs.argv
if (argv._.length === 0) {
  yargs.showHelp()
  process.exit(1)
}

const { JSDOM } = require('jsdom')

global.window = new JSDOM().window
global.document = window.document
global.XMLSerializer = window.XMLSerializer
global.navigator = window.navigator

const { mxGraph, mxCodec, mxUtils, mxConstants } = require('mxgraph')()

let defaultStyle = ''
defaultStyle = mxUtils.setStyle(defaultStyle, mxConstants.STYLE_SHAPE, mxConstants.SHAPE_IMAGE)
defaultStyle = mxUtils.setStyle(defaultStyle, mxConstants.STYLE_VERTICAL_LABEL_POSITION, mxConstants.ALIGN_BOTTOM)
defaultStyle = mxUtils.setStyle(defaultStyle, mxConstants.STYLE_VERTICAL_ALIGN, mxConstants.ALIGN_TOP)
defaultStyle = mxUtils.setStyle(defaultStyle, mxConstants.STYLE_IMAGE_ASPECT, 1)
defaultStyle = mxUtils.setStyle(defaultStyle, mxConstants.STYLE_ASPECT, 'fixed')

const fs = require('fs')
const path = require('path')
const pako = require('pako')

const library = argv._.map((arg) => {
  const title = path.basename(arg, '.svg').replace(/-/g, ' ')

  const svg = fs.readFileSync(arg)
  const image = 'data:image/svg+xml,' + Buffer.from(svg).toString('base64')
  const style = mxUtils.setStyle(defaultStyle, mxConstants.STYLE_IMAGE, image)

  const graph = new mxGraph()
  const parent = graph.getDefaultParent();
  graph.getModel().beginUpdate()
  graph.insertVertex(parent, null, '', 0, 0, argv.size, argv.size, style)
  graph.getModel().endUpdate()
  const modelNode = new mxCodec().encode(graph.getModel())
  const modelXML = mxUtils.getXml(modelNode)
  const xml = Buffer.from(pako.deflateRaw(encodeURIComponent(modelXML))).toString('base64')

  return { title, xml, w: argv.size, h: argv.size }
})

fs.writeFileSync(argv.out, '<mxlibrary>' + JSON.stringify(library) + '</mxlibrary>')
