angular.module('eugef.checkboxAll', []).directive('checkboxAll',
    function () {
        "use strict";

        return {
            restrict: 'A',

            /**
             * @param {Scope} scope
             * @param {jQuery} element
             * @param {Attributes} attributes
             * @param {String} attributes.checkboxAll
             */
            link: function (scope, element, attributes) {
                /**
                 * @type {Array}
                 */
                var parts = attributes.checkboxAll.split('|');

                element.attr('type', 'checkbox');
                element.bind('change', function () {
                    scope.$apply(function () {
                        var setValue = element.prop('checked');
                        angular.forEach(scope.$eval(parts[0]), function (v) {
                            v[parts[1]] = setValue;
                        });
                    });
                });

                scope.$watch(parts[0], function (newVal) {
                    var hasTrue = false, hasFalse = false;

                    angular.forEach(newVal, function (v) {
                        if (v[parts[1]]) {
                            hasTrue = true;
                        } else {
                            hasFalse = true;
                        }
                    });

                    if (hasTrue && hasFalse) {
                        element.attr('checked', false);
                        element.prop('indeterminate', true);
                        element.addClass('greyed');
                    } else {
                        element.attr('checked', hasTrue);
                        element.prop('indeterminate', false);
                        element.removeClass('greyed');
                    }
                }, true);
            }
        }
    }
);
