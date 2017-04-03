import {States} from '../../states.service';
import {opServicesModule} from '../../../angular-modules';
import {State} from '../../../helpers/reactive-fassade';
import {WPTableRowSelectionState, WorkPackageTableRow} from '../wp-table.interfaces';
import {WorkPackageResource} from '../../api/api-v3/hal-resources/work-package-resource.service';

export class WorkPackageTableSelection {

  public selectionState:State<WPTableRowSelectionState>;

  constructor(public states: States) {
    this.selectionState = states.table.selection;

    if (this.selectionState.isPristine()) {
      this.reset();
    }
  }

  public isSelected(workPackageId:string) {
    return this.currentState.selected[workPackageId];
  }

  /**
   * Select all work packages
   */
  public selectAll(rows: string[]) {
    const state:WPTableRowSelectionState = this._emptyState;

    rows.forEach((workPackageId:string) => {
      state.selected[workPackageId] = true;
    });

    this.selectionState.put(state);
  }

  /**
   * Get the current work package resource form the selection state.
   */
  public getSelectedWorkPackages():WorkPackageResource[] {
    let wpState = this.states.workPackages;
    return this.getSelectedWorkPackageIds().map(id => wpState.get(id).value as WorkPackageResource);
  }

  public getSelectedWorkPackageIds():string[] {
    let selected:string[] = [];

    _.each(this.currentState.selected, (isSelected:boolean, wpId:string) => {
      if (isSelected) {
        selected.push(wpId);
      }
    });

    return selected;
  }

  /**
   * Reset the selection state to an empty selection
   */
  public reset() {
    this.selectionState.put(this._emptyState);
  }

  /**
   * Get current selection state.
   * @returns {WPTableRowSelectionState}
   */
  public get currentState():WPTableRowSelectionState {
    return this.selectionState.getCurrentValue() as WPTableRowSelectionState;
  }

  /**
   * Return the number of selected rows.
   */
  public get selectionCount():number {
    return _.size(this.currentState.selected);
  }

  /**
   * Switch the current focused work package to the given id,
   * setting selection and focus on this WP.
   */
  public focusOn(workPackgeId:string) {
    let newState = this._emptyState;
    newState.selected[workPackgeId] = true;
    this.selectionState.put(newState);
    this.states.focusedWorkPackage.put(workPackgeId);
  }

  /**
   * Toggle a single row selection state and update the state.
   * @param workPackageId
   */
  public toggleRow(workPackageId:string) {
    let isSelected = this.currentState.selected[workPackageId];
    this.setRowState(workPackageId, !isSelected);
  }

  /**
   * Force the given work package's selection state. Does not modify other states.
   * @param workPackageId
   * @param newState
   */
  public setRowState(workPackageId:string, newState:boolean) {
    let state = this.currentState;
    state.selected[workPackageId] = newState;
    this.selectionState.put(state);
  }

  /**
   * Override current selection with the given work package id.
   */
  public setSelection(row:WorkPackageTableRow) {
    let state:WPTableRowSelectionState = {
      selected: {},
      activeRowIndex: row.position
    };
    state.selected[row.workPackageId] = true;

    this.selectionState.put(state);
  }

  /**
   * Select a number of rows from the current `activeRowIndex`
   * to the selected target.
   * (aka shift click expansion)
   * @param rows Current visible rows
   * @param selected Selection target
   */
  public setMultiSelectionFrom(rows:string[], selected:WorkPackageTableRow) {
    let state = this.currentState;

    if (this.selectionCount === 0) {
      state.selected[selected.workPackageId] = true;
      state.activeRowIndex = selected.position;
    } else if (state.activeRowIndex !== null) {
      let start = Math.min(selected.position, state.activeRowIndex);
      let end = Math.max(selected.position, state.activeRowIndex);

      rows.forEach((workPackageId, i) => {
        state.selected[workPackageId] = i >= start && i <= end;
      });
    }

    this.selectionState.put(state);
  }


  private get _emptyState():WPTableRowSelectionState {
    return {
      selected: {},
      activeRowIndex: null
    };
  }
}

opServicesModule.service('wpTableSelection', WorkPackageTableSelection);
