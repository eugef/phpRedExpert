App.controller('AppController', [
    '$scope', '$q', '$location', '$route', '$modal', '$log', 'config', 'RedisService', 'ServersListModel',
    function ($scope, $q, $location, $route, $modal, $log, config, RedisService, ServersList) {
        "use strict";

        $log.debug('AppController', $route);

        $scope.$route = $route;
        $scope.$location = $location;

        $scope.view = {
            title: '',
            subtitle: ''
        };

        $scope.servers = new ServersList();

        $scope.init = function (serverId, dbId) {
            $log.debug('AppController.init');

            serverId = parseInt(serverId, 10);
            dbId = parseInt(dbId, 10);

            var deferred = $q.defer();

            if ($scope.servers.isEmpty) {
                $scope.loadServersList(serverId).then(
                    function () {
                        $scope.loadServerData(serverId, dbId).then(
                            function () {
                                deferred.resolve();
                            }
                        );
                    }
                );
            }
            else {
                if ($scope.servers.current().id != serverId || angular.isUndefined(dbId)) {
                    $scope.loadServerData(serverId, dbId).then(function () {
                        deferred.resolve();
                    });
                }
                else {
                    if ($scope.servers.current().databaseCurrent().id != dbId) {
                        $scope.changeDB(dbId);
                    }
                    deferred.resolve();
                }
            }

            $log.debug('AppController.init / done');

            return deferred.promise;
        };

        $scope.loadServersList = function (serverId) {
            $log.debug('loadServersList', arguments);

            return RedisService.getServers().then(
                function (response) {
                    $log.debug('loadServersList / done', response.data);

                    $scope.servers.set(response.data);
                    $scope.servers.current(serverId);
                }
            );
        };

        $scope.loadServerData = function (serverId, selectDbId) {
            $log.debug('loadServerData', arguments);

            // if error is thrown - defer object should be resolved
            if (!$scope.servers.isExist(serverId)) {
                serverId = $scope.servers.default().id;
            }

            return RedisService.getServerDBs(serverId).then(
                function (response) {
                    $log.debug('loadServerData / done', response.data);

                    $scope.servers.current(serverId).databases = response.data;
                    $scope.servers.current().databaseCurrent(selectDbId);
                },
                function (error) {
                    $log.error(error.data.error.message);
                }
            );
        };

        $scope.changeDB = function (dbId) {
            $log.debug('changeDB', dbId);

            $scope.servers.current().databaseCurrent(dbId);
        };

        $scope.addDb = function () {
            $log.debug('addDb');

            $scope.showModal('ModalEditKeyAttributeController', 'adddb.html',
                {
                    databases: $scope.servers.current().databases
                }
            ).result.then(
                function (newDB) {
                    $log.debug('addDb / end', newDB);

                    $location.path('server/' + $scope.servers.current().id + '/db/' + newDB + '/search');
                }
            );
        };

        $scope.flushDB = function () {
            $scope.showModalConfirm({
                title: 'Flush database?',
                message: 'All keys are about to be permanently deleted',
                warning: 'You can\'t undo this action!',
                action: 'Flush'
            }).result.then(
                function () {
                    RedisService.flushDB($scope.servers.current().id, $scope.servers.current().databaseCurrent().id).then(
                        function (response) {
                            $location.path('server/' + $scope.servers.current().id + '/db/' + $scope.servers.current().databaseCurrent().id + '/search');

                            // reduce amount of keys in whole db
                            $scope.servers.current().databaseCurrent().keys = 0;
                        }
                    );
                }
            );
        };

        $scope.showModalConfirm = function (settings) {
            return $scope.showModal('ModalConfirmController', 'confirm.html', settings);
        };

        $scope.showModalAlert = function (settings) {
            return $scope.showModal('ModalAlertController', 'alert.html', settings, true);
        };

        $scope.showModal = function (controller, template, settings, backdrop) {
            return $modal.open({
                templateUrl: config.assetsUri + 'views/modals/' + template,
                controller: controller,
                backdrop: angular.isDefined(backdrop) ? backdrop : 'static',
                resolve: {
                    settings: function () {
                        return settings;
                    }
                }
            });
        };

        $scope.partialsUri = function (template) {
            return config.assetsUri + 'views/partials/' + template;
        };

        $scope.server = function () {
            return $scope.servers.current() || {};
        };

        $scope.db = function () {
            var server = $scope.servers.current();
            if (server) {
                return server.databaseCurrent();
            } else {
                return {};
            }
        };
    }
]);
