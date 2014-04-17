App.directive('menutree', ['$timeout', 
    function($timeout) {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                var btn = angular.element(elem.children()[0]);

                //open or close the menu on link click
                btn.bind('click', function(e) {
                    e.preventDefault();
                    if (elem.hasClass('active')) {
                        elem.removeClass('active').removeClass('animate');
                    } else {
                        elem.addClass('active').addClass('animate');
                        //animate on open
                        $timeout(
                            function() {
                                elem.removeClass('animate');
                            }, 
                            700
                        );
                    }
                });

            }
        }
    }
]);            
        