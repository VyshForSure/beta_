import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

Template.hello.onCreated(function helloOnCreated() {

  this.counter = new ReactiveVar(0);
  //console.log(this);
});

Template.hello.helpers({
  counter() {
    return Template.instance().counter.get();
  },
  getEmail(){
 	if(Meteor.user().emails)
  		return Meteor.user().emails[0].address;
  	else
  		return '';
  }
});

Template.hello.events({
  'click .increment' (event, instance) {
    // increment the counter when button is clicked
    	instance.counter.set(instance.counter.get() + 1);
  },
  'click .logout' (event){
   		event.preventDefault();
        Meteor.logout();
   }
});

Template.register.events({
	'submit form' (event) {
        event.preventDefault();
        var rollno = event.target.registerRollNumber.value;
        var passwordVar = event.target.registerPassword.value;
        Accounts.createUser({
            email: rollno + '@iith.ac.in',
            rollNo: rollno,
            password: passwordVar
        });
	},
});

Template.login.events({
    'submit form' (event) {
        event.preventDefault();
        var rollno = event.target.loginRollNumber.value;
        var passwordVar = event.target.loginPassword.value;
        Meteor.loginWithPassword({email: rollno + '@iith.ac.in'}, passwordVar, () => { console.log("logged in"); });
    }
});