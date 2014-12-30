App.directive('sortOrder',
    function () {
        "use strict";

        return {
            restrict: 'A',

            /**
             * @param {Scope} scope
             * @param {jQuery} element
             * @param {Attributes} attributes
             * @param {String} attributes.sortOrder
             * @param {String} attributes.sortOrderBy
             */
            link: function (scope, element, attributes) {
                /**
                 * @typedef {Object} Sorting
                 * @property {String} field
                 * @property {Boolean} reverse
                 *
                 * @type {Sorting}
                 */
                var sort = scope.$eval(attributes.sortOrder);

                /**
                 * @type {String}
                 */
                var field = attributes.sortOrderBy;

                element.addClass('sorting');

                element.bind('click', function () {
                    scope.$apply(function () {
                        if (sort.field == field) {
                            sort.reverse = !sort.reverse;
                        }
                        else {
                            sort.field = field;
                            sort.reverse = false;
                        }
                    });
                });

                scope.$watch(attributes.sortOrder, function (sortNew) {
                    if (sortNew.field == field) {
                        if (sortNew.reverse) {
                            element.removeClass('sorting-desc').addClass('sorting-asc');
                        }
                        else {
                            element.removeClass('sorting-asc').addClass('sorting-desc');
                        }
                    }
                    else {
                        element.removeClass('sorting-asc').removeClass('sorting-desc');
                    }
                }, true);
            }
        }
    }
);
