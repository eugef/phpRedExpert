App.directive('checkboxAll', 
    function() {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                var parts = attrs.checkboxAll.split('|');

                elem.attr('type', 'checkbox');
                elem.bind('change', function() {
                    scope.$apply(function() {
                        var setValue = elem.prop('checked');
                        angular.forEach(scope.$eval(parts[0]), function(v) {
                            v[parts[1]] = setValue;
                        });
                    });
                });

                scope.$watch(parts[0], function(newVal) {
                    var hasTrue = false, hasFalse = false;

                    angular.forEach(newVal, function(v) {
                        if (v[parts[1]]) {
                            hasTrue = true;
                        } else {
                            hasFalse = true;
                        }
                    });

                    if (hasTrue && hasFalse) {
                        elem.attr('checked', false);
                        elem.prop('indeterminate', true);
                        elem.addClass('greyed');
                    } else {
                        elem.attr('checked', hasTrue);
                        elem.prop('indeterminate', false);
                        elem.removeClass('greyed');
                    }
                }, true);
            }
        }
    }
);
