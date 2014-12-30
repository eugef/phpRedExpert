App.directive('resizable', ['$window',
    function ($window) {
        "use strict";

        return {
            restrict: 'A',

            /**
             * @param {Scope} scope
             * @param {jQuery} element
             * @param {Attributes} attributes
             * @param {String} attributes.resizableStyle
             * @param {String} attributes.resizableWrapper
             */
            link: function (scope, element, attributes) {
                /**
                 * @param {Number} [wrapperHeight]
                 */
                function resizeElement(wrapperHeight) {
                    wrapperHeight = angular.isDefined(wrapperHeight) ? wrapperHeight : document.querySelector(attributes.resizableWrapper).clientHeight;

                    element.css(attributes.resizableStyle, Math.max(wrapperHeight, $window.innerHeight - element.prop(('offsetTop'))) + 'px');
                }

                // resize on window
                angular.element($window).bind('resize', function () {
                    resizeElement();
                    scope.$apply();
                });

                // resize when wrapper height is changed
                scope.$watch(
                    function () {
                        return document.querySelector(attributes.resizableWrapper).clientHeight;
                    },
                    function (wrapperHeight) {
                        resizeElement(wrapperHeight);
                    }
                );
            }
        }
    }
]);
