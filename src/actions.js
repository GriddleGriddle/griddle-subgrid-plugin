import * as types from './constants';

export function expandRow(griddleKey){
  return {
    type: types.GRIDDLE_ROW_TOGGLED,
    griddleKey: griddleKey
  };
}