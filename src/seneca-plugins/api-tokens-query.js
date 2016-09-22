'use strict';

const validator = require( 'validator' );
const db = require( '../db' );
const r = db.r;
const _ = require( 'lodash' );

module.exports = function () {

  this.add( 'role:api,path:tokens,cmd:getTokens', function( msg, done ) {

    const args = msg.args,
      defaultOptions = {
        limit: 10,
        page: 1
      };

    const options = _.defaults( msg.options, defaultOptions );

    // Limit cant be lower than 1 or higher than 100
    options.limit = Math.min( Math.max( 1, parseInt( options.limit, 10 ) ), 100 );

    // Page cant be lower than 1
    options.page = Math.max( 1, parseInt( options.page, 10 ) );

    // Start the request
    let request = r.table( 'Token' );

    if ( args.id ) {

      if ( Array.isArray( args.id ) ) {

        request = request.getAll( r.args( args.id ) );

      } else {

        request = request.get( validator.escape( args.id ) );

      }

    } else if ( args.userId ) {

      if ( Array.isArray( args.userId ) ) {

        request = request.getAll( r.args( args.userId ), { index: 'userId' } );

      } else {

        request = request.getAll( args.userId, { index: 'userId' } );

      }

      if ( args.type ) {

        if ( Array.isArray( args.type ) ) {

          request = request.filter( ( token ) => { return r.expr( args.type ).contains( token ); });

        } else {

          request = request.filter({ type: args.type });

        }

      }

    } else if ( args.type ) {

      if ( Array.isArray( args.type ) ) {

        request = request.getAll( r.args( args.type ), { index: 'type' } );

      } else {

        request = request.getAll( args.type, { index: 'type' } );

      }

    }

    // Page
    if ( ( ! args.id || Array.isArray( args.id ) ) && options.page > 1 ) {

      request = request.skip( options.limit * ( options.page - 1 ) );

    }

    // Limit
    if ( ( ! args.id || Array.isArray( args.id ) ) && options.limit ) {

      request = request.limit( options.limit );

    }

    request
      .run()
      .then( ( result ) => {

        done( null, {
          data: result
        });

      })
      .catch( ( err ) => {

        done( err, null );

      });

  });

  return {
    name: 'api-tokens-query'
  };

};
