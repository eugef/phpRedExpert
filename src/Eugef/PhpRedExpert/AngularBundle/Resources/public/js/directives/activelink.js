App.directive('activeLink', ['$location',
    function ($location) {
        "use strict";

        return {
            restrict: 'A',
            link: function (scope, element, attributes) {
                /**
                 * @type {String}
                 */
                var path = attributes.activeLink ? 'activeLink' : 'href';

                /**
                 * @type {jQuery}
                 */
                var target = angular.isDefined(attributes.activeLinkParent) ? element.parent() : element;

                /**
                 * @type {Boolean}
                 */
                var disabled = angular.isDefined(attributes.activeLinkDisabled) ? true : false;

                /**
                 * @type {Boolean}
                 */
                var nested = angular.isDefined(attributes.activeLinkNested) ? true : false;

                /**
                 * @param {String} needle
                 * @param {String} haystack
                 * @returns {Boolean}
                 */
                function inPath(needle, haystack) {
                    var current = (haystack == needle);
                    if (nested) {
                        current |= (haystack.indexOf(needle + '/') == 0);
                    }

                    return current;
                }

                /**
                 * @param {String} linkPath
                 * @param {String} locationPath
                 */
                function toggleClass(linkPath, locationPath) {
                    // remove hash prefix and trailing slashes
                    linkPath = linkPath ? linkPath.replace(/^#!/, '').replace(/\/+$/, '') : '';
                    locationPath = locationPath.replace(/\/+$/, '');

                    if (linkPath && inPath(linkPath, locationPath)) {
                        target.addClass('active');
                        if (disabled) {
                            target.removeClass('disabled');
                        }
                    } else {
                        target.removeClass('active');
                        if (disabled) {
                            target.addClass('disabled');
                        }
                    }
                }

                // watch if attribute value changes / evaluated
                attributes.$observe(path, function (linkPath) {
                    toggleClass(linkPath, $location.path());
                });

                // watch if location changes
                scope.$watch(
                    function () {
                        return $location.path();
                    },
                    function (newPath) {
                        toggleClass(attributes[path], newPath);
                    }
                );
            }
        };
    }
]);
