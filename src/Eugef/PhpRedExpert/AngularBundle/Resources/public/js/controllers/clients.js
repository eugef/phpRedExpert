App.controller('ClientsController', ['$scope', '$routeParams', '$location', 'RedisService', 
    function ($scope, $routeParams, $location, RedisService) {
        console.log('ClientsController');
        console.log($routeParams);
        
        $scope.clients = [];        
        
        $scope.getClients = function(refresh) {
            refresh = angular.isDefined(refresh) ? refresh : false;
            
            console.log('getClients: ' + refresh);
                                    
            return RedisService.getClients($scope.current.serverId, refresh).then(
                function(response) {
                    $scope.clients = response.data.items;
                    console.log($scope.clients);
                    console.log('getClients / done');
                }
            );
        }
        
        $scope.init($routeParams.serverId, $routeParams.dbId).then(function() {
            $scope.$parent.view = {
                title: 'Clients',
                subtitle: $scope.getCurrentServer().name
            };
            
            console.log('clients');
            $scope.getClients();
        });        
    }
]);
