import React, { Component } from 'react'
import { withStyles } from '@material-ui/core/styles'

import MenuItem from '@material-ui/core/MenuItem'
import FormHelperText from '@material-ui/core/FormHelperText'
import FormControl from '@material-ui/core/FormControl'
import Select from '@material-ui/core/Select'

import Button from '@material-ui/core/Button'

import ApplyIcon from '@material-ui/icons/Refresh'
import FitContent from '@material-ui/icons/ZoomOutMap'
import FitSelected from '@material-ui/icons/CenterFocusStrong'

// Base style
const styles = theme => ({
  root: {
    color: '#333333',
    background: '#EEEEEE',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  formControl: {
    padding: '1em',
    minWidth: '17em',
    width: '100%'
  },
  button: {
    marginRight: '0.5em'
  },
  icon: {
    fontSize: '2em'
  }
})

const LAYOUTS = {
  PRESET: 'preset',
  COSE: 'cose-bilkent',
  GRID: 'grid',
  CIRCLE: 'circle',
  COCENTRIC: 'concentric',
  BREADTHFIRST: 'breadthfirst'
}

class LayoutSelector extends Component {
  constructor(props) {
    super(props)
    this.state = {
      layout: LAYOUTS.COSE
    }
  }

  handleChange = name => event => {
    this.setState({ [name]: event.target.value })
  }

  handleClick = event => {
    const layoutName = this.state.layout

    const extAction = this.props.externalNetworksActions
    if (extAction !== undefined && extAction !== null) {
      extAction.setLayout(layoutName)
    }

    if (this.props.commandActions.applyLayout !== undefined) {
      this.props.commandActions.applyLayout({
        name: layoutName,
        options: {}
      })
    }
  }

  handleFit = event => {
    this.props.commandActions.fit()

    // This is for other networks' view
    const extAction = this.props.externalNetworksActions
    if (extAction !== undefined && extAction !== null) {
      extAction.setCommand('fit')
    }
  }

  handleFitSelected = event => {
    console.log('fitSelected:')
    this.props.commandActions.fitSelected()
  }

  render() {
    const { classes } = this.props

    return (
      <div className={classes.root}>
        <FormControl className={classes.formControl}>
          <Select
            fullWidth
            value={this.state.layout}
            onChange={this.handleChange('layout')}
          >
            <MenuItem value={LAYOUTS.COSE}>COSE (Force-Directed)</MenuItem>
            <MenuItem value={LAYOUTS.GRID}>Grid</MenuItem>
            <MenuItem value={LAYOUTS.CIRCLE}>Circle</MenuItem>
            <MenuItem value={LAYOUTS.COCENTRIC}>Cocentric</MenuItem>
            <MenuItem value={LAYOUTS.BREADTHFIRST}>Breadthfirst</MenuItem>
          </Select>
          <FormHelperText>Select a layout algorithm</FormHelperText>
        </FormControl>

        <Button
          className={classes.button}
          variant="contained"
          color="primary"
          onClick={this.handleClick}
          size="small"
        >
          <ApplyIcon className={classes.icon} />
        </Button>

        <Button
          className={classes.button}
          variant="contained"
          color="default"
          onClick={this.handleFit}
          size="small"
        >
          <FitContent className={classes.icon} />
        </Button>

        <Button
          className={classes.button}
          variant="contained"
          color="default"
          onClick={this.handleFitSelected}
          size="small"
        >
          <FitSelected className={classes.icon} />
        </Button>
      </div>
    )
  }
}

export default withStyles(styles)(LayoutSelector)
