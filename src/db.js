'use strict';

const Promise = require( 'bluebird' );
const r = require( 'rethinkdbdash' )({
  host: 'rethinkdb-proxy',
  db: 'modding'
});

require( 'rethinkdb-init' )( r );

exports.init = function() {

  return new Promise( ( resolve, reject ) => {

    r.init({
        host: 'rethinkdb-proxy',
        db: 'modding'
      }, [
        {
          name: 'Token',
          replicas: 1,
          shards: 3,
          indexes: [
            'userId',
            'type'
          ]
        }
      ])
      .then( resolve )
      .catch( reject );

  });

}

exports.r = r;
