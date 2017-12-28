import React, { Component } from "react";
import Collapse from "material-ui/transitions/Collapse";
import List, {
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemIcon,
  ListItemText
} from "material-ui/List";
import Avatar from "material-ui/Avatar";
import Button from "material-ui/Button";

import PlaceIcon from "material-ui-icons/Place";
import NavigationIcon from "material-ui-icons/Navigation";

import PathList from "./PathList";

class AliasList extends Component {
  state = {};

  componentWillReceiveProps(nextProps) {
    const newPath = nextProps.currentPath;
    console.log("NEW PATH=========================");
    console.log(newPath);

    if (newPath !== undefined && newPath !== null) {
      const path = newPath.get("currentPath");

      if(path === undefined || path === null || path.length === 0) {
        return
      }

      this.setState({ [path[0].id]: path });
    }
  }

  render() {
    const aliases = this.props.aliases;
    const keys = Object.keys(aliases);

    return (
      <List disablePadding style={{ paddingLeft: "4em" }}>
        {keys.map((key, i) => (
          <div>
            <ListItem key={i}>
              <ListItemAvatar>
                <Avatar>
                  <PlaceIcon />
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={"Path " + (i + 1)}
                secondary={"Node ID: " + key}
              />
              <ListItemSecondaryAction>
                <Button
                  aria-label="Find path"
                  raised
                  color="secondary"
                  onClick={e => this.handleClick(key)}
                >
                  <NavigationIcon />
                  Find Path
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
            <Collapse component="li" in={true} timeout="auto" unmountOnExit>
              <PathList
                path={this.state[key]}
                commandActions={this.props.commandActions}
              />
            </Collapse>
          </div>
        ))}
      </List>
    );
  }

  handleClick = nodeId => {
    this.props.commandActions.findPath([nodeId, this.props.rootId]);
  };
}

export default AliasList;