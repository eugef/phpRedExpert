App.controller('AppController', ['$scope', '$q', '$location', '$route', '$modal', '$log', 'config', 'RedisService', 
    function ($scope, $q, $location, $route, $modal, $log, config, RedisService) {
        $log.debug('AppController', $route);

        $scope.$route = $route;
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

        $scope.init = function(serverId, dbId) {
            $log.debug('AppController.init');
            
            serverId = parseInt(serverId, 10);
            dbId = parseInt(dbId, 10);
            
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

            $log.debug('AppController.init / done');
            
            return deferred.promise;
        }

        $scope.loadServers = function(newServerId) {
            $log.debug('loadServers', arguments);

            return RedisService.getServers().then(
                function(response) {
                    $log.debug('loadServers / done', response.data);
                    
                    $scope.servers = [];
                    $scope.current.serverId = null;
                    $scope.default.serverId = null;

                    angular.forEach(response.data, function(server) {
                        if ($scope.default.serverId == null) {
                            $scope.default.serverId = server.id;
                        }

                        $scope.servers.push({
                            id : server.id,
                            name : server.name ? server.name : server.host + ':' + server.port,
                            password : server.password,
                            host : server.host,
                            port : server.port,
                        });
                    });

                    if ($scope.serverExists(newServerId)) {
                        $scope.current.serverId = newServerId;
                    } 
                    else {
                        $scope.current.serverId = $scope.default.serverId;
                    }                    
                }
            );
        }   

        $scope.loadDBs = function(serverId, newDbId) {
            $log.debug('loadDBs');

            // if error is thrown - defer object should be resolved
            if (!$scope.serverExists(serverId)) {
                serverId = $scope.default.serverId;
            }

            return RedisService.getServerDBs(serverId).then(
                function(response) {
                    $log.debug('loadDBs / done', response.data)
                    
                    $scope.dbs = [];
                    $scope.current.serverId = serverId;
                    $scope.current.dbId = null;
                    $scope.default.dbId = null;

                    angular.forEach(response.data, function(db) {
                        if ($scope.default.dbId == null || db.default) {
                            $scope.default.dbId = db.id;
                        }

                        $scope.dbs.push({
                            id : db.id,
                            name : db.name ? db.name : 'DB ' + db.id,
                            keys : db.keys,
                            expires : db.expires,
                            visible : db.keys > 0 || !!db.default
                        });
                    });

                    $scope.changeDB(newDbId);
                },
                function(error) {
                    $log.error(error.data.error.message);
                }
            );
        };

        $scope.changeDB = function(dbId) {
            $log.debug('changeDB', dbId);
            
            if ($scope.dbExists(dbId)) {
                $scope.current.dbId = dbId;
            } 
            else {
                $scope.current.dbId = $scope.default.dbId; 
            }
            
            for (var i = 0; i < $scope.dbs.length; i++) {
                if ($scope.dbs[i].id == $scope.current.dbId) {
                    $scope.dbs[i].visible = true;
                    $scope.dbs[i].current = true;
                }
                else {
                    $scope.dbs[i].current = false;
                }
            };
        }

        $scope.serverExists = function(serverId) {
            return $scope.find($scope.servers, 'id', serverId) !== null;
        }

        $scope.dbExists = function(dbId) {
            return $scope.find($scope.dbs, 'id', dbId) !== null;
        }
        
        $scope.getDB = function(dbId) {
            return $scope.find($scope.dbs, 'id', dbId);
        }
        
        $scope.getCurrentDB = function() {
            return $scope.getDB($scope.current.dbId);
        }

        $scope.getServer = function(serverId) {
            return $scope.find($scope.servers, 'id', serverId);
        }
        
        $scope.getCurrentServer = function() {
            return $scope.getServer($scope.current.serverId);
        }
        
        $scope.find = function(array, key, value) {
            for (var i = 0; i < array.length; i++) {
                if (array[i][key] == value) {
                    return array[i];
                }
            };
            return null;
        }
        
        $scope.addDb = function() {
            $log.debug('addDb');
            
            $scope.showModal('ModalEditKeyAttributeController', 'adddb.html',                  
                {
                    databases: $scope.dbs,
                }
            ).result.then(function(newDB) {
                $log.debug('addDb / end', newDB);
                
                $location.path('server/' + $scope.current.serverId + '/db/' + newDB + '/search');
            });
        }
        
        $scope.flushDB = function()  {
            $scope.showModalConfirm({
                title: 'Flush database?',
                message: 'All keys are about to be permanently deleted',
                warning: 'You can\'t undo this action!',
                action: 'Flush'
            }).result.then(function() {
                RedisService.flushDB($scope.current.serverId, $scope.current.dbId).then(
                    function(response) {
                        $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/search');
                        
                        // reduce amount of keys in whole db
                        $scope.getCurrentDB().keys = 0;
                    }
                );
            });
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
