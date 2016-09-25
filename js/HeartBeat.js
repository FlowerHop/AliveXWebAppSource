'use strict';

(function (exports) {
    var HeartBeatManager = function() {
        // HeartRate
        this.mHR = "";
        this.mHRUnits = "";
        // HeartRateUnits
        this.contextHR = "";
        this.contextHRUnits = "";

        this.hrString = "68";
    }
    HeartBeatManager.prototype = {
        init() {
            this.mHR = document.getElementById("ecgtitle");
            this.contextHR = this.mHR.getContext("2d");

            this.mHRUnits = document.getElementById("ecghr");
            this.contextHRUnits = this.mHRUnits.getContext("2d");

            this.onMeasure();//test

            window.addEventListener('resize', this.onMeasure.bind(this), false);
            this.onMeasure();
        },
        onMeasure() {
            this.mHR.width = window.innerWidth / 4;
            this.mHR.height = window.innerHeight / 4;
            this.contextHR.font = "30px Georgia";
            this.contextHR.fillText(this.hrString, this.mHR.width/8, this.mHR.height/2);

            this.mHRUnits.width = window.innerWidth / 4;
            this.mHRUnits.height = window.innerHeight / 4;
            this.contextHRUnits.font = "30px Georgia";
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
                this.contextHR.fillText(this.hrString, this.mHR.width/8, this.mHR.height/2);
            }
        	/*if(mHR.getVisibility() != View.VISIBLE) {
        		mHR.setVisibility(View.VISIBLE);
        		mHRUnits.setVisibility(View.VISIBLE);
        	}*/
        },
        onAliveHeartBeat(timeSampleCount, hr, rrSamples) {
            this.updateHeartRate(Math.floor(hr+0.5));
        }
    };

    exports.HeartBeatManager = HeartBeatManager;
})(window);
