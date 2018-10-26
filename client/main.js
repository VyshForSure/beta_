import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

FlowRouter.route('/caportal', {
	action(){
		BlazeLayout.render('top');
	}
});

FlowRouter.route('/*', {
	action(){
		window.location.href='/Home.html';
	}
});

Template.top.onCreated(function topOnCreated() {
});

Template.top.helpers({
  	isAdmin() {
  		if(Meteor.user()){
  			return Meteor.user().profile.isAdmin;
  		}
  		return false;
  	},
});

Template.info.helpers({
  	entries() {
  		Meteor.call('getPosts', 0, 100,
  		(err, val) => { 
  			var list = document.getElementById('table');
  			for(var i = 0; i < val.length; i++){
  				var row = document.createElement('tr');
  				var content = document.createElement('td');
  				var time = document.createElement('td');
  				var admin = document.createElement('td');
  				content.innerHTML = val[i].content;
  				time.innerHTML = val[i].time.toLocaleDateString();
  				admin.innerHTML = val[i].adminName;
  				row.appendChild(content);
  				row.appendChild(time);
  				row.appendChild(admin);
  				list.appendChild(row);
  			}
		});
  	},
  	getScore() {
  		if(Meteor.user()){
  			return Meteor.user().profile.score;
  		}
  		return false;
  	},
});

Template.adminPanel.events({
	'click .submit' : () => {
		if(!Meteor.user()) return;
		var content = document.getElementById('content').value;
		var bel = document.getElementById('legend');
		if(!content)
			i = 'Invalid Content';
		else{
			i = 'Submitted and waiting for response...';
			Meteor.call('submitContent',
			 	content, 
			 	new Date(),
			 	Meteor.user()._id,
			 	(err, val) => { 
					if(err) bel.innerHTML = err;
					else bel.innerHTML = val;
				}
			);
		}
		bel.innerHTML = i;
	},
	'click .update' : () => {
		if(!Meteor.user()) return;
		var score = document.getElementById('delScore').value;
		var email = document.getElementById('idOfCA').value;
		var bel = document.getElementById('legend');
		if(!content)
			i = 'Invalid Content';
		else if(!email)
			i = 'Invalid email of CA';
		else{
			i = 'Submitted and waiting for response...';
			Meteor.call('updateScore',
			 	score, 
			 	email,
			 	Meteor.user()._id,
			 	(err, val) => { 
					if(err) bel.innerHTML = err;
					else bel.innerHTML = val;
				}
			);
		}
		bel.innerHTML = i;
	}
});