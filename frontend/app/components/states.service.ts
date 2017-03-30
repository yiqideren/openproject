import {WorkPackageTimelineTableController} from "./wp-table/timeline/wp-timeline-container.directive";
import {WorkPackageTable} from "./wp-fast-table/wp-fast-table";
import {WPTableHierarchyState, WPTableRowSelectionState} from "./wp-fast-table/wp-table.interfaces";
import {MultiState, State} from "../helpers/reactive-fassade";
import {WorkPackageResource} from "./api/api-v3/hal-resources/work-package-resource.service";
import {opServicesModule} from "../angular-modules";
import {SchemaResource} from "./api/api-v3/hal-resources/schema-resource.service";
import {TypeResource} from "./api/api-v3/hal-resources/type-resource.service";
import {WorkPackageEditForm} from "./wp-edit-form/work-package-edit-form";
import {WorkPackageTableMetadata} from "./wp-fast-table/wp-table-metadata";
import {Subject} from "rxjs";
import {Component} from "reactivecomponents";
import {createNewContext} from "../../node_modules/reactivecomponents/dist/Context";
import {whenDebugging} from "../helpers/debug_output";

export class States extends Component {

  /* /api/v3/work_packages */
  workPackages = new MultiState<WorkPackageResource>();

  /* /api/v3/schemas */
  schemas = new MultiState<SchemaResource>();

  /* /api/v3/types */
  types = new MultiState<TypeResource>();

  // Work package table states
  table = {
    // Metadata of the current table result
    // (page, links, grouping information)
    metadata: new State<WorkPackageTableMetadata>(),
    // Set of work package IDs in strict order of appearance
    rows: new State<WorkPackageResource[]>(),
    // Set of columns in strict order of appearance
    columns: new State<string[]>(),
    // Table row selection state
    selection: new State<WPTableRowSelectionState>(),
    // Current state of collapsed groups (if any)
    collapsedGroups: new State<{[identifier: string]: boolean}>(),
    // Hierarchies of table
    hierarchies: new State<WPTableHierarchyState>(),
    // State to be updated when the table is up to date
    rendered: new State<WorkPackageTable>(),
    // State to determine timeline visibility
    timelineVisible: new State<boolean>(),
    // Subject used to unregister all listeners of states above.
    stopAllSubscriptions: new Subject()
  };

  // Query states
  query = {
    // All available columns for selection
    availableColumns: new State<any[]>()
  };

  // Current focused work package (e.g, row preselected for details button)
  focusedWorkPackage = new State<string>();

  // Open editing forms
  editing = new MultiState<WorkPackageEditForm>();

}


const ctx = createNewContext();
const states = ctx.create(States);

whenDebugging(() => {
  states.loggingFn = (msg: string) => {
    console.debug(msg);
  }
});

opServicesModule.value('states', states);
