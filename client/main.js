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
  	categories(){
  		return Object.keys(Meteor.user().profile.nss.hoursByCategory);
  	},
  	hoursInCategory(){
  		return Object.values(Meteor.user().profile.nss.hoursByCategory);
  	},
  	headers(){
  		return Meteor.user().profile.nss.events.map((s) => s.eventName);
  	},
  	entries(){
  		return Meteor.user().profile.nss.events.map((s) => s.hours);
  	}

});

Template.hello.events({
	'click .increment' : () => {
		Template.instance().counter.set(Template.instance().counter.get() + 1);
	}
});

Template.adminPanel.events({
	'click .submit' : () => {
		if(!Meteor.user()) return;
		var name = document.getElementById('nameSheet').value;
		var idx = document.getElementById('idxSheet').value;
		var eventName = document.getElementById('eventName').value;
		var eventDate = document.getElementById('eventDate').value;
		var bel = document.getElementById('legend');
		if(!name)
			i = 'Invalid SpreadSheet Name';
		else if(!idx)
			i = 'Invalid WorkSheet Index';
		else{
			i = 'Submitted and waiting for response...';
			Meteor.call('processSheet',
			 	name,
				idx,
				eventName,
				eventDate,
				Meteor.user()._id, 
				Meteor.user().profile.accessTokenExpiry,
				(err, val) => { 
					if(err) bel.innerHTML = err;
					else bel.innerHTML = val;
				}
			);
		}
		bel.innerHTML = 'Add Hours by Sheet - ' + i;
			
	},


	'click .test' : () => {
		var bel = document.getElementById('legend');
		if(!Meteor.user()) return;
		Meteor.call('giveCreditToStudent',
		 	'ep17btech11001',
			'sample Event Name',
			'12/09/2018',
			'54', 
			'1',
			Meteor.user()._id, 
			Meteor.user().profile.accessTokenExpiry,
			'no url for single credit testing',
			(err, val) => { 
				if(err) bel.innerHTML = err;
				else bel.innerHTML = val;
			}
		);
		bel.innerHTML = 'Add Hours by Event - ' + i;
			
	}
});