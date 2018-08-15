import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {

	// var spreadsheetName = 'LOL';
 //  	var serviceEmail = 'nss-iith-meteor@nss-iith.iam.gserviceaccount.com'; 
 //  	var result = Meteor.call("spreadsheet/fetch2", spreadsheetName, "1", {email: serviceEmail});

  	// console.log(result);

  	console.log("\n\n\tServer Started.\n\n");

  	console.log("ISSUE: Allow credit to ghost roll numbers, fix.");
  	console.log("ISSUE: Secure Queries, fix");

  	// Meteor.users.remove({});

  	console.log('DB constains ' + Meteor.users.find({}).count() + ' documents.');
  	console.log('DB constains ' + Meteor.users.find({isAdmin: true}).count() + ' Admins.\n');

  	// console.log(Meteor.users.findOne({isAdmin: true}));
  	// console.log(Meteor.users.find({}).fetch()[0]);
  	// console.log('Modified ' + Meteor.users.update({}, {$set: {nss: nss}}) + ' documents.');

  	ServiceConfiguration.configurations.remove({
  		service: "google"
	});
	ServiceConfiguration.configurations.insert({
 		service: "google",
 		clientId: "871001074249-fc9fd21o3k87s4n2an01l3t1tbuufgjq.apps.googleusercontent.com",
		loginStyle: "popup", //This is for nss@iith.ac.in
		secret: "ulQSkZdjXf-gbXZ0xdLQWSS9",
		serviceEmail: "nss-iith-meteor@nss-iith.iam.gserviceaccount.com"
	});

	Accounts.config({ restrictCreationByEmailDomain: 'iith.ac.in' });

  	Accounts.onCreateUser((options, user) => {
  		if (!('profile' in options)) { options.profile = {}; }
  		if (!('providers' in options.profile)) { options.profile.providers = {}; }
	  	
  		user.rollNo = user.services.google.email.split('@')[0].toLowerCase();
  		user.name = user.services.google.name.toLowerCase();

  		user.nss = {
  			totalHours: 0,
  			hoursByCategory: {},
  			events: new Array()
  		};
  		user.isAdmin = false;
  		return user;
  	});

  	Accounts.onLogin((loginDetails) => {
  		// Set NSS Data So that User can read their profile
  		var t = Meteor.users.findOne({_id: loginDetails.user._id});

  		//UnComment this to make admin the people who log in
  // 		Meteor.users.update({_id: loginDetails.user._id}, {$set:{
		// 	'isAdmin' : true
		// }});

		Meteor.users.update({_id: loginDetails.user._id}, {$set:{
			'profile.isAdmin' : t.isAdmin,
			'profile.nss.totalHours': t.nss.totalHours,
			'profile.nss.hoursByCategory': t.nss.hoursByCategory,
			'profile.accessTokenExpiry': t.services.google.expiresAt
		}});
  	});


});

	makeEvent = (adminName, hours, eventName, category, googleSheetId, eventDate) => {
		var today = new Date();
		return {
			adminName: adminName, 
			hours: hours, 
			eventName: eventName,
			time: today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate() 
			+ '@' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds(),
			eventDate: eventDate,
			category: category,
			googleSheetId: googleSheetId
		};
	}

	isValidNumber = (n) => {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

	authenticate = (adminId, tokenExpiry) => {
		var admin = Meteor.users.findOne({_id: adminId});
		var res = { success: false, msg: 'admin not found'};

		if(!admin) res.msg = 'Access Token is invalid.';
		else if(!admin.isAdmin) res.msg = 'Access Denied.';
		else if(admin.services.google.expiresAt !== tokenExpiry) res.msg = 'Access Token has expired, please log in again.';
		else {
			res.success = true;
			res.msg = admin.name;
		}

		return res;
	}

	roundToOneDecimal = (value) => {
  		return Number(Math.round(value+'e1')+'e-1');
	}

	creditStudent = (rollNo, adminName, hours, eventName, category, googleSheetId, eventDate) => {
		var student = Meteor.users.findOne({rollNo: rollNo.toLowerCase()});

		if(!student) return 'Roll Number not found.';
		if(!isValidNumber(hours)) return 'Hours is an invalid figure';

		var event = makeEvent(adminName, hours, eventName, category, googleSheetId, eventDate);
		var hoursByCategory = student.nss.hoursByCategory;
		if(hoursByCategory[category]) 
			hoursByCategory[category] = roundToOneDecimal(parseFloat(hours) + parseFloat(hoursByCategory[category]));
		else 
			hoursByCategory[category] = roundToOneDecimal(hours);
		student.nss.totalHours = roundToOneDecimal(parseFloat(student.nss.totalHours) + parseFloat(hours));
		student.nss.events.push(event);

		Meteor.users.update({_id: student._id}, {$set:{ 'nss': student.nss }});
		return 'Success, hours credited to Roll Number ' + rollNo;
	}

	queryRollNumbers = (selector) => {
		return Meteor.users.find(selector, { fields: {rollNo: 1}}).fetch();
	}

Meteor.methods({
	giveCreditToStudent: (rollNo, eventName, eventDate, hours, category, adminId, tokenExpiry, googleSheetId) => {
		var auth = authenticate(adminId, tokenExpiry);
		if(!auth.success) return auth.msg;

		var adminName = auth.msg;
		
		return creditStudent(rollNo, adminName, hours, eventName, category, googleSheetId, eventDate);

	},

	processSheet: (sheetName, sheetIdx, eventName, eventDate, adminId, tokenExpiry) => {
		var auth = authenticate(adminId, tokenExpiry);
		if(!auth.success) return auth.msg;

		var adminName = auth.msg;
		var serviceEmail = ServiceConfiguration.configurations.findOne({ service: "google" }).serviceEmail;

		var data = Meteor.call("spreadsheet/fetch2", sheetName, sheetIdx, {email: serviceEmail});

		if(!data) return 'Spreadsheet Not Found';

		var iMax = parseInt(data.info.lastRow) + 1;
		var x = 2, errCount = 0, doneCount = 0, notFoundCount = 0;
		while(x < iMax){
			var row = data.rows[x];
			var res = creditStudent(row[2], adminName, row[3], eventName, row[4], data.info.spreadsheetId, eventDate);
			if(res.startsWith('Success')) doneCount++;
			else if(res.startsWith('Hours')){
				errCount++;
				console.log('Row ' + x + ' has an invalid hours entry, ignoring.');	
			} 
			else if(res.startsWith('Roll')){
				notFoundCount++;
				console.log('Row ' + x + ' has a roll number not present in the DB, ignoring');			
			} 
			x++;
		}

		return 'Done Processing ' +(iMax - 1) +' entries, ' 
			+ doneCount + ' students credited, ' 
			+ notFoundCount + ' Roll Nos not found, ' 
			+ errCount + ' invalid hour entries.';
	},

	totalHoursLessThan: (compVal) => {
		return queryRollNumbers({ 'nss.totalHours' : {$lt: compVal} });
	},

	totalHoursGreaterThan: (compVal) => {
		return queryRollNumbers({ 'nss.totalHours' : {$gt: compVal} });
	},

	categoryHoursGreaterThan: (compVal, category) => {
		var t = 'nss.hoursByCategory.' + String(category);
		var d = {};
		d[t] = { $gt: compVal };
		return queryRollNumbers(d);
	},
	categoryHoursLessThan: (compVal, category) => {
		var t = 'nss.hoursByCategory.' + String(category);
		var d = {};
		d[t] = { $lt: compVal };
		return queryRollNumbers(d);
	}

});

/*

HTML _ Admin Panel
	URL, NAME of Spreadsheet, Date of Event, Name of Event
Implicit
	Time stamp of entry, Name of Admin
Data from the Spreadsheet (In this order only)
	Name, RollNO, hours, category

user{
	totalHours: 
	hoursByCategory: []
	events: [
		{	
			adminName: adminName, 
			hours: hours, 
			eventName: eventName,
			time: <timeStamp of DB chnage>
			timeofEvent: <time when the event happened>
			category:
			urlOfSpreadsheet: 
		},
		{	
			adminName: adminName, 
			hours: hours, 
			eventName: eventName,
			time: <timeStamp of DB chnage>
			timeofEvent: <time when the event happened>
			category:
			urlOfSpreadsheet: 
		},
		....
	]
}

*/
