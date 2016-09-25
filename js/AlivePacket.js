'use strict';

(function (exports) {
    var AlivePacketManager = function() {
        this.BUFFER_SIZE = 512;
        this.ESTATE_SYNC = 0;
        this.ESTATE_PACKETHEADER = 5;
        this.ESTATE_DATAHEADER = 6;
        this.ESTATE_DATA = 7;
        this.ESTATE_CHECKSUM = 8;
        this.mChannelByteCount = "";
        this.mChannelType = new Int8Array(1);
        this.mChannelFormat = new Int8Array(1);
        this.mDataChannel = "";
        this.mDataChannels = "";
        this.mChannelPacketLength = "";
        this.mPacketLength = "";
        this.mPacketBytes = "";
        this.mECGLength = "";
        this.mECGID = new Int8Array(1);
        this.mECGFormat = new Int8Array(1);
        this.mECGDataIndex = "";
        this.mAccChannels = "";
        this.mAccLength = "";
        this.mAccFormat = new Int8Array(1);
        this.mAccID = new Int8Array(1);
        this.mAccDataIndex = "";
        this.mBuffer = new Int8Array(this.BUFFER_SIZE);
        this.mPacketCheckSum = new Int8Array(1); // type => signed byte
        this.mInfo = new Int8Array(1);
        this.mSeqNum = "";
        this.mPrevSeqNum = "";
        this.mBattPercent = "";
        this.mState = "";
    }
    AlivePacketManager.prototype = {
        init() {
            this.mECGLength = 0;
            this.mPacketLength = 0;
            this.mPacketBytes = 0;
            this.mSeqNum = -1;
            this.mPrevSeqNum = -1;
            this.mInfo[0] = 0;
            this.mECGFormat[0] = 0;
            this.mAccLength = 0;
            this.mAccChannels = 0;
            this.mAccFormat[0] = 0;
            this.mBattPercent = -1.0; // -1=Unknown, 0-100%
            this.mState = this.ESTATE_SYNC;
        },
        getPacketLength() {
            return this.mPacketLength;
        },
        getPacketData() {
            return this.mBuffer;
        },
        getSeqNum() {
            return this.mSeqNum;
        },
        getPrevSeqNum() {
            return this.mPrevSeqNum;
        },
        getInfo() {
            return this.mInfo;
        },
        getECGLength() {
            return this.mECGLength;
        },
        getECGDataIndex() {
            return this.mECGDataIndex;
        },
        getECGID() {
            return this.mECGID;
        },
        getECGDataFormat() {
            return this.mECGFormat;
        },
        getECGSamplingRate() {
            return (300);
        },
        getAccLength() {
            return this.mAccLength;
        },
        getAccDataIndex() {
            return this.mAccDataIndex;
        },
        getAccID() {
            return this.mAccID;
        },
        getAccDataFormat() {
            return this.mAccFormat;
        },
        getAccChannels() {
            return this.mAccChannels;
        },
        getAccSamplingRate() {
            return (75);
        },
        getBatteryPercent() {
            return (this.mBattPercent);
        },
        add(tmp_ucData) {
            var ucData = new Int8Array(1);
            var tmp = new Int8Array(3);
            ucData[0] = tmp_ucData;
            this.mBuffer[this.mPacketBytes] = ucData[0];
            this.mPacketBytes++;
            //console.log(ucData[0]);
            switch (this.mState) {
              case this.ESTATE_SYNC:
              //console.log("mState == ESTATE_SYNC");
                  if (this.mPacketBytes == 1) {
                      //console.log("mPacketBytes == 1");
                      tmp[0] = 0x00;
                      if (ucData[0] == tmp[0]) { // 0x00
                          // Start of new packet
                          //console.log("ucData == 0");
                          this.mPacketCheckSum[0] = 0; // Start new checksum
                          this.mECGLength = 0;
                          this.mAccLength = 0;
                          this.mPrevSeqNum = this.mSeqNum;
                      } else {
                          this.mPacketBytes = 0;
                      }
                  } else if (this.mPacketBytes == 2) { // 0xFE
                      //console.log("mPacketBytes == 2");
                      tmp[0] = 0xFE;
                      if (ucData[0] == tmp[0]) {
                          this.mState = this.ESTATE_PACKETHEADER;
                      } else {
                          this.mState = this.ESTATE_SYNC;
                          this.mPacketBytes = 0;
                      }
                  }
                  break;

              case this.ESTATE_PACKETHEADER:
              //console.log("mState == ESTATE_PACKETHEADER");
                  if (this.mPacketBytes == 3) {
                      //console.log("mPacketBytes == 3");
                      this.mBattPercent = ucData[0] / 2.0;
                  } else if (this.mPacketBytes == 4) {
                      // use for loop to deal with bit operations
                      //console.log("mPacketBytes == 4");
                      tmp[0] = 0xF0;
                      this.mInfo[0] = ((ucData[0] & tmp[0]) >> 4); // Top nibble for info
                      tmp[0] = 0x0F;
                      this.mSeqNum = ((ucData[0] & tmp[0]) << 8); // Bottom nibble is the high 4 bits of 12 bit sequence number
                  } else if (this.mPacketBytes == 5) {
                      //console.log("mPacketBytes == 5");
                      tmp[0] = 0xFF;
                      this.mSeqNum |= (ucData[0] & tmp[0]); // Low 8 bits of 12 bit sequence number
                  } else if (this.mPacketBytes == 6) {
                      //console.log("mPacketBytes == 6");
                      this.mDataChannels = ucData[0];
                      this.mDataChannel = 0;
                      this.mChannelByteCount = 0;

                      // Packet length:
                      //	6  byte main header
                      //  n1 bytes in channel 1
                      //  n2 bytes in channel 2
                      //  ...
                      //  1  byte checksum + bytes in each channel

                      // Set current packet length and checksum.
                      // We add length of channel bytes after reading each channel header
                      this.mPacketLength = this.mPacketBytes + 1;
                      this.mState = this.ESTATE_DATAHEADER;
                  }
                  break;
              case this.ESTATE_DATAHEADER:
              //console.log("mState == ESTATE_DATAHEADER");
                  this.mChannelByteCount++;
                  if (this.mChannelByteCount == 1) {
                      //console.log("mChannelByteCount == 1");
                      this.mChannelType = ucData[0];
                  } else if (this.mChannelByteCount == 2) {
                      //console.log("mChannelByteCount == 2");
                      tmp[0] = 0xFF;
                      this.mChannelPacketLength = ((ucData[0] & tmp[0]) << 8);
                  } else if (this.mChannelByteCount == 3) {
                      //console.log("mChannelByteCount == 3");
                      tmp[0] = 0xFF;
                      this.mChannelPacketLength |= (ucData[0] & tmp[0]);

                      // mChannelPacketLength includes header and data bytes
                      // add this to the packet length
                      this.mPacketLength += this.mChannelPacketLength;
                      if (this.mPacketLength >= this.BUFFER_SIZE) {
                          this.mState = this.ESTATE_SYNC;
                          this.mPacketBytes = 0;
                          console.log("Packet is too large");
                      }
                  } else if (this.mChannelByteCount == 4) {
                      //console.log("mChannelByteCount == 4");
                      this.mChannelFormat = ucData[0];

                      // Note: any additional header bytes are ignored

                      this.mState = this.ESTATE_DATA;
                  }
                  break;
              case this.ESTATE_DATA:
             // console.log("mState == ESTATE_DATA");
                  this.mChannelByteCount++;
                  if (this.mChannelByteCount == this.mChannelPacketLength) {
                      //console.log("mChannelByteCount = " + this.mChannelByteCount);
                      //console.log("mChannelType = " + this.mChannelType);
                      tmp[0] = 0xAA;
                      tmp[1] = 0x56;
                      tmp[2] = 0x55;
                      if (this.mChannelType == tmp[0]) { // 0xAA
                          // ECG data packet
                          this.mECGID = this.mChannelType;
                          this.mECGFormat[0] = this.mChannelFormat;
                          this.mECGLength = this.mChannelPacketLength - 5; // 5 byte ECG header
                          this.mECGDataIndex = this.mPacketBytes - this.mECGLength;
                      } else if (this.mChannelType == tmp[1]) { // 0x56
                          // Acc 3 channel data packet
                          this.mAccID = this.mChannelType;
                          this.mAccChannels = 3;
                          this.mAccFormat[0] = this.mChannelFormat;
                          this.mAccLength = this.mChannelPacketLength - 5; // 5 byte Acc header
                          this.mAccDataIndex = this.mPacketBytes - this.mAccLength;
                      } else if (this.mChannelType == tmp[2]) { // 0x55
                          // Obsolete. Ignore Acc 2 channel data packet
                      } else {
                          // Unknown channel type. Just ignore
                      }
                      this.mDataChannel++;
                      if (this.mDataChannel == this.mDataChannels) {
                          this.mState = this.ESTATE_CHECKSUM;
                      } else {
                          this.mChannelByteCount = 0;
                          this.mState = this.ESTATE_DATAHEADER;
                      }
                  }
                  break;
              case this.ESTATE_CHECKSUM:
              console.log("mState == ESTATE_CHECKSUM");
                  if (ucData[0] == this.mPacketCheckSum[0]) {
                      this.mState = this.ESTATE_SYNC;
                      this.mPacketBytes = 0;
                      return (true);
                  }
                  console.log("Bad checksum");
                  this.mState = this.ESTATE_SYNC;
                  this.mPacketBytes = 0;
                  break;

          }
          this.mPacketCheckSum[0] += ucData[0];
          return (false);
        }
    };

    exports.AlivePacketManager = AlivePacketManager;
})(window);
