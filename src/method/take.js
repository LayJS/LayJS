(function() {
  "use strict";


  LAY.take = function ( relativePath, prop ) {

    if ( ( prop !== undefined ) &&
    	( LAY.$checkIsValidUtils.checkIsAttrExpandable( prop ) ) ) {
        LAY.$error( "takes using expander props such as '" +
          relativePath  + "' are not permitted." );
    } else {

    	return new LAY.Take( relativePath, prop );
    }

  };

})();
