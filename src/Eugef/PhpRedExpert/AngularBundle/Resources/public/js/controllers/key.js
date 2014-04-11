App.controller('KeyController', ['$scope', '$routeParams', '$location', 'RedisService',
    function ($scope, $routeParams, $location, RedisService) {
        console.log('KeyController');
        console.log($routeParams);

        $scope.key = {};

        $scope.displayKey = function(keyName) {
            $scope.key.name = keyName;
        }

        $scope.init($routeParams.serverId, $routeParams.dbId).then(function() {
            $scope.$parent.view = {
                title: 'Key',
                subtitle: $routeParams.key
            };
            
            $scope.displayKey($routeParams.key);
        });        
    }
]);

