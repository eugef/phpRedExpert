var App = angular.module('phpRedExpert', ['ngRoute', 'jmdobry.angular-cache', 'ui.bootstrap', 'ui.unique', 'app.directives', 'app.filters'])
    .constant('config', CONFIG)
    .config(['$interpolateProvider', function ($interpolateProvider) {
        $interpolateProvider.startSymbol('{[').endSymbol(']}');
    }]);

angular.module('app.directives', ['eugef.activeLink', 'eugef.autoFocus', 'eugef.checkboxAll', 'eugef.menutree', 'eugef.resizable', 'eugef.sortOrder', 'eugef.togglesidebar']);
angular.module('app.filters', ['eugef.clientflag', 'eugef.range', 'eugef.sec2time']);

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

/**
 * Logging
 */
App.config(['$logProvider', 'config',
    function ($logProvider, config) {
        $logProvider.debugEnabled(config.debug);
    }
]);

/**
 * Router
 */
App.config(['$routeProvider', '$locationProvider', 'config',
    function ($routeProvider, $locationProvider, config) {
        $locationProvider.hashPrefix('!');
        $routeProvider.
            when('/', {
                templateUrl: config.assetsUri + 'src/app/dashboard/dashboard.tpl.html',
                controller: 'DashboardController'
            }).
            when('/server/:serverId', {
                templateUrl: config.assetsUri + 'src/app/dashboard/dashboard.tpl.html',
                controller: 'DashboardController'
            }).
            when('/server/:serverId/db/:dbId', {
                templateUrl: config.assetsUri + 'src/app/search/search.tpl.html',
                controller: 'SearchController'
            }).
            when('/server/:serverId/db/:dbId/search/:pattern?/:page?', {
                templateUrl: config.assetsUri + 'src/app/search/search.tpl.html',
                controller: 'SearchController'
            }).
            when('/server/:serverId/db/:dbId/key/view/:key', {
                templateUrl: config.assetsUri + 'src/app/key/key.tpl.html',
                controller: 'KeyController'
            }).
            when('/server/:serverId/db/:dbId/key/create/:type', {
                templateUrl: config.assetsUri + 'src/app/key/key.tpl.html',
                controller: 'KeyController'
            }).
            when('/server/:serverId/clients', {
                templateUrl: config.assetsUri + 'src/app/clients/clients.tpl.html',
                controller: 'ClientsController'
            }).
            otherwise({
                redirectTo: '/'
            });
    }
]);
