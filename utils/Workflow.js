function getStep(stepNum) {
  var localStore = require('../utils/LocalStore')
  var steps = localStore.loadWorkflow();
  var selectedStep = null;
  steps.forEach(function(step) {
      if (step.id == stepNum) {
          selectedStep = step;
      }
  });
  return selectedStep;
}

var HFC_FUNCTION_NAME = {};


exports.getStep = getStep;
exports.HFC_FUNCTION_NAME={
  'initContract':'initContract'
}