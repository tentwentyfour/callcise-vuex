const { Optional } = require('lonad');
const Callcise     = require('callcise');
const pipe         = require('lodash.flow');

const evaluate = Callcise.internal.evaluate;

const namespacedVuexInvokers = (optionalNamespace = Optional.None()) => {
  /*
  * Returns a function that calls a VueX
  * getter identified by its name that gets
  * a function. It takes pre-bound, evaluated
  * arguments and call-place arguments.
  */
  function vuexQuery(queryName, ...parameters) {
    return function query(...additionalParameters) {
      const getter = this.$store.getters[makeMethodName(queryName)];

      return getter(...evaluate(this, parameters).concat(additionalParameters));
    };
  }

  // Returns a function that calls a VueX getter identified by its name.
  function vuexGetter(getterName) {
    return function getter() {
      return this.$store.getters[makeMethodName(getterName)];
    };
  }

  /*
  * Returns a function that calls a VueX mutation that either takes a pre-bound
  * evaluated payload or one that's passed at the call-place (or none at all).
  */
  function vuexMutation(mutationName, predefinedPayload) {
    return function mutation(callbackPayload) {
      let payload = predefinedPayload ? evaluate(this, [predefinedPayload])[0] : callbackPayload;

      return this.$store.commit(makeMethodName(mutationName), payload);
    };
  }

  // Returns a function that calls a VueX action with evaluated arguments plus call-place arguments.
  function vuexAction(actionName, ...parameters) {
    return function action(...additionalParameters) {
      return this.$store.dispatch(
        makeMethodName(actionName),
        ...evaluate(this, parameters).concat(additionalParameters)
      );
    };
  }

  return {
    query:    vuexQuery,
    getter:   vuexGetter,
    action:   vuexAction,
    mutation: vuexMutation
  };

  function makeMethodName(vuexMethodName) {
    return optionalNamespace
    .map(namespace => `${namespace}/${vuexMethodName}`)
    .getOrElse(vuexMethodName);
  }
};

const globalVuex = namespacedVuexInvokers();

module.exports = {
  // Returns namespaced VueX invoker builders.
  namespaced: pipe(Optional.Some, namespacedVuexInvokers),

  vuexMutation: globalVuex.mutation,
  vuexGetter:   globalVuex.getter,
  vuexAction:   globalVuex.action,
  vuexQuery:    globalVuex.query
};
