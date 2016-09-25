'use strict';
/*************************************************************************
*  lpfilt() implements the digital filter represented by the difference
*  equation:
*
*   y[n] = 2*y[n-1] - y[n-2] + x[n] - 2*x[t-24 ms] + x[t-48 ms]
*
*   Note that the filter delay is (LPBUFFER_LGTH/2)-1
*
**************************************************************************/
(function (exports) {
    var LPFilterManager = function() {
        var MS25 = Math.floor(25 / (1000 / 300) + 0.5);
        this.LPBUFFER_LGTH = Math.floor(2 * MS25);
        this.mY1 = 0;
        this.mY2 = 0;
        this.mBuffer = new Array(this.LPBUFFER_LGTH);
        this.mIndex = 0;
    }
    LPFilterManager.prototype = {
        init() {
            for (this.mIndex = 0; this.mIndex < this.LPBUFFER_LGTH; ++this.mIndex) {
                this.mBuffer[this.mIndex] = 0;
            }
            this.mY1 = this.mY2 = 0;
            this.mIndex = 0;
            this.addSample(0);
        },
        addSample(datum) {
            var y0;
            var output;
            var halfPtr;

            //console.log("LPBUFFER_LGTH = " + this.LPBUFFER_LGTH);
            halfPtr = this.mIndex - (this.LPBUFFER_LGTH / 2); // Use halfPtr to index
            if (halfPtr < 0) // to x[n-6].
            {
                halfPtr += this.LPBUFFER_LGTH;
            }
            y0 = (this.mY1 << 1) - this.mY2 + datum - (this.mBuffer[halfPtr] << 1) + this.mBuffer[this.mIndex];
            this.mY2 = this.mY1;
            this.mY1 = y0;
            output = Math.floor(y0 / ((this.LPBUFFER_LGTH * this.LPBUFFER_LGTH) / 4));
            this.mBuffer[this.mIndex] = datum;// Stick most recent sample into
            if (++this.mIndex == this.LPBUFFER_LGTH)// the circular buffer and update
            {
                this.mIndex = 0;// the buffer pointer.
            }
            return (output);
        }
    };

    exports.LPFilterManager = LPFilterManager;
})(window);
