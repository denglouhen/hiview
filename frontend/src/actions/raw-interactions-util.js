import * as d3Scale from 'd3-scale'
export const MAIN_EDGE_TAG = 'Main Feature'
export const PATTERN = /[ -]/g

const PARENT_WT_TAG = 'Parent weight'
const CHILDREN_WT_TAG = 'Children weight'

const category10 = d3Scale.schemeCategory10

const DEF_COLOR = '#777777'

const compareBy = fieldName => (a, b) => {
  const scoreA = a.data[fieldName]
  const scoreB = b.data[fieldName]

  let comparison = 0
  if (scoreA > scoreB) {
    comparison = -1
  } else if (scoreA < scoreB) {
    comparison = 1
  }
  return comparison
}

/**
 * Create subset of edges based on minimum score provided.
 *
 * @param edges
 * @param scoreName
 * @param min
 * @returns {Array}
 */
const filter = (edges, scoreName, min) => {

  let subMax = -1.0

  let size = edges.length
  const subset = []

  while (size--) {
    const edge = edges[size]
    const s = edge.data[scoreName]
    let score = 0
    if (s) {
      score = Number(s)
    }
    if (score > min) {
      subset.push(edge)
    }

    if(score > subMax) {
      subMax = score
    }
  }

  return {
    subset,
    subMax
  }
}

const filterOld = (edges, maxEdgeCount) => {
  const numEdges = edges.length
  if (numEdges <= maxEdgeCount) {
    return edges
  }

  return edges.slice(0, maxEdgeCount)
}

const generateColorMap = (weightRange, minVal, maxVal, parentScore) => {
  // Create color mapper based on the local range (parent score to max)

  weightRange.push(parentScore)
  weightRange.sort()

  const slots = weightRange.length
  const colorScale = d3Scale
    .scaleSequential(d3Scale.interpolateInferno)
    .domain([parentScore, maxVal])

  let len = slots
  const colorMap = []


  //First entry: global minimum to Parent
  colorMap.push({
    min: minVal,
    max: parentScore,
    color: DEF_COLOR
  })

  for (let idx = 0; idx < len; idx++) {
    const v1 = weightRange[idx]
    const v2 = weightRange[idx + 1]
    const diff = v2 - v1


    // Case 1: two numbers are the same
    if (diff !== 0) {
      console.log('Range ' + idx, v1, v2)
      colorMap.push({
        min: v1,
        max: v2,
        color: colorScale(v2)
      })
    }

    // Last entry
    if (idx === len - 2) {
      // Add last one
      const lastEntry = {
        min: v2,
        max: maxVal,
        color: colorScale(maxVal)
      }
      colorMap.push(lastEntry)
      break
    }
  }

  return colorMap
}

const calculateZindex = (score, edge, name) => {

  if(score === undefined || isNaN(score)) {
    // Fix invalid entry

    edge.data[name] = 0
    return 0 // Default value for the zIndex
  }

  return Math.floor(score * 200)
}

const assignColor = (colorMap, edge, primaryName, min) => {
  let color = '#777777'
  let zIndex = 0

  const weight = edge.data[primaryName]

  for (let i = 0; i < colorMap.length; i++) {
    const mapEntry = colorMap[i]
    // console.log('score: ', weight, mapEntry)

    if (mapEntry.min <= weight && weight <= mapEntry.max) {
      color = mapEntry.color
      // color = category10[i]
      break
    }
  }
  edge.data['color'] = color
  edge.data['zIndex'] = calculateZindex(weight, edge, primaryName)
}

const getColorForRange = (colorMap, val) => {
  let color = DEF_COLOR

  for (let i = 0; i < colorMap.length; i++) {
    const mapEntry = colorMap[i]
    if (mapEntry.min <= val && val <= mapEntry.max) {
      color = mapEntry.color
      break
    }
  }

  return color
}

