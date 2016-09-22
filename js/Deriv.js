'use strict';
/*****************************************************************************
*  Deriv implement derivative approximation represented by
*  the difference equation:
*
*   y[n] = x[n] - x[n - 10ms]
*
*  Filter delay is DERIV_LENGTH/2
*****************************************************************************/
(function (exports) {
    var DerivManager = function() {
        var MS10 = Math.round(10 / (1000 / 300) + 0.5);
        this.DERIV_LENGTH = MS10;
        this.mDerBuff = [this.DERIV_LENGTH];
        this.mDerI = 0;
    }
    DerivManager.prototype = {
        init() {
            for (this.mDerI = 0; this.mDerI < this.DERIV_LENGTH; ++mDerI) {
                this.mDerBuff[this.mDerI] = 0;
            }
            this.mDerI = 0;
        },
        addSample(x) {
            var y;

            y = x - this.mDerBuff[this.mDerI];
            this.mDerBuff[this.mDerI] = x;
            if (++this.mDerI == this.DERIV_LENGTH) {
                this.mDerI = 0;
            }
            return (y);
        }
    };

    exports.DerivManager = DerivManager;
})(window);
