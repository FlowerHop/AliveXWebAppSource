'use strict';
/******************************************************************************
* Syntax:
*   int QRSFilter(int datum, int init) ;
* Description:
*   QRSFilter() takes samples of an ECG signal as input and returns a sample of
*   a signal that is an estimate of the local energy in the QRS bandwidth. In
*   other words, the signal has a lump in it whenever a QRS complex, or QRS
*   complex like artifact occurs. The filters were originally designed for data
*   sampled at 200 samples per second, but they work nearly as well at sample
*   frequencies from 150 to 250 samples per second.
*
*   The filter buffers and static variables are reset if a value other than
*   0 is passed to QRSFilter through init.
*******************************************************************************/
(function (exports) {
    var QRSFilterManager = function() {
        this.mLPFilter = new LPFilterManager();
        this.mHPFilter = new HPFilterManager();
        this.mMWIntegrator = new MWIntegratorManager();
        this.mDeriv = new DerivManager();
    }
    QRSFilterManager.prototype = {
        init() {
            this.mLPFilter.init();      // Initialize filters.
            this.mHPFilter.init();
            this.mMWIntegrator.init();
            this.mDeriv.init();
            this.addSample(0);
        },
        addSample(datum) {
            var fdatum;
            fdatum = this.mLPFilter.addSample(datum);// Low pass filter data.
            console.log("LPFilter: " + fdatum);
            fdatum = this.mHPFilter.addSample(fdatum);// High pass filter data.
            console.log("HPFilter: " + fdatum);
            fdatum = this.mDeriv.addSample(fdatum);// Take the derivative.
            console.log("Deriv: " + fdatum);
            fdatum = Math.abs(fdatum);// Take the absolute value.
            fdatum = this.mMWIntegrator.addSample(fdatum);// Average over an 80 ms window .
            return (fdatum);
        }
    };

    exports.QRSFilterManager = QRSFilterManager;
})(window);
