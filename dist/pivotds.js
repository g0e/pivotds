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
		version: "0.1.0"
	};
	
	/* ------------------------------------------------------------------ */
	/*  pivotds globals                                                   */
	/* ------------------------------------------------------------------ */

	pivotds.options = {};
	pivotds.separator = "___"; // separator
	pivotds.nested_coupler = ".";

	/* ------------------------------------------------------------------ */
	/*  pivotds.Pivot                                                     */
	/* ------------------------------------------------------------------ */

	pivotds.Pivot = function(dataset,options){
		this.rows = []; // ex ["category","color"]
		this.cols = []; // ex ["date","person"]
		/* ex [
			{key:"hoge",type:"sum"},
			{key:"piyo",type:"custom",func:function(){}}
		] */
		this.aggs = [];
		this.filters = {};
		this.separator = pivotds.separator;
		if(dataset !== undefined){
			this.dataset = dataset;
		}
		if(options !== undefined){
			this.setup_options(options);
		}
	};
	
	pivotds.Pivot.prototype.setup_options = function(options){
		return pivotds.Util.merge(this,options);
	};
	
	pivotds.Pivot.prototype.set_dataset = function(dataset){
		this.dataset = dataset;
	};
	
	pivotds.Pivot.prototype.execute = function(dataset){
		if(dataset === undefined){
			dataset = this.dataset;
		}
		this.prepare_conditions();
		var filtered = this.filter_dataset(dataset);
		var dict = this.create_dict(filtered);
		dict = this.do_aggs(dict);
		var results = this.restore_dataset(dict);
		return results;
	};
	
	pivotds.Pivot.prototype.prepare_conditions = function(){
		if(this.aggs.length === 0){
			this.aggs.push({key:null,type:"count"});
		}
		var agg,func;
		for(var i=0,len=this.aggs.length;i<len;i++){
			agg = this.aggs[i];
			if(agg.type == "custom"){
				if(typeof(agg.func) !== "function"){
					throw new Error("custom aggregation type required func");
				}
			}else{
				func = pivotds.AggsFunc.name_to_func[agg.type];
				if(func !== undefined){
					agg.func = func;
				}else{
					throw new Error("invalid agg.type");
				}
			}
		}
	};
	
	pivotds.Pivot.prototype.filter_dataset = function(dataset){
		var d,filtered = [];
		for(var i=0,len=dataset.length;i<len;i++){
			d = dataset[i];
			// TODO filter
			filtered.push(d);
		}
		return filtered;
	};
	
	pivotds.Pivot.prototype.create_row_key = function(d){
		var keys = [], val;
		for(var i=0,len=this.rows.length;i<len;i++){
			val = d[this.rows[i]];
			if(val !== undefined){
				keys.push(""+val);
			}else{
				keys.push("");
			}
		}
		return keys.join(this.separator);
	};
	
	pivotds.Pivot.prototype.create_col_key = function(d){
		var keys = [], val;
		for(var i=0,len=this.cols.length;i<len;i++){
			val = d[this.cols[i]];
			if(val !== undefined){
				keys.push(""+val);
			}else{
				keys.push("");
			}
		}
		return keys.join(this.separator);
	};
	
	pivotds.Pivot.prototype.restore_row_vals = function(k){
		var dict = {};
		var keys = k.split(this.separator);
		if(keys.length === this.rows.length){
			for(var i=0,len=keys.length;i<len;i++){
				dict[this.rows[i]] = keys[i];
			}
		}else{
			throw new Error("can't restore row_key");
		}
		return dict;
	};
	
	pivotds.Pivot.prototype.restore_col_vals = function(k){
		var dict = {};
		var keys = k.split(this.separator);
		if(keys.length === this.cols.length){
			for(var i=0,len=keys.length;i<len;i++){
				dict[this.cols[i]] = keys[i];
			}
		}else{
			throw new Error("can't restore col_key");
		}
		return dict;
	};
	
	pivotds.Pivot.prototype.create_dict = function(dataset){
		var dict = {};
		var d, row_key, col_key, agg_key;
		var agg;
		for(var i=0,len=dataset.length;i<len;i++){
			d = dataset[i];
			row_key = this.create_row_key(d);
			col_key = this.create_col_key(d);
			if(dict[row_key] === undefined){
				dict[row_key] = {};
			}
			if(dict[row_key][col_key] === undefined){
				dict[row_key][col_key] = {};
			}
			for(var j=0,lenj=this.aggs.length;j<lenj;j++){
				agg_key = this.aggs[j].key;
				if(dict[row_key][col_key][agg_key] === undefined){
					dict[row_key][col_key][agg_key] = [];
				}
				dict[row_key][col_key][agg_key].push(d[agg_key]);
			}
		}
		return dict;
	};
	
	pivotds.Pivot.prototype.do_aggs = function(dict){
		var row_keys, col_keys, row, col, agg;
		row_keys = Object.keys(dict);
		for(var i=0,leni=row_keys.length;i<leni;i++){
			row = dict[row_keys[i]];
			col_keys = Object.keys(row);
			for(var j=0,lenj=col_keys.length;j<lenj;j++){
				col = row[col_keys[j]];
				for(var k=0,lenk=this.aggs.length;k<lenk;k++){
					agg = this.aggs[k];
					col[agg.key] = agg.func(col[agg.key]);
				}
			}
		}
		return dict;
	};
	
	pivotds.Pivot.prototype.restore_dataset = function(dict){
		var ds = [], d;
		var row_keys, col_keys, agg_keys, row, col;
		var col_key,col_keys_all = {};
		row_keys = Object.keys(dict);
		for(var i=0,leni=row_keys.length;i<leni;i++){
			d = this.restore_row_vals(row_keys[i]);
			row = dict[row_keys[i]];
			col_keys = Object.keys(row);
			for(var j=0,lenj=col_keys.length;j<lenj;j++){
				col = row[col_keys[j]];
				agg_keys = Object.keys(col);
				for(var k=0,lenk=agg_keys.length;k<lenk;k++){
					col_key = [col_keys[j],agg_keys[k]].join(this.separator);
					if(col_key.indexOf(this.separator) === 0){
						col_key = col_key.substr(this.separator.length);
					}
					d[col_key] = col[agg_keys[k]];
					col_keys_all[col_key] = true;
				}
			}
			ds.push(d);
		}
		col_keys_all = Object.keys(col_keys_all);
		ds = this.fillup_col(ds,col_keys_all);
		return ds;
	};
	
	pivotds.Pivot.prototype.fillup_col = function(ds,keys){
		for(var i=0,leni=ds.length;i<leni;i++){
			for(var j=0,lenj=keys.length;j<lenj;j++){
				if(ds[i][keys[j]] === undefined){
					ds[i][keys[j]] = 0;
				}
			}
		}
		return ds;
	};
	
	/* ------------------------------------------------------------------ */
	/*  pivotds.AggsFunc                                                  */
	/* ------------------------------------------------------------------ */
	pivotds.AggsFunc = {};
	
	pivotds.AggsFunc.count = function(ar){
		return ar.length;
	};
	pivotds.AggsFunc.sum = function(ar){
		var s = 0;
		for(var i=0,len=ar.length;i<len;i++){
			s += ar[i];
		}
		return s;
	};
	pivotds.AggsFunc.average = function(ar){
		return 1.0 * pivotds.AggsFunc.sum(ar) / ar.length;
	};
	pivotds.AggsFunc.max = function(ar){
		return Math.max.apply(null,ar);
	};
	pivotds.AggsFunc.min = function(ar){
		return Math.min.apply(null,ar);
	};

	pivotds.AggsFunc.name_to_func = {
		count: pivotds.AggsFunc.count,
		sum: pivotds.AggsFunc.sum,
		average: pivotds.AggsFunc.average,
		max: pivotds.AggsFunc.max,
		min: pivotds.AggsFunc.min,
	};
	
	/* ------------------------------------------------------------------ */
	/*  pivotds.Util                                                      */
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
