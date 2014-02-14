var myApp = angular.module('myApp', ['ngRoute'])
    .config(['$interpolateProvider', function($interpolateProvider) {
        $interpolateProvider.startSymbol('{[').endSymbol(']}');
    }])
    .config(['$routeProvider', '$locationProvider',  function($routeProvider, $locationProvider) {
        $locationProvider.hashPrefix('!');
        $routeProvider.
            when('/', {
                templateUrl: '/phpredexpert/web/bundles/eugefphpredexpert/partials/search.html?1',
                controller: 'SearchController'
            }).
            when('/server/:serverId/', {
                templateUrl: '/phpredexpert/web/bundles/eugefphpredexpert/partials/search.html?2',
                controller: 'SearchController'
            }).
            when('/server/:serverId/db/:dbId/', {
                templateUrl: '/phpredexpert/web/bundles/eugefphpredexpert/partials/search.html?3',
                controller: 'SearchController'
            }).
            when('/server/:serverId/info/', {
                templateUrl: '/phpredexpert/web/bundles/eugefphpredexpert/partials/info.html',
                controller: 'InfoController'
            }).
            otherwise({
                redirectTo: '/'
            });
        }]
    );

myApp.factory('RedisService', ['$http', function($http) {
    return {
        getServers: function() {
            return $http.get('server/list');
        },
        
        getDBs: function(serverId) {
            return $http.get('server/' + serverId + '/databases');
        }
    };
}]);

myApp.controller('SearchController', ['$scope', '$routeParams', function ($scope, $routeParams) {
    console.log('SearchController');
    console.log($routeParams);
    $scope.init($routeParams.serverId, $routeParams.dbId);
}]);

myApp.controller('AppController', ['$scope', 'RedisService', function ($scope, RedisService) {
    
    $scope.servers = {};
    $scope.dbs = {};
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
        if ($scope.current.serverId == null) {
            
            $scope.loadServers(serverId).then(function() { 
                $scope.loadDBs(serverId, dbId);
            });
            
        }
        else {
            if ($scope.current.serverId != serverId) {
                $scope.loadDBs(serverId, dbId);
            }
            else {
                if ($scope.current.dbId != dbId) {
                    $scope.changeDB(dbId); 
                }    
            }
        }
        
        console.log('init');
    }
    
    $scope.getCurrentDB = function() {
        //console.log('getCurrentDB');
        return $scope.dbs[$scope.current.dbId];
    }
    
    $scope.getCurrentServer = function() {
        //console.log('getCurrentServer');
        return $scope.servers[$scope.current.serverId];
    }
    
    $scope.loadServers = function(newServerId) {
        console.log('loadServers');
        
        return RedisService.getServers().then(
            function(res) {
                $scope.servers = {};
                $scope.current.serverId = null;
                $scope.default.serverId = null;
                
                angular.forEach(res.data, function(server) {
                    if ($scope.default.serverId == null) {
                        $scope.default.serverId = server.id;
                    }
                    
                    $scope.servers[server.id] = {
                        'id' : server.id,
                        'name' : server.name ? server.name : server.host + ':' + server.port,
                        'password' : server.password,
                        'host' : server.host,
                        'port' : server.port,
                        'url': '#!/server/' + server.id
                    };
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
        
        if ($scope.serverExists(serverId)) {
            $scope.current.serverId = serverId;
        }
        else {
            $scope.current.serverId = $scope.default.serverId;
        }

        return RedisService.getDBs($scope.current.serverId).then(
            function(res) {
                $scope.dbs = {};
                $scope.current.dbId = null;
                $scope.default.dbId = null;
                
                angular.forEach(res.data, function(db) {
                    if ($scope.default.dbId == null || db.default) {
                        $scope.default.dbId = db.id;
                    }
                    
                    $scope.dbs[db.id] = {
                        'id' : db.id,
                        'name' : db.name ? db.name : 'DB ' + db.id,
                        'keys' : db.keys,
                        'expires' : db.expires,
                        'url' : '#!/server/' + $scope.current.serverId + '/db/' + db.id
                    };
                });
                
                if ($scope.dbExists(newDbId)) {
                    $scope.current.dbId = newDbId; 
                }
                else {
                    $scope.current.dbId = $scope.default.dbId; 
                }

                console.log('loadDBs / done');
            }
        );
    };
    
    $scope.changeDB = function(dbId) {
        console.log('changeDB ' + dbId);
        if ($scope.dbExists(dbId)) {
            $scope.current.dbId = dbId;
        }    
    }
    
    $scope.serverExists = function(serverId) {
        return angular.isDefined($scope.servers[serverId]);
    }
    
    $scope.dbExists = function(dbId) {
        return angular.isDefined($scope.dbs[dbId]);
    }
    
    //$scope.init();
}]);
