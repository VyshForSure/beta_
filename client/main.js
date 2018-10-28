import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

FlowRouter.route('/ca', {
	action(){
		// BlazeLayout.render('top');
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
  	isPhoneRegistered() {
  		if(Meteor.user()){
  			return !(Meteor.user().profile.phoneNumber === "");
  		}
  	}
});

Template.info.helpers({
  	entries() {
  		Meteor.call('getPosts', 0, 100,
  		(err, val) => { 
  			var table = document.getElementById('table');

  			for(var i = 0; i < val.length; i++){
  				var row = document.createElement('tr');
  				var content = document.createElement('td');
  				var expiry = document.createElement('td');
  				var admin = document.createElement('td');
  				content.innerHTML = val[i].content;
  				expiry.innerHTML = val[i].expiry.toLocaleDateString();
  				admin.innerHTML = val[i].score;
  				row.appendChild(content);
  				row.appendChild(expiry);
  				row.appendChild(admin);
  				if(Meteor.user() && Meteor.user().profile.isAdmin){
  					var rmBtn = document.createElement('button');
					rmBtn.innerHTML = 'Remove';
					rmBtn.style.color = 'Black';
					rmBtn.removeID = val[i]._id;
					rmBtn.addEventListener('click', () => {
						Meteor.call('removePost', Meteor.user()._id, rmBtn.removeID);
						table.removeChild(row);
					});
  					row.appendChild(rmBtn);
  				}
  				table.appendChild(row);
  			}
		});
  	},
  	getScore() {
  		if(Meteor.user()){
  			return Meteor.user().profile.score;
  		}
  		return false;
  	},
  	isAdmin() {
  		if(Meteor.user()){
  			return Meteor.user().profile.isAdmin;
  		}
  		return false;
  	},
});

Template.adminPanel.helpers({
	caentries() {
  		Meteor.call('getCAs', Meteor.userId(),
  		(err, val) => { 
  			if(val === 'Access Denied') {
  				document.getElementById('listLegend').innerHTML = val;
  				return;
  			}
  			var list = document.getElementById('catable');
  			for(var i = 0; i < val.length; i++){
  				var row = document.createElement('tr');
  				var name = document.createElement('td');
  				var score = document.createElement('td');
  				var email = document.createElement('td');
  				var number = document.createElement('td');
  				name.innerHTML = val[i].name;
  				score.innerHTML = val[i].score;
  				email.innerHTML = val[i].services.google.email;
  				number.innerHTML = val[i].phoneNumber;
  				row.appendChild(name);
  				row.appendChild(score);
  				row.appendChild(email);
  				row.appendChild(number);
  				list.appendChild(row);
  			}
		});
  	},
});

Template.registerNumber.events({
	'click #addNumber': () => {
		var t = document.getElementById('actualNumber').value;

		var heading = document.getElementById('ThisNeedsToBeSomething');

		if(t.toString().length !== 10 || isNaN(parseFloat(t))){
			heading.innerHTML = "Please Enter your Correct 10 digit Phone Number";
			return;
		}
		Meteor.call('registerNumber', Meteor.user()._id, t, 
			(err, val) => { 
				heading.innerHTML = val;
				window.Reload._reload();
			}
		);
	}
});

Template.adminPanel.events({
	'click .submit' : () => {
		if(!Meteor.user()) return;
		var content = document.getElementById('content').value;
		var score = document.getElementById('postScore').value;
		var expiry = document.getElementById('postExpiry').value;
		var bel = document.getElementById('legend');
		if(!content || !score || !expiry)
			i = 'Invalid Content';
		else{
			i = 'Submitted and waiting for response...';
			Meteor.call('submitContent',
			 	content, new Date(), new Date(expiry), score,
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
