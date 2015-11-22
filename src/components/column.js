'use strict';

import React, { Component } from 'react';

export default ColumnComponent => class extends Component {
  render() {
    const styles = Object.assign({
      padding: (this.props.depth || 0) * 5
    }, this.props.styles);

    return <ColumnComponent {...this.props} styles={styles} onClick={this._expandRow} />
  }

  _expandRow = () => {
    this.props.events.expandRow(this.props.rowData.griddleKey)
  }
};
