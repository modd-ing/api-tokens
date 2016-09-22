'use strict';

const Promise = require( 'bluebird' );

Promise.config({
  cancellation: true
});

const _ = require( 'lodash' );
const db = require( '../db' );
const r = db.r;

module.exports = function () {

  // Promisify the seneca .act() method
  const act = Promise.promisify( this.act, { context: this });

  this.add( 'init:api-tokens', function( msg, done ) {

    db.init()
      .then( function() {

        done();

      });

  });

  this.add( 'role:api,path:tokens,cmd:get', function( msg, done ) {

    let tokenId = ( msg.params.id || msg.query.id ),
      type = msg.body.type,
      userId = msg.body.userId;

    if ( ! tokenId && ! type && ! userId ) {

      done( null, {
        errors: [
          {
            title: 'Parameters not valid',
            detail: 'Token id is missing.',
            propertyName: 'id',
            status: 400
          }
        ]
      });

      return;

    }

    const queryParams = {};

    if ( tokenId ) {

      queryParams.tokenId = tokenId;

    }

    if ( type ) {

      queryParams.type = type;

    }

    if ( userId ) {

      queryParams.userId = userId;

    }

    act({
        role: 'api',
        path: 'tokens',
        cmd: 'getTokens',
        args: queryParams,
        options: {}
      })
      .then( ( result ) => {

        if ( _.isEmpty( result.data ) ) {

          done( null, {
            data: null
          });

          return;

        }

        done( null, {
          data: result.data
        });

      })
      .catch( ( err ) => {

        done( err, null );

      });

  });

  this.add( 'role:api,path:tokens,cmd:post', function( msg, done ) {

    if ( ! msg.userId ) {

      done( null, {
        errors: [
          {
            title: 'Parameters not valid',
            detail: 'User id is missing.',
            propertyName: 'userId',
            status: 400
          }
        ]
      });

      return;

    }

    if ( ! msg.type ) {

      done( null, {
        errors: [
          {
            title: 'Parameters not valid',
            detail: 'Type is missing.',
            propertyName: 'type',
            status: 400
          }
        ]
      });

      return;

    }

    const token = {
      userId: msg.userId,
      type: msg.type
    };

    // Check if such token already exists in the db, and if yes, return it
    const queryParams = {
      userId: msg.userId,
      type: msg.type
    };

    const promise = act({
        role: 'api',
        path: 'tokens',
        cmd: 'getTokens',
        args: queryParams,
        options: {}
      })
      .then( ( result ) => {

        if ( ! _.isEmpty( result.data ) ) {

          // Token found, no need for insert
          done( null, {
            data: result.data
          });

          promise.cancel();

          return;

        }

        return;

      })
      .then( () => {

        return r
          .table( 'Token' )
          .insert( token, { returnChanges: true } )
          .run();

      })
      .then( ( result ) => {

        if ( 0 === result.inserted ) {

          done( null, {
            errors: [
              {
                title: 'Unknown error',
                detail: 'Failed writing to database.',
                status: 500
              }
            ]
          });

          return;

        }

        const data = result.changes[0].new_val;

        done( null, {
          data: data
        });

      })
      .catch( ( err ) => {

        done( err, null );

      });

  });

  return {
    name: 'api-tokens'
  };

};
