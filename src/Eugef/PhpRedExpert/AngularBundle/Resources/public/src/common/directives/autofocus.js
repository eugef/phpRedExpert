angular.module('eugef.autoFocus', []).directive('autoFocus', ['$timeout',
    function ($timeout) {
        "use strict";

        return {
            restrict: 'AC',

            /**
             * @param {Scope} scope
             * @param {jQuery} element
             */
            link: function (scope, element) {
                $timeout(
                    function () {
                        element[0].focus();
                    },
                    50
                );
            }
        };
    }
]);
