App.controller('DashboardController', ['$scope', '$routeParams', '$location', 'RedisService', 
    function ($scope, $routeParams, $location, RedisService) {
        console.log('DashboardController');
        console.log($routeParams);
        
        $scope.board = {};        
        
        $scope.getInfo = function() {
            console.log('getInfo');
                        
            return RedisService.getServerInfo($scope.current.serverId).then(
                function(response) {
                    $scope.board = response.data;

                    console.log('getInfo / done');
                }
            );
        }
        
        $scope.init($routeParams.serverId, $routeParams.dbId).then(function() {
            $scope.$parent.view = {
                title: 'Dashboard',
                subtitle: $scope.getCurrentServer().name
            };
            
            console.log('dashboard');
            $scope.getInfo();
        });        
    }
]);
