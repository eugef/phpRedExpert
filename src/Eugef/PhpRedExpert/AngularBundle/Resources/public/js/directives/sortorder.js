App.directive('sortOrder', 
    function() {
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                var sort =  scope.$eval(attrs.sortOrder);
                var field = attrs.sortOrderBy;

                elem.addClass('sorting');

                elem.bind('click', function() {
                    scope.$apply(function() {
                        if (sort.field == field) {
                            sort.reverse = !sort.reverse;
                        } 
                        else {
                            sort.field = field;
                            sort.reverse = false;
                        }
                    });
                });
                
                scope.$watch(attrs.sortOrder, function(sortNew) {
                    if (sortNew.field == field) {
                        if (sortNew.reverse) {
                            elem.removeClass('sorting-desc').addClass('sorting-asc');
                        }
                        else {
                            elem.removeClass('sorting-asc').addClass('sorting-desc');
                        } 
                    }
                    else {
                        elem.removeClass('sorting-asc').removeClass('sorting-desc');
                    }
                }, true);
            }
        }
    }
);
