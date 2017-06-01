class CareerPortalSidebarController {
    /*jshint -W072 */
    constructor($scope, SharedData, $location, SearchService, $timeout, configuration) {
    /*jshint +W072 */
        'ngInject';

        this.SharedData = SharedData;
        this.$location = $location;
        this.$timeout = $timeout;
        this.SearchService = SearchService;
        this.configuration = configuration || {};

        this.stateLimitTo = 8;
        this.cityLimitTo = 8;
        this.divisionLimitTo = 8;
        this.branchLimitTo = 8;
        this.employmentTypeLimitTo = 8;
        this.categoryLimitTo = 8;

        // CONTEXT BINDING
        this.updateFilterCounts = this.updateFilterCounts.bind(this);
        this.setStates = this.setStates.bind(this);
        this.setCities = this.setCities.bind(this);
        this.setDivisions = this.setDivisions.bind(this);
        this.setBranches = this.setBranches.bind(this);
        this.setEmploymentTypes = this.setEmploymentTypes.bind(this);

        this.setCategories = this.setCategories.bind(this);

        this.SearchService.registerFilterBindings({
            state: this.setStates,
            city: this.setCities,
            division: this.setDivisions,
            branch: this.setBranches,
            employmentType: this.setEmploymentTypes,
            category: this.setCategories
        });

        this.SearchService.findJobs();

        // Set the grid state based on configurations
        switch (this.configuration.defaultGridState) {
            case 'grid-view':
                this.SharedData.gridState = 'grid-view';
                break;
            case 'list-view':
                /* falls through */
            default:
                this.SharedData.gridState = 'list-view';
        }

        $scope.$watchCollection(angular.bind(this, function () {
            return this.SearchService.searchParams.category;
        }), this.updateFilterCounts);

        $scope.$watchCollection(angular.bind(this, function () {
            return this.SearchService.searchParams.state;
        }), this.updateFilterCounts);

        $scope.$watchCollection(angular.bind(this, function () {
            return this.SearchService.searchParams.city;
        }), this.updateFilterCounts);

        $scope.$watchCollection(angular.bind(this, function () {
            return this.SearchService.searchParams.division;
        }), this.updateFilterCounts);

        $scope.$watchCollection(angular.bind(this, function () {
            return this.SearchService.searchParams.branch;
        }), this.updateFilterCounts);

        $scope.$watchCollection(angular.bind(this, function () {
            return this.SearchService.searchParams.employmentType;
        }), this.updateFilterCounts);
    }

    updateStateLimitTo(value) {
        this.stateLimitTo = value;
    }

    updateCityLimitTo(value) {
        this.cityLimitTo = value;
    }

    updateDivisionLimitTo(value) {
        this.stateLimitTo = value;
    }

    updateBranchLimitTo(value) {
        this.cityLimitTo = value;
    }

    updateCategoryLimitTo(value) {
        this.categoryLimitTo = value;
    }

    setStates(states) {
        this.states = states.filter(state =>
            state);
    }

    setCities(cities) {
        this.cities = cities.filter(city =>
            city);
    }

    setDivisions(divisions) {
        this.divisions = divisions.filter(division =>
            division);
    }

    setBranches(branches) {
        this.branches = branches.filter(branch =>
            branch);
    }

    setEmploymentTypes(employmentTypes) {
        this.employmentTypes = employmentTypes.filter(employmentType =>
            employmentType);
    }

    setCategories(categories) {
        this.categories = categories.filter(category =>
            category && category.publishedCategory && category.publishedCategory.name && category.publishedCategory.name.length);
    }

    setCustomText(id) { // TODO get by a custom field
        //let
    }

    updateCountsByIntersection(oldCounts, newCounts, getID, getLabel) {
        if (!getLabel) {
            getLabel = getID;
        }

        angular.forEach(oldCounts, function (oldCount) {
            let found = false;

            angular.forEach(newCounts, function (newCount) {
                if (getID.call(oldCount) === getID.call(newCount)) {
                    oldCount.idCount = newCount.idCount;

                    found = true;
                }
            });

            if (!found) {
                oldCount.idCount = 0;
            }
        });

        oldCounts.sort(function (count1, count2) {
            let name1 = getLabel.call(count1);
            let name2 = getLabel.call(count2);

            if (name1 < name2) {
                return -1;
            } else if (name1 > name2) {
                return 1;
            } else {
                let idCount1 = count1.idCount;
                let idCount2 = count2.idCount;

                return idCount2 - idCount1;
            }
        });
    }

    updateFilterCounts () {
        let controller = this;

        if (this.states) {
            this.SearchService.getCountByState(function (states) {
                controller.updateCountsByIntersection(controller.states, states, function () {
                    return this.state;
                });
            });
        }

        if (this.cities) {
            this.SearchService.getCountByCity(function (cities) {
                controller.updateCountsByIntersection(controller.cities, cities, function () {
                    return this.city;
                });
            });
        }

        if (this.divisions) {
            this.SearchService.getCountByDivision(function (divisions) {
                controller.updateCountsByIntersection(controller.divisions, divisions, function () {
                    return this.division;
                });
            });
        }

        if (this.branches) {
            this.SearchService.getCountByBranch(function (branches) {
                controller.updateCountsByIntersection(controller.branches, branches, function () {
                    return this.branch;
                });
            });
        }

        if (this.employmentTypes) {
            this.SearchService.getCountByEmploymentType(function (employmentTypes) {
                controller.updateCountsByIntersection(controller.employmentTypes, employmentTypes, function () {
                    return this.employmentType;
                });
            });
        }

        // if (this.customText)
        if (this.categories) {
            this.SearchService.getCountByCategory(function (categories) {
                controller.updateCountsByIntersection(controller.categories, categories, function () {
                    return !this.publishedCategory ? null : this.publishedCategory.id;
                }, function () {
                    return !this.publishedCategory ? null : this.publishedCategory.name;
                });
            });
        }
    }

    switchViewStyle(type) {
        this.SharedData.gridState = type + '-view';
    }

    searchJobs() {
        this.SearchService.searchParams.reloadAllData = true;
        this.SearchService.findJobs();

        this.updateFilterCounts();
    }

    clearSearchParamsAndLoadData(param) {
        this.SearchService.clearSearchParams(param);
        this.SearchService.searchParams.reloadAllData = true;
        this.SearchService.findJobs();
        this.updateFilterCounts();
    }

    goBack() {
        if (this.SharedData.viewState === 'overview-open') {
            this.$location.path('/jobs');
        }
    }

    searchOnDelay() {
        if (this.searchTimeout) {
            this.$timeout.cancel(this.searchTimeout);
        }

        this.searchTimeout = this.$timeout(angular.bind(this, function () {
            this.searchJobs();
        }), 250);
    }

//TODO generalize filter toggle
    toggleFilter(filterName, item) {
        if (this.getFilter(filterName, item)) {
            this.SearchService.searchParams[filterName].splice(index, 1);
        } else {
            this.SearchService.searchParams[filterName].push(item);
        }
        this.searchJobs();
    }

    addOrRemoveState(state) {  // Handle City and State Filters
        let key = state;
        if (!this.hasStateFilter(state)) {
            this.SearchService.searchParams.state.push(key);
        } else {
            let index = this.SearchService.searchParams.state.indexOf(key);
            this.SearchService.searchParams.state.splice(index, 1);
        }
        this.searchJobs();
    }

    addOrRemoveCity(city) {
        let key = city;
        if (!this.hasCityFilter(city)) {
            this.SearchService.searchParams.city.push(key);
        } else {
            let index = this.SearchService.searchParams.city.indexOf(key);
            this.SearchService.searchParams.city.splice(index, 1);
        }
        this.searchJobs();
    }

    addOrRemoveDivision(division) {  // Handle Division
        let key = division;
        if (!this.hasDivisionFilter(division)) {
            this.SearchService.searchParams.division.push(key);
        } else {
            let index = this.SearchService.searchParams.division.indexOf(key);
            this.SearchService.searchParams.division.splice(index, 1);
        }
        this.searchJobs();
    }

    addOrRemoveBranch(branch) {
        let key = branch;
        if (!this.hasBranchFilter(branch)) {
            this.SearchService.searchParams.branch.push(key);
        } else {
            let index = this.SearchService.searchParams.branch.indexOf(key);
            this.SearchService.searchParams.branch.splice(index, 1);
        }
        this.searchJobs();
    }

    addOrRemoveEmploymentType(employmentType) {
        let key = employmentType;
        if (!this.hasEmploymentTypeFilter(employmentType)) {
            this.SearchService.searchParams.employmentType.push(key);
        } else {
            let index = this.SearchService.searchParams.employmentType.indexOf(key);
            this.SearchService.searchParams.employmentType.splice(index, 1);
        }
        this.searchJobs();
    }

    addOrRemoveCategory(category) {
        let key = category.publishedCategory.id;
        if (!this.hasCategoryFilter(category)) {
            this.SearchService.searchParams.category.push(key);
        } else {
            let index = this.SearchService.searchParams.category.indexOf(key);
            this.SearchService.searchParams.category.splice(index, 1);
        }
        this.searchJobs();
    }

    hasStateFilter(state) {
        return this.hasFilter('state', state);
    }

    hasCityFilter(city) {
        return this.hasFilter('city', city);
    }

    hasDivisionFilter(division) {
        return this.hasFilter('division', division);
    }

    hasBranchFilter(branch) {
        return this.hasFilter('branch', branch);
    }

    hasEmploymentTypeFilter(employmentType) {
        return this.hasFilter('employmentType', employmentType);
    }

    hasCategoryFilter(category) {
        return this.hasFilter('category', category.publishedCategory.id);
    }

    hasCustomTextFilter(id, text) {
        return this.hasFilter('customText' + id, text);
    }

    hasFilter(filterName, filterValue) {
        return this.SearchService.searchParams[filterName].indexOf(filterValue) !== -1
    }
}

export default CareerPortalSidebarController;
