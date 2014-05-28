App.controller('ModalEditKeyAttributeController', ['$scope', '$modalInstance', '$log', 'settings',
    function ($scope, $modalInstance, $log, settings) {
        $log.debug('ModalEditKeyAttributeController', settings);
        
        $scope.data = settings;
        
        $scope.ok = function() {
            if (angular.isDefined($scope.data.value)) {
                $modalInstance.close($scope.data.value);
            }
            else {
                $scope.cancel();
            }
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };      
    }
]);
