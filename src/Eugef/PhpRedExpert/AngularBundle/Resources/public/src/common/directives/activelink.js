angular.module('eugef.activeLink', []).directive('activeLink', ['$location',
    function ($location) {
        "use strict";

        /**
         * @param {String} attribute
         * @returns {Boolean}
         */
        var isAttributeEnabled = function (attribute) {
            return attribute || (attribute === '');
        };

        return {
            restrict: 'A',

            /**
             * @param {Scope} scope
             * @param {jQuery} element
             * @param {Attributes} attributes
             * @param {String} attributes.activeLink
             * @param {*} attributes.activeLinkFront
             * @param {*} attributes.activeLinkDisabled
             * @param {*} attributes.activeLinkNested
             * @param {*} attributes.activeLinkParent
             */
            link: function (scope, element, attributes) {
                /**
                 * @type {String}
                 */
                var path = attributes.activeLink ? 'activeLink' : 'href';

                /**
                 * @type {jQuery}
                 */
                var target = isAttributeEnabled(attributes.activeLinkParent) ? element.parent() : element;

                /**
                 * @type {Boolean}
                 */
                var front = isAttributeEnabled(attributes.activeLinkFront);

                /**
                 * @type {Boolean}
                 */
                var disabled = isAttributeEnabled(attributes.activeLinkDisabled);

                /**
                 * @type {Boolean}
                 */
                var nested = isAttributeEnabled(attributes.activeLinkNested);

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

                    if ((linkPath && inPath(linkPath, locationPath)) || (locationPath === '' && front)) {
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
