import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Template.hello.onCreated(function helloOnCreated() {

  	this.counter = new ReactiveVar(0);
  	//console.log(this);


});

Template.top.helpers({
  	isAdminLink() {
  		if(Meteor.user()){
  			return Meteor.user().profile.isAdmin && window.location.pathname === '/supersecretadminpanel';
  		}

  		return false;
  	},

});

Template.hello.helpers({
  	counter() {
    	return Template.instance().counter.get();
  	},

});

Template.hello.events({
	'click .increment' : () => {
		Template.instance().counter.set(Template.instance().counter.get() + 1);
	}
});

Template.adminPanel.events({
	'click .submit' : () => {
		if(!Meteor.user()) return;
		var rollNo = document.getElementById('rollNumber').value;
		var hours = document.getElementById('hours').value;
		var eventName = document.getElementById('eventName').value;
		var i = '', bel = document.getElementById('legend');
		if(!rollNo)
			i = 'Invalid Roll Number';
		else if(!hours)
			i = 'Invalid Number of Hours';
		else if(!eventName)
			i = 'ERROR! Invalid Event Name';
		else{
			i = 'Submitted';
			Meteor.call('giveCreditToStudent', rollNo, eventName, hours, Meteor.user()._id, Meteor.user().profile.accessTokenExpiry,
				(err, val) => { 
					if(err) console.log(err);
					else bel.innerHTML = val;
				}
			);
		}
		bel.innerHTML = 'Add Hours by Event - ' + i;
			
	}
});