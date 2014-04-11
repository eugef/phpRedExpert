App.directive('autoFocus', ['$timeout',
    function($timeout) {
        return {
            restrict: 'AC',
            link: function(scope, elem) {
                $timeout(function() {
                    elem[0].focus();
                }, 50);
            }
        };
    }
]);
