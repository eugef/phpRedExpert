App.controller('ModalEditKeyAttributeController', ['$scope', '$modalInstance', 'settings',
    function ($scope, $modalInstance, settings) {
        console.log('ModalEditKeyAttributeController');
        
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
