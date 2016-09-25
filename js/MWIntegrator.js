'use strict';

// MWIntegrator implements a moving window integrator. It averages
// the signal values over the last WINDOW_WIDTH samples.
(function (exports) {
    var MWIntegratorManager = function() {
        var MS80 = Math.floor(80 / (1000 / 300) + 0.5);
        this.WINDOW_WIDTH = MS80;
        this.mSum = 0;
        this.mBuffer = new Array(this.WINDOW_WIDTH);
        this.mIndex = 0;
    }
    MWIntegratorManager.prototype = {
        init() {
            for (this.mIndex = 0; this.mIndex < this.WINDOW_WIDTH; ++this.mIndex) {
                this.mBuffer[this.mIndex] = 0;
            }
            this.mSum = 0;
            this.mIndex = 0;
            this.addSample(0);
        },
        addSample(datum) {
            var output;

            this.mSum += datum;
            this.mSum -= this.mBuffer[this.mIndex];
            this.mBuffer[this.mIndex] = datum;
            console.log("WINDOW_WIDTH = " + this.WINDOW_WIDTH);
            if (++this.mIndex == this.WINDOW_WIDTH) {
                this.mIndex = 0;
            }
            if ((this.mSum / this.WINDOW_WIDTH) > 32000) {
                output = 32000;
            } else {
                output = Math.floor(this.mSum / this.WINDOW_WIDTH);
            }
            return (output);
        }
    };

    exports.MWIntegratorManager = MWIntegratorManager;
})(window);
