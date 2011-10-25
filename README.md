Hello, githubs! :)

# Description
A small utility to easily add/subtract time intervals from JavaScript Date object.

# Syntax
```
	offsetDate(interval, date)
```

## Parameters
	`interval` - {String} - time interval in special format
	`date`	- starting date
	
## Output
	Outputs JS Date object. Original `date` value will be left intact (returns modified copy)
	
# Interval syntax

I struggled a lot to make this syntax clean, predictable and easy to remember (some features were lost during the amputation process though -_-)

## Format

Typical format is as follows:
```
    <sign><value><modifier>
```

Typical examples of the format are:
```
    +1y      // add 1 year 
    -2M      // subtract 2 months
```

Easy, huh? :)

### List of supported modifiers
Supported modifiers should look familiar if you ever used any other JS date-related library:

```
    y - years
    M - months
    d - days
    h - hours
    m - minutes
    s - seconds
    ms - milliseconds
    w - weeks
    MM - months (with side effect*)
```

# Examples

So lets get down to the examples and use cases:

## Level 1 magic

```javascript

	var date = new Date(2011, 0, 30, 13, 30, 25);		// 2011-01-30 13:30:25
	
	// add 1 day
	offsetDate('+1d', date);		// 2011-01-30 11:30:25
    
    // subtract 2 hours
    offsetDate('-2h', date);		// 2011-01-30 11:30:25
    
    // add 1 week (notice, +w is the same as +1w)
    offsetDate('+w', date);			// 2011-02-06 11:30:25

```

Two or more intervals can be separated by one or more spaces. Operations will be 
executed one after another

```javascript
	var date = new Date(2011, 0, 30, 13, 30, 25);		// 2011-01-30 13:30:25

	// add 1 hour 30 minutes
    offsetDate('+1h +30m', date);	// 2011-01-03 15:00:25
    
    // this stuff does nothing 
    offsetDate('+1h -1h', date);
    
    // add 2 days
    offsetDate('+d +d', date);
    
    // WARNING! Be careful with months as they may cause date changes
    offsetDate('+M +M', date);		// 2011-03-28 ...
    offsetDate('+2M', date);		// 2011-03-30 ...
```


While hours, minutes, seconds and milliseconds are pretty much predictable, Date is all about 
struggling with dates and months and leap years.

```javascript
	// Jan 30 2011
	var date = new Date(2011, 0, 30);
	
	// change month to February?
	date.setMonth(1);
	
	// WTF?
	date.toString(); 	// "Wed Mar 02 2011 00:00:00 GMT-0800 (Pacific Standard Time)"
	date.getMonth(); 	// 2
```

`offsetDate` takes that into consideration:

```javascript
	var date = new Date(2011, 0, 30);	// 2011-01-30
	
	// adding 1 month guarantees month value will be increased by 1
	offsetDate('+1M', date);		// 2011-02-28
	
	// and it also takes leap years into consideration
	offsetDate('+1M', new Date(2012, 0, 30)); 	// 2012-02-29
	
	// if you really REALLY want that native weird behaviour, here's the gun,
	// you know where to find your foot
	offsetDate('+1MM', date);		// 2011-03-02
```

## Level 2 magic

But what if you would like to add some arbitrary number of days but prevent Date from
jumping to the next month?

You can do so by adding "!" at the end of the interval. "!" guarantees that given 
parameter will remain withing an applicable range. *Month changes may affect dates*.
For everyone else, "!" means other parameters will be left intact.

```javascript
	var date = new Date(2011, 0, 30);
	
	// "!" guarantees that date will not exceed last day of the month
	offsetDate('+5d!', date);		// 2011-01-31
	
	// works pretty much for everything, except years (centuries, epochs are not supported)
	offsetDate('-35d!', date);		// 2011-01-01
	
	// weeks are capped by current month (subject to change though..., so use "7d" for this cases)
	offsetDate('+w!', date);		// 2011-01-31
	
```

## Level 3 magic

Most of the time, however, just adding interval would not be enough.

```javascript
	var date = new Date(2011, 0, 30, 13, 30, 25);
	
	// adding 1 day adds EXACTLY 24 hours
	offsetDate('+d', date);		// 2011-01-31 13:30:25
			
```

Sometimes we need to truncate time or even date information. For example if we want to know 
whether some date is in some date range.

Let's say, I need to check whether Alice's birthday is this month

```javascript
	var alice = new Date(2011, 1, 1);		// Alice's birthday is Feb 1st
	
	// Alice?
	function aliceHasBirthdayThisMonth(today) {
		return alice >= offsetDate('-99d!', today) && alice <= offsetDate('+99d!', today)
	} 
	
	var date = new Date(2011, 1, 2, 13, 30, 25);	// now is 2011-02-02 13:30:25
	
	// surprise!
	aliceHasBirthdayThisMonth(date);		// false;
```

This happens because `offset('-99d!', today)` results in `2011-02-01 13:30:25` because as we said
before "d!" will not affect time. 

So you have to keep "!"-ing for hours and minutes and seconds and milliseconds (no pun intended) :)

```
	offsetDate('-99d! -24h! -60m! -60s! -1000ms!', date)	// 2011-02-01 00:00:00.000
```

So I decided to add trimming to spare you some time. To do it, just add "~" at the end of the 
interval. It would trim everything after that modifier.

```
	var date = new Date(2011, 1, 2, 13, 30, 25);	// now is 2011-02-02 13:30:25
	
	// add month, then keep month and year, trim everything else
	offsetDate('+1M~', date);		// 2011-03-01 00:00:00.000
	
	// but you can also write the same as above like this:
	offsetDate('+M~', date);
	
	// to specify beginning of this month, you can do
	offsetDate('+0M~', date);	// 2011-02-01 00:00:00.000
	
	// but you can ommit "+0" for this case and get a cleaner syntax:
	offsetDate('M~', date);		// 2011-02-01 00:00:00.000
	
```

Trimming date is like rounding a number to a certain precision. 

`y~` will keep year and trim month, date, hours, minutes, seconds and milliseconds
`M~` will keep year and month and trim date, etc.
`d~` will keep year, month and date.
`w~` will round date to the beginning of the current week. (I think it requires localization, tho)

You can think of "~" as equivalent of *"go to the beginning of ..."*;

```javascript
	
	var date = new Date(2011, 1, 2, 13, 30, 25);	// now is 2011-02-02 13:30:25
	
	// beginning of this week
	offsetDate('w~', date);	// Sun, 2011-01-30 00:00:00.000
	
	// beginning of next week:
	offsetDate('+w~', date);	// Sun, 2011-02-06 00:00:00.000
	
	// beginning of the month before the previous month
	offsetDate('-2M~', date);	// 2010-11-01 00:00:00.000
	
	// there are many ways you can go crazy
	
	// last moment before Christmas
	offsetDate('y~ +11M +24d -1ms', date);	// 2011-12-24 23:59:59.999
	offsetDate('+y~ -7d -1ms', date);
```

The final listing for the example with Alice's birthday would be

```javascript
	var alice = new Date(2011, 1, 1);		// Alice's birthday is Feb 1st
	
	// Alice?
	function aliceHasBirthdayThisMonth(today) {
		// from beginning of this month to the beginning of next month
		return alice >= offsetDate('M~', today) && alice < offsetDate('+M~', today)
	} 
	
	var date = new Date(2011, 1, 2, 13, 30, 25);	// now is 2011-02-02 13:30:25
	
	// no surprise!
	aliceHasBirthdayThisMonth(date);		// true;
```

Oh, yeah... keep "!" before "~". 


# Known issues

* There's no way to set a specific year with current syntax... 
	May be "2008y" or something will be the way to do it, but all my previous attempts made
	syntax too complicated to remember.
	
* Weeks are bounded by month in strict mode ("w!"), not sure if anyone needs that


# For developers

If you would like to contribute to this small utility, feel free to send pull requests!

Please make sure that the tests in `/test/SpecRunner.htm` are not broken. (Just open it in any 
browser and make sure it's green :)). And submit test cases for your fixes.

It's Open-source and thus free and open to use for whatever you want.

If anyone knows how to make it a nice npm package, pm me! ^_^


Cheerz,
TEHEK =]