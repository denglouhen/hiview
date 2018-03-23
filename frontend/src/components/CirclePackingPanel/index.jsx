import React, { Component } from 'react'
import { CirclePackingRenderer, CyTreeViewer } from 'cy-tree-viewer'
import cyjs2tree from './cyjs2tree'
import { Set } from 'immutable'

const TreeViewer = CyTreeViewer(CirclePackingRenderer)

class CirclePackingPanel extends Component {
  state = {
    tree: null,
    hover: null,
    hoverNodes: null,
    selectedGroups: Set(),
    selectedGenes: Set()
  }

  componentDidMount() {
    const tree = cyjs2tree(this.props.network)
    this.setState({
      tree
    })
  }

  selectGroups = (id, data, groups, actions) => {
    if (data.props === undefined) {
      return
    }

    if (data.props.name === undefined) {
      return
    }

    console.log(data)
    const name = data.props.name.split('.')[0]
    const geneIds = groups[name]

    if (geneIds === null || geneIds === undefined) {
      return
    }

    console.log('$$$$$$$$$$$$$$$$ADDED ID')
    this.setState({
      selectedGroups: this.state.selectedGroups.add(id)
    })

    console.log(this.state.selectedGroups)

    geneIds.forEach(gene => this.state.selectedGenes.add(gene))

    window.setTimeout(() => {
      actions.selectNodes({
        idList: [...this.state.selectedGenes],
        selectedColor: 'green'
      })
    }, 0)
  }

  getEventHandlers = () => {
    const selectNode = (id, data, zoom) => {
      const wrappedData = {
        props: data
      }

      if (zoom) {
        // Move focus to new node

        // Clear all selected nodes
        this.setState({
          hover: null,
          hoverNodes: null,
          selectedGroups: Set(),
          selectedGenes: Set()
        })

        this.props.selectPrimaryNode([id], { [id]: wrappedData })
      } else {
        this.selectGroups(
          id,
          wrappedData,
          this.props.groups,
          this.props.interactionsCommandActions
        )
      }
      // this.props.commandActions.zoomToNode(id)
    }

    const deselectNode = id => {
      if (id === null) {
        return
      }

      if (this.state.hoverNodes !== null) {
        if (!this.state.selectedGroups.has(id)) {
          this.props.interactionsCommandActions.unselectNodes({
            idList: this.state.hoverNodes
          })
        }
      }
    }

    const hoverOutNode = (id, data) => {
      // Case 1: No permanent selection
      if (this.state.hoverNodes === null) {
        return
      }

      // Case 2: Hover, but no permanent selection
      if (this.state.selectedGenes.size === 0) {
        this.props.interactionsCommandActions.unselectNodes({
          idList: this.state.hoverNodes
        })

        this.setState({
          hover: null,
          hoverNodes: null
        })

        return
      }

      // Case 3: permanent selection is not empty

      const hoverSelectionSet = Set(this.state.hoverNodes)
      const permanentSelectionSet = this.state.selectedGenes

      // this.props.interactionsCommandActions.unselectNodes({
      //   idList: this.state.hoverNodes
      // })
      //
      // window.setTimeout(() => {
      //   this.props.interactionsCommandActions.selectNodes({
      //     idList: [...this.state.selectedGenes],
      //     selectedColor: 'green'
      //   })
      // }, 0)
    }

    const hoverOnNode = (id, data) => {

      this.props.selectionActions.enterNode(data)

      if (
        data === null ||
        data.props === null ||
        data.props.name === undefined
      ) {
        return
      }

      console.log('DATA::: ', data)
      if(data.NodeType === 'Gene') {
        console.log([id])
        this.setState({
          hover: id,
          hoverNodes: [id]
        })

        this.props.interactionsCommandActions.selectNodes({
          idList: [id],
          selectedColor: 'red'
        })

      }

      const name = data.props.name.split('.')[0]
      const groups = this.props.groups
      if (groups === undefined) {
        return
      }

      const geneIds = groups[name]

      if (geneIds === null || geneIds === undefined) {
        return
      }

      if (this.state.selectedGroups.has(id)) {
        return
      }

      console.log("GENE SET: ", geneIds)
      this.setState({
        hover: id,
        hoverNodes: geneIds
      })


      this.props.interactionsCommandActions.selectNodes({
        idList: geneIds,
        selectedColor: 'red'
      })
    }

    return {
      selectNode,
      hoverOutNode,
      hoverOnNode,
      deselectNode
    }
  }

  render() {
    return (
      <div
        ref={containerElement => (this.containerElement = containerElement)}
        style={this.props.style}
      >
        {this.state.tree === null ? (
          <div />
        ) : (
          <TreeViewer
            selected={this.props.search.result}
            tree={this.state.tree}
            eventHandlers={this.getEventHandlers()}
            width={this.props.style.width}
            height={this.props.style.height}
          />
        )}
      </div>
    )
  }
}

const handleClick = (nodeId, props) => {
  props.commandActions.zoomToNode(nodeId)
}

export default CirclePackingPanel