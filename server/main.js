import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {

  	console.log("\n\n\tServer Started.\n\n");

  	// Clear Users DB
  	// console.log(Meteor.users.find({}).fetch());

  	// console.log('YOLO'); 
  	console.log('DB constains ' + Meteor.users.find({}).count() + ' documents.');
  	console.log(Meteor.users.findOne({isAdmin: true}));
  	// console.log(Meteor.users.find({}).fetch()[0]);
  	// console.log('Modified ' + Meteor.users.update({}, {$set: {nss: nss}}) + ' documents.');

  	// Meteor.users.remove({});

  	Accounts.onCreateUser((options, user) => {
  		if (!('profile' in options)) { options.profile = {}; }
  		if (!('providers' in options.profile)) { options.profile.providers = {}; }
	  	
  		user.nss = {
  			totalHours: 0,
  			events: []
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
		}});
  	});

});

class Event{
	constructor(adminName, hours, eventName, category){
		this.adminName = adminName;
		this.hours = hours;
		this.eventName = eventName;
		this.category = category;
		this.time = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate() 
			+ '@' + today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();

	}	
}

Meteor.methods({
	giveCreditToStudent: (rollNo, eventName, hours, adminId) => {
		var doc = Meteor.users.findOne({_id: adminId});
		if(!doc) return;
		if(!doc.isAdmin) return;
		console.log(doc.isAdmin);

		console.log(rollNo);
	},
});

giveCreditToStudent: (rollNo, event, adminId) => {

	//get the admin name from his id and check if he is admin and logged in 

	//Fnd student by roll No
	//increase his total hours,
	//Append this event to his events list
}




