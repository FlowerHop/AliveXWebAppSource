'use strict';

(function (exports) {
    var HRDetManager = function() {
        this.TAG = "HRDet";
        this.MAX_HR = 300;
        this.MIN_HR = 30;
        this.MEDIAN_WINDOW_LENGTH = 10;
        this.HR_AVG_WINDOW_SAMPLES = 5 * 300;
        // Size must be power of 2 so simple math for calculating history index
        this.HISTORYBUFFER_LENGTH = 32;
        this.HR_TOLERANCE = 10; // Allow 10bpm step change in HR

        this.mADCUnit = ""; // ADC units per mV
        this.mADCZero = ""; // ADC zero level
        this.mSampleRate = ""; // ECG sampling rate
        this.mSampleCount = "";
        this.mCurrQRSSample = "";
        this.mPrevQRSSample = "";
        this.mLastHRUpdateSample = "";

        this.mHeartRate = ""; // Heart Rate measurement calculated over 5sec  window
        this.mCurrRR = ""; // The last RR interval in samples
        this.mCurrHR = ""; // Current Instantaneous HR
        this.mPrevHR = ""; // Previous HR
        this.mTrimMeanSort = new Array(this.HISTORYBUFFER_LENGTH);
        this.mQrsDet = new QrsDetManager();

        this.mRRInterval = new Array(this.MEDIAN_WINDOW_LENGTH);
        this.mRRIntervalCount = "";
        this.mRRIndex = "";

        this.mRRIntervalList = [];
        this.mHRV = new HRV ();

        this.mRRIntervalHistory = new Array(this.HISTORYBUFFER_LENGTH);
        this.mQrsSampleHistory = new Array(this.HISTORYBUFFER_LENGTH);
        this.mHistoryCount = 0;

        this.mSampleRate = this.mQrsDet.SAMPLE_RATE; // 300Hz (OESA beat detector assumes 300Hz)
        this.mADCUnit = 50;  // 50 units per mV
        this.mADCZero = 128; // 128. (8bit unsigned data, where 128 = 0mV)
        this.reset(0);
    }
    HRDetManager.prototype = {
        getLastRR() {
            return this.mCurrHR;
        },

        getRRInterval30 () {
            return this.mRRIntervalList;
        },
        
        getHRV () {
            return this.mHRV;
        },

        getHR() {
            return this.mHeartRate;
        },
        /*reset() {
            reset(0);
        },*/
        reset(sampleCount) {
            this.mSampleCount = sampleCount;
            if (this.mSampleCount == 0) {
                this.mPrevQRSSample = 0;
                this.mLastHRUpdateSample = 0;
            }

            this.mHeartRate = 0.;
            this.mCurrRR = 0;
            this.mRRIntervalCount = 0;
            this.mRRIndex = 0;
            this.mHistoryCount = 0;
            this.mRRIntervalList = [];
            // Reset the beat detector
            this.mQrsDet.init();
        },
        // Description:
        //   Processes ECG samples to detect beats and to calculate the heart rate.
        // Returns:
        //   When a QRS complex is detected it returns the delay (in samples),
        //   or zero if no QRS detected,
        //   or -1 if HR reset due to timeouts etc.
        process(ecgSample) {
            var tmp;
            var delay = 0;

            // Set baseline to 0 and resolution to 5 uV/lsb (200 units/mV)
            // tmp = ecgSample - this.mADCZero;
            // tmp *= 200;
            // tmp /= this.mADCUnit;
            // ecgSample = tmp;
            // console.log ('ecgSample: ' + ecgSample);
            if (this.mSampleCount == 0) {
                this.mQrsDet.init();
            }

            // Pass ECG sample to beat detector
            delay = this.mQrsDet.process(ecgSample);
            // Beat was detected
            if (delay != 0) {
                this.mCurrQRSSample = this.mSampleCount - delay;

                if (this.mPrevQRSSample != 0) {
                    this.mCurrRR = this.mCurrQRSSample - this.mPrevQRSSample;
                    this.mCurrHR = this.mSampleRate * 60 / this.mCurrRR;

                    this.mRRIntervalCount++;
                    this.mRRInterval[this.mRRIndex++] = this.mCurrRR;

                    if (this.mCurrRR > 60 && this.mCurrRR < 600) {
                        this.mRRIntervalList.push(parseInt (1000*this.mCurrRR/this.mSampleRate + 0.5));
                        this.mHRV.addRR(parseInt(1000*this.mCurrRR/this.mSampleRate + 0.5));
                    }

                    if (this.mRRIndex >= this.MEDIAN_WINDOW_LENGTH) {
                        this.mRRIndex = 0;
                    }

                    // Robust RR interval measurement using the trimmed mid mean
                    var midMeanRR = this.trimMean(this.mRRInterval, Math.min(this.mRRIntervalCount, this.MEDIAN_WINDOW_LENGTH), 2);

                    // Ignore intervals outside HR limits
                    if (this.mCurrHR <= (this.MAX_HR+0.5) && this.mCurrHR >= (this.MIN_HR-0.5)) {
                        var midMeanHR = this.mSampleRate * 60 / midMeanRR;


                        // Update the current heart rate if change is within tolerance
                        if (Math.abs(this.mCurrHR - this.mPrevHR) < this.HR_TOLERANCE && Math.abs(this.mCurrHR - midMeanHR) < this.HR_TOLERANCE) {
                            this.mLastHRUpdateSample = this.mCurrQRSSample;
                            this.mQrsSampleHistory[this.mHistoryCount % this.HISTORYBUFFER_LENGTH] = this.mCurrQRSSample;
                            this.mRRIntervalHistory[this.mHistoryCount % this.HISTORYBUFFER_LENGTH] = this.mCurrRR;
                            this.mHistoryCount++;

                            var rrsum = this.mCurrRR;
                            var intervalCount = 1;
                            var index = this.mHistoryCount - 2;
                            while (index >= 0 && this.mQrsSampleHistory[index % this.HISTORYBUFFER_LENGTH] >= (this.mCurrQRSSample - this.HR_AVG_WINDOW_SAMPLES)) {
                                rrsum += this.mRRIntervalHistory[index % this.HISTORYBUFFER_LENGTH];
                                intervalCount++;
                                index--;
                            }
                            this.mHeartRate = this.mSampleRate * 60 / (rrsum / intervalCount);
                        }
                        this.mPrevHR = this.mCurrHR;
                    }
                }
                this.mPrevQRSSample = this.mCurrQRSSample;
            }

            // Set heart rate to zero if no beat detection for 5 seconds
            if (this.mSampleCount - this.mPrevQRSSample > 5 * this.mSampleRate) {
                if (delay == 0 && this.mHeartRate > 0.05) {
                    delay = -1;
                }
                this.mHeartRate = 0.;
            }
            // If heart rate has not been updated for 8 seconds
            if (this.mSampleCount - this.mLastHRUpdateSample > 8 * this.mSampleRate) {
                if (delay == 0 && this.mHeartRate > 0.05) {
                    delay = -1;
                }
                this.mHeartRate = 0.;
            }
            this.mSampleCount++;
            return delay;
        },
        // trimMean: Returns a trim mean of an array of int's.
        // It uses a slow sort algorithm, but these arrays are small, so it hardly matters.
        // len: length of array
        // meanCount: Mid number of values in the array to average.
        trimMean(array, len, meanCount) {
            var i, j, k;
            var temp;
            var index;

            // Copy to temp array so we don't change the order of original array
            for (i = 0; i < len; ++i) {
                this.mTrimMeanSort[i] = array[i];
            }

            // Sort temp array
            for (i = 0; i < len; ++i) {
                temp = this.mTrimMeanSort[i];
                for (j = 0; (temp < this.mTrimMeanSort[j]) && (j < i); ++j)
                    ;
                for (k = i - 1; k >= j; --k) {
                    this.mTrimMeanSort[k + 1] = this.mTrimMeanSort[k];
                }
                this.mTrimMeanSort[j] = temp;
            }
            if (meanCount > len)
                meanCount = len;

            // Trim same number from top and bottom of sorted list
            index = Math.floor((len - meanCount) >> 1);

            // Calculate trimmean.
            var sum = 0;
            for (j = 0; j < meanCount; j++)
                sum += this.mTrimMeanSort[index + j];

            return sum / meanCount;
        }
    };

    exports.HRDetManager = HRDetManager;
})(window);
