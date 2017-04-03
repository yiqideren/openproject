import {State} from "reactivestates";
import {Observable, Subject} from "rxjs";
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
import {opWorkPackagesModule} from "../../angular-modules";
import {
  WorkPackageResource,
  WorkPackageResourceInterface
} from "../api/api-v3/hal-resources/work-package-resource.service";
import {ApiWorkPackagesService} from "../api/api-work-packages/api-work-packages.service";
import {States} from "../states.service";
import {WorkPackageNotificationService} from "./../wp-edit/wp-notification.service";
import IScope = angular.IScope;
import IPromise = angular.IPromise;


function getWorkPackageId(id: number | string): string {
  return (id || "__new_work_package__").toString();
}

export class WorkPackageCacheService {

  private newWorkPackageCreatedSubject = new Subject<WorkPackageResource>();

  /*@ngInject*/
  constructor(private states: States,
              private $rootScope: ng.IRootScopeService,
              private $q: ng.IQService,
              private wpNotificationsService: WorkPackageNotificationService,
              private apiWorkPackages: ApiWorkPackagesService) {
  }

  newWorkPackageCreated(wp: WorkPackageResource) {
    this.newWorkPackageCreatedSubject.next(wp);
  }

  updateWorkPackage(wp: WorkPackageResource) {
    this.updateWorkPackageList([wp]);
  }

  updateWorkPackageList(list: WorkPackageResource[]) {
    for (var wp of list) {
      const workPackageId = getWorkPackageId(wp.id);
      const wpState = this.states.workPackages.get(workPackageId);
      const lastValue = wpState.value;
      const wpForPublish = lastValue && lastValue.dirty
        ? lastValue // dirty, use current wp
        : wp; // not dirty or unknown, use new wp

      // Ensure the schema is loaded
      // so that no consumer needs to call schema#$load manually
      if (wpForPublish.schema.$loaded) {
        wpState.putValue(wpForPublish);
      } else {
        wpState.clearAndPutFromPromise(wpForPublish.schema.$load().then(() => {
          return wpForPublish;
        }));
      }
    }
  }

  saveIfChanged(workPackage: WorkPackageResourceInterface): IPromise<WorkPackageResourceInterface> {
    if (!(workPackage.dirty || workPackage.isNew)) {
      return this.$q.when(workPackage);
    }

    const deferred = this.$q.defer<WorkPackageResourceInterface>();
    workPackage.save()
      .then(() => {
        this.wpNotificationsService.showSave(workPackage);
        this.$rootScope.$emit('workPackagesRefreshInBackground');
        deferred.resolve(workPackage);
      })
      .catch((error) => {
        this.wpNotificationsService.handleErrorResponse(error, workPackage);
        deferred.reject(error);
      });

    return deferred.promise;
  }

  loadWorkPackage(workPackageId: string, forceUpdate = false): State<WorkPackageResource> {
    const state = this.states.workPackages.get(getWorkPackageId(workPackageId));
    if (forceUpdate) {
      state.clear();
    }

    // Several services involved in the creation of work packages
    // use this method to resolve the latest created work package,
    // so let them just subscribe.
    if (workPackageId === 'new') {
      return state;
    }

    state.putFromPromiseIfPristine(() => {
      const deferred = this.$q.defer();

      this.apiWorkPackages.loadWorkPackageById(workPackageId, forceUpdate)
        .then((workPackage: WorkPackageResource) => {
          workPackage.schema.$load().then(() => {
            deferred.resolve(workPackage);
          });
        });

      return deferred.promise;
    });

    return state;
  }

  onNewWorkPackage(): Observable<WorkPackageResource> {
    return this.newWorkPackageCreatedSubject.asObservable();
  }

}

opWorkPackagesModule.service('wpCacheService', WorkPackageCacheService);
