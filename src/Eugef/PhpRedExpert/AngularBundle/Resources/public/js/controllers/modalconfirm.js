App.controller('ModalConfirmController', ['$scope', '$modalInstance', 'settings',
    function ($scope, $modalInstance, settings) {
        console.log('ModalConfirmController');
        
        $scope.data = settings;
        $scope.data.action = angular.isDefined(settings.action) ? settings.action : 'Ok'
        
        $scope.ok = function() {
            $modalInstance.close();
        };

        $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
        };      
    }
]);
