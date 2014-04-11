App.controller('ModalAlertController', ['$scope', '$modalInstance', 'settings',
    function ($scope, $modalInstance, settings) {
        console.log('ModalAlertController');
        
        $scope.data = settings;
        
        $scope.ok = function() {
            $modalInstance.dismiss('cancel');
        };
    }
]);
