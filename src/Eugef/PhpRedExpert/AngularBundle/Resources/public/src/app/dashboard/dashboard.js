App.controller('DashboardController', ['$scope', '$routeParams', '$location', '$log', 'RedisService',
    function ($scope, $routeParams, $location, $log, RedisService) {
        "use strict";

        $log.debug('DashboardController', $routeParams);

        $scope.board = {};

        $scope.getInfo = function () {
            $log.debug('getInfo');

            return RedisService.getServerInfo($scope.servers.current().id).then(
                function (response) {
                    $log.debug('getInfo / done', response.data);

                    $scope.board.info = response.data;
                }
            );
        };

        $scope.getConfig = function () {
            $log.debug('getConfig');

            return RedisService.getServerConfig($scope.servers.current().id).then(
                function (response) {
                    $log.debug('getConfig / done', response.data);

                    $scope.board.config = response.data;
                }
            );
        };

        $scope.init($routeParams.serverId, $routeParams.dbId).then(function () {
            $log.debug('DashboardController.init');

            $scope.$parent.view = {
                title: 'Dashboard',
                subtitle: ''
            };

            $scope.getInfo();
            $scope.getConfig();
        });
    }
]);
