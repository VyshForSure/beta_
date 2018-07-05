import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {

  	console.log("\n\n\tServer Started.\n\n");

  	// console.log(Meteor.users.find({}).fetch());

  	Meteor.users.remove({});	

  	// console.log('YOLO'); 
  	console.log('DB constains ' + Meteor.users.find({}).count() + ' documents.');
  	console.log('DB constains ' + Meteor.users.find({isAdmin: true}).count() + ' Admins.\n');
  	// console.log(Meteor.users.findOne({isAdmin: true}));
  	// console.log(Meteor.users.find({}).fetch()[0]);
  	// console.log('Modified ' + Meteor.users.update({}, {$set: {nss: nss}}) + ' documents.');


  	Accounts.onCreateUser((options, user) => {
  		if (!('profile' in options)) { options.profile = {}; }
  		if (!('providers' in options.profile)) { options.profile.providers = {}; }
	  	
  		user.rollNo = user.services.google.email.split('@')[0].toLowerCase();
  		user.name = user.services.google.name.toLowerCase();

  		user.nss = {
  			totalHours: 0,
  			events: [{}]
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

		console.log(t.nss.events);

  	});

});


	makeEvent = (adminName, hours, eventName) => {
		var today = new Date();
		return {
			adminName: adminName, 
			hours:hours, 
			eventName: eventName,
			time: today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate() 
			+ '@' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds()
		};
	}

Meteor.methods({
	giveCreditToStudent: (rollNo, eventName, hours, adminId, tokenExpiry) => {
		var admin = Meteor.users.findOne({_id: adminId});
		if(!admin) return 'Access Token is invalid.';
		if(!admin.isAdmin) return 'Access Denied.';
		if(admin.services.google.expiresAt !== tokenExpiry) return 'Access Token has expired, please log in again.';

		var student = Meteor.users.findOne({rollNo: rollNo.toLowerCase()});

		if(!student) {
			return 'Roll Number not found.';
		}

		Meteor.users.update({_id: student._id}, {$set:{
			'nss.totalHours': (parseInt(student.nss.totalHours) + parseInt(hours)),
			'nss.events': (student.nss.events.concat([makeEvent(admin.name, hours, eventName)]))
		}});

		return 'Success, hours credited to Roll Number ' + rollNo;
		// var student = Meteor.users.findOne({})

	},
});




