'use strict';

(function (exports) {
    var HeartBeatManager = function() {
        // HeartRate
        this.mHR = "";
        this.mHRUnits = "";

        // HeartRateUnits
        this.contextHR = "";
        this.contextHRUnits = "";

        this.hrString = "---";
    }
    HeartBeatManager.prototype = {
        init() {
            this.mHR = document.getElementById("ecgtitle");
            this.contextHR = this.mHR.getContext("2d");

            this.mHRUnits = document.getElementById("ecghr");
            this.contextHRUnits = this.mHRUnits.getContext("2d");

            this.onMeasure();

            window.addEventListener('resize', this.onMeasure.bind(this), false);
            this.onMeasure();
        },
        onMeasure() {
            this.mHR.width = window.innerWidth / 4;
            this.mHR.height = window.innerHeight / 4;
            this.contextHR.font = "20px sans-serif";
            this.contextHR.fillText(this.hrString, this.mHR.width/4, this.mHR.height/2);

            this.mHRUnits.width = window.innerWidth / 4;
            this.mHRUnits.height = window.innerHeight / 4;
            this.contextHRUnits.font = "20px sans-serif";
            this.contextHRUnits.fillText("BPM", this.mHR.width/4, this.mHR.height/2);
        },
        updateHeartRate(hr) {
            var hrString;
            if (hr == 0) {
                hrString = "---";
            } else {
                hrString = hr;
            }
            if(this.hrString != hrString) {
                this.hrString = hrString;
                this.onMeasure();
            }
        },
        onAliveHeartBeat(timeSampleCount, hr, rrSamples) {
            console.log(hr);
            this.updateHeartRate(Math.floor(hr+0.5));
        }
    };

    exports.HeartBeatManager = HeartBeatManager;
})(window);
