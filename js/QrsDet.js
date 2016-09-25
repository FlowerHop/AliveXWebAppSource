'use strict';

(function (exports) {
    var QrsDetManager = function() {
        this.SAMPLE_RATE = 300; // Sample rate in Hz

        this.TAG = "QrsDet";
        this.MS10 = Math.floor(10 / (1000 / this.SAMPLE_RATE) + 0.5);
        this.MS25 = Math.floor(25 / (1000 / this.SAMPLE_RATE) + 0.5);
        this.MS80 = Math.floor(80 / (1000 / this.SAMPLE_RATE) + 0.5);
        this.MS95 = Math.floor(95 / (1000 / this.SAMPLE_RATE) + 0.5);
        this.MS100 = Math.floor(100 / (1000 / this.SAMPLE_RATE) + 0.5);
        this.MS125 = Math.floor(125 / (1000 / this.SAMPLE_RATE) + 0.5);
        this.MS150 = Math.floor(150 / (1000 / this.SAMPLE_RATE) + 0.5);
        this.MS195 = Math.floor(195 / (1000 / this.SAMPLE_RATE) + 0.5);
        this.MS220 = Math.floor(220 / (1000 / this.SAMPLE_RATE) + 0.5);
        this.MS360 = Math.floor(360 / (1000 / this.SAMPLE_RATE) + 0.5);
        this.MS1000 = this.SAMPLE_RATE;
        this.MS1500 = Math.floor(1500 / (1000 / this.SAMPLE_RATE));
        this.DERIV_LENGTH = this.MS10;
        this.LPBUFFER_LGTH = Math.floor(2 * this.MS25);
        this.HPBUFFER_LGTH = this.MS125;
        this.PRE_BLANK = this.MS195;
        this.MIN_PEAK_AMP = 7; // Prevents detections of peaks smaller than about 300 uV.

        /// Detector threshold  = 0.3125 = TH_NUMERATOR/TH_DENOMINATOR
        this.TH_NUMERATOR = 3125;
        this.TH_DENOMINATOR = 10000;
        this.WINDOW_WIDTH = this.MS80; // Moving window integration width.
        this.FILTER_DELAY = Math.floor((this.DERIV_LENGTH / 2) + (this.LPBUFFER_LGTH / 2 - 1) + ((this.HPBUFFER_LGTH - 1) / 2) + this.PRE_BLANK);  // filter delays plus 200 ms blanking delay
        this.DER_DELAY = this.WINDOW_WIDTH + this.FILTER_DELAY + this.MS100; // Variables for peakHeight function

        this.mPeakMax = 0;
        this.mPeakTimeSinceMax = 0;
        this.mPeakLastDatum = 0;
        this.mDDBuffer = new Array(this.DER_DELAY); // Buffer holding derivative data.
        this.mDly = 0;
        this.mDDPtr;
        this.mDelay = 0;
        this.mDetThresh = "";
        this.mQpkcnt = 0;
        this.mQrsBuf = new Array(8);
        this.mNoiseBuf = new Array(8);
        this.mRRBuf = new Array(8);
        this.mRsetBuf = new Array(8);
        this.mRsetCount = 0;
        this.mNMean = "";
        this.mQMean = "";
        this.mRRMean = "";
        this.mCount = "";
        this.mSBPeak = 0;
        this.mSBLoc = "";
        this.mSBCount = this.MS1500;
        this.mMaxDer = "";
        this.mLastMax = "";
        this.mInitBlank = "";
        this.mInitMax = "";
        this.mPreBlankCnt = "";
        this.mTempPeak = "";

        this.mQRSFilter = new QRSFilterManager();
        this.mDeriv1 = new DerivManager();
        this.mMainsFilter = new MainsFilterManager();
        this.init();
    }
    QrsDetManager.prototype = {
        init() {
            for (var i = 0; i < 8; ++i) {
                this.mNoiseBuf[i] = 0; // Initialize noise buffer
                this.mRRBuf[i] = this.MS1000; // and R-to-R interval buffer.
            }
            this.mQpkcnt = this.mMaxDer = this.mLastMax = this.mCount = this.mSBPeak = 0;
            this.mInitBlank = this.mInitMax = this.mPreBlankCnt = this.mDDPtr = 0;
            this.mSBCount = this.MS1500;

            this.mQRSFilter.init(); // initialise filters
            this.mDeriv1.init();
            this.mMainsFilter.init();
            this.peakHeight(0, 1);

            // initialize derivative buffer
            for(var i=0;i<this.DER_DELAY;i++) {
                this.mDDBuffer[i] = 0;
            }
        },
        setMainsFrequency(freq) {
            return this.mMainsFilter.setMainsFrequency(freq);
        },
        process(datum) {
            var mfdatum, fdatum;
            var qrsDelay = 0;
            var i, newPeak, aPeak;

            // Filter data
            mfdatum = Math.floor(this.mMainsFilter.filter(datum));
            //console.log("mfdatum = " + mfdatum);
            fdatum = this.mQRSFilter.addSample(mfdatum);
            //console.log("fdatum = " + fdatum);
            // Wait until normal detector is ready before calling early detections.
            aPeak = this.peakHeight(fdatum, 0);
            if (aPeak < this.MIN_PEAK_AMP) {
                aPeak = 0;
                // Hold any peak that is detected for 200 ms
                // in case a bigger one comes along.  There
                // can only be one QRS complex in any 200 ms window.
            }

            newPeak = 0;

            // If there has been no peak for 200 ms save this one and start counting.
            if (aPeak != 0 && this.mPreBlankCnt == 0)
            {
                this.mTempPeak = aPeak;
                this.mPreBlankCnt = this.PRE_BLANK;           // MS200
            }
            // If we have held onto a peak for 200 ms pass it on for evaluation.
            else if (aPeak == 0 && this.mPreBlankCnt != 0)
            {
                if (--this.mPreBlankCnt == 0) {
                    newPeak = this.mTempPeak;
                }
            }
            // If we were holding a peak, but this ones bigger, save it and start
            // counting to 200 ms again.
            else if (aPeak != 0)
            {
                if (aPeak > this.mTempPeak)
                {
                    this.mTempPeak = aPeak;
                    this.mPreBlankCnt = this.PRE_BLANK; // MS200
                } else if (--this.mPreBlankCnt == 0) {
                    newPeak = this.mTempPeak;
                }
            }

            // Save derivative of raw signal for T-wave and baseline shift discrimination.
            this.mDDBuffer[this.mDDPtr] = this.mDeriv1.addSample(mfdatum);
            if (++this.mDDPtr == this.DER_DELAY) {
                this.mDDPtr = 0;
            }
            // Initialize the qrs peak buffer with the first eight
            // local maximum peaks detected.
            if (this.mQpkcnt < 8) {
                ++this.mCount;
                if (newPeak > 0) {
                    this.mCount = this.WINDOW_WIDTH;
                }
                if (++this.mInitBlank == this.MS1000) {
                    this.mInitBlank = 0;
                    this.mQrsBuf[this.mQpkcnt] = this.mInitMax;
                    this.mInitMax = 0;
                    ++this.mQpkcnt;

                    // Mod so that detection is faster at starting
                    if(this.mQpkcnt == 2)
                    {
                        this.mQpkcnt = 8;
                        this.mQMean = (this.mQrsBuf[0] + this.mQrsBuf[1]) / 2;
                        this.mQrsBuf[2] = this.mQrsBuf[4] = this.mQrsBuf[6] = this.mQrsBuf[0];
                        this.mQrsBuf[3] = this.mQrsBuf[5] = this.mQrsBuf[7] = this.mQrsBuf[1];
                        this.mNMean = 0 ;
                        this.mRRMean = this.MS1000 ;
                        this.mSBCount = this.MS1500+this.MS150 ;
                        this.mDetThresh = this.thresh(this.mQMean, this.mNMean) ;
                    }
                }
                if (newPeak > this.mInitMax) {
                    this.mInitMax = newPeak;
                }
            }else { // Else test for a qrs.
                ++this.mCount;
                if (newPeak > 0) {

                    // Check for maximum derivative and matching minima and maxima
                    // for T-wave and baseline shift rejection.  Only consider this
                    // peak if it doesn't seem to be a base line shift.

                    if (this.baselineShiftCheck(this.mDDBuffer, this.mDDPtr) == 0) {
                        this.mDelay = this.WINDOW_WIDTH + this.mDly ;


                        // If a peak occurs within 360 ms of the last beat it might be a T-wave.
                        // Classify it as noise if its maximum derivative
                        // is less than 1/2 the maximum derivative in the last detected beat.

                        if((this.mMaxDer < (this.mLastMax/2)) // less than one third
                            && ((this.mCount - this.mDelay) < this.MS360))
                        { // store the new peak as noise and go on
                            this.shiftArrayValues(this.mNoiseBuf);
                            this.mNoiseBuf[0] = newPeak ;
                            this.mNMean = this.mean(this.mNoiseBuf,8) ;
                            this.mDetThresh = this.thresh(this.mQMean,this.mNMean) ;
                        }
                        // Classify the beat as a QRS complex
                        // if it has been at least 360 ms since the last detection
                        // or the maximum derivative was large enough, and the
                        // peak is larger than the detection threshold.

                        // Classify the beat as a QRS complex
                        // if the peak is larger than the detection threshold.

                        else if (newPeak > this.mDetThresh) {
                            this.shiftArrayValues(this.mQrsBuf);
                            this.mQrsBuf[0] = newPeak;
                            this.mQMean = this.mean(this.mQrsBuf, 8);
                            this.mDetThresh = this.thresh(this.mQMean, this.mNMean);
                            this.shiftArrayValues(this.mRRBuf);
                            this.mRRBuf[0] = this.mCount - this.mDelay;
                            this.mRRMean = this.mean(this.mRRBuf, 8);
                            this.mSBCount = this.mRRMean + (this.mRRMean >> 1) + this.WINDOW_WIDTH;
                            this.mCount = this.mDelay;

                            this.mSBPeak = 0;

                            this.mLastMax = this.mMaxDer;
                            this.mMaxDer = 0;
                            qrsDelay = this.mDelay + this.FILTER_DELAY;
                            this.mInitBlank = this.mInitMax = this.mRsetCount = 0;
                        }
                        // If a peak isn't a QRS update noise buffer and estimate.
                        // Store the peak for possible search back.
                        else {
                            this.shiftArrayValues(this.mNoiseBuf);
                            this.mNoiseBuf[0] = newPeak;
                            this.mNMean = this.mean(this.mNoiseBuf, 8);
                            this.mDetThresh = this.thresh(this.mQMean, this.mNMean);

                            // Don't include early peaks (which might be T-waves)
                            // in the search back process.  A T-wave can mask
                            // a small following QRS.

                            if ((newPeak > this.mSBPeak) && ((this.mCount - this.WINDOW_WIDTH) >= this.MS360)) {
                                this.mSBPeak = newPeak;
                                this.mSBLoc = this.mCount - this.mDelay;
                            }
                        }
                    }
                }

                // Test for search back condition.  If a QRS is found in
                // search back update the QRS buffer and mDetThresh.
                if ((this.mCount > this.mSBCount) && (this.mSBPeak > (this.mDetThresh >> 1))) {
                    this.shiftArrayValues(this.mQrsBuf);
                    this.mQrsBuf[0] = this.mSBPeak;
                    this.mQMean = this.mean(this.mQrsBuf, 8);
                    this.mDetThresh = this.thresh(this.mQMean, this.mNMean);
                    this.shiftArrayValues(this.mRRBuf);
                    this.mRRBuf[0] = this.mSBLoc;
                    this.mRRMean = this.mean(this.mRRBuf, 8);
                    this.mSBCount = this.mRRMean + (this.mRRMean >> 1) + this.WINDOW_WIDTH;
                    qrsDelay = this.mDelay = this.mCount = this.mCount - this.mSBLoc;
                    qrsDelay += this.FILTER_DELAY;
                    this.mSBPeak = 0;
                    this.mLastMax = this.mMaxDer;
                    this.mMaxDer = 0;

                    this.mInitBlank = this.mInitMax = this.mRsetCount = 0;
                }
            }

            // In the background estimate threshold to replace adaptive threshold
            // if eight seconds elapses without a QRS detection.
            if (this.mQpkcnt == 8) {
                if (++this.mInitBlank == this.MS1000) {
                    this.mInitBlank = 0;
                    this.mRsetBuf[this.mRsetCount] = this.mInitMax;
                    this.mInitMax = 0;
                    ++this.mRsetCount;

                    // Reset threshold if it has been 8 seconds without a detection.
                    if (this.mRsetCount == 8) {
                        for (i = 0; i < 8; ++i) {
                            this.mQrsBuf[i] = this.mRsetBuf[i];
                            this.mNoiseBuf[i] = 0;
                        }
                        this.mQMean = this.mean(this.mRsetBuf, 8);
                        this.mNMean = 0;
                        this.mRRMean = this.MS1000;
                        this.mSBCount = this.MS1500 + this.MS150;
                        this.mDetThresh = this.thresh(this.mQMean, this.mNMean);
                        this.mInitBlank = this.mInitMax = this.mRsetCount = 0;
                    }
                }
                if (newPeak > this.mInitMax) {
                    this.mInitMax = newPeak;
                }
            }

            if(qrsDelay>0) {
                qrsDelay += this.mMainsFilter.getDelay();
            }
            return (qrsDelay);
        },
        shiftArrayValues(data) {
            var nLength = data.length;
            for (var i = nLength - 1; i > 0; i--) {
                data[i] = data[i - 1];
            }
        },
        peakHeight(datum, init) {
            var pk = 0;

            if (init != 0) {
                this.mPeakMax = this.mPeakTimeSinceMax = 0;
            }
            if (this.mPeakTimeSinceMax > 0) {
                ++this.mPeakTimeSinceMax;
            }
            if ((datum > this.mPeakLastDatum) && (datum > this.mPeakMax)) {
                this.mPeakMax = datum;
                if (this.mPeakMax > 2) {
                    this.mPeakTimeSinceMax = 1;
                }
            } else if (datum < (this.mPeakMax >> 1)) {
                pk = this.mPeakMax;
                this.mPeakMax = 0;
                this.mPeakTimeSinceMax = 0;
                this.mDly = 0;
            } else if (this.mPeakTimeSinceMax > this.MS95) {
                pk = this.mPeakMax;
                this.mPeakMax = 0;
                this.mPeakTimeSinceMax = 0;
                this.mDly = 3;
            }
            this.mPeakLastDatum = datum;
            return (pk);
        },
        mean(array, datum) {
            var sum;
            var i;

            for (i = 0, sum = 0; i < datum; ++i) {
                sum += array[i];
            }
            sum /= datum;
            return Math.floor(sum);
        },
        thresh(qmean, nmean) {
            var thrsh;
            var dmed;

            dmed = qmean - nmean;
            dmed = Math.floor(dmed * this.TH_NUMERATOR / this.TH_DENOMINATOR);
            thrsh = nmean + dmed;
            return (thrsh);
        },
        baselineShiftCheck(dBuf, dbPtr) {
            var max, min, maxt, mint, t, x;
            max = min = maxt = mint = 0;

            for (t = 0; t < this.MS220; ++t) {
                x = dBuf[dbPtr];
                if (x > max) {
                    maxt = t;
                    max = x;
                } else if (x < min) {
                    mint = t;
                    min = x;
                }
                if (++dbPtr == this.DER_DELAY) {
                    dbPtr = 0;
                }
            }

            this.mMaxDer = max;
            min = -min;

            /* Possible beat if a maximum and minimum pair are found
            where the interval between them is less than 150 ms. */

            if ((max > (min >> 3)) && (min > (max >> 3)) && (Math.abs(maxt - mint) < this.MS150)) {
                return (0);
            } else {
                return (1);
            }
        }
    };

    exports.QrsDetManager = QrsDetManager;
})(window);
