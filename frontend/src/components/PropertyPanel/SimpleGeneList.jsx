import React, {Component, PropTypes} from 'react'

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListSubheader from '@material-ui/core/ListSubheader';

class SimpleGeneList extends Component {

  render() {

    let genes = this.props.genes
    if (genes === undefined || genes === null) {
      genes = []
    }

    return (

      <div>
        <List>
          <ListSubheader>Assigned Genes:</ListSubheader>

          {
            genes.map((gene, i) => {
            return (<ListItem key={i} hoverColor={'#80CBC4'} primaryText={gene}/>)
          })
}
        </List>
      </div>
    )
  }

  _handleTouchTap = id => {
    window.open('http://www.yeastgenome.org/locus/' + id);
  }

}

export default SimpleGeneList
