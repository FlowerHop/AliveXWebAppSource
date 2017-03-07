'use strict';

(function (exports) {
	var HRV = function () {
		var RRs = [];
		var fftRRs = [];
		var fftN = 256;
		var SDNN = 0;
	    var SDANN = 0;
	    var RMSSD = 0;
	    var NN50 = 0;
	    var pNN50 = 0;
	    var meanRR = 0;
	    var VLF = 0;
	    var HF = 0;
	    var LF = 0;
	    var TP = 0;
	    var other = 0;
	    var l = 0;
	    this.FFTBuild (fftN);
	    var n = 0;
	    var m = 0;
	    var cos = [];
	    var sin = [];
	};

	HRV.prototype = {
		addRR (rr) {
            this.RRs.push (rr);
		},
        getfftRRs () {
            return this.fftRRs;
        },
		getRRs () {
            return this.RRs;
		},
		getRMSSD () {
            return this.RMSSD;
		},
		getSDNN () {
			return this.SDNN;
		},
		getNN50 () {
			return this.NN50;
		},
		getpNN50 () {
			return this.pNN50;
		},

		getTP () {
			return this.TP;
		},

		getLF () {
			return this.LF;
		},

		getHF () {
			return this.HF;
		},

		getMeanRR () {
            return this.meanRR;
		},
		calMeanRR (num) {
	      var RRSum = 0;
	      var RRDif = 0;
	      var count = num;

	      if (num == 0) {
	        count = this.RRs.length;
	      }

	      if (this.RRs.length > 0) {
	      	for (var i = this.RRs.length - 1; i > 0 && count > 0; i--, count--) {
	      	    RRSum += this.RRs[i];
	      	}

	      	count = num;

	      	if (num == 0 || this.RRs.length < num)
	      	    this.meanRR = RRSum / this.RRs.length;
	      	else
	      	    this.meanRR = RRSum / num;
	      	//meanRRrate = (int)(60./(meanRR/QrsDet.SAMPLE_RATE)+0.5);
	      	if (this.RRs.length > 1) {
	      	    RRSum = 0;
	      	    if (num == 0)
	      	        count = this.RRs.length;
	      	    for (var i = this.RRs.length - 1; i > 0 && count > 0; i--, count--) {
	      	        RRSum += (this.RRs[i] - this.meanRR) * (this.RRs[i] - this.meanRR);
	      	        if (i > 0 && count > 0)
	      	        	RRDif += (this.RRs[i] - this.RRs[i-1])*(this.RRs[i] - this.RRs[i-1]);
	      	    }
	      	    if (num == 0 || this.RRs.length < num) {
	      	        RRSum = RRSum / (this.RRs.length - 1);
	      	        RRDif = RRDif / (this.RRs.legnth - 1);
	      	    } else {
	      	        RRSum = RRSum / (num - 1);
	      	        RRDif = RRDif / (num - 1);
	      	    }
	      	    this.SDNN = Math.sqrt (RRSum);
	      	    this.RMSSD = Math.sqrt (RRDif);
	      	}
	      }
		},
		calNN50 (num) {
			var count = 0;
			var curRR = this.RRs[this.RRs.length - 1];
			var preRR;
			this.NN50 = 0;
			this.pNN50 = 0;

			if (num == 0) {
				count = this.RRs.length;
			}

			for (var i = this.RRs.length - 2; i > 0 && count > 0; i--, count--) {
				preRR = this.RRs[i];
				if ((curRR - preRR) > 50 || (preRR - curRR) > 50) {
					this.NN50++;
				}
				curRR = preRR;

				if (num == 0 || this.RRs.length < num) {
					this.pNN50 = NN50/(this.RRs.length - 1);
				} else {
					this.pNN50 = NN50/(num - 1);
				}
			}
		},
		calFrequency (num) {
	      var count = num;
	      if (count == 0) {
	      	count = this.RRs.length;
	        var fftRRArray = new Array (this.fftN); // fftN length
	        var RRsDouble = new Array (this.fftN); // fftN length

	        for (var i = 0; i < fftRRArray.length; i++) {
	          fftRRArray[i] = 0;
	          RRsDouble[i] = 0;
	        }

	        this.n = count;

	        for (var i = this.RRs.length - 1; i > 0 && count > 0; i--, count--) {
	          RRsDouble[count - 1] = this.RRs[i] - this.meanRR;
	        }

	        this.fft (RRsDouble, fftRRArray);
	        this.complexAbs (RRsDouble, fftRRArray);

	        var freMean = [];
	        for (var i = 0; i < RRsDouble.legnth; i++) {
	        	freMean.push (RRsDouble[i]);
	        }

	        this.fftRRs = [];
	        var phz = 1.0/this.fftN;
	        var TPMean = 0;
	        var VLFMean = 0;
	        var LFMean = 0;
	        var HFMean = 0;
	        var VLFc = 0;
	        var LFc = 0;
	        var HFc = 0;

	        for (var i = 0; (i + 1)*phz <= 0.4 && i < freMean.length; i++) {
	            var value = freMean[i];
	            this.fftRRs.push (value);

	            if ((i + 1)*phz < 0.04) {
	                VLFMean += value;
	                VLFc++; 
	            } else if ((i + 1)*phz < 0.15) {
	                LFMean += value;
	                LFc++;   
	            } else if ((i + 1)*phz < 0.4) {
	                HFMean += value;
	                HFc++;
	            }

	            TPMean += value;
	            VLFMean /= VLFc;
	            LFmean /= LFc;
	            HFmean /= HFc;
	            TPmean /= (VLFc+LFc+HFc);

	            for (var i = 0; (i + 1)*phz <= 0.4 && i < freMean.length; i++) {
	                var value = freMean[i];
	                this.fftRRs.push(value);

	                if ((i + 1)*phz < 0.04) {
	                    VLF += (value-VLFmean)*(value-VLFmean);
	                } else if ((i + 1)*phz < 0.15) {
	                    LF += (value-LFmean)*(value-LFmean);
	                } else if ((i + 1)*phz < 0.4) {
	                    HF += (value-HFmean)*(value-HFmean);
	                }
	                TP += (value-TPmean)*(value-TPmean);
	            }
	            this.VLF /= (VLFc - 1);
	            this.VLF = Math.sqrt(this.VLF);
	            this.LF /= (LFc - 1);
	            this.LF = Math.sqrt(this.LF);
	            this.HF /= (HFc - 1);
	            this.HF = Math.sqrt(this.HF);
	            this.TP /= (VLFc + HFc + LFc - 1);
	            this.TP = Math.sqrt(this.TP);
	        }


	      }
		},

		complexAbs (x, y) {
			for (var i = 0; i < x.length; i++) {
	            x[i] = x[i]*x[i]+y[i]*y[i];
	            x[i] = Math.sqrt(x[i]);
			}
		},

		isArr (num) {
			var isArr = false;
			var arrCount = 0;
			var count = num;
	      
	        for (var i = this.RRs.length - 1 ; i > 0 && count > 0; i--, count--) {
	            var mean = 0;
	            if (i >= 8) {
	                for (var j = 0; j < 8; j++) {
	                    mean += this.RRs[i - j - 1];
	                }
	                mean /= 8;
	                var lowerB = mean - mean * 0.14;
	                var upperB = mean + mean * 0.14;
	                //if (!(RRs.get(RRs.size() - 1) > lowerB && RRs.get(RRs.size() - 1) < upperB))
	                if (!(this.RRs[i] > lowerB && this.RRs[i] < upperB)) {
	                    arrCount += 1;
	                }
	            }
	        }

	        if (arrCount >= (num-8)/4) {
	            isArr = true;
	        }
	        return isArr;
		},
		FFTBuild (n) {
	        this.n = n;
	        this.m = (Math.log (this.n)/Math.log (2));
	        // Make sure n is a power of 2
	        if (this.n != (1<<this.m)) {
	            console.log ("FFT length must be power of 2");
	        }

	        // precompute tables
	        this.cos = new Array (this.n/2);
	        this.sin = new Array (this.n/2);

	        for (var i = 0; i < n / 2; i++) {
	            this.cos[i] = Math.cos(-2 * Math.PI * i / n);
	            this.sin[i] = Math.sin(-2 * Math.PI * i / n);
	        }
		}, 
		fft (x, y) {
	        var i, j, k, n1, n2, a;
	        var c, s, t1, t2;

	        // Bit-reverse
	        j = 0;
	        n2 = this.n/2;
	        for (i = 1; i < this.n - 1; i++) {
	            n1 = n2;
	            while (j >= n1) {
	                j = j - n1;
	                n1 = n1/2;
	            }

	            j = j + n1;

	            if (i < j) {
	                t1 = x[i];
	                x[i] = x[j];
	                x[j] = t1;
	                t1 = y[i];
	                y[i] = y[j];
	                y[j] = t1;
	            }
	        }

	        // FFT
	        n1 = 0;
	        n2 = 1;

	        for (i = 0; i < this.m; i++) {
	            n1 = n2;
	            n2 = n2 + n2;
	            a = 0;

	            for (j = 0; j < n1; j++) {
	                c = this.cos[a];
	                s = this.sin[a];
	                a += 1 << (this.m - i - 1);

	                for (k = j; k < this.n; k = k + n2) {
	                    t1 = c * x[k + n1] - s * y[k + n1];
	                    t2 = s * x[k + n1] + c * y[k + n1];
	                    x[k + n1] = x[k] - t1;
	                    y[k + n1] = y[k] - t2;
	                    x[k] = x[k] + t1;
	                    y[k] = y[k] + t2;
	                }
	            }
	        }
		}
	};
	exports.HRV = HRV;
})(window);
