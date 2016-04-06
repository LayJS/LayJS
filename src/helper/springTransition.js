
// source of spring code insprired from below:
// facebook pop framework & framer.js

( function() {
  "use strict";


  LAY.$springTransition = function( duration, args ) {
    this.curTime = 0;
    this.value = 0;
    this.friction = parseFloat( args.friction || 20 );
    this.tension = parseFloat( args.tension || 300 );
    this.velocity = parseFloat( args.velocity || 0 );

    this.threshold = parseFloat( args.threshold || ( 1 / 1000 ) );
    this.isComplete = false;
  };

  LAY.$springTransition.prototype.generateNext = function ( delta ) {
    var
      finalVelocity, net1DVelocity, netFloat,
       netValueIsLow, netVelocityIsLow, stateAfter, stateBefore;


    delta = delta / 1000;

    this.curTime += delta;
    stateBefore = {};
    stateAfter = {};
    stateBefore.x = this.value - 1;
    stateBefore.v = this.velocity;
    stateBefore.tension = this.tension;
    stateBefore.friction = this.friction;
    stateAfter = springIntegrateState( stateBefore, delta );

    this.value = 1 + stateAfter.x;
    finalVelocity = stateAfter.v;
    netFloat = stateAfter.x;
    net1DVelocity = stateAfter.v;
    netValueIsLow = Math.abs( netFloat ) < this.threshold;
    netVelocityIsLow = Math.abs( net1DVelocity ) < this.threshold;
    this.isComplete = netValueIsLow && netVelocityIsLow;
    this.velocity = finalVelocity;
    return this.value;
  };

  LAY.$springTransition.prototype.checkIsComplete = function() {
    return this.isComplete;
  };


  function springAccelerationForState ( state ) {
    return ( - state.tension * state.x ) - ( state.friction * state.v );
  };

  function springEvaluateState ( initialState ) {
    var output;
    output = {};
    output.dx = initialState.v;
    output.dv = springAccelerationForState( initialState );
    return output;
  };

  function springEvaluateStateWithDerivative( initialState, dt, derivative ) {
    var output, state;
    state = {};
    state.x = initialState.x + derivative.dx * dt;
    state.v = initialState.v + derivative.dv * dt;
    state.tension = initialState.tension;
    state.friction = initialState.friction;
    output = {};
    output.dx = state.v;
    output.dv = springAccelerationForState(state);
    return output;
  };

  function springIntegrateState ( state, speed ) {
    var a, b, c, d, dvdt, dxdt;
    a = springEvaluateState(state);
    b = springEvaluateStateWithDerivative(state, speed * 0.5, a);
    c = springEvaluateStateWithDerivative(state, speed * 0.5, b);
    d = springEvaluateStateWithDerivative(state, speed, c);


    dxdt = 1.0 / 6.0 * (a.dx + 2.0 * (b.dx + c.dx) + d.dx);
    dvdt = 1.0 / 6.0 * (a.dv + 2.0 * (b.dv + c.dv) + d.dv);
    state.x = state.x + dxdt * speed;
    state.v = state.v + dvdt * speed;
    return state;
  }

})();
