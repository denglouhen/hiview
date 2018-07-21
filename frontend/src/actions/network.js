import * as d3Hierarchy from 'd3-hierarchy'
import cytoscape from 'cytoscape'

import Fuse from 'fuse.js'

export const FETCH_NETWORK = 'FETCH_NETWORK'

const generateIndex = networkJson => {
  console.log(networkJson)

  if (networkJson === null || networkJson === undefined) {
    throw Error('Network not loaded')
  }

  const nodes = networkJson.elements.nodes
  const nodeData = nodes.map(node => node.data)

  const options = {
    shouldSort: true,
    threshold: 0.0,
    tokenize: true,
    location: 0,
    matchAllTokens: true,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: ['name', 'Label', 'GO_term_aligned']
  }

  return new Fuse(nodeData, options)
}

// const testDb = networkJson => {
//   // Use UUID as store name
//   const objectStoreName = networkJson.cxData.ndexStatus[0].externalId
//   // const objectStoreName = 'NDEXTEST'
//
//   const open = indexedDB.open(DB_NAME, DB_VERSION)
//
//   open.onupgradeneeded = function() {
//     const db = open.result
//     const store = db.createObjectStore(objectStoreName, {
//       keyPath: PRIMARY_KEY
//     })
//     const index = store.createIndex('NameIndex', ['name.last', 'name.first'])
//     const labelIdx = store.createIndex(INDEX_LABEL, ['Label'])
//   }
//
//   open.onsuccess = function() {
//     // Start a new transaction
//     const db = open.result
//     const tx = db.transaction(objectStoreName, 'readwrite')
//     const store = tx.objectStore(objectStoreName)
//     const index = store.index('NameIndex')
//     const indexLabel = store.index(INDEX_LABEL)
//
//     generateIndex(store, networkJson)
//     // Add some data
//     store.put({
//       [PRIMARY_KEY]: 12345,
//       name: {
//         first: 'John',
//         last: 'Doe'
//       },
//       age: 42
//     })
//
//     store.put({
//       [PRIMARY_KEY]: 67890,
//       name: { first: 'Bob', last: 'Smith' },
//       age: 35
//     })
//
//     // Query the data
//     var getJohn = store.get(12345)
//     var getBob = index.get(['Smith', 'Bob'])
//
//     const get1 = indexLabel.get(['DNA'])
//
//     get1.onsuccess = function() {
//       console.log(get1) // => "John"
//     }
//     getJohn.onsuccess = function() {
//       console.log(getJohn.result.name.first) // => "John"
//     }
//
//     getBob.onsuccess = function() {
//       console.log(getBob.result.name.first) // => "Bob"
//     }
//
//     // Close the db when the transaction is done
//     tx.oncomplete = function() {
//       db.close()
//     }
//   }
//
//   return networkJson
// }

const fetchNetwork = url => {
  return {
    type: FETCH_NETWORK,
    url
  }
}

export const RECEIVE_NETWORK = 'RECEIVE_NETWORK'
const receiveNetwork = (url, json, error) => {

  if(error !== null) {
    return {
      type: RECEIVE_NETWORK,
      url,
      index: null,
      network: null,
      error: error
    }
  }

  const index = generateIndex(json)

  return {
    type: RECEIVE_NETWORK,
    url,
    index,
    network: json,
    error: null
  }
}

const fetchNet = url => {
  return fetch(url)
}

/**
 * remove unnecessary edges for visualization
 */
const filterEdges = network => {
  const edges = []
  network.elements.edges.forEach(edge => {
    if (edge.data.Is_Tree_Edge === 'Tree') {
      edges.push(edge)
    }
  })

  network.elements.edges = edges
  return network
}

const filterNodes = network => {
  const nodes = []
  network.elements.nodes.forEach(node => {
    if (node.data.Gene_or_Term === 'Term') {
      nodes.push(node)
    }
  })

  network.elements.nodes = nodes
  return network
}

export const fetchNetworkFromUrl = url => {


  console.log('NET URL: ', url)
  return dispatch => {
    dispatch(fetchNetwork(url))

    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText)
        } else {
          return response.json()
        }
      })
      .then(json => createLabel2IdMap(json))
      .then(network => addOriginalToAlias(network))
      .then(network => dispatch(receiveNetwork(url, network, null)))
      .catch(err => {
        console.log("Fetch Error: ", err)
        return dispatch(receiveNetwork(url, null, err))
      })
  }
}


let primaryName2prop = new Map()

const createLabel2IdMap = network => {
  const nodes = network.elements.nodes

  const label2id = {}
  const id2prop = {}
  // primaryId2prop = new Map()
  primaryName2prop = new Map()

  let i = nodes.length
  while (i--) {
    const nodeData = nodes[i].data
    const label = nodeData.Label
    const isRoot = nodeData.isRoot

    if (isRoot) {
      network['rootId'] = nodeData.id
    }

    const hidden = nodeData.Hidden
    if(!hidden && nodeData.NodeType === 'Term') {
      primaryName2prop.set(nodeData.name, nodeData)
    }

    label2id[label] = nodeData.id
    id2prop[nodeData.id] = nodeData
  }
  network['label2id'] = label2id
  network['id2prop'] = id2prop

  return network
}

/**
 *
 * Add children to alias nodes and make it expandable
 *
 * @param network
 * @returns {*}
 */
