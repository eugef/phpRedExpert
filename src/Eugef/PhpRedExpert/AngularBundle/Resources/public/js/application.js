var App = angular.module('myApp', ['ngRoute'])
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
                            page: page
                        }
                    }
                );
            }
        };
        
        return service;
    }
]);

// Controllers

App.controller('AppController', ['$scope', '$q', 'RedisService', 
    function ($scope, $q, RedisService) {
    
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
        
        $scope.isEmpty = function (obj) {
            return angular.isUndefined(obj) || (obj == null) || angular.equals({},obj); 
        };
        
        $scope.rangeSlice = function(size, start, end) {
            if (size > 0) {
                if (start < 0) {
                    end -= start;
                    start = 0;
                }

                if (end > size) {
                    start -= end - size;
                    end = size-1;
                }

                return $scope.range(start, end);
            }  
            else {
               return []; 
            }
        }
        
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
            page: 0,        
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
                if ($scope.search.pattern !== $scope.search.result.pattern) {
                    $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/search/' + encodeURIComponent($scope.search.pattern), false);
                }
                $scope.keySearch($scope.search.pattern);
			}
            
        }
        
        $scope.keySearch = function(pattern, page) {
            console.log('keySearch');
            $scope.search.pattern = pattern;
            $scope.search.page = angular.isDefined(page) ? page : 0;

            return RedisService.keySearch($scope.current.serverId, $scope.current.dbId, $scope.search.pattern, $scope.search.page).then(
                function(res) {
                    $scope.search.result.pattern = pattern;
                    $scope.search.result.count = res.data.metadata.count;
                    $scope.search.result.total = res.data.metadata.total;
                    $scope.search.result.pageSize = res.data.metadata.page_size;
                    
                    $scope.search.result.keys = [];
                    angular.forEach(res.data.items, function(key) {
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
        
        $scope.prevPage = function() {
            if ($scope.search.page > 0) {
                $scope.setPage($scope.search.page - 1);
            }
        };

        $scope.nextPage = function() {
            if ($scope.search.page < $scope.getLastPage() ) {
                return $scope.setPage($scope.search.page + 1);
            } 
        };

        $scope.setPage = function(page) {
            $location.path('server/' + $scope.current.serverId + '/db/' + $scope.current.dbId + '/search/' + encodeURIComponent($scope.search.pattern) + '/' + encodeURIComponent(page), false);
            $scope.keySearch($scope.search.pattern, page);
        };
        
        $scope.getLastPage = function() {
            return Math.ceil($scope.search.result.total / $scope.search.result.pageSize);
        };
        
        $scope.init($routeParams.serverId, $routeParams.dbId).then(function() {
            if ($routeParams.pattern) {
                console.log('search');
                console.log($routeParams);
                $scope.keySearch($routeParams.pattern, parseInt($routeParams.page));
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
