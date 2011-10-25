describe('Offset date.', function () {
	
	var date, res;
	
	beforeEach(function () {
		// lab mouse
		date = new Date(2011, 0, 30, 13, 30, 20);	// 2011-01-30 13:30:20.000 
	});
	
	describe('Modifiers.', function () {
		describe('Date "d"', function () {
			beforeEach(function () {
				date = new Date(2011, 0, 30);		// 30 Jan 2011
			});
			
			it('should adjust date', function () {
				expect(offsetDate('+1d', date)).toEqual(new Date(2011, 0, 31));
				
				expect(offsetDate('-1d', date)).toEqual(new Date(2011, 0, 29));
			});
			
			it('should leap month if not in strict mode', function () {
				expect(offsetDate('+2d', date)).toEqual(new Date(2011, 1, 1));		// 1 feb 2011
				
				expect(offsetDate('-30d', date)).toEqual(new Date(2010, 11, 31));	// 31 dec 2010
			});
			
			it('should cap date to available date in given month for "d!" (strict mode)', function () {
				expect(offsetDate('+2d!', date)).toEqual(new Date(2011, 0, 31));	// 31 jan 2011
				expect(offsetDate('+2d!', date)).toEqual(offsetDate('+9999d!', date));			// same date
				
				expect(offsetDate('-32d!', date)).toEqual(new Date(2011, 0, 1));		// 1 jan 2011
				expect(offsetDate('-32d!', date)).toEqual(offsetDate('-9999d!', date));		// 1 jan 2011
				
				// check leap year february
				expect(offsetDate('+1d', new Date(2012, 1, 28))).toEqual(new Date(2012, 1, 29));
			});
			
			it('should set time to 00:00:00.000 when trimming (d~)', function () {
				expect(offsetDate('d~', new Date(2011, 0, 30, 13, 30, 20))).toEqual(new Date(2011, 0, 30));
			})
		});
		
		describe('Month "M" and "MM"', function () {
			beforeEach(function () {
				date = new Date(2011, 0, 30);		// 30 Jan 2011
			});
			
			it('should guarantee month adjustment for "M" and set date to the last available date', function () {
				expect(offsetDate('+1M', date)).toEqual(new Date(2011, 1, 28));	// 28 Feb 2011, not 2 March 2011
				
				// on leap years
				expect(offsetDate('+1M', new Date(2012, 0, 30))).toEqual(new Date(2012, 1, 29));	// 29 Feb 2012
			});
			
			it('should let side-effect month leap happen for "MM"', function () {
				expect(offsetDate('+1MM', date)).toEqual(new Date(2011, 2, 2));	// March 2nd
			});
			
			it('should not affect year in strict mode (!)', function () {
				expect(offsetDate('+12M!', date)).toEqual(new Date(2011, 11, 30));	// 30 dec 2011
				expect(offsetDate('+12M!', date)).toEqual(offsetDate('+999M!', date));	// 30 dec 2011
			});
			
			it('should trim date and time', function () {
				expect(offsetDate('M~', new Date(2011, 0, 30, 13, 30, 20))).toEqual(new Date(2011, 0, 1));
			})
		});
		
		describe('Week "w"', function () {
			it('should adjust date by 7 days', function () {
				expect(offsetDate('+2w', date)).toEqual(offsetDate('+14d', date));
			});
			
			it('should be trimmed to the first day of the week', function () {
				expect(offsetDate('w~', date)).toEqual(new Date(2011, 0, 30));	// Sunday Jan 30, 2011
				
				expect(offsetDate('+1d w~', date)).toEqual(new Date(2011, 0, 30));	// Sunday Jan 30, 2011
				
				expect(offsetDate('+1d +w~', date)).toEqual(new Date(2011, 1, 6));	// Sunday Feb 6, 2011
				
			});
		});
		
		describe('Hour "h"', function () {
			var date, res;
			
			beforeEach(function () {
				date = new Date(2011, 0, 30, 13, 30, 25);
			});
			
			it('should adjust hour', function () {
				expect(offsetDate('+10h', date)).toEqual(new Date(2011, 0, 30, 23, 30, 25));
			});
			
			it('should not exceed day in strict mode', function () {
				expect(offsetDate('+25h!', date)).toEqual(new Date(2011, 0, 30, 23, 30, 25));
				expect(offsetDate('-25h!', date)).toEqual(new Date(2011, 0, 30, 0, 30, 25));
			})
		})
	})
	
	it('should ignore wrong offsets', function () {
		res = offsetDate('something', date);
		
		expect(res).toEqual(date);
	});
	
	it('should treat space separated inputs as individual operations', function () {
		res = offsetDate('+1h +1h', date);
		var res2 = offsetDate('+2h', date);
		
		expect(res).toEqual(res2);
	});
	
	it('should not affect original date object', function () {
		res = offsetDate('+1h', date);
		expect(res).not.toBe(date);
	});
	
	it('should treat value as 0 if no sign given', function () {
		expect(offsetDate('y', date)).toEqual(date);
	});
	
	it('should treat value as 1 if sign is given but no value provided', function () {
		expect(offsetDate('+y', date).getFullYear()).toEqual(2012);
	});
	
	it('should issue a warning if format is wrong', function () {
		spyOn(console, 'warn');
		
		offsetDate('invalid', date);
		
		expect(console.warn).toHaveBeenCalledWith('Unknown token "invalid" in "invalid"');
	})
});