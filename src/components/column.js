'use strict';

import React, { Component } from 'react';

export default ColumnComponent => class extends Component {
  render() {
    const columnStyle = Object.assign({}, this.props.styles.inlineStyles.column, { padding: (this.props.rowData.__metadata.depth || 0) * 5 + 5 });
    const inlineStyles = Object.assign({}, this.props.styles.inlineStyles, { column: columnStyle });
    const styles = Object.assign({}, this.props.styles, { inlineStyles });

    return <ColumnComponent {...this.props} styles={styles} onClick={this._expandRow} />
  }

  _expandRow = () => {
    this.props.events.expandRow(this.props.rowData.__metadata.griddleKey)
  }
};
