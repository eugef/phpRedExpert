App.directive('autoFocus', ['$timeout',
    function ($timeout) {
        "use strict";

        return {
            restrict: 'AC',
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
