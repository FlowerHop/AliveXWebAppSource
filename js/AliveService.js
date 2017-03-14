'use strict';

(function (exports) {
    var AliveServiceManager = function() {
        this.sampleCount = 0;
        this.hmPacket = new AlivePacketManager();
        this.mHRDet = new HRDetManager();
        this.hmPacket.init();

        // Initialize UI view
        this.mEcgView = new EcgViewManager();
        // this.mAccView = new AccViewManager();
        this.mHeartBeat = new HeartBeatManager();
        this.mEcgView.init();
        // this.mAccView.init();
        this.mHeartBeat.init();
    }
    AliveServiceManager.prototype = {
        start() {
            this.mSocket = new WebSocket("ws://127.0.0.1:8080");
            this.mSocket.binaryType = "arraybuffer";

            this.mSocket.onopen = function (evt) {
                console.log("Connection established");
            }.bind(this);

            this.mSocket.onmessage = function (evt) {
                if (evt.data instanceof ArrayBuffer) {
                    var mBytesBuffer = new Int8Array(evt.data);
                    //for (var i = 0; i < mBytesBuffer.length; i++) {
                      this.run(mBytesBuffer);    
                    //}
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
            // if(this.hmPacket.add(mBytesBuffer)) {
            // We have a packet of data from the heart monitor
            this.mEcgView.onAlivePacket(this.sampleCount, mBytesBuffer);
            // this.mAccView.onAlivePacket(this.sampleCount, this.hmPacket);
            
            // Process the ECG data
            var len = mBytesBuffer.length;
            // var tmp = new Int8Array(1); // in nodejs, it won't work
            // tmp[0] = 0xFF;
            // console.log (mBytesBuffer);
            for(var i = 0; i < len; i++) {
                // var nDatum = (buffer[startIndex+i] & tmp[0]);
                var nDelay = this.mHRDet.process(mBytesBuffer[i]);
                if(nDelay!=0) {
                    // Update the heart-rate in the UI
                    console.log("Update the heart rate");
                    this.mHeartBeat.onAliveHeartBeat(
                        this.sampleCount+i+1-nDelay,
                        this.mHRDet.getHR(),
                        this.mHRDet.getLastRR(),
                        this.mHRDet.getHRV ()
                    );
                }
            }
            this.sampleCount += len;
            // console.log("sampleCount = " + this.sampleCount);
            // }
        }, 
        stop () {
            this.mSocket.close ();
        }
    };

    exports.AliveServiceManager = AliveServiceManager;
})(window);
