class OmitFilters {
    constructor() {
        return function (collection, type, params) {
            if (!angular.isArray(collection) || angular.isUndefined(type)) {
                return collection;
            }

            return collection.filter(function (element) {
                let isChecked = false;

                switch (type) {
                    case 'state':
                        isChecked = params ? params.indexOf(element) >= 0 : false;
                        break;
                    case 'city':
                        isChecked = params ? params.indexOf(element) >= 0 : false;
                        break;
                    case 'division':
                        isChecked = params ? params.indexOf(element) >= 0 : false;
                        break;
                    case 'branch':
                        isChecked = params ? params.indexOf(element) >= 0 : false;
                        break;
                    case 'employmentType':
                        isChecked = params ? params.indexOf(element) >= 0 : false;
                        break;
                    case 'publishedCategory':
                        isChecked = params ? params.indexOf(element.publishedCategory.id) >= 0 : false;
                        break;
                    default:
                        isChecked = params ? params.indexOf(element.publishedCategory.id) >= 0 : false;
                }
                return element.idCount !== 0 || isChecked;
            });
        };
    }
}

export default OmitFilters;
