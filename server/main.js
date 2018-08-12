import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {

	var spreadsheetName = 'LOL';
  	var serviceEmail = 'nss-iith-meteor@nss-iith.iam.gserviceaccount.com'; 
  	var result = Meteor.call("spreadsheet/fetch2", spreadsheetName, "1", {email: serviceEmail});

  	console.log(result);

  	console.log("\n\n\tServer Started.\n\n");
  	console.log("ISSUE: Allows sign in with non iith.ac.in emails, fix.");

  	// Meteor.users.remove({});

  	console.log('DB constains ' + Meteor.users.find({}).count() + ' documents.');
  	console.log('DB constains ' + Meteor.users.find({isAdmin: true}).count() + ' Admins.\n');

  	// console.log(Meteor.users.findOne({isAdmin: true}));
  	// console.log(Meteor.users.find({}).fetch()[0]);
  	// console.log('Modified ' + Meteor.users.update({}, {$set: {nss: nss}}) + ' documents.');

 //  	ServiceConfiguration.configurations.remove({
 //  		service: "google"
	// });
	// ServiceConfiguration.configurations.insert({
 	// 	service: "google",
 	// 	clientId: "871001074249-fc9fd21o3k87s4n2an01l3t1tbuufgjq.apps.googleusercontent.com",
	// 	loginStyle: "popup", //This is for nss@iith.ac.in
	// 	secret: "ulQSkZdjXf-gbXZ0xdLQWSS9"
	// });

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
		Meteor.users.update({_id: loginDetails.user._id}, {$set:{
			'profile.nss': t.nss,
			'profile.isAdmin': t.isAdmin,
			'profile.accessTokenExpiry': t.services.google.expiresAt
		}});
  	});


});

	makeEvent = (adminName, hours, eventName, category, urlGoogleSheet, eventDate) => {
		var today = new Date();
		return {
			adminName: adminName, 
			hours:hours, 
			eventName: eventName,
			time: today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate() 
			+ '@' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds(),
			eventDate: eventDate,
			category: category,
			urlGoogleSheet: urlGoogleSheet
		};
	}

	isValidNumber = (n) => {
		return !isNaN(parseFloat(n)) && isFinite(n);
	}

Meteor.methods({
	giveCreditToStudent: (rollNo, eventName, eventDate, hours, category, adminId, tokenExpiry, urlGoogleSheet) => {
		var admin = Meteor.users.findOne({_id: adminId});
		if(!admin) return 'Access Token is invalid.';
		if(!admin.isAdmin) return 'Access Denied.';
		if(!isValidNumber(hours)) return 'Hours is an invalid figure';
		if(admin.services.google.expiresAt !== tokenExpiry) return 'Access Token has expired, please log in again.';

		var student = Meteor.users.findOne({rollNo: rollNo.toLowerCase()});

		if(!student) {
			return 'Roll Number not found.';
		}

		var event = makeEvent(admin.name, hours, eventName, category, urlGoogleSheet, eventDate);
		var hoursByCategory = student.nss.hoursByCategory;
		if(hoursByCategory[category]) 
			hoursByCategory[category] = parseFloat(hours) + parseFloat(hoursByCategory[category]);
		else 
			hoursByCategory[category] = hours;
		student.nss.totalHours = parseFloat(student.nss.totalHours) + parseFloat(hours);
		student.nss.events.push(event);

		Meteor.users.update({_id: student._id}, {$set:{ 'nss': student.nss }});

		console.log(student.nss)

		return 'Success, hours credited to Roll Number ' + rollNo;

	},
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
