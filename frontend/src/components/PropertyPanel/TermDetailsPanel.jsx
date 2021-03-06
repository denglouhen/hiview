import React, { Component } from 'react'

import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'

import RawInteractionPanel from './RawInteractionPanel'
import SubsystemPanel from './SubsystemPanel'

import TabContainer from './TabContainer'
import { EdgeFilter, PrimaryFilter } from '../Filters'

import GeneList from './GeneList'

import * as StyleFactory from './StyleFactory'

import LayoutSelector from '../LayoutSelector'
import EmptyInteractionPanel from './EmptyInteractionPanel.jsx'
import MaxEdgePanel from './MaxEdgePanel'
import MessageBar from './MessageBar'

import CrossFilter from '../CrossFilter'
import SplitPane from 'react-split-pane'
import LoadingPanel from './LoadingPanel'
import AutoLoadThresholdPanel from './AutoLoadThresholdPanel'
import LargeNetworkWarningPanel from './LargeNetworkWarningPanel'
import InteractionNetworkSelector from '../InteractionNetworkSelector'
import CytoscapeViewer from '../CytoscapeViewer'

import { makeStyles } from '@material-ui/core/styles'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import Typography from '@material-ui/core/Typography'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

const WARNING_TH = 2000000

const filterPanelStyle = {
  display: 'inline-flex',
  boxSizing: 'border-box',
  width: '100%',
  padding: '0.6em',
  background: '#FFFFFF'
}

const controlPanelStyle = {
  boxSizing: 'border-box'
}

const layoutPanelStyle = {
  background: '#EEEEEE'
}

const controllerStyle = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '6em',
  background: '#EEEEEE'
}

const headingStyle = {
  fontSize: '1em',
  fontWeight: 400
}

class TermDetailsPanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      loaded: false,
      subtree: {},
      scoreFilter: 1.0,
      subnet: {},
      selectedTab: 0,
      networkPanelHeight: window.innerHeight * 0.5
    }
  }

  addStyle(rawInteractions) {
    const networkStyle = StyleFactory.createStyle(rawInteractions)

    this.props.interactionStyleActions.addStyle({
      name: 'defaultStyle',
      style: networkStyle
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.rawInteractions !== this.props.rawInteractions) {
      this.addStyle(nextProps.rawInteractions)
    }
  }

  setScore = val => {
    this.setState({ scoreFilter: val })

    this.props.commandActions.filter({
      options: {
        type: 'numeric',
        range: 'edge[score > ' + val + ']'
      },
      target: 'subnet'
    })
  }

  handleResize = e => {
    //resize
    this.props.interactionsCommandActions.fit()
  }

  handleHorizontalResize = topHeight => {
    this.setState({
      networkPanelHeight: topHeight
    })
  }

  render() {
    // Still loading interaction...
    const raw = this.props.rawInteractions.toJS()
    const loading = raw['loading']
    if (loading) {
      return <LoadingPanel message={raw['message']} />
    }

    const summary = raw.summary
    // const autoLoadTh = WARNING_TH
    const autoLoadTh = raw.autoLoadThreshold
    const locationParams = this.props.location
    const uuid = this.props.routeParams.uuid
    let serverType = locationParams.query.type
    const url = this.props.cxtoolUrl + uuid + '?server=' + serverType

    const interactions = raw.interactions
    const selected = raw.selected
    // Permanent selection
    const selectedPerm = raw.selectedPerm

    // Term property
    const details = this.props.currentProperty
    if (
      details === undefined ||
      details === null ||
      details.id === null ||
      details.id === undefined
    ) {
      return <div />
    }

    // This is the details about current subsystem
    let hidden = false
    const data = details.data
    if (!data['ndex_internalLink']) {
      // No interaction data
      hidden = false
    }

    let geneList = []

    // Special case: GO term
    // TODO: better alternative to generalize this?
    if (data.name !== undefined && data.name.startsWith('GO:')) {
      // console.log('GO Term:', data.name)
      hidden = false
    }

    let subnet = null
    subnet = interactions

    if (subnet !== null && subnet !== undefined) {
      geneList = subnet.elements.nodes.map(node => node.data.name)
    } else {
      const geneMap = this.props.network.get('geneMap')
      const label = data.Label
      const geneSet = geneMap.get(label)

      if (geneSet === undefined) {
        geneList = []
      } else {
        geneList = [...geneSet]
      }
    }

    const title = data.name
    let networkProps = {}
    if (interactions) {
      networkProps = interactions.data
    }

    const visualStyle = this.props.interactionStyle.get('defaultStyle')
    if (visualStyle !== null && visualStyle !== undefined) {
      visualStyle.name = 'defaultStyle'
    }

    const network = this.props.network.get(url)

    let networkData = {}
    if (network !== undefined || network === null) {
      networkData = network.data
    }

    const bottomStyle = {
      boxSizing: 'border-box',
      width: '100%',
      height: window.innerHeight - this.state.networkPanelHeight,
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      overflowY: 'auto'
    }

    // Calculate
    const topHeight = this.state.networkPanelHeight
    const allProps = this.props

    const selectedExternalNetwork = this.props.externalNetworks
      .selectedNetworkUuid

    return (
      <SplitPane
        split="horizontal"
        minSize={50}
        size={this.state.networkPanelHeight}
        onDragFinished={topHeight => this.handleHorizontalResize(topHeight)}
      >
        <div
          style={{
            boxSizing: 'border-box',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <MessageBar
            height={50}
            network={this.props.network}
            title={this.props.title}
            titleColor={this.props.color}
            originalEdgeCount={this.props.originalEdgeCount}
            maxEdgeCount={this.props.maxEdgeCount}
          />

          {this.getNetworkPanel(
            hidden,
            topHeight,
            selectedExternalNetwork,
            interactions,
            selected,
            selectedPerm,
            visualStyle,
            raw
          )}
        </div>

        <div style={bottomStyle}>
          {this.props.expanded ? <div style={{ height: '5.2em' }} /> : <div />}

          {hidden ? (
            <div />
          ) : (
            <div style={controlPanelStyle}>
              <InteractionNetworkSelector genes={geneList} {...allProps} />
              {this.getControllers(
                selectedExternalNetwork,
                layoutPanelStyle,
                networkProps,
                controllerStyle,
                raw
              )}
            </div>
          )}

          {hidden || selectedExternalNetwork ? (
            <div />
          ) : (
            <div style={filterPanelStyle}>
              <EdgeFilter
                filters={raw.filters}
                commandActions={this.props.interactionsCommandActions}
                commands={this.props.interactionsCommands}
                filtersActions={this.props.filtersActions}
                networkData={networkProps}
                uiState={this.props.uiState}
                uiStateActions={this.props.uiStateActions}
              />
            </div>
          )}

          <div>
            <Tabs value={this.state.selectedTab} onChange={this.handleChange}>
              <Tab label="Subsystem Details" />
              <Tab label="Assigned Genes" />
            </Tabs>
          </div>

          {this.state.selectedTab === 0 && (
            <TabContainer>
              <SubsystemPanel
                selectedTerm={this.props.currentProperty}
                networkData={networkData}
                title={title}
                description={'N/A'}
              />
            </TabContainer>
          )}
          {this.state.selectedTab === 1 && (
            <TabContainer>
              <GeneList genes={geneList} {...allProps} />
            </TabContainer>
          )}
          {this.state.selectedTab === 2 && <TabContainer>N/A</TabContainer>}
        </div>
      </SplitPane>
    )
  }

  getControllers = (
    externalNetwork,
    layoutPanelStyle,
    networkProps,
    controllerStyle,
    raw
  ) => {
    if (externalNetwork !== null) {
      const others = this.props
      return (
        <LayoutSelector
          style={layoutPanelStyle}
          commandActions={this.props.interactionsCommandActions}
          {...others}
        />
      )
    }

    return (
      <React.Fragment>
        <LayoutSelector
          style={layoutPanelStyle}
          commandActions={this.props.interactionsCommandActions}
        />

        <ExpansionPanel>
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1a-content"
            id="panel1a-header"
          >
            <Typography>Primary Score Filter</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <CrossFilter
              panelWidth={this.props.width * 0.9}
              networkData={networkProps}
              originalEdgeCount={this.props.originalEdgeCount}
              maxEdgeCount={this.props.maxEdgeCount}
              filters={raw.filters}
              commandActions={this.props.interactionsCommandActions}
              commands={this.props.interactionsCommands}
              filtersActions={this.props.filtersActions}
            />
          </ExpansionPanelDetails>
        </ExpansionPanel>

        <div style={controllerStyle}>
          <AutoLoadThresholdPanel
            autoLoadThreshold={this.props.autoLoadThreshold}
            rawInteractionsActions={this.props.rawInteractionsActions}
          />
          <MaxEdgePanel
            maxEdgeCount={this.props.maxEdgeCount}
            uiState={this.props.uiState}
            uiStateActions={this.props.uiStateActions}
            rawInteractionsActions={this.props.rawInteractionsActions}
          />
        </div>
      </React.Fragment>
    )
  }

  getNetworkPanel = (
    hidden,
    topHeight,
    externalNetwork,
    interactions,
    selected,
    selectedPerm,
    visualStyle,
    raw
  ) => {
    if (hidden) {
      return <EmptyInteractionPanel height={topHeight} />
    }

    if (externalNetwork === null || externalNetwork === undefined) {
      return (
        <RawInteractionPanel
          subnet={interactions}
          subnetSelected={selected}
          subnetSelectedPerm={selectedPerm}
          selectedTerm={this.props.currentProperty.id}
          handleClose={this.props.handleClose}
          commandActions={this.props.interactionsCommandActions}
          commands={this.props.interactionsCommands}
          loading={raw.loading}
          selection={this.props.selection}
          selectionActions={this.props.selectionActions}
          filters={raw.filters}
          interactionStyleActions={this.props.interactionStyleActions}
          networkStyle={visualStyle}
          panelWidth={this.props.width}
          expanded={this.props.expanded}
          enrichment={this.props.enrichment}
          enrichmentActions={this.props.enrichmentActions}
          uiState={this.props.uiState}
          hierarchy={this.props.network.get('hierarchy')}
        />
      )
    } else {
      const allProps = this.props
      return <CytoscapeViewer {...allProps} />
    }
  }

  handleChange = (event, value) => {
    this.setState({ selectedTab: value })
  }
}

export default TermDetailsPanel
