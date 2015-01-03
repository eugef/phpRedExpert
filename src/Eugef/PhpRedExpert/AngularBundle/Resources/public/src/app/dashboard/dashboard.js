App.controller('DashboardController', ['$scope', '$routeParams', '$log',
    function ($scope, $routeParams, $log) {
        "use strict";

        $log.debug('DashboardController', $routeParams);

        $scope.board = {
            info: null,
            config: null
        };

        $scope.init($routeParams.serverId, $routeParams.dbId).then(function () {
            $log.debug('DashboardController.init');

            $scope.$parent.view = {
                title: 'Dashboard',
                subtitle: ''
            };

            $scope.board = {
                info: $scope.$parent.server().info,
                config: $scope.$parent.server().config
            };
        });
    }
]);
