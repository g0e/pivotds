/**
pivotds.js

Copyright (c) 2015 Masafumi.OSOGOE

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/

// for JSHint
/* exported pivotds */

/* ================================================================== */
/*  pivotds definition                                                */
/* ================================================================== */
var pivotds = function(){
	"use strict";
	
	var pivotds = {
		version: "1.2.4"
	};
	
	/* ------------------------------------------------------------------ */
	/*  pivotds globals                                                   */
	/* ------------------------------------------------------------------ */

	pivotds.options = {};
	
	/* ------------------------------------------------------------------ */
	/*  pivotds.Worker                                                    */
	/* ------------------------------------------------------------------ */

	pivotds.Worker = function(dataset,options){
		this.dataset = dataset || [];
		this.options = options || {};
	};
	
	pivotds.Worker.prototype.setup_options = function(options){
		return pivotds.Util.merge(this,options);
	};
		
	pivotds.Worker.prototype.set_dataset = function(dataset){
		this.dataset = dataset;
	};
	
	pivotds.Worker.prototype.execute = function(){
		// TODO
		return [];
	};
	
	/* ------------------------------------------------------------------ */
	/*  pivotds.Util                                                         */
	/* ------------------------------------------------------------------ */
	pivotds.Util = {};
	/**
	* merge object(overwrite properties)
	* thanks to https://gist.github.com/ww24/2181560
	*/
	pivotds.Util.merge = function(a,b){
		for (var key in b) {
			if (b.hasOwnProperty(key)) {
				a[key] = (key in a) ? 
					((typeof a[key] === "object" && typeof b[key] === "object") ?
						pivotds.Util.merge(a[key], b[key]) : b[key]) : b[key];
			}
		}
		return a;
	};
	pivotds.Util.copy = function(obj){
		// deep copy dataset and so on.
		if (null === obj || undefined === obj || "object" != typeof obj) return obj;
		var copy;
		
		if (obj instanceof Date) {
			copy = new Date();
			copy.setTime(obj.getTime());
			return copy;
		}
		if (obj instanceof Array) {
			copy = [];
			for (var i = 0, len = obj.length; i < len; i++) {
				copy[i] = pivotds.Util.copy(obj[i]);
			}
			return copy;
		}
		if (obj instanceof Object) {
			copy = {};
			for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) copy[attr] = pivotds.Util.copy(obj[attr]);
			}
			return copy;
		}
		
		throw new Error("Unable to copy obj! Its type isn't supported.");
	};

	return pivotds;
}();
