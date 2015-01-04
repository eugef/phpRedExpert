App.controller('ClientsController', ['$scope', '$routeParams', '$log', 'RedisService',
    function ($scope, $routeParams, $log, RedisService) {
        "use strict";

        $log.debug('ClientsController', $routeParams);

        $scope.clients = {
            sort: {
                field: 'addr',
                reverse: false
            },
            result: {
                selected: [],
                items: []
            }
        };

        $scope.getServerClients = function (refresh) {
            refresh = angular.isDefined(refresh) ? refresh : false;

            $log.debug('getServerClients', arguments);

            return RedisService.getServerClients($scope.servers.current().id, refresh).then(
                function (response) {
                    $scope.clients.result.items = response.data.items;
                    $scope.clients.result.selected = [];

                    $log.debug('getServerClients / done', $scope.clients);
                }
            );
        };

        $scope.killServerClients = function () {
            $log.debug('killServerClients');

            var killClients = $scope.clients.result.selected;
            if (killClients) {
                $scope.$parent.showModalConfirm({
                    title: 'Kill client(s)?',
                    message: (killClients.length == 1 ? '1 client is' : killClients.length + ' clients are') + ' about to be killed:',
                    items: killClients,
                    warning: 'You can\'t undo this action!',
                    action: 'Kill'
                }).result.then(
                    function () {
                        RedisService.killServerClients($scope.servers.current().id, killClients).then(
                            function (response) {
                                $log.debug('killServerClients / done', response.data);

                                // Refresh clients
                                $scope.getServerClients(true);
                            }
                        );
                    }
                );
            }
        };

        $scope.selectItemExclusive = function (addr) {
            $log.debug('selectItemExclusive', arguments);

            for (var i = 0; i < $scope.clients.result.items.length; i++) {
                if ($scope.clients.result.items[i].addr == addr) {
                    // if multiple clients are selected - then select current client
                    // if only one client was selected - then inverse current state
                    // (i.e. allow to deselect current client)
                    $scope.clients.result.items[i].selected = $scope.clients.result.selected.length == 1 ? !$scope.clients.result.items[i].selected : true;
                }
                else {
                    $scope.clients.result.items[i].selected = false;
                }
            }
        };

        $scope.$watch('clients.result.items', function () {
            $scope.clients.result.selected = [];
            for (var i = 0; i < $scope.clients.result.items.length; i++) {
                if ($scope.clients.result.items[i].selected) {
                    $scope.clients.result.selected.push($scope.clients.result.items[i].addr);
                }
            }
        }, true);

        $scope.init($routeParams.serverId, $routeParams.dbId).then(function () {
            $log.debug('ClientsController.init');

            $scope.$parent.view = {
                title: 'Clients',
                subtitle: ''
            };

            $scope.getServerClients();
        });
    }
]);
