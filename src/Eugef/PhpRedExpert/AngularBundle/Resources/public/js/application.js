var App = angular.module('myApp', ['ngRoute', 'ui.bootstrap'])
    .constant('config', CONFIG)
    .config(['$interpolateProvider', function($interpolateProvider) {
        $interpolateProvider.startSymbol('{[').endSymbol(']}');
    }]);

/*
 * Allow change location without firing route
 * @see https://github.com/angular/angular.js/issues/1699#issuecomment-36637748
 */
App.run(['$route', '$rootScope', '$location', 
    function ($route, $rootScope, $location) {
        var original = $location.path;
        $location.path = function (path, reload) {
            if (reload === false) {
                var lastRoute = $route.current;
                var un = $rootScope.$on('$locationChangeSuccess', function () {
                    $route.current = lastRoute;
                    un();
                });
            }
            
            return original.apply($location, [path]);
        };
    }
]);

// Router

App.config(['$routeProvider', '$locationProvider', 'config', 
    function($routeProvider, $locationProvider, config) {
        $locationProvider.hashPrefix('!');
        $routeProvider.
            when('/', {
                templateUrl: config.assetsUri + 'partials/search.html',
                controller: 'SearchController'
            }).
            when('/server/:serverId/', {
                templateUrl: config.assetsUri + 'partials/search.html',
                controller: 'SearchController'
            }).
            when('/server/:serverId/db/:dbId/', {
                templateUrl: config.assetsUri + 'partials/search.html',
                controller: 'SearchController'
            }).
            when('/server/:serverId/info/', {
                templateUrl: config.assetsUri + 'partials/info.html',
                controller: 'InfoController'
            }).
            when('/server/:serverId/db/:dbId/search/:pattern?/:page?', {
                templateUrl: config.assetsUri + 'partials/search.html',
                controller: 'SearchController'
            }).        
            otherwise({
                redirectTo: '/'
            });
    }]
);

// Filters

App.filter('sec2time', function() {
    return function(input) {
        if (input > 0) {
            var sec_num = parseInt(input, 10);
            var days = 0;
            var hours = Math.floor(sec_num / 3600);
            var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
            var seconds = sec_num - (hours * 3600) - (minutes * 60);

            if (hours >= 23) {
               days = Math.floor(hours / 24);
               hours = hours - (days * 24);
            }

            if (hours < 10) {
                hours = '0' + hours;
            }
            if (minutes < 10) {
                minutes = '0' + minutes;
            }
            if (seconds < 10) {
                seconds = '0' + seconds;
            }

            return (days ? days + ' day(s) ' : '') + hours + ':' + minutes + ':' + seconds;
        }
        else {
            return '-';
        }
    }
});

// Services

App.factory('RedisService', ['$http', 'config', 
    function($http, config) {
        var service = {
            getServers: function() {
                return $http.get(config.apiUri + 'server/list');
            },

            getDBs: function(serverId) {
                return $http.get(config.apiUri + 'server/' + serverId + '/databases');
            },
            
            keySearch: function(serverId, dbId, pattern, page) {
                return $http.get(
                    config.apiUri + 'server/' + serverId + '/db/' + dbId + '/search', 
                    {
                        params : {
                            pattern : pattern,
                            // backend pagination starts from 0, frontend from 1
                            page: page > 0 ? page-1 : 0
                        }
                    }
                );
            }
        };
        
        return service;
    }
]);

// Controllers

App.controller('AppController', ['$scope', '$q', '$location', 'RedisService', 
    function ($scope, $q, $location, RedisService) {
    
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
                function(response) {
                    $scope.servers = {};
                    $scope.current.serverId = null;
                    $scope.default.serverId = null;

                    angular.forEach(response.data, function(server) {
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

            // if error is thrown - defer object should be resolved
            if (!$scope.serverExists(serverId)) {
                serverId = $scope.default.serverId;
            }

            return RedisService.getDBs(serverId).then(
                function(response) {
                    $scope.dbs = {};
                    $scope.current.serverId = serverId;
                    $scope.current.dbId = null;
                    $scope.default.dbId = null;

                    angular.forEach(response.data, function(db) {
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
            return angular.isDefined($scope.servers[serverId]);
        }

        $scope.dbExists = function(dbId) {
            return angular.isDefined($scope.dbs[dbId]);
        }
        
        $scope.isEmpty = function (obj) {
            return angular.isUndefined(obj) || (obj == null) || angular.equals({},obj); 
        };
        
        $scope.range = function(start, end)  {
            var result = [];        

            if (angular.isUndefined(end)) {
                end = start;
                start = 0;
            }

            for (var i = start; i <= end; i++) {
                result.push(i);
            }     

            return result;
        };
        

    }
]);

App.controller('SearchController', ['$scope', '$routeParams', '$location', 'RedisService', 
    function ($scope, $routeParams, $location, RedisService) {
        console.log('SearchController');
        console.log($routeParams);
        
        $scope.search = {
            pattern: '',
            page: 1, 
            pageCount: 0,
            sort: {
                field: 'name',
                reverse: false
            },
            result: {
                pattern: '',
                keys: [],
                count: 0,
                total: 0,
                pageSize: 1
            }        
        };        
        
        $scope.submitSearch = function() {
			if ($scope.searchForm.$valid) {
                if ($scope.search.pattern != $scope.search.result.pattern) {
                    $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/search/' + encodeURIComponent($scope.search.pattern), false);
                }
                $scope.keySearch($scope.search.pattern, 1);
			}
            
        }
        
        $scope.keySearch = function(pattern, page) {
            console.log('keySearch: ' + page + '[' + $scope.search.page + ']');
            $scope.search.pattern = pattern;
                        
            return RedisService.keySearch($scope.current.serverId, $scope.current.dbId, pattern, page).then(
                function(response) {
                    /*
                     * because pagination plugin watches total count and page,
                     * these variables should be changed in one scope
                     */
                    $scope.search.page = page;
                    $scope.search.result.pattern = pattern;
                    $scope.search.result.count = response.data.metadata.count;
                    $scope.search.result.total = response.data.metadata.total;
                    $scope.search.result.pageSize = response.data.metadata.page_size;
                    
                    $scope.search.result.keys = [];
                    angular.forEach(response.data.items, function(key) {
                        $scope.search.result.keys.push(key);
                    });

                    console.log('keySearch / done');
                }
            );
        }
        
        // change sorting order
        $scope.sortBy = function(field) {
            console.log('sortBy: ' + field);
            if ($scope.search.sort.field == field) {
                $scope.search.sort.reverse = !$scope.search.sort.reverse;
            } 
            else {
                $scope.search.sort.field = field;
                $scope.search.sort.reverse = false;
            }
        };
        
        $scope.setPage = function(page) {
            console.log('set page: ' + page + '[' + $scope.search.page + ']');
            console.log($scope.search);
            $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/search/' + encodeURIComponent($scope.search.pattern) + '/' + encodeURIComponent(page), false);
            $scope.keySearch($scope.search.pattern, page);
        };
        
        $scope.init($routeParams.serverId, $routeParams.dbId).then(function() {
            if ($routeParams.pattern) {
                console.log('search');
                console.log($routeParams);
                page = parseInt($routeParams.page, 10) > 0 ? parseInt($routeParams.page, 10) : 1;
                $scope.keySearch($routeParams.pattern, page);
            }
        });        
    }
]);

App.controller('InfoController', ['$scope', '$routeParams', 
    function ($scope, $routeParams) {
        console.log('InfoController');
        console.log($routeParams);
        $scope.init($routeParams.serverId, $routeParams.dbId);
    }
]);
