
// Utility Filter
var uniqueFilter = (v, i, a) => a.indexOf(v) === i;

class Job {
    static get _() {
        return Job.__ || (Job.__ = Object.create(null));
    }

    static get fieldList() {
            return [
            'id',
            'title',
            'publishedCategory(id,name)',
            'address(city,state)',
            'customText3',
            'customText5',
            'employmentType',
            'dateLastPublished',
            'publicDescription',
            'isOpen',
            'isPublic',
            'isDeleted'
        ];
    } 

    static get _fields() {
        return Job._.fields || (Job._.fields = this.fieldList.join(','));
    }

    constructor(job = {}) {
    }
}

class JobList {
    constructor(jobs = []) {
        this.jobs = jobs;
    }
}

class SearchService {
    constructor($http, configuration, $q) {
        'ngInject';
        this.$http = $http;
        this.configuration = configuration;
        this.$q = $q;
    }

    static get _() {
        return SearchService.__ || (SearchService.__ = Object.create(null));
    }

    static get _count() {
        return SearchService._.pageSize || (SearchService._.pageSize = 20);
    }

    static get _sort() {
        return SearchService._.sort || (SearchService._.sort = '-dateLastPublished');
    }

    static uriParameterize(params) {
        return Object.prototype.Keys.call(params).map((k) =>
                encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
            .join('&')
    }

    get _() {
        return this.__ || (this.__ = Object.create(null));
    }

    get currentDetailData() {
        return this._.currentDetailData || (this._.currentDetailData = {});
    }

    set currentDetailData(value) {
        this._.currentDetailData = value;
    }

    get currentListData() {
        return this._.currentListData || (this._.currentListData = []);
    }

    set currentListData(value) {
        this._.currentListData = value;
    }

    get filteredListData() {
        return this._.filteredListData || this.currentListData;
    }

    set filteredListData(value) {
        this._.filteredListData = value;
    }

    get isFilteredSearch() {
        return Boolean(
            this.searchParams.textSearch
            || this.searchParams.category.length
            || this.searchParams.state.length
            || this.searchParams.city.length
            || this.searchParams.employmentType.length
            || this.searchParams.division.length
            || this.searchParams.branch.length
        );
    }

    get hasMore() { return this._.hasMore || false; }
    set hasMore(value) { return this._.hasMore = Boolean(value); }

    get sort() { return this.searchParams.sort || SearchService._sort; }
    set sort(value) { return this.searchParams.sort = value; }

    get count() { return this.searchParams.count || SearchService._count; }
    set count(value) { this.searchParams.count = value; }

    get start() { return this.searchParams.start; }
    set start(value) { return this.searchParams.start = value; }

    get total() { return this.searchParams.total; }
    set total(value) { return this.searchParams.total = value; }

    updateStart(count) {
        let params = this.requestParams;
        this.searchParams.start = parseInt(this.start) + (count ? parseInt(count) : parseInt(this.count));
    }

    emptyCurrentDataList() {
        return this.currentListData.length = 0;
        return this.filteredListData.length = 0;
    }

    resetStartAndTotal() {
        this.hasMore = true;
        this.total = 0;
        this.start = 0;
    }

    get moreRecordsExist() { return (parseInt(this.total) - parseInt(this.start)) > 0; }

    clearSearchParams (specificParam) {
        switch (specificParam) {
            case 'state': this.searchParams.state.length = 0; break;
            case 'city': this.searchParams.city.length = 0; break;
            case 'division': this.searchParams.division.length = 0; break;
            case 'branch': this.searchParams.branch.length = 0; break;
            case 'employmentType': this.searchParams.employmentType.length = 0; break;
            case 'category': this.searchParams.category.length = 0; break;
            case 'text': this.searchParams.textSearch = ''; break;
            default:
                this.searchParams.textSearch = '';
                this.searchParams.category.length = 0;
                this.searchParams.state.length = 0;
                this.searchParams.city.length = 0;
                this.searchParams.employmentType.length = 0;
                this.searchParams.division.length = 0;
                this.searchParams.branch.length = 0;
        }
    }

    get _publicServiceUrl() {
        let result = this._.publicServiceUrl;

        if (!result) {
            let corpToken = this.configuration.service.corpToken;
            let port = parseInt(this.configuration.service.port) || 443;
            let scheme = `http${port === 443 ? 's' : ''}`;
            let swimlane = this.configuration.service.swimlane;

            result = this._.publicServiceUrl = `${scheme}://public-rest${swimlane}.bullhornstaffing.com:${port}/rest-services/${corpToken}`;
        }

        return result;
    }

    get _localSearchServiceUrl() {
        return `/wp-json/bh-api/v1/search`; // Cheating, using the local api endpoint
    }

    get _localQueryServiceUrl() {
        return `/wp-json/bh-api/v1/query`; // Cheating, using the local api endpoint
    }

    get _queryUrl() {
        return this._.queryUrl || (this._.queryUrl = `${this._publicServiceUrl}/query/JobBoardPost`);
        //return this._.queryUrl || (this._.queryUrl = this._localQueryServiceUrl);
    }

    get requestParams() {
        return this._.requestParams || (this._.requestParams = {
                publishedCategory: (isSearch, fields) => {
                    if ('publishedCategory(id,name)' !== fields) {
                        if (this.searchParams.category.length > 0) {
                            let equals = isSearch ? ':' : '=';

                            let fragment = this.searchParams.category
                                .map(category => 'publishedCategory.id' + equals + category)
                                .join(' OR ');

                            return fragment;
                        }
                    }

                    return '';
                },
                employmentType: (isSearch, fields) => {
                    if ('employmentType' !== fields) {
                        if (this.searchParams.employmentType.length > 0) {
                            let delimiter = isSearch ? '"' : '\'';
                            let equals = isSearch ? ':' : '=';

                            let fragment = this.searchParams.employmentType
                                .map(employmentType => {
                                    if (isSearch) employmentType = employmentType.replace(/'/g, '\'\'');
                                    return '(employmentType' + equals + delimiter + employmentType + delimiter + ')';
                                })
                                .join(' OR ');
                            return fragment;
                        }
                    }

                    return '';
                },
                city: (isSearch, fields) => {
                    if ('address(city)' !== fields) {
                        if (this.searchParams.city.length > 0) {
                            let delimiter = isSearch ? '"' : '\'';
                            let equals = isSearch ? ':' : '=';

                            let fragment = this.searchParams.city
                                .map(city => {

                                    if (isSearch) city = city.replace(/'/g, '\'\'');
                                    return '(address.city' + equals + delimiter + city + delimiter + ')';
                                })
                                .join(' OR ');
                            return fragment;
                        }
                    }

                    return '';
                },
                state: (isSearch, fields) => {
                    if ('address(state)' !== fields) {
                        if (this.searchParams.state.length > 0) {
                            let delimiter = isSearch ? '"' : '\'';
                            let equals = isSearch ? ':' : '=';

                            let fragment = this.searchParams.state
                                .map(state => {
                                    return '(address.state' + equals + delimiter + state + delimiter + ')';
                                })
                                .join(' OR ');
                            return fragment;
                        }
                    }

                    return '';
                },
                division: (isSearch, fields) => {
                    if ('division' !== fields) {
                        if (this.searchParams.division.length > 0) {
                            let delimiter = isSearch ? '"' : '\'';
                            let equals = isSearch ? ':' : '=';

                            let fragment = this.searchParams.division
                                .map(division => {
                                    if (isSearch) division = division.replace(/'/g, '\'\'');
                                    return 'customText5' + equals + delimiter + division + delimiter;
                                })
                                .join(' OR ');
                            return fragment;
                        }
                    }

                    return '';
                },
                branch: (isSearch, fields) => {
                    if ('branch' !== fields) {
                        if (this.searchParams.branch.length > 0) {
                            let delimiter = isSearch ? '"' : '\'';
                            let equals = isSearch ? ':' : '=';

                            let fragment = this.searchParams.branch
                                .map(branch => {
                                    if (isSearch) branch = branch.replace(/'/g, '\'\'');
                                    return 'customText3' + equals + delimiter + branch + delimiter;
                                })
                                .join(' OR ');
                            return fragment;
                        }
                    }

                    return '';
                },
                public: (isSearch) => {
                    return 'isOpen' + (isSearch ? ':1' : '=true') + ' AND isPublic' + (isSearch ? ':' : '=') + '1';

                },
                text: (isSearch) => {
                    let delimiter = isSearch ? '"' : '\'';
                    let equals = isSearch ? ':' : '=';
                    let wildcard = isSearch ? '*' : '';
                    let fragment = '';

                    if (this.searchParams.textSearch) {
                        fragment = 'title' + equals + delimiter + this.searchParams.textSearch + wildcard + delimiter
                         + ' OR publicDescription' + equals + delimiter + this.searchParams.textSearch + wildcard + delimiter;
                    }

                    return fragment;
                },
                constructQuery(conditionsList) {
                    return conditionsList.filter(item => item)
                        .map(item => '(' + item + ')')
                        .join(' AND ');
                },
                query: (isSearch, additionalQuery, fields) => {
                    let params = this.requestParams;
                    let conditions = [
                        params.public(isSearch),
                        // params.text(isSearch),
                        params.publishedCategory(isSearch, fields),
                        params.division(isSearch),
                        params.branch(isSearch),
                        params.city(isSearch),
                        params.state(isSearch),
                        params.employmentType(isSearch),
                        additionalQuery
                    ];

                    return this.requestParams.constructQuery(conditions);
                },
                whereIDs: (jobs, isSearch) => {
                    let getValue = isSearch ? (job) => 'id:' + job.id : (job) => job.id;
                    let join = isSearch ? ' OR ' : ',';
                    let prefix = isSearch ? '' : 'id IN ';

                    let values = [];

                    for (let i = 0; i < jobs.length; i++) {
                        values.push(getValue(jobs[i]));
                    }

                    return prefix + '(' + values.join(join) + ')';
                },
                relatedJobs: (publishedCategoryID, idToExclude) => {
                    let query = '(isOpen=true and isPublic=1) AND publishedCategory.id=' + publishedCategoryID;

                    if (idToExclude && parseInt(idToExclude) > 0) {
                        query += ' AND id <>' + idToExclude;
                    }

                    return query;
                },
                customFieldSearch: (fieldName, searchSubstring) => {
                    if(/custom(Text|Int)\d{1,2}/.test(fieldName)) {
                        return fieldName + ' like "' + searchSubstring + '"';
                    } else {
                        return null;
                    }
                },
                customFieldsSearch: (customSearchParams) => {
                    return Object.prototype.Keys.call(customSearchParams)
                        .map(customFieldName => 
                            customFieldSearch(customFieldName, customSearchParams(customFieldName)))
                        .filter(a => a !== null)
                        .join(' AND '); // 

                },
                find: (jobID) => {
                    return 'id=' + jobID;
                },
                assembleForSearchWhereIDs: (jobs) => {
                    let where = this.requestParams.query(true, this.requestParams.whereIDs(jobs, true));

                    return '?start=0&query=' + where + '&fields=id&count=' + SearchService._count;
                },
                assembleJobQuery: (start, count) => {
                    return '?where=' + this.requestParams.query(false) + '&fields=' + Job._fields + '&count=' + count + '&orderBy=' + SearchService._sort + '&start=' + start;
                },
                assembleForGroupByWhereIDs: (fields, orderByFields, start, count, jobs) => {
                    return '?where=' + this.requestParams.whereIDs(jobs, false) + '&groupBy=' + fields + '&fields=' + fields + ',count(id)&count=' + count + '&orderBy=+' + orderByFields + ',-count.id&start=' + start;
                },
                assembleForGroupByWhere: (fields, orderByFields, start, count, jobs) => {
                    return '?where=' + this.requestParams.whereIDs(jobs, false) + '&groupBy=' + fields + '&fields=' + fields + ',count(id)&count=' + count + '&orderBy=+' + orderByFields + ',-count.id&start=' + start;
                },
                assembleForSearchForIDs: (start, count, fields) => {
                    return '?showTotalMatched=true&query=' + this.requestParams.query(true, undefined, fields) + '&fields=id&sort=id&count=' + count + '&start=' + start;
                },
                assembleForRelatedJobs: (publishedCategoryID, idToExclude) => {
                    return '?start=0&where=' + this.requestParams.relatedJobs(publishedCategoryID, idToExclude) + '&fields=' + Job._fields + '&sort=' + this.sort + '&count=' + this.configuration.maxRelatedJobs;
                },
                assembleForCustomField: (fieldName, searchSubstring) => {
                    let params = {
                        start: 0,
                        where: '(isOpen=true AND isPublic=1)'+ this.requestParams.customFieldSearch(
                            fieldName,
                            searchSubstring
                        ),
                        fields: Job._fields,
                        sort: this.sort,
                        count: this.configuration.maxRelatedJobs
                    }
                    return '?' + uriParameterize(params);
                },
                assembleForFind: (jobID) => {
                    return '?start=0&count=1&where=' + this.requestParams.find(jobID) + '&fields=' + Job._fields;
                }
            });
    }

    // TODO state and city from location reduce to array
    extractStateFromLocation() {
        return this.searchParams.location
            .map(location => location.state)
            .filter(uniqueFilter)
    }

    // TODO state and city from location reduce to array
    extractCityFromLocation() {
        return this.searchParams.location
            .map(location => location.city)
            .filter(uniqueFilter)
    }

    get searchParams() {
        return this._.searchParams || (this._.searchParams = {
                textSearch: '',
                employmentType: [],
                state: [],
                city: [],
                division: [],
                branch: [],
                category: [],
                sort: '',
                count: '',
                start: '',
                total: '',
                reloadAllData: true
            });
    }

    get _searchUrl() {
        // return this._.searchUrl || (this._.searchUrl = `${this._publicServiceUrl}/search/JobOrder`);
        return this._.searchUrl || (this._.searchUrl = this._localSearchServiceUrl);
    }

    get filterCallbacks() { return this._._filterCallbacks || (this._._filterCallbacks = {}); }
    set filterCallbacks(value) { return this._._filterCallbacks = value; }

    registerFilterBindings(callbackMap) {
        this.filterCallbacks = callbackMap;
    }

    /**
     * Would like to aggregate all these methods
     * But would have to handle these callbacks first
     */
    getAllCounts(callback, errorCallback) {

        // this.generateCounts(); // Unnecessary
        this.getCountByEmploymentType(this.filterCallbacks.employmentType);
        this.getCountByState(this.filterCallbacks.state);
        this.getCountByCity(this.filterCallbacks.city);
        this.getCountByDivision(this.filterCallbacks.division);
        this.getCountByBranch(this.filterCallbacks.branch);

        this.getCountByCategory(this.filterCallbacks.category);
        //getCountByLocation
    }

    getCountByState(callback, errorCallback) {
        return this.getCountBy('address(state)', 'address.state', callback, errorCallback);
    }

    getCountByCity(callback, errorCallback) {
        return this.getCountBy('address(city)', 'address.city', callback, errorCallback);
    }

    getCountByDivision(callback, errorCallback) {
        return this.getCountBy('division', 'customText5', callback, errorCallback);
    }

    getCountByBranch(callback, errorCallback) {
        return this.getCountBy('branch', 'customText3', callback, errorCallback);
    }

    getCountByEmploymentType(callback, errorCallback) {
        return this.getCountBy('employmentType', 'employmentType', callback, errorCallback);
    }

    getCountByCategory(callback, errorCallback) {
        return this.getCountBy('publishedCategory(id,name)', 'publishedCategory.name', callback, errorCallback);
    }

    getCountWhereIDs(fields, orderByFields, start, count, jobs, callback) {
        this.$http({
            method: 'GET',
            url: this._queryUrl + this.requestParams.assembleForGroupByWhereIDs(fields, orderByFields, start, count, jobs)
        }).success(data => {
            callback(data);
        }).error(() => {
        });
    }

    recursiveSearchForIDs(searchParameters, results, callback) {
        let start = searchParameters.start;
        let count = searchParameters.count;
        let fields = searchParameters.fields;
        let controller = this;

        this.$http({
            method: 'GET',
            url: this._searchUrl + this.requestParams.assembleForSearchForIDs(start, count, fields)
        }).success(data => {
            if (data.data.length) {
                controller.getCountWhereIDs();

            }
            else {
                callback(results);
            }
        }).error(() => {
        });
    }

    recursiveSearchForGroups(searchParameters, results, callback) {
        let start = searchParameters.start;
        let count = searchParameters.count;
        let fields = searchParameters.fields;
        let controller = this;

        this.$http({
            method: 'GET',
            url: this._searchUrl + this.requestParams.assembleForSearchForGroups(start, count, fields)
        }).success(data => {
            if (data.data.length) {
                controller.getCountWhereIDs();

            }
            else {
                callback(results);
            }
        }).error(() => {
        });
    }

    getCountBy(fields, orderByFields, callback, errorCallback) {
        errorCallback = errorCallback || function () {
            };

        let totalRecords = [];
        let start = 0;

        let controller = this;

        let callbackIfNoMore = (data) => {
            if (data.data.length) {
                controller.getCountWhereIDs(fields, orderByFields, start, controller.configuration.service.batchSize, data.data, (counts) => {
                    totalRecords = totalRecords.concat(counts.data);

                    if (data.total > data.count) {
                        start += controller.configuration.service.batchSize;

                        controller.recursiveSearchForIDs({ start: start, count: this.configuration.service.batchSize, fields: fields }, callbackIfNoMore);
                    } else {
                        callback(totalRecords);
                    }
                });
            } else {
                callback(totalRecords);
            }
        };

        let valueExtractor = () => '';
        switch(fields) {
            case 'address(city,state)': valueExtractor = (item) => item.address.state + '|' + item.address.city; break;
            case 'address(state)': valueExtractor = (item) => item.address.state; break;
            case 'address(city)': valueExtractor = (item) => item.address.city; break;
            case 'division': valueExtractor = (item) => item.customText5; break;
            case 'branch': valueExtractor = (item) => item.customText3; break;
            case 'employmentType': valueExtractor = (item) => item.employmentType; break;
            case 'publishedCategory(id,name)': valueExtractor = (item) => (item.publishedCategory || {}).id; break;
            default: valueExtractor = (item) => item.publishedCategory.id;
        }

        if (this.currentListData && this.currentListData.length > 0) {
            let count = this.currentListData.reduce((countMap, item, key) => {
                let groupIndex = valueExtractor(item);
                countMap[groupIndex] = countMap[groupIndex] || [];
                countMap[groupIndex].push(item.id);
                return countMap;
            }, (Object.create(null)))

            callback(Object.keys(count));
        }
        return;

        // this.recursiveSearchForIDs({ start: start, count: this.configuration.service.batchSize, fields: fields }, [], callbackIfNoMore);
    }

    searchWhereIDs(jobs, callback) {
        this.$http({
            method: 'GET',
            url: this._searchUrl + this.requestParams.assembleForSearchWhereIDs(jobs)
        }).success(data => {
            callback(data.data);
        }).error(() => {
        });
    }

    recursiveJobQuery(callbackIfNoMore, start, count, errorCallback) {
        errorCallback = errorCallback || (() => {
            });

        this
            .$http({
                method: 'GET',
                url: this._localQueryServiceUrl + this.requestParams.assembleJobQuery(start, count)
            })
            .success(callbackIfNoMore)
            .error(errorCallback);
    }

    findJobs() {
        if (this.searchParams.reloadAllData) {
            this.emptyCurrentDataList();
            this.resetStartAndTotal();
        }

        let controller = this;

        let allJobs = [];
        let start = this.start;
        let count = this.count;

        this.hasMore = false;
        this.isSearching = true;

        let doneFinding = (jobs) => {
            controller.isSearching = false;
            controller.updateStart();

            if (this.isFilteredSearch) { // Dont clear data
                let textSearch = this.searchParams.textSearch;
                if (textSearch) {
                    jobs = jobs.filter(job => {
                        let check = ((0 <= job.title.indexOf(textSearch))
                        || (0 <= job.publicDescription.indexOf(textSearch)));
                        return check;
                    });
                }

                if (controller.searchParams.reloadAllData) {
                    controller.filteredListData = jobs;
                } else {
                    controller.filteredListData.push.apply(controller.filteredListData, jobs);
                }
            } else { // Refresh all data from API
                if (controller.searchParams.reloadAllData) {
                    controller.currentListData = jobs;
                } else {
                    controller.currentListData.push.apply(controller.currentListData, jobs);
                }
                controller.filteredListData = controller.currentListData;
            }

            this.getAllCounts();
        };

        let callbackIfNoMore = (data) => {
            if (data.data.length) {
                for (let i = 0; i < data.data.length; i++) {
                    allJobs.push(data.data[i]);
                }

                if (data.count < count) {
                    doneFinding(allJobs);
                } else if (allJobs.length >= controller.count) {
                    this.hasMore = true;
                    doneFinding(allJobs);
                } else {
                    controller.updateStart(count);
                    start = controller.start;
                    controller.recursiveJobQuery(callbackIfNoMore, start, count);
                }
            } else {
                doneFinding(allJobs);
            }
        };

        this.recursiveJobQuery(callbackIfNoMore, start, count);
    }

    loadJobData(jobID, callback, errorCallback) {
        errorCallback = errorCallback || function () {
            };

        this.$http({
            method: 'GET',
            url: this._localQueryServiceUrl + this.requestParams.assembleForFind(jobID)
        }).success(data => {
            if (data && data.data && data.data.length) {
                callback(data.data[0]);
            }
            else {
                errorCallback();
            }
        }).error(() => errorCallback());
    }

    loadJobDataByCategory(categoryID, idToExclude) {
        let deferred = this.$q.defer();

        this.$http({
            method: 'GET',
            url: this._localQueryServiceUrl + this.requestParams.assembleForRelatedJobs(categoryID, idToExclude)
        }).success(data => {
            if (data && data.data && data.data.length) {
                deferred.resolve(data.data);
            }
            else {
                deferred.reject({message: 'no data was returned from the server'});
            }
        }).error(error => {
            deferred.reject(error);
        });

        return deferred.promise;
    }

    loadJobDataByCustomText(fieldName, searchSubstring) {
        let deferred = this.$q.defer();

        this.$http({
            method: 'GET',
            url: this._localQueryServiceUrl + this.requestParams.assembleForCustomField(fieldName, searchSubstring)
        }).success(data => {
            if (data && data.data && data.data.length) {
                deferred.resolve(data.data);
            }
            else {
                deferred.reject({message: 'no data was returned from the server'});
            }
        }).error(error => {
            deferred.reject(error);
        });

        return deferred.promise;
    }
}

export default SearchService;
