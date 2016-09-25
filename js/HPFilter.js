'use strict';
/******************************************************************************
*  hpfilt() implements the high pass filter represented by the following
*  difference equation:
*
*   y[n] = y[n-1] + x[n] - x[n-128 ms]
*   z[n] = x[n-64 ms] - y[n] ;
*
*  Filter delay is (HPBUFFER_LGTH-1)/2
******************************************************************************/
(function (exports) {
    var HPFilterManager = function() {
        var MS125 = Math.floor(125 / (1000 / 300) + 0.5);
        this.HPBUFFER_LGTH = MS125;
        this.mY = 0;
        this.mBuffer = new Array(this.HPBUFFER_LGTH);
        this.mIndex = 0;
    }
    HPFilterManager.prototype = {
        init() {
            for (this.mIndex = 0; this.mIndex < this.HPBUFFER_LGTH; ++this.mIndex) {
                this.mBuffer[this.mIndex] = 0;
            }
            this.mIndex = 0;
            this.mY = 0;
            this.addSample(0);
        },
        addSample(datum) {
            var z;
            var halfPtr;
            this.mY += datum - this.mBuffer[this.mIndex];
            //console.log("HPBUFFER_LGTH = " + this.HPBUFFER_LGTH);
            halfPtr = this.mIndex - (this.HPBUFFER_LGTH / 2);
            if (halfPtr < 0) {
                halfPtr += this.HPBUFFER_LGTH;
            }
            z = this.mBuffer[halfPtr] - Math.floor(this.mY / this.HPBUFFER_LGTH);

            this.mBuffer[this.mIndex] = datum;
            if (++this.mIndex == this.HPBUFFER_LGTH) {
                this.mIndex = 0;
            }

            return (z);
        }
    };

    exports.HPFilterManager = HPFilterManager;
})(window);
