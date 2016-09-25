'use strict';

(function (exports) {
    var AccViewManager = function() {
        this.TAG = "AccView";

        this.IN_TO_CM = 2.54;

        this.SWEEPBAR_WIDTH = 5; // 5mm
        this.ACC_SAMPLING_RATE = 75;

        this.mInitalized = false;
        this.mAccBuffer = "";
        this.mSamplesPerWidth = "";

        this.mYOffset = "";
        this.mXScale = "";
        this.mYScale = "";
        this.mWidth = "";

        this.mXppcm = "";

        this.canvas = "";
        this.mPath = "";
    }
    AccViewManager.prototype = {
        init() {
            this.canvas = document.getElementById("accview");
            this.mPath = this.canvas.getContext("2d");
            this.mPath.lineWidth = 2;
            this.mPath.lineCap = "round";
            this.mPath.lineJoin = "round";

            this.onMeasure();//test

            window.addEventListener('resize', this.onMeasure.bind(this), false);
            this.onMeasure();
        },
        onMeasure() {
            this.canvas.width = window.innerWidth / 2;
            this.canvas.height = window.innerHeight;

            this.mXppcm = this.canvas.width / this.IN_TO_CM;

            // XScale set to 25mm/s. Sample rate is 75 Hz, so 75 samples per 25mm
            this.mXScale = 2.5 * this.mXppcm / this.ACC_SAMPLING_RATE;

            // YScale set to 10mm/mV. 8bit, 20uV LSB or 50=1mV
            this.mYScale = 0.2 * this.canvas.height/255;

            this.mYOffset = this.canvas.height * 0.25;
            this.mWidth = this.canvas.width;
            this.mSamplesPerWidth = Math.floor(this.canvas.width/this.mXScale);

            if(this.mInitalized) {
                // Extra samples for filter delay etc
                var bufferSamples = this.mSamplesPerWidth+12;
                this.mAccBuffer.resize(bufferSamples*3);
            }
        },
        onDraw() {
            if(!this.mInitalized) return; // Nothing to draw

            var sweepbarSamples = Math.floor(this.SWEEPBAR_WIDTH*this.ACC_SAMPLING_RATE/25.0);
            var startIndex=0;
            var endIndex = this.mAccBuffer.getCount()/3 - 1;

            if(endIndex>=(this.mSamplesPerWidth-sweepbarSamples)) {
                startIndex = endIndex - (this.mSamplesPerWidth-sweepbarSamples);
                endIndex = startIndex + (this.mSamplesPerWidth-sweepbarSamples);
            }

            var nCount=0;
            var lastXPos=0;
            this.mPath.strokeStyle = "red";
            this.mPath.beginPath();
            for(var x= startIndex;x<endIndex;x++) {
                var xPos = x * this.mXScale;
                xPos = xPos % this.mWidth;
                var tmp = new Int8Array(1);
                tmp[0] = 0xFF;
                var yPos = this.mYOffset - ((this.mAccBuffer.get(x*3)&tmp[0])-128)*this.mYScale;
                console.log("X: " +
                "mYOffset = " + this.mYOffset +
                " xPos = " + xPos +
                " yPos = " + yPos +
                " " + ((this.mAccBuffer.get(x*3)&tmp[0])-128));
                if(x==startIndex || xPos<lastXPos) {
                    this.mPath.moveTo(xPos, yPos);
                }else {
                    this.mPath.lineTo(xPos, yPos);
                }
                lastXPos = xPos;
                nCount++;
            }
            if(nCount>1) {
                this.mPath.stroke();
            }

            nCount=0;
            lastXPos=0;
            this.mPath.strokeStyle = "green";
            this.mPath.beginPath();
            for(var x= startIndex;x<endIndex;x++) {
                var xPos = x * this.mXScale;
                xPos = xPos % this.mWidth;
                var tmp = new Int8Array(1);
                tmp[0] = 0xFF;
                var yPos = this.mYOffset - ((this.mAccBuffer.get(x*3+1)&tmp[0])-128)*this.mYScale;
                console.log("Y: " +
                "mYOffset = " + this.mYOffset +
                " xPos = " + xPos +
                " yPos = " + yPos +
                " " + ((this.mAccBuffer.get(x*3+1)&tmp[0])-128));
                if(x==startIndex || xPos<lastXPos) {
                    this.mPath.moveTo(xPos, yPos);
                }else {
                    this.mPath.lineTo(xPos, yPos);
                }
                lastXPos = xPos;
                nCount++;
            }
            if(nCount>1) {
                this.mPath.stroke();
            }

            nCount=0;
            lastXPos=0;
            this.mPath.strokeStyle = "blue";
            this.mPath.beginPath();
            for(var x= startIndex;x<endIndex;x++) {
                var xPos = x * this.mXScale;
                xPos = xPos % this.mWidth;
                var tmp = new Int8Array(1);
                tmp[0] = 0xFF;
                var yPos = this.mYOffset - ((this.mAccBuffer.get(x*3+2)&tmp[0])-128)*this.mYScale;
                console.log("Z: " +
                "mYOffset = " + this.mYOffset +
                " xPos = " + xPos +
                " yPos = " + yPos +
                " " + ((this.mAccBuffer.get(x*3+2)&tmp[0])-128));
                if(x==startIndex || xPos<lastXPos) {
                    this.mPath.moveTo(xPos, yPos);
                }else {
                    this.mPath.lineTo(xPos, yPos);
                }
                lastXPos = xPos;
                nCount++;
            }
            if(nCount>1) {
                this.mPath.stroke();
            }
        },
        reset() {
            if(this.mInitalized) {
                this.mAccBuffer.reset();
            }
            this.onDraw();
        },
        onAlivePacket(timeSampleCount, packet) {
            var len = packet.getAccLength();
            if (len > 0) {
                if(!this.mInitalized) {
                    var bufferSamples = this.mSamplesPerWidth+12; // Extra samples for filter delay etc

                    this.mAccBuffer = new CirByteBufferManager(bufferSamples*3);
                    this.mInitalized = true;
                }
                var startIndex = packet.getAccDataIndex();
                var accBuffer = new Int8Array(packet.getPacketData());
                //console.log("accBuffer = " + accBuffer);
                for (var i = 0; i < len; i+=3) {
                    this.mAccBuffer.add(accBuffer[startIndex+i]);
                    this.mAccBuffer.add(accBuffer[startIndex+i+1]);
                    this.mAccBuffer.add(accBuffer[startIndex+i+2]);
                    /*console.log("Three-way: " +
                    accBuffer[startIndex+i] + " " +
                    accBuffer[startIndex+i+1] + " " +
                    accBuffer[startIndex+i+2]);*/
                }
                this.onMeasure();
                this.onDraw();
            }
        }
    };

    exports.AccViewManager = AccViewManager;
})(window);
