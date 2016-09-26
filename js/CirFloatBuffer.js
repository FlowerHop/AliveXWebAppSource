'use strict';

(function (exports) {
    var CirFloatBufferManager = function(size) {
        var sizeAsPowerOfTwo = this.ceilingNextPowerOfTwo(size);

        this.mCapacity = sizeAsPowerOfTwo;
        this.mCount = 0;
        this.mMask = sizeAsPowerOfTwo - 1;
        this.mBuffer = new Array(this.mCapacity);
    }
    CirFloatBufferManager.prototype = {
        ceilingNextPowerOfTwo(x) {
            return 1 << (Math.ceil(Math.log2(x)));
        },
        resize(size) {
            var newCapacity = this.ceilingNextPowerOfTwo(size);
            if(newCapacity!=this.mCapacity) {
                var newBuffer = new Array(newCapacity);
                var oldestIndex;
                if(newCapacity>this.mCapacity) {
                    oldestIndex = this.mCount - this.mCapacity;
                }else {
                    oldestIndex = this.mCount - newCapacity;
                }
                var newCount=0;
                for(var i=oldestIndex;i<this.mCount;i++) {
                    newBuffer[newCount] = this.get(i);
                    newCount++;
                }
                this.mBuffer = newBuffer; // Delete the old array and replace with the new
                this.mMask = newCapacity -1;
                this.mCount = newCount;
            }
        },
        getCapacity() {
            return(this.mCapacity);
        },
        reset() {
            this.mCount = 0;
        },
        getCount() {
            return(this.mCount);
        },
        add(val) {
            this.mBuffer[(this.mCount & this.mMask)] = val;
            this.mCount++;
        },
        /*add(array, len) {
            //var tmp = new Float32Array(array);
            console.log("addwrong");
            for(var i=0;i<len;i++) {
                this.mBuffer[this.mCount & this.mMask] = array[i];
                this.mCount++;
            }
        },*/
        get(index) {
            return(this.mBuffer[(index & this.mMask)]);
        }
    };

    exports.CirFloatBufferManager = CirFloatBufferManager;
})(window);
