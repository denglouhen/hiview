import React, { Component } from 'react'
import { browserHistory } from 'react-router'
import CyNetworkViewer from 'cy-network-viewer'
import { SigmaRenderer } from 'cytoscapejs-renderer'
import { CircularProgress } from 'material-ui/Progress'

// For context menu
import { ContextMenuTrigger } from 'react-contextmenu'
import NetworkContextMenu from '../NetworkContextMenu'

import CirclePackingPanel from '../CirclePackingPanel'

import { Map } from 'immutable'

const MYGENE_URL = 'http://mygene.info/v3'
const NDEX_LINK_TAG = 'ndex_internalLink'

const Viewer = CyNetworkViewer(SigmaRenderer)

const progressStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  height: '100%',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  backgroundColor: 'rgba(0,0,0,0.2)',
  zIndex: 1000
}

const styles = theme => ({
  progress: progressStyle
})

class NetworkPanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      updating: false,
      networkUrl: '',
      hoverNode: null
    }
  }

  setGeneProps = geneName => {
    // Just fetch property
    const myGeneUrl = MYGENE_URL + '/query?q='
    const qUrl = myGeneUrl + geneName + '&fields=all&size=1'
    this.props.propertyActions.fetchPropertyFromUrl(geneName, qUrl, 'gene')
  }

  selectNodes = (nodeIds, nodeProps) => {
    // First node in the selection
    const nodeId = nodeIds[0]
    const props = nodeProps[nodeId].props

    const newSelectionState = {
      networkId: 'main',
      nodeId: nodeId,
      nodeProps: props
    }

    this.props.selectionActions.selectNode(newSelectionState)

    const nodeTypeTag = 'NodeType'
    let nodeType = props[nodeTypeTag]
    if (nodeType === null || nodeType === undefined) {
      nodeType = props['nodeType']
    }

    if (nodeType === null || nodeType === undefined) {
      // Error handler will be here...
      return
    }

    if (nodeType === 'Gene') {
      this.setGeneProps(props.Label)
      return
    }

    // From NDEx to CYJS converter
    const linkEntry = props[NDEX_LINK_TAG]
    if (linkEntry === undefined) {
      return
    }

    const linkId = linkEntry.split('(')[1].replace(')', '')

    const link = this.props.cxtoolUrl + linkId + '?server=test'
    console.log('----------------- Selected3 -----------------')

    console.log(props)
    window.setTimeout(() => {
      this.props.eventActions.selected(nodeProps[nodeIds[0]])

      if (props.Size < 500) {
        // Directly set prop from node attributes
        this.props.rawInteractionsActions.fetchInteractionsFromUrl(
          link,
          this.props.maxEdgeCount
        )
        this.props.propertyActions.setProperty(props.id, props, 'term')
      }
    }, 0)
  }

  selectEdges = (edgeIds, edgeProps) => {
    console.log('====== Custom edge select function called! ========')
    console.log('Selected Edge ID: ' + edgeIds)
    console.log(edgeProps)
  }

  // Callback
  commandFinished = (lastCommand, result = {}) => {
    console.log('Custom command handler: Command Finished: ' + lastCommand)
    console.log(result)

    if (lastCommand === 'findPath') {
      const path = result

      if (path !== undefined && path.notFound) {
        this.props.commandActions.zoomToNode(path.startId)
        return
      }

      this.props.currentPathActions.setPath(path)

      if (path !== undefined && path.length !== 0 && path.length !== 1) {
        if (path[0] !== undefined) {
          const start = path[0].id
          this.props.commandActions.zoomToNode(start)
        } else {
        }
      }
    }
  }

  hoverOnNode = (nodeId, nodeProps) => {
    this.setState({ hoverNode: nodeProps })
  }

  // Then use it as a custom handler
  getCustomEventHandlers = () => ({
    selectNodes: this.selectNodes,
    selectEdges: this.selectEdges,
    commandFinished: this.commandFinished,
    hoverOnNode: this.hoverOnNode
  })

  handleBack = () => {
    browserHistory.push('/')
  }

  // Initialize
  componentWillMount() {
    // const url = this.props.trees[this.props.currentNetwork.id].url
    const uuid = this.props.datasource.get('uuid')
    const url = this.props.cxtoolUrl + uuid + '?server=test'

    this.setState({ networkUrl: url })
    this.props.networkActions.fetchNetworkFromUrl(url)
  }

  componentWillReceiveProps(nextProps) {
    const uuid = this.props.datasource.get('uuid')
    const nextUuid = nextProps.datasource.get('uuid')

    const url = this.props.cxtoolUrl + uuid + '?server=test'
    const network = this.props.network.get(url)

    const search = this.props.search
    const nextSearch = nextProps.search

    if (search.result !== nextSearch.result) {
      console.log('+++ Search result updated')

      // Select result
      const selectedIds = nextSearch.result
      if (selectedIds !== undefined && selectedIds !== null) {
        this.props.commandActions.select(selectedIds)
      }
    }

    if (url !== undefined && (network === undefined || network === null)) {
      // Need to fetch network data
      if (nextUuid !== uuid) {
        this.props.networkActions.fetchNetworkFromUrl(newUrl)
      }
    } else {
      // Check selection state
      const newSelection = nextProps.selection
      const selection = this.props.selection

      const nextRawSelection = newSelection.get('raw')
      const rawSelection = selection.get('raw')
      if (rawSelection === undefined || nextRawSelection === undefined) {
        return
      }

      const newId = nextRawSelection.nodeId
      const originalId = rawSelection.nodeId

      if (newId !== originalId) {
        const geneName = nextRawSelection.nodeProps.name
        const networkProp = this.props.network
        const networkData = networkProp.get(this.state.networkUrl)
        const targetNodeId = networkData.label2id[geneName]
        // this.props.commandActions.zoomToNode(targetNodeId)
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.height !== nextProps.height) {
      return true
    }

    if (
      this.props.uiState.get('changeViewer') !==
      nextProps.uiState.get('changeViewer')
    ) {
      console.log('!!!!!!!!!! CHANGE VIEW !!!!!!!!!!!!!!!!!')
      return true
    }

    if (this.props.rawInteractions !== nextProps.rawInteractions) {
      console.log('!!!!!!!!!! NEWNETWORK !!!!!!!!!!!!!!!!!')
      return true
    }

    if (nextProps.commands.target === 'subnet') {
      return false
    }

    if (this.state.hoverNode !== nextState.hoverNode) {
      return true
    }

    if (!this.props.renderingOptions.equals(nextProps.renderingOptions)) {
      return true
    }

    if (
      nextProps.network.get('loading') === this.props.network.get('loading')
    ) {
      // Check commands difference

      if (this.props.commands !== nextProps.commands) {
        return true
      }

      return false
    }
    return true
  }

  render() {
    const loading = this.props.network.get('loading')
    const networkProp = this.props.network
    const networkData = networkProp.get(this.state.networkUrl)


    console.log('!!! NP render: ', this.props)

    if (loading) {
      let message = 'Loading hierarchy.  Please wait...'

      console.log('ND::: ', networkData)

      if (networkData !== undefined) {
        message = 'Data Loaded!'
      }

      return (
        <div style={progressStyle}>
          <h2>{message}</h2>
          <CircularProgress size={500} />
        </div>
      )
    }

    let commands = this.props.commands
    if (commands.target === 'subnet') {
      commands = Map({ command: '', parameters: {} })
    }

    const networkAreaStyle = {
      position: 'fixed',
      top: 0,
      right: 0,
      width: this.props.width,
      height: this.props.height
    }

    const circleAreaStyle = {
      position: 'fixed',
      top: 0,
      left: 0,
      width: this.props.width,
      height: this.props.height,
      background: 'red'
    }

    // Default layout
    const rendOpts = {
      layout: 'preset',
      sigmaOptions: this.props.renderingOptions.toJS()
    }

    if (this.props.uiState.get('changeViewer')) {
      return (
        <div style={{ width: '100%', height: this.props.height }}>
          <ContextMenuTrigger id="networkContextMenu">
            <Viewer
              key="mainView"
              network={networkData}
              networkType={'cyjs'}
              style={networkAreaStyle}
              // networkStyle={style}
              eventHandlers={this.getCustomEventHandlers()}
              command={commands}
              rendererOptions={rendOpts}
            />
          </ContextMenuTrigger>

          <NetworkContextMenu
            hoverNode={this.state.hoverNode}
            commandActions={this.props.commandActions}
          />
        </div>
      )
    } else {
      return (
        <div style={{ width: '100%', height: this.props.height }}>
          <CirclePackingPanel
            {...this.props}
            network={networkData}
            groups={this.props.rawInteractions.get('groups')}
            style={circleAreaStyle}
            selectPrimaryNode={this.selectNodes}
            commandActions={this.props.commandActions}
          />
        </div>
      )
    }
  }
}

export default NetworkPanel
