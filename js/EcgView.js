'use strict';

(function (exports) {
    var EcgViewManager = function() {
        this.TAG = "EcgView";
        this.IN_TO_CM = 2.54; // 2.54f

        this.SWEEPBAR_WIDTH = 1;
        this.mEcgFilter = ""; // Using simple averaging LP filter, that also removes mains noise
        this.mInitalized = false;
        this.mEcgBuffer = "";
        this.mPath = "";
        this.mSamplesPerWidth = "";

        this.mYOffset = "";
        this.mXScale = "";
        this.mYScale = "";
        this.mWidth = "";

        this.mDisplayMetrics = "";
        this.mXppcm = "";
        this.mYppcm = "";
        this.mContext = "";

        this.mView = "";
        this.contextView = "";
    }
    EcgViewManager.prototype = {
        init() {
            this.mView = document.getElementById("ecgview");
            this.contextView = this.mView.getContext("2d");
            this.contextView.strokeStyle = "black";
            this.contextView.lineWidth = 2;
            this.contextView.lineCap = "round";
            this.contextView.lineJoin = "round";

            this.onMeasure();

            window.addEventListener('resize', this.onMeasure.bind(this), false);
            this.onMeasure();
        },
        getEcgRangeHeight() {
            var xppcm = this.mView.width / this.IN_TO_CM;
            var yppcm = this.mView.height / this.IN_TO_CM;
            yppcm = xppcm;

            // Height of 5 mV range
            return Math.floor(5*yppcm);
        },
        onMeasure() {
            this.mView.width = window.innerWidth;
            this.mView.height = window.innerHeight;

            this.mXppcm = this.mView.width / this.IN_TO_CM;
            this.mYppcm = this.mView.height / this.IN_TO_CM;
            //this.mYppcm = this.mXppcm;

            // XScale set to 25mm/s. Sample rate is 300 Hz, so 300 samples per 25mm
            this.mXScale = 1.25 * this.mXppcm / 300.0;

            // YScale set to 10mm/mV. 8bit, 20uV LSB or 50=1mV
            this.mYScale = this.mYppcm / 100;

            this.mYOffset = this.mView.height * 0.4;
            this.mWidth = this.mView.width;
            this.mSamplesPerWidth = Math.floor(this.mView.width/this.mXScale);

            if(this.mInitalized) {
                var bufferSamples = this.mSamplesPerWidth+12; // Extra samples for filter delay etc
                this.mEcgBuffer.resize(bufferSamples);
            }
        },
        onDraw() {
            if(!this.mInitalized) return; // Nothing to draw

            var sweepbarSamples = Math.floor(this.SWEEPBAR_WIDTH*300/12.5);

            this.contextView.beginPath();

            var startIndex=0;
            var endIndex = this.mEcgBuffer.getCount()-1;

            if(endIndex>=(this.mSamplesPerWidth-sweepbarSamples)) {
                startIndex = endIndex - (this.mSamplesPerWidth-sweepbarSamples);
                endIndex = startIndex + (this.mSamplesPerWidth-sweepbarSamples);
            }
            var nCount=0;
            var lastXPos=0;
            for(var x= startIndex;x<endIndex;x++) {
                var xPos = x * this.mXScale;
                xPos = xPos % this.mWidth;
                //var yPos = this.mYOffset - this.mEcgBuffer.get(x)*this.mYScale;
                //var yPos = this.mYOffset + this.mEcgBuffer.get(x)*0.5
                var yPos;
                // if(this.mEcgBuffer.get(x) > 20) {
                    // yPos = this.mYOffset - this.mEcgBuffer.get(x)*this.mYScale*0.025;
                // } else {
                    yPos = this.mYOffset - this.mEcgBuffer.get(x)*this.mYScale;
                // }
                 
                // console.log(
                //     "mYOffset = " + this.mYOffset +
                //     " xPos = " + xPos +
                //     " yPos = " + yPos
                // );

                if(x==startIndex || xPos<lastXPos) {
                    this.contextView.moveTo(xPos, yPos);
                }else {
                    this.contextView.lineTo(xPos, yPos);
                }
                lastXPos = xPos;

                // TODO: Test optimization - drawing short paths
                nCount++;
                if(nCount==200) {
                    this.contextView.stroke();
                    this.contextView.beginPath();
                    this.contextView.moveTo(xPos, yPos);
                    nCount=0;
                }

            }
            if(nCount>1) {
                this.contextView.stroke();
            }
        },
        resetECG() {
            if(this.mInitalized) {
                this.mEcgFilter.reset();
                this.mEcgBuffer.reset();
            }
            this.onDraw();
        },
        onAlivePacket(timeSampleCount, packet) {
            var len = packet.length;
            if (len > 0) {
                if(!this.mInitalized) {
                    // Extra samples for filter delay etc
                    var bufferSamples = this.mSamplesPerWidth+12;

                    this.mEcgBuffer = new CirFloatBufferManager(bufferSamples);
                    this.mEcgFilter = new MainsFilterManager();
                    this.mInitalized = true;
                }
                // var ecgBuffer = new Int8Array(packet);
                
                for (var i = 0; i < len; i++) {
                    var s = new Int8Array(1);
                    // s[0] = ecgBuffer[startIndex+i];
                    // s[0] = packet[i];
                    // var smp = (s[0] & 0xFF);
                    // var val = smp-128;
                    var val = packet[i];
                    val = this.mEcgFilter.filter(-val);
                    this.mEcgBuffer.add(val);
                }
                this.onMeasure();
                this.onDraw();
            }
        }
    };

    exports.EcgViewManager = EcgViewManager;
})(window);