const addOriginalToAlias = network => {

  const nodes = network.elements.nodes
  const id2prop = network['id2prop']
  const label2id = network['label2id']

  let i = nodes.length
  while (i--) {
    const nodeData = nodes[i].data
    const hidden = nodeData.Hidden
    const nodeType = nodeData.NodeType

    if (hidden && nodeType === 'Term') {
      const originalData = primaryName2prop.get(nodeData.Original_Name)

      nodeData['originalId'] = originalData.id
      console.log('Term ALIAS5: ', nodeData, originalData)
    }
  }

  return network

}

const filterLeafs = network => {
  const cy = cytoscape({
    elements: network.elements
  })

  const toBeRemovedNodes = cy.filter((element, i) => {
    if (element.isNode() && element.degree() === 1) {
      return true
    }
    return false
  })

  console.log('TOTAL: ' + network.elements.nodes.length)
  console.log('FILTERED: ' + toBeRemovedNodes.length)

  const toBeRemovedEdges = cy.nodes().edgesWith(toBeRemovedNodes)
  cy.remove(toBeRemovedEdges)
  cy.remove(toBeRemovedNodes)

  network.elements.nodes = cy.nodes().jsons()
  network.elements.edges = cy.edges().jsons()

  return network
}

const findRoot = network => {
  const nodes = network.elements.nodes

  let minSize = null
  let maxSize = null

  let rootId = null

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const isRoot = node.data.isRoot
    const name = node.data.name

    if (isRoot === 'True') {
      rootId = node.data.id
    }

    const size = node.data.Size
    if (size !== undefined) {
      node.data.Size = parseInt(size)

      if (minSize === null) {
        minSize = size
      }
      if (maxSize === null) {
        maxSize = size
      }
      if (size <= minSize) {
        minSize = size
      }

      if (size >= maxSize) {
        maxSize = size
      }
    }
  }

  network.data.minSize = minSize
  network.data.maxSize = maxSize

  return rootId
}

const layout = network => {
  const rootNodeId = findRoot(network)
  if (rootNodeId === null) {
    console.log('FAILED!!!!!!!!!!!!!!!!!!!!!!!!! Root Node not found: ')
    // Return network as-is
    return network
  }

  console.log('Root Node found: ' + rootNodeId)

  network.data.rootId = rootNodeId

  const layoutMap = getTree(rootNodeId, network)
  return applyLayout(layoutMap, network)
}

const getTree = (rootId, tree) => {
  const csv = []
  csv.push({
    name: rootId,
    parent: ''
  })

  const edges = tree.elements.edges
  edges.forEach(edge => {
    const source = edge.data.source
    const target = edge.data.target

    csv.push({
      name: source,
      parent: target
    })
  })

  console.log('********** ROOT: ' + rootId)

  const d3tree = d3Hierarchy
    .stratify()
    .id(function(d) {
      return d.name
    })
    .parentId(function(d) {
      return d.parent
    })(csv)

  console.log(d3tree)

  var layout = d3Hierarchy
    .cluster()
    .size([360, 1600])
    .separation((a, b) => {
      return (a.parent === b.parent ? 1 : 2) / a.depth
    })

  layout(d3tree)
  console.log('---------- Done! -------------')
  console.log(d3tree)

  const layoutMap = {}
  walk(d3tree, layoutMap)

  console.log(layoutMap)
  return layoutMap
}

const applyLayout = (layoutMap, network) => {
  const nodes = network.elements.nodes
  nodes.forEach(node => {
    const position = layoutMap[node.data.id]
    if (position !== undefined) {
      let depth = position[2]

      if (depth === undefined) {
        depth = 0
      }

      const newPos = project(position[0], position[1])
      node.position.x = newPos[0]
      node.position.y = newPos[1]
      // node.position.x = position[0]* 10
      // node.position.y = position[1]* 10
      // console.log(newPos[2]*180/Math.PI)
      if (node.data.Size === 1 || depth > 1) {
        let angle = newPos[2]
        // let angle = newPos[2]*180/Math.PI
        if (angle <= Math.PI * 1.5 && angle >= Math.PI / 2.0) {
          angle = angle + Math.PI
          // if(node.data.Size === 1) {
          //   node.position.x = -1205
          //   node.position.y = newPos[1] * 12
          // }
        } else {
          // if(node.data.Size === 1) {
          //   node.position.x = 1205
          //   node.position.y = newPos[1] * 12
          // }
        }
        node.data.angle = angle
      } else {
        node.data.angle = 0
      }

      // Leaf nodes
      // if(node.data.Size === 1) {
      //   node.position.x = newPos[0]*3
      //   node.position.y = newPos[1]*3
      // }
    } else {
      // console.log('ERRRRRRRRRRRR: ' + node.data.id)
    }
  })

  return network
}

const project = (x, y) => {
  const angle = (x - 90) / 180 * Math.PI
  const radius = y
  return [radius * Math.cos(angle), radius * Math.sin(angle), angle]
}

const project2 = (x, y) => {
  const angle = (x - 90) / 180 * Math.PI
  const radius = y
  return [radius * Math.cos(angle * 2), radius * Math.sin(angle * 2), angle]
}

const walk = (node, layoutMap) => {
  layoutMap[node.id] = [node.x, node.y, node.depth]

  const children = node.children

  if (children === undefined || children.length === 0) {
    return
  } else {
    children.forEach(child => walk(child, layoutMap))
  }
}

export const idMapping = json => {
  fetch(url, {
    method: 'POST'
  })
    .then(response => response.json())
    .then(json => {
      dispatch(receiveNetwork(url, json))
    })
}

export const DELETE_NETWORK = 'DELETE_NETWORK'
const deleteNetwork = url => {
  return {
    type: DELETE_NETWORK,
    url
  }
}
