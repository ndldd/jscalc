self.onmessage = function(e) {
  var usedInputs = {};
  var inputs = {};

  var prepareInputs = function(targetInputs, sourceInputs, usedInputs) {
    for (var keyOrIndex in sourceInputs) {
      (function() {
        var key = keyOrIndex.toString();
        var usedInput = {used: false};
        usedInputs[key] = usedInput;
        var sourceInput = sourceInputs[keyOrIndex];
        var isPrimitive = (sourceInput instanceof Date ||
            !(sourceInput instanceof Object));
        var targetInput;
        if (isPrimitive) {
          if (sourceInput instanceof Date) {
            Object.freeze(sourceInput);
          }
          targetInput = sourceInput;
        } else {
          if (sourceInput instanceof Array) {
            targetInput = [];
          } else {
            targetInput = {};
          }
          usedInput.properties = {};
          prepareInputs(targetInput, sourceInput, usedInput.properties);
        }
        Object.defineProperty(targetInputs, key, {
          enumerable: true,
          get: function() {
            usedInput.used = true;
            return targetInput;
          }
        });
      })();
    }
    Object.freeze(targetInputs);
  };

  prepareInputs(inputs, e.data.inputs, usedInputs);
  var erred = true;
  try {
    var outputs = calculate(inputs);
    erred = false;
  } finally {
    var message = {usedInputs: usedInputs};
    if (!erred) {
      message.outputs = outputs;
    }
    self.postMessage(message);
  }
};
