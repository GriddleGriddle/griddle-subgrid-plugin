'use strict';

import React from 'react';

class TableBody extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  shouldComponentUpdate(nextProps) {
    return this.props.data !== nextProps.data;
  }


  getRows(rowData) {
    return rowData
      .filter(data => data.visible === undefined || data.visible === true)
      .map((data, index) =>
        this.getRow(data, index)
      );
  }

  getRow(data, index) {
    let rows = [<this.props.components.Row rowData={data}
      components={this.props.components}
      events={this.props.events}
      rowIndex={index}
      rowProperties={this.props.renderProperties.rowProperties}
      tableProperties={this.props.tableProperties}
      ignoredColumns={this.props.renderProperties.ignoredColumns}
      settings={this.props.settings}
      styles={this.props.styles}
      columnProperties={this.props.renderProperties.columnProperties} />
    ];

    if(data.children && data.children.length > 0 && data.__metadata.expanded) {
      rows.push(this.getRows(data.children));
    }

    return rows;
  }


  render() {
    var rows = this.getRows(this.props.data);
    return (
      <tbody>
        {rows}
      </tbody>
    );
  }
}

//Plugins expect a function
export default Component => TableBody;
