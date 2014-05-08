App.controller('AppController', ['$scope', '$q', '$location', '$route', '$modal', 'config', 'RedisService', 
    function ($scope, $q, $location, $route, $modal, config, RedisService) {
    
        $scope.$route = $route;
        console.log($route);
        $scope.$location = $location;
        
        $scope.view = {
            title: '',
            subtitle: ''
        };
        
        $scope.servers = [];
        $scope.dbs = [];
        $scope.current = {
            serverId: null,
            dbId: null
        };
        $scope.default = {
            serverId: null,
            dbId: null
        };

        console.log('AppController');

        $scope.init = function(serverId, dbId) {
            var deferred = $q.defer();
            
            if ($scope.current.serverId == null) {
                $scope.loadServers(serverId).then(function() { 
                    $scope.loadDBs(serverId, dbId).then(function() {
                        deferred.resolve();
                    });
                });
            }
            else {
                if ($scope.current.serverId != serverId || angular.isUndefined(dbId)) {
                    $scope.loadDBs(serverId, dbId).then(function() {
                        deferred.resolve();
                    });
                }
                else {
                    if ($scope.current.dbId != dbId) {
                        $scope.changeDB(dbId); 
                    }    
                    deferred.resolve();
                }
            }

            console.log('init');
            return deferred.promise;
        }

        $scope.loadServers = function(newServerId) {
            console.log('loadServers');

            return RedisService.getServers().then(
                function(response) {
                    $scope.servers = [];
                    $scope.current.serverId = null;
                    $scope.default.serverId = null;

                    angular.forEach(response.data, function(server) {
                        if ($scope.default.serverId == null) {
                            $scope.default.serverId = server.id;
                        }

                        $scope.servers.push({
                            'id' : server.id,
                            'name' : server.name ? server.name : server.host + ':' + server.port,
                            'password' : server.password,
                            'host' : server.host,
                            'port' : server.port,
                        });
                    });

                    if ($scope.serverExists(newServerId)) {
                        $scope.current.serverId = newServerId;
                    } 
                    else {
                        $scope.current.serverId = $scope.default.serverId;
                    }
                    console.log('loadServers / done');
                }
            );
        }   

        $scope.loadDBs = function(serverId, newDbId) {
            console.log('loadDBs');

            // if error is thrown - defer object should be resolved
            if (!$scope.serverExists(serverId)) {
                serverId = $scope.default.serverId;
            }

            return RedisService.getServerDBs(serverId).then(
                function(response) {
                    $scope.dbs = [];
                    $scope.current.serverId = serverId;
                    $scope.current.dbId = null;
                    $scope.default.dbId = null;

                    angular.forEach(response.data, function(db) {
                        if ($scope.default.dbId == null || db.default) {
                            $scope.default.dbId = db.id;
                        }

                        $scope.dbs.push({
                            'id' : db.id,
                            'name' : db.name ? db.name : 'DB ' + db.id,
                            'keys' : db.keys,
                            'expires' : db.expires,
                        });
                    });

                    if ($scope.dbExists(newDbId)) {
                        $scope.current.dbId = newDbId; 
                    }
                    else {
                        $scope.current.dbId = $scope.default.dbId; 
                    }

                    console.log('loadDBs / done');
                },
                function(error) {
                    alert(error.data.error.message);
                }
            );
        };

        $scope.changeDB = function(dbId) {
            console.log('changeDB ' + dbId);
            if ($scope.dbExists(dbId)) {
                $scope.current.dbId = dbId;
            } 
            else {
                alert('Database doesn\'t exists');
            }
        }

        $scope.serverExists = function(serverId) {
            return $scope.find($scope.servers, 'id', serverId) !== null;
        }

        $scope.dbExists = function(dbId) {
            return $scope.find($scope.dbs, 'id', dbId) !== null;
        }
        
        $scope.getCurrentDB = function() {
            //console.log('getCurrentDB');
            return $scope.find($scope.dbs, 'id', $scope.current.dbId);
        }

        $scope.getCurrentServer = function() {
            //console.log('getCurrentServer');
            return $scope.find($scope.servers, 'id', $scope.current.serverId);
        }
        
        $scope.find = function(array, key, value) {
            for (var i = 0; i < array.length; i++) {
                if (array[i][key] == value) {
                    return array[i];
                }
            };
            return null;
        }
        
        $scope.showModalConfirm = function(settings) {
            return $scope.showModal('ModalConfirmController', 'confirm.html', settings);
        }
        
        $scope.showModalAlert = function(settings) {
            return $scope.showModal('ModalAlertController', 'alert.html', settings, true);
        }
        
        $scope.showModal = function(controller, template, settings, backdrop) {
            return $modal.open({
                templateUrl: config.assetsUri + 'views/modals/' + template,
                controller: controller,
                backdrop: angular.isDefined(backdrop) ? backdrop : 'static',
                resolve: {
                    settings: function() {
                        return settings;
                    }      
                }    
            });
        }
        
        $scope.partialsUri = function(template) {
            return config.assetsUri + 'views/partials/' + template;
        }

    }
]);
