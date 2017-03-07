'use strict';

(function (exports) {
    var HeartBeatManager = function() {
        // HeartRate
        this.mHR = "";
        this.mHRUnits = "";

        // HeartRateUnits
        this.contextHR = "";
        this.contextHRUnits = "";

        this.hrString = "---";
    }
    HeartBeatManager.prototype = {
        init() {
            this.mHR = document.getElementById("ecgtitle");
            this.contextHR = this.mHR.getContext("2d");

            this.mHRUnits = document.getElementById("ecghr");
            this.contextHRUnits = this.mHRUnits.getContext("2d");

            this.onMeasure();

            window.addEventListener('resize', this.onMeasure.bind(this), false);
            this.onMeasure();
        },
        onMeasure() {
            this.mHR.width = window.innerWidth / 4;
            this.mHR.height = window.innerHeight / 4;
            this.contextHR.font = "20px sans-serif";
            this.contextHR.fillText(this.hrString, this.mHR.width/4, this.mHR.height/2);

            this.mHRUnits.width = window.innerWidth / 4;
            this.mHRUnits.height = window.innerHeight / 4;
            this.contextHRUnits.font = "20px sans-serif";
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
                this.onMeasure();
            }
        },
        checkCon (hrv) {
            hrv.calMeanRR (32);
            hrv.calNN50 (32);
            var meanRR = hrv.getMeanRR ();
            var fre = hrv.getfftRRs ();
            hrv.calFrequency (32);
            meanRR = (1000*60.)/meanRR;
            // mRR.setText("RR: "+hrv.getRRs().get(hrv.getRRs().size()-1)+"\nMean RR: " + (int)(meanRR*100+0.5)/100.+"\nRMSSD: "+(int)(hrv.getRMSSD()*100+0.5)/100.+"\nSDNN: "+(int)(hrv.getSDNN()*100+0.5)/100.+"\nNN50: "+hrv.getNN50()+"\npNN50: "+(int)(hrv.getpNN50()*10000+0.5)/100.+"%");
            // mRR.append("\nTP: "+hrv.getTP()+"\nLF: "+hrv.getLF()+"\nHF: "+hrv.getHF()+"\nLF/HF: "+hrv.getLF()/hrv.getHF());
            // //mRR.append("\nother: "+hrv.getother()+"\nl: "+hrv.getl());
            // if(meanRR < 50){
            //     mCon.setText("心跳過緩(Bradycardia)");
            // }
            // else if(meanRR > 100){
            //     mCon.setText("心跳過速(Tachycardia)");
            // }
            // else if(hrv.isArr(32)){
            //     mCon.setText("心律不整(Irregular rhythm)");
            //     mAllRR.append(" Arr ");
            // }
            // else{
            //     mCon.setText("心律正常(Regular rhythm)");
            // }
            console.log ("RR: "+hrv.getRRs()[hrv.getRRs().length-1]+"\nMean RR: " + parseInt(meanRR*100+0.5)/(100.)+"\nRMSSD: "+parseInt(hrv.getRMSSD()*100+0.5)/100.+"\nSDNN: "+parseInt(hrv.getSDNN()*100+0.5)/100.+"\nNN50: "+hrv.getNN50()+"\npNN50: "+parseInt(hrv.getpNN50()*10000+0.5)/100.+"%");
            console.log ("\nTP: "+hrv.getTP()+"\nLF: "+hrv.getLF()+"\nHF: "+hrv.getHF()+"\nLF/HF: "+hrv.getLF()/hrv.getHF());
            //mRR.append("\nother: "+hrv.getother()+"\nl: "+hrv.getl());
            if(meanRR < 50){
                console.log ("心跳過緩(Bradycardia)");
            }
            else if(meanRR > 100){
                console.log ("心跳過速(Tachycardia)");
            }
            else if(hrv.isArr(32)){
                console.log ("心律不整(Irregular rhythm)");
                console.log (" Arr ");
            }
            else{
                console.log ("心律正常(Regular rhythm)");
            }
        },
        updateRR (rr, hrv) {
            var rrString;
            var meanRR = 0;
            if (hrv.getRRs ().length < 32) {
                console.log ("計算中(Calculating)..."+(32 - hrv.getRRs().length));
            } else {

            }

        },
        onAliveHeartBeat(timeSampleCount, hr, rrSamples, hrv) {
            // console.log(hr);
            this.updateHeartRate (Math.floor(hr+0.5));
            this.updateRR (rrSamples, hrv);
        }
    };

    exports.HeartBeatManager = HeartBeatManager;
})(window);
