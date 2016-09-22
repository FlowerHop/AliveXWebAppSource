'use strict';

(function (exports) {
    var AliveServiceManager = function() {
        this.sampleCount = 0;
        this.hmPacket = new AlivePacketManager();
        this.mHRDet = new HRDetManager();
        this.hmPacket.init();
    }
    AliveServiceManager.prototype = {
        start() {
            this.mSocket = new WebSocket("ws://127.0.0.1:80");
            this.mSocket.binaryType = "arraybuffer";
            //console.log(this);

            this.mSocket.onopen = function (evt) {
                console.log("Connection established");
                //console.log(this);
            }.bind(this);

            this.mSocket.onmessage = function (evt) {
                if (evt.data instanceof ArrayBuffer) {
                    var mBytesBuffer = new Int8Array(evt.data);
                    //console.log(mBytesBuffer.length);
                    this.run(mBytesBuffer[0]);
                }
            }.bind(this);

            this.mSocket.onerror = function (evt) {
                console.log("Error: " + evt.data);
            }.bind(this);

            this.mSocket.onclose = function (evt) {
                console.log("Connection closed");
            }.bind(this);
        },
        run(mBytesBuffer) {
            if(this.hmPacket.add(mBytesBuffer)) {
                //Here we need to use this certain packet to
                //draw the ecg and the acc
                //mListener.onAlivePacket(sampleCount, hmPacket);

                var len = this.hmPacket.getECGLength();
                console.log("getECGLength() = " + len);
                var startIndex = this.hmPacket.getECGDataIndex();
                console.log("getECGDataIndex() = " + startIndex);
                var buffer = new Int8Array(this.hmPacket.getPacketData());
                console.log(buffer[0] + " " + buffer[1] + " " + buffer[2]);
                var tmp = new Int8Array(1);
                tmp[0] = 0xFF;
                for(var i = 0; i < len; i++) {
                    var nDatum = (buffer[startIndex+i] & tmp[0]);
                    var nDelay = this.mHRDet.process(nDatum);
				    if(nDelay!=0) {
                    //Update the heart-beat in the UI thread
				    //mListener.onAliveHeartBeat(sampleCount+i+1-nDelay, mHRDet.getHR(), mHRDet.getLastRR());
				    }
                }
                this.sampleCount += len;
            }
        }
    };

    exports.AliveServiceManager = AliveServiceManager;
})(window);