export const filterEdge = (network, maxEdgeCount) => {
  let mainEdgeType = network.data[MAIN_EDGE_TAG]
  if (mainEdgeType !== undefined) {
    mainEdgeType = mainEdgeType.replace(/ /g, '_')
  }
  const networkData = network.data

  console.log('######### net data:', networkData)

  // For new format
  const parentScoreStr = networkData[PARENT_WT_TAG]
  const parentScore = Number(parentScoreStr)
  const childrenWeight = networkData[CHILDREN_WT_TAG]
  let weightRange = []
  if (childrenWeight) {
    // This is the new format
    weightRange = childrenWeight.split('|').map(val => Number(val))
  }

  const nodes = network.elements.nodes
  const originalEdges = network.elements.edges
  let edges = []
  let maxScore = -1
  let minScore = -1

  // Sort all edges and find max.
  originalEdges.sort(compareBy(mainEdgeType))

  // This is always the global maximum
  maxScore = originalEdges[0].data[mainEdgeType]

  if (!parentScore) {
    edges = filterOld(originalEdges, maxEdgeCount)
    minScore = edges[edges.length - 1].data[mainEdgeType]
  } else {
    // New data format
    // const result = filter(originalEdges, mainEdgeType, parentScore)
    // edges = result.subset
    // edges.sort(compareBy(mainEdgeType))

    maxScore = originalEdges[originalEdges.length -1].data[mainEdgeType]

    edges = filterOld(originalEdges, maxEdgeCount)
    if (edges.length < maxEdgeCount) {
      minScore = parentScore
    } else {
      minScore = parentScore
    }

  }

  if(maxScore === undefined) {
    maxScore = 0.0
  }

  if(minScore === undefined) {
    minScore = 0.0
  }

  // let minScore = edges[edges.length - 1].data[mainEdgeType]
  console.log("MIN / Max ==========", minScore, maxScore, originalEdges)
  network.data['allEdgeScoreRange'] = [minScore, maxScore]

  // Create colors for range.  0 is always global minimum
  const colorMap = generateColorMap(weightRange, 0, maxScore, parentScore)

  let barCount1 = 50
  let barCount2 = 50

  if (edges.length < 100) {
    barCount1 = 10
    barCount2 = 5
  }
  const allData = createBuckets(
    edges,
    minScore,
    maxScore,
    mainEdgeType,
    barCount1,
    true,
    colorMap
  )

  const forHistogram = allData.result
  network.data['allEdgeScoreDist'] = forHistogram
  network.data['allEdgeMaxFrequency'] = allData.maxFrequency

  const subset = edges
  const subMin = minScore

  const subData = createBuckets(
    subset,
    subMin,
    maxScore,
    mainEdgeType,
    barCount2,
    true,
    colorMap
  )
  network.data['subEdgeScoreDist'] = subData.result
  network.data['maxFrequency'] = subData.maxFrequency
  network.data['edgeScoreRange'] = [subMin, maxScore]
  network.data['edgeColorMap'] = colorMap

  const subsetLen = subset.length
  const nodeSet = new Set()

  const colorGenerator = d3Scale
    .scaleSequential(d3Scale.interpolateInferno)
    .domain([subMin, maxScore])

  for (let i = 0; i < subsetLen; i++) {
    const edge = subset[i]
    // Assign color
    if (parentScore) {
      assignColor(colorMap, edge, mainEdgeType)
    } else {
      const weight = edge.data[mainEdgeType]
      edge.data['color'] = colorGenerator(weight)
      edge.data['zIndex'] = calculateZindex(weight, edge, mainEdgeType)
    }

    nodeSet.add(edge.data.source)
    nodeSet.add(edge.data.target)
  }

  let j = nodes.length
  const newNodes = new Array(nodeSet.size)

  let idx = 0
  while (j--) {
    const node = nodes[j]
    if (nodeSet.has(node.data.id)) {
      newNodes[idx] = node
      idx++
    }
  }
  network.elements.edges = subset
  network.elements.nodes = newNodes
  return network
}

const createBuckets = (
  edges,
  min,
  max,
  scoreFieldName,
  sliceCount = 200,
  coloring = false,
  colorMap
) => {
  const colorScale = d3Scale
    .scaleSequential(d3Scale.interpolateInferno)
    .domain([min, max])

  const range = max - min
  const delta = range / sliceCount

  let maxFrequency = 0

  let edgeCount = edges.length

  let curRange = min + delta
  let bucketCounter = 0
  const result = []
  while (edgeCount--) {
    const score = edges[edgeCount].data[scoreFieldName]
    if (score < curRange) {
      bucketCounter++
    } else {
      if (maxFrequency < bucketCounter) {
        maxFrequency = bucketCounter
      }

      let log10val = Math.log10(bucketCounter)
      if (log10val <= 0) {
        // for -infinity
        log10val = 0
      }
      const newBucket = { x: curRange, y: log10val }
      if (coloring && colorMap) {
        newBucket['color'] = getColorForRange(colorMap, curRange)
      } else if (coloring) {
        newBucket['color'] = colorScale(curRange)
      }
      result.push(newBucket)
      bucketCounter = 1
      curRange = curRange + delta
    }
  }

  return { result, maxFrequency }
}

export const createFilter = (network, maxEdgeCount) => {
  const defCutoff = network.data['Parent weight']

  const filters = []

  const edges = network.elements.edges
  let edgeCount = edges.length

  // 1. Extract props from network data
  const edgeTypes = {}
  let mainEdgeType = network.data[MAIN_EDGE_TAG]
  if (mainEdgeType !== undefined) {
    mainEdgeType = mainEdgeType.replace(PATTERN, '_')
  }

  for (let [key, value] of Object.entries(network.data)) {
    if (key === MAIN_EDGE_TAG) {
      continue
    }

    const keyParts = key.split(' ')
    const suffix = keyParts[keyParts.length - 1]
    let realKey = keyParts.slice(0, keyParts.length - 1).join('_')
    const edgeTypeName = realKey.replace(PATTERN, '_')

    const currentValue = edgeTypes[edgeTypeName]
    if (currentValue === undefined) {
      const newEntry = {}
      newEntry[suffix] = value
      edgeTypes[edgeTypeName] = newEntry
    } else {
      currentValue[suffix] = value
      edgeTypes[edgeTypeName] = currentValue
    }
  }

  for (let [key, value] of Object.entries(edgeTypes)) {
    if (value.type === 'numeric') {
      const isPrimary = mainEdgeType === key

      let th = value.min
      let min = value.min
      let max = value.max

      filters.push({
        attributeName: key,
        min: min,
        max: max,
        value: min,
        isPrimary: isPrimary,
        enabled: isPrimary,
        type: 'continuous',
        threshold: th
      })
    } else if (value.type === 'boolean') {
      filters.push({
        attributeName: key,
        isPrimary: false,
        enabled: false,
        type: 'boolean'
      })
    }
  }

  return [network, filters]
}
