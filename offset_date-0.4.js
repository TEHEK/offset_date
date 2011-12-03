(function (exports) {
		
	function warn () {
		if ('console' in window && console.warn)
			console.warn.apply(console, arguments);
	}
	
	/**
	 * Set of functions that round date to the beginning of something.
	 */
	var roundDate = {
		ms: function (date) {return date},	// nop
		s: function (date) {
			date.setMilliseconds(0);
			return date;
		},
		m: function (date) {
			date.setSeconds(0);
			return roundDate.s(date);
		},
		h: function (date) {
			date.setMinutes(0);
			return this.m(date);
		},
		d: function (date) {
			date.setHours(0);
			return this.h(date);
		},
		M: function (date) {
			date.setDate(1);	// combo breaker! :)
			return this.d(date);
		},
		y: function (date) {
			date.setMonth(0);
			return this.M(date);
		},
		w: function (date) {
		 	// TODO: add locale's first day awareness
			date.setDate(date.getDate() - date.getDay());
			return this.d(date);
		}
	};
	// alias for MM
	roundDate.MM = roundDate.M;	


	// mapping between modifiers and date functions
	var dateModifiers = {
		'y': {
			mod: 'FullYear',
			max: null,
			min: null
		},
		
		/**
		 * This default implementation will prevent you from shooting yourself in the foot
		 * if the date exceeds maximum days available in this month, the date will be set to the last 
		 * day of this month. Thus `M` guarantees that month will be adjusted EXACTLY by `num`
		 */
		'M': function (date, value, strict) {
			var result = new Date(date);
			var val = date.getMonth() + value;
			
			// if strict mode, do not leap over the year
			if (strict) {
				if (val > 11) val = 11;
				if (val < 0) val = 0;
			}
			
			// set month
			result.setMonth(val);
			
			// again... if month leaped forward, revert to the last day of the month
			if (result.getMonth() != (val + 12) % 12) {
				result.setDate(0);
			}
			
			return result;
		},
		
		/**
		 * In case you REALLY want unpredictable leaping month, here it is. 
		 * I don't know ANY use case for it, though :)
		 */
		'MM': {
			mod: 'Month',
			max: 11,
			min: 0
		},
		
		/** 
		 * Unfortunatelly, maximum date varies for each month. And we have leap years
		 */
		'd': function (date, value, strict) {
			var result = new Date(date);
			
			var newValue = result.getDate() + value;
			
			// if in strict mode
			if (strict) {
				// new value can definitelly not exceed 31 days
				if (newValue > 31) newValue = 31;
				
				// unlike others, date is limited by 1
				if (newValue < 1) newValue = 1;
			}
			
			// adjust
			result.setDate(newValue);
			
			// if in strict mode
			if (strict) {
				// if month did leap forward
				if (result.getDate() != newValue)
					// revert to the last day of prev month
					result.setDate(0);
			}
			
			return result;
		},
		
		'h': {
			mod: 'Hours',
			max: 23,
			min: 0
		},
		'm': {
			mod: 'Minutes',
			max: 59,
			min: 0
		},
		's': {
			mod: 'Seconds',
			max: 59,
			min: 0
		},
		'ms': {
			mod: 'Milliseconds',
			max: 999,
			min: 0
		},
		/**
		 * Week is 7 days
		 */
		'w': function (date, value, mode) {
			
			// delegate to d
			return dateModifiers.d(date, value*7, mode);
			
		}
	};
	
	
	var roundingPriority = {ms: 0, s: 1, m: 2, h: 3, d: 4, w: 5, M: 6, MM: 6, y: 7};

	/**
	 * Offset date 
	 */
	function _offsetDate(date, sign, value, factor, strict) {
		var result = new Date(date);
		var value, newValue;
						
		// if no sign, assume zero
		if (!sign)
			value = 0;
		else 
			// if sign given, but value missing
			if (value == "")
				value = 1;
		
		// convert value
		value = (sign == '-' ? -1 : 1) * Number(value);
		
		
		// get modifier type
		mod = dateModifiers[factor];
		
		switch (typeof mod) {
			
			// if it's an object, adjust parameter using getter/setter
			case "object":
				// adjust date
				newValue = date["get" + mod.mod]() + value;
				
				// if we are in stict mode
				if (strict && mod.max) {
					
					// set limits
					if (mod.max != null && newValue > mod.max)
						newValue = mod.max;
					
					if (mod.min != null && newValue < mod.min)
						newValue = mod.min;
				}
				
				// adjust value
				result["set" + mod.mod](newValue); 
				
				break;
			
			// if it's a function, call it
			case "function":
				result = mod(date, value, strict);
				break;
			
			default:
				return match;
		}
		
		return result;
	}
	
	/**
	 * Offsets date by given interval
	 * 
	 * @example 
	 * 		var date = new Date()
	 * 
	 * @param interval Interval by which the date must be adjusted.
	 * 		Format:
	 * 		<interval> ::= <sign> <value> <modifier> <strict> <trim>
	 * 		<sign> ::= '+' | '-' | ''
	 * 		<value> ::= <digit> | <digit> <value>
	 * 		<digit> ::= '0' | '1' | .. | '9' 
	 * 		<modifier> ::= 'y' | 'M' | 'd' | 'h' | 'm' | 's' | 'ms' | 'w' | 'MM'
	 * 		<strict> ::= '!' | ''
	 * 		<trim> ::= '~' | ''
	 * @param {Date} date Starting date. This value will be left intact
	 * @return {Date} resulting date
	 */
	function offsetDate(interval, date) {
		
		// copy date
		var result = new Date(date);
		
		var terms = interval.split(/\s+/);
		
		var offsetRegExp = /^([+-]?)(\d*)(y|MM|M|d|h|ms|m|s|w)(!?)(~?)$/;
		
		for (var i = 0; i < terms.length; i++) {
			var term = terms[i];
			
			// skip empty terms
			if (term == "")
				continue;
				
			var match = offsetRegExp.exec(term);
			
			if (!match) {
				warn('Unknown token "'+ term +'" in "'+ interval +'"');
				continue;
			}
			
			var sign = match[1];
			var value = match[2];
			var factor = match[3];
			var strict = match[4] == '!';
			var trim = match[5] == '~';
			
			
			result = _offsetDate(result, sign, value, factor, strict);
			
			if (trim && factor in roundDate)
				result = roundDate[factor](result);
			
		}
		
		return result;
	}
	
	exports['offsetDate'] = offsetDate;
})((function () {
	
	// Node.js?
	if( typeof exports !== 'undefined') {
		if( typeof module !== 'undefined' && module.exports) {
			exports = module.exports;
		}
		return exports;
	} else {
		// whatever else
		return this;
	}
})());
