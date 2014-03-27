App.filter('clientflag', function() {
    var flags = {
        O: 'slave in MONITOR mode',
        S: 'normal slave server',
        M: 'master',
        x: 'in MULTI/EXEC context',
        b: 'waiting in a blocking operation',
        i: 'waiting for a VM I/O',
        d: 'a watched keys has been modified - EXEC will fail',
        c: 'connection to be closed after writing entire reply',
        u: 'unblocked',
        A: 'connection to be closed ASAP',
        N: 'normal client'
    };
    
    return function(input) {
        if (input) {
            result = [];
            for(i=0; i<input.length; i++) {
                result.push(flags[input.charAt(i)]);
            }
            
            return result.join();
        }
        else {
            return '-';
        }
    }
});