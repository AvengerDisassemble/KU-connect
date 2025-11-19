// Artillery processor for custom logic
// Provides helper functions for load testing scenarios

module.exports = {
  // Generate random test data
  generateTestData: function (userContext, events, done) {
    userContext.vars.randomEmail = `test-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}@ku.th`;
    userContext.vars.randomName = `Test-${Math.random()
      .toString(36)
      .substring(7)}`;
    return done();
  },

  // Log response times for debugging
  logResponse: function (requestParams, response, context, ee, next) {
    if (response.statusCode >= 400) {
      console.log(`Error ${response.statusCode}: ${requestParams.url}`);
    }
    return next();
  },

  // Custom metric tracking
  trackCustomMetrics: function (requestParams, response, context, ee, next) {
    if (response.timings) {
      ee.emit("counter", "response.time.total", response.timings.total || 0);
    }
    return next();
  },
};
