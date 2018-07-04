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
  			if(Meteor.user().profile.isAdmin && window.location.pathname === '/supersecretadminpanel'){

  				return true;

  			}
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
		var bel = document.getElementById('legend');
		var i = '';
		if(!rollNo)
			i = 'Invalid Roll Number';
		else if(!hours || hours < 1)
			i = 'Invalid Number of Hours';
		else if(!eventName)
			i = 'ERROR! Invalid Event Name';
		else{
			i = 'Submitted';
			Meteor.call('giveCreditToStudent', rollNo, eventName, hours, Meteor.user()._id);
		}
		bel.innerHTML = 'Add Hours by Event - ' + i;
			
	}
});