#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const pako = require('pako')
const process = require('process');
const argv = process.argv

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


const library = argv.map((arg) => {

    // skip non SVG files
    if (!arg.includes('.svg'))
        return;

    const title = path.basename(arg, '.svg').replace(/-/g, ' ')
    console.log('Add to library', title);

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

    return { title, xml, w: 80, h: 80 }
})

// remove skipped (null) entries
const cleanLibrary = library.filter(x => x);

fs.writeFileSync(argv[3], '<mxlibrary>' + JSON.stringify(cleanLibrary) + '</mxlibrary>')
console.log('Generate library: ', argv[3]);
