import {WorkPackageCacheService} from "../../work-packages/work-package-cache.service";
import {WorkPackageTimelineCell} from "../../wp-table/timeline/wp-timeline-cell";
import {WorkPackageTimelineTableController} from "../../wp-table/timeline/wp-timeline-container.directive";
import {States} from "../../states.service";
import {WorkPackageResource} from "./../../api/api-v3/hal-resources/work-package-resource.service";
import {injectorBridge} from "../../angular/angular-injector-bridge.functions";
import {Observable} from "rxjs";
import { WorkPackageTable } from "../wp-fast-table";
import { WorkPackageTableTimelineService } from "../state/wp-table-timeline.service";
export const timelineCellClassName = 'wp-timeline-cell';
export const timelineCollapsedClassName = '-collapsed';

export class TimelineCellBuilder {

  public states:States;
  public wpTableTimeline:WorkPackageTableTimelineService;
  public wpCacheService:WorkPackageCacheService;

  constructor(private stopExisting$:Observable<any>, private workPackageTable:WorkPackageTable) {
    injectorBridge(this);
  }

  public build(workPackage:WorkPackageResource):HTMLElement {
    const td = document.createElement('td');
    td.classList.add(timelineCellClassName, '-max');

    if (!this.wpTableTimeline.isVisible) {
      td.classList.add(timelineCollapsedClassName);
    }

    this.buildTimelineCell(td, workPackage);

    return td;
  }

  public buildTimelineCell(cell:HTMLElement, workPackage:WorkPackageResource):void {
    // required data for timeline cell
    const timelineCell = new WorkPackageTimelineCell(
      this.workPackageTable.timelineController,
      this.wpCacheService,
      this.states,
      workPackage.id,
      cell
    );

    // show timeline cell
    timelineCell.activate();
    this.stopExisting$.take(1)
      .subscribe(() => {
        timelineCell.deactivate();
      });
  }
}

TimelineCellBuilder.$inject = ['states', 'wpCacheService', 'wpTableTimeline'];
