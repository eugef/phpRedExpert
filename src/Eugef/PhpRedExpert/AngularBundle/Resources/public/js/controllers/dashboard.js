App.controller('DashboardController', ['$scope', '$routeParams', '$location', '$log', 'RedisService', 
    function ($scope, $routeParams, $location, $log, RedisService) {
        $log.debug('DashboardController', $routeParams);
        
        $scope.board = {};        
        
        $scope.getInfo = function() {
            $log.debug('getInfo');
                        
            return RedisService.getServerInfo($scope.current.serverId).then(
                function(response) {
                    $log.debug('getInfo / done', response.data);
                    
                    $scope.board.info = response.data;
                }
            );
        }
        
        $scope.getConfig = function() {
            $log.debug('getConfig');
                        
            return RedisService.getServerConfig($scope.current.serverId).then(
                function(response) {
                    $log.debug('getConfig / done', response.data);
                    
                    $scope.board.config = response.data;
                }
            );
        }
        
        $scope.init($routeParams.serverId, $routeParams.dbId).then(function() {
            $log.debug('DashboardController.init');
            
            $scope.$parent.view = {
                title: 'Dashboard',
                subtitle: $scope.getCurrentServer().name
            };

            $scope.getInfo();
            $scope.getConfig();
        });        
    }
]);
