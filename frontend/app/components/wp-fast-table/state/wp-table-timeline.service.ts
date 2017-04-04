// -- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
// ++

import {
  WorkPackageTableBaseService,
  TableStateStates
} from './wp-table-base.service';
import {
  QueryResource,
  QueryColumn
} from '../../api/api-v3/hal-resources/query-resource.service';
import {QuerySchemaResourceInterface} from '../../api/api-v3/hal-resources/query-schema-resource.service';
import {QueryGroupByResource} from '../../api/api-v3/hal-resources/query-group-by-resource.service';
import {opServicesModule} from '../../../angular-modules';
import {States} from '../../states.service';
import {State} from '../../../helpers/reactive-fassade';
import {WorkPackageTableTimelineVisible} from './../wp-table-timeline-visible';

export class WorkPackageTableTimelineService extends WorkPackageTableBaseService {
  protected stateName = 'timelineVisible' as TableStateStates;

  constructor(public states:States) {
    super(states);
  }

  public initialize(query:QueryResource) {
    let current = new WorkPackageTableTimelineVisible(query.timelineVisible);

    this.state.put(current);
  }

  public toggle() {
    let currentState = this.current;

    currentState.toggle();

    this.state.put(currentState);
  }

  public get isVisible() {
    return this.current.isVisible;
  }

  private get current():WorkPackageTableTimelineVisible {
    return this.state.getCurrentValue() as WorkPackageTableTimelineVisible;
  }

  public get currentSum():boolean|undefined {
    if (this.current) {
      return this.current.current;
    } else {
      return undefined;
    }
  }
}

opServicesModule.service('wpTableTimeline', WorkPackageTableTimelineService);
