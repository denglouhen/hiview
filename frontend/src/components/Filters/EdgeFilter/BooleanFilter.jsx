import React, { Component } from "react";

import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from '@material-ui/core/FormControlLabel';

import BaseFilter from "./BaseFilter";

const filterRowStyle = {
  padding: "1em",
  width: "100%",
  height: "0.8em",
  display: "flex",
  alignItems: "center"
};

class BooleanFilter extends BaseFilter {
  render() {
    return (
      <div style={filterRowStyle}>
        <FormControlLabel
          style={{ width: "95%" }}
          control={
            <Checkbox
              disabled={this.state.disabled}
              style={{
                width: "1em",
                height: "1em",
                paddingRight: '0.2em',
                color: this.state.labelColor
              }}
              checked={this.state.checked}
              onChange={this.filterSelected}
              value={this.props.label}
            />
          }
          label={this.props.label}
        />
      </div>
    );
  }
}

export default BooleanFilter;
