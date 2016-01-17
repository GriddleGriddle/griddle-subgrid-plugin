import Immutable from 'immutable';
import MAX_SAFE_INTEGER from 'max-safe-integer';
import extend from 'lodash.assign';

import { GriddleHelpers } from 'griddle-core';
const { data } = GriddleHelpers;
const { getVisibleDataColumns } = data;

/*
OVERALL TODO:
  fix column order
*/
function hasChildren(record, childrenPropertyName = 'children') {
  return (record.get(childrenPropertyName) && record.get(childrenPropertyName).size > 0)
}

function transform(data, state, childrenPropertyName = 'children') {
  let currentData = data;
  if(state.get('filter') && state.get('filter') !== '') {
    currentData = filterChildren(data, state.get('filter'), childrenPropertyName);
  }

  return currentData;
}

function sortChildren(data, state, helpers, childrenPropertyName = 'children') {
  const sortColumns = state.getIn(['sortProperties', 'sortColumns']);
  const sortAscending = state.getIn(['sortProperties', 'sortAscending']);
  const getSortedRows = (data, sort = false) => {
    const mappedData = data.map((row, index) => {
      return hasChildren(row) && row.getIn(['__metadata', 'expanded']) === true ?
        row.set('children', getSortedRows(row.get('children'), true)) :
        row
    });

    return sort ? helpers.getSortedData(mappedData, sortColumns, sortAscending) : mappedData;
  }

  if(!sortColumns || !helpers) { return data; }

  return getSortedRows(data)
}

export function AFTER_REDUCE(state, action, helpers) {
  const columns = helpers.getDataColumns(state, data);

  const properties = getProperties(columns);
  const data = transform(state.get('visibleData'), state, properties.childrenPropertyName);

  columns.push(properties.childrenPropertyName);

  return state
    .set('visibleData', sortChildren(helpers.getSortedColumns(getVisibleChildData(data, columns), columns), state, helpers, properties.childrenPropertyName), columns);
}

//TODO: Make this more efficient where it'll stop when it finds the record it's looking for
function toggleExpanded(data, griddleKey, childrenPropertyName = 'children') {
  return data.map(row => {
    let children = row.get(childrenPropertyName);

    if(children && children.size > 0) {
      children = toggleExpanded(children, griddleKey)
    }

    return row
      .set(childrenPropertyName, children)
      /* Sets the toggle status of the row either to what it is currently or the opposite if this is the one to toggle */
      .set('expanded', row.get('griddleKey') === griddleKey ?
        !row.get('expanded') :
        row.get('expanded'));
  })
}

export function GRIDDLE_ROW_TOGGLED(state, action, helpers) {
  const { griddleKey } = action;
  const columns = helpers.getDataColumns(state, state.get('data'));
  const properties = getProperties(columns);

  return state.set('data', toggleExpanded(state.get('data'), griddleKey, properties.childrenPropertyName));
}

//TODO: This is almost the same as the filterChildrenData method but not applying the filter method :/
function filterChildren(rows, filter, childrenPropertyName = 'children') {
  return rows.map(row => {
    let children = row.get(childrenPropertyName);

    if(children && children.size > 0) {
      children = filterChildrenData(row.get(childrenPropertyName), filter, childrenPropertyName)
    }

    return row
      .set(childrenPropertyName, children)
  });
}

function filterChildrenData(rows, filter, childrenPropertyName = 'children') {
  const values = rows.filter(row => {
    let children = row.get(childrenPropertyName);

    if(children && children.size > 0) {
      children = filterChildrenData(row.get(childrenPropertyName), filter, childrenPropertyName)
    }

    const hasMatch = (children && children.length > 0) || (Object.keys(row.toJSON())
      .some(key => {
        return row.get(key) && row.get(key).toString().toLowerCase().indexOf(filter.toLowerCase()) > -1
      }));

    return hasMatch;
  });
  return values;
}

export function GRIDDLE_LOADED_DATA_AFTER(state, action, helpers) {
  const data = state.get('data');

  const columns = helpers.getDataColumns(state, data);
  const newData = setRowProperties(data, getProperties(columns));

  return state.set('data', newData);
}

function getProperties(columns) {
  return extend({
    childrenPropertyName: 'children',
    columns: []
  }, columns);
}

function hasMetadata(data) {
  const metadata = data.get(0).get('__metadata');
  return metadata && metadata.size > 0;
}

//TODO: Refactor this logic -- This is probably way more expensive than it needs to be
export function getVisibleChildData(data, columns, childrenPropertyName = 'children') {
  //get the data and make sure metadata is applied
  const dataWithMetadata = hasMetadata(data) ?
    data :
    getVisibleDataColumns(data, columns);

  //go through each visible child row and set it to use the correct column settings
  return dataWithMetadata.map((row, index) => {
    let children = row.get(childrenPropertyName);

    if(children && children.size > 0) {
      children = getVisibleChildData(children, columns, childrenPropertyName);
    }

    return row
      .set('children', children);
  });
}

export function setRowProperties(data, properties, depth = 0, parentId = null) {
  let key = 0;
  const getKey = (() => key+= 1);

  return data.map((row, index) => {
    let children = row.get(properties.childrenPropertyName);
    let currentKey = parentId !== null ? `${parentId}.${getKey()}` : `${row.get('griddleKey')}`;

    if(children && children.size > 0) {
      children = setRowProperties(children, { childrenPropertyName: properties.childrenPropertyName, columns: properties.columns }, depth + 1, currentKey);
    }

    return row
      .sortBy((val, key) => properties.columns.indexOf(key))
      .set('children', children)
      .set('depth', depth)
      .set('griddleKey', currentKey)
      .set('parentId', parentId)
      .set('expanded', false)
      .set('hasChildren', children && children.size > 0);
  });
}
