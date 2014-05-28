var App = angular.module('myApp', ['ngRoute', 'ui.bootstrap', 'jmdobry.angular-cache', 'ui.unique'])
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

// Logging

App.config(['$logProvider', 'config', 
    function($logProvider, config) {
        $logProvider.debugEnabled(config.debug);
    }]
);

// Router

App.config(['$routeProvider', '$locationProvider', 'config', 
    function($routeProvider, $locationProvider, config) {
        $locationProvider.hashPrefix('!');
        $routeProvider.
            when('/', {
                templateUrl: config.assetsUri + 'views/controllers/dashboard.html',
                controller: 'DashboardController'
            }).
            when('/server/:serverId', {
                templateUrl: config.assetsUri + 'views/controllers/dashboard.html',
                controller: 'DashboardController'
            }).
            when('/server/:serverId/db/:dbId', {
                templateUrl: config.assetsUri + 'views/controllers/search.html',
                controller: 'SearchController'
            }).
            when('/server/:serverId/db/:dbId/search/:pattern?/:page?', {
                templateUrl: config.assetsUri + 'views/controllers/search.html',
                controller: 'SearchController'
            }). 
            when('/server/:serverId/db/:dbId/key/view/:key', {
                templateUrl: config.assetsUri + 'views/controllers/key.html',
                controller: 'KeyController'
            }).        
            when('/server/:serverId/db/:dbId/key/add/:type', {
                templateUrl: config.assetsUri + 'views/controllers/key.html',
                controller: 'KeyController'
            }).        
            when('/server/:serverId/clients', {
                templateUrl: config.assetsUri + 'views/controllers/clients.html',
                controller: 'ClientsController'
            }).
            otherwise({
                redirectTo: '/'
            });
    }]
);
