'use strict';

// Simple averaging LP Filter that also removes 50Hz or 60Hz AC Mains noise from ECG.
(function (exports) {
    var MainsFilterManager = function() {
        this.mD = new Array(6);
        this.mCount;

        this.setMainsFrequency(50);
        this.mInit = true;
        this.mIndex = 0;
    }
    MainsFilterManager.prototype = {
        init() {
            this.mInit = true;
        },
        filter(val) {
            if(this.mInit==true) {
                //console.log("MainsFilter: mCount = " + this.mCount);
                this.mIndex=0;
                for(var i=0;i<this.mCount;i++) {
                    this.mD[i] = val;
                }
                this.mInit=false;
                return(val);
            }

            this.mD[this.mIndex] = val;
            var sum = 0.0;
            for(var i=0;i<this.mCount;i++) sum += this.mD[i];
            //console.log(this.mD);
            var avg = sum/this.mCount;
            this.mIndex++;
            if(this.mIndex==this.mCount) this.mIndex=0;
            return(avg);
        },
        setMainsFrequency(mainsFreq) {
            // If mains is 50 Hz, average 6 samples at 300Hz
            // If mains is 60 Hz, average 5 samples at 300Hz
            this.mCount = mainsFreq==50 ? 6 : 5;
        },
        reset() {
            this.mIndex=0;
            for(var i=0;i<this.mCount;i++) {
                this.mD[i] = 0;
            }
        },
        getDelay() {
            return this.mCount/2;
        }
    };

    exports.MainsFilterManager = MainsFilterManager;
})(window);
