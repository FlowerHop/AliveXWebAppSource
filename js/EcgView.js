'use strict';

(function (exports) {
    var EcgViewManager = function() {
        this.TAG = "EcgView";
        this.IN_TO_CM = 2.54; // 2.54f

        this.SWEEPBAR_WIDTH = 5;
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
            this.contextView.lineWidth = 1;
            this.contextView.lineCap = "round";
            this.contextView.lineJoin = "round";

            this.onMeasure();//test

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
            this.mView.width = window.innerWidth / 2;
            this.mView.height = window.innerHeight;
			this.mXppcm = this.mView.width / this.IN_TO_CM;
			this.mYppcm = this.mView.height / this.IN_TO_CM;
			this.mYppcm = this.mXppcm;

			// XScale set to 25mm/s. Sample rate is 300 Hz, so 300 samples per 25mm
			this.mXScale = 2.5 * this.mXppcm / 300.0;

			// YScale set to 10mm/mV. 8bit, 20uV LSB or 50=1mV
    		this.mYScale = this.mYppcm / 50.0;

			this.mYOffset = this.mView.height * 0.25;
			this.mWidth = this.mView.width;
			this.mSamplesPerWidth = Math.floor(this.mView.width/this.mXScale);

			if(this.mInitalized) {
				var bufferSamples = this.mSamplesPerWidth+12; // Extra samples for filter delay etc
				this.mEcgBuffer.resize(bufferSamples);
			}
        },
        onDraw() {
            if(!this.mInitalized) return; // Nothing to draw

			var sweepbarSamples = Math.floor(this.SWEEPBAR_WIDTH*300/25.0);

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
				var yPos = this.mYOffset - this.mEcgBuffer.get(x)*this.mYScale;

                /*console.log("xPos = " + xPos);
                console.log("yPos = " + yPos);*/

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
            var len = packet.getECGLength();
			if (len > 0) {
				if(!this.mInitalized) {
                    // Extra samples for filter delay etc
					var bufferSamples = this.mSamplesPerWidth+12;

					this.mEcgBuffer = new CirFloatBufferManager(bufferSamples);
					this.mEcgFilter = new MainsFilterManager();
					this.mInitalized = true;
				}
				var startIndex = packet.getECGDataIndex();
				var ecgBuffer = new Int8Array(packet.getPacketData());
                var tmp = new Int8Array(1);
                tmp[0] = 0xFF;
				for (var i = 0; i < len; i++) {
                	var s = new Int8Array(1);
                    s[0] = ecgBuffer[startIndex+i];
                	var smp = s[0] & tmp[0];
                	var val = smp-128;
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
