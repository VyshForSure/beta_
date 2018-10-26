import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {

  	console.log("\n\tServer Started.\n");

  	// Meteor.users.remove({});
  	Posts = new Mongo.Collection('posts');

  	console.log('DB constains ' + Meteor.users.find({}).count() + ' documents.');
  	console.log('DB constains ' + Meteor.users.find({isAdmin: true}).count() + ' Admins.');

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

    // Accounts.config({ restrictCreationByEmailDomain: 'iith.ac.in' });

  	Accounts.onCreateUser((options, user) => {
  		if (!('profile' in options)) { options.profile = {}; }
  		if (!('providers' in options.profile)) { options.profile.providers = {}; }
	  	
  		user.name = user.services.google.name.toLowerCase();
  		user.isAdmin = false;
      user.score = 0;
  		return user;
  	});

  	Accounts.onLogin((loginDetails) => {
  		var t = Meteor.users.findOne({_id: loginDetails.user._id});

      // Meteor.users.update({_id: loginDetails.user._id}, {$set:{
      //     // 'isAdmin' : true
      //     'score' : t.score + 1
      // }});

  		Meteor.users.update({_id: loginDetails.user._id}, {$set:{
        'profile.isAdmin' : t.isAdmin,
        'profile.score' : t.score
	    }});

    });
});

makeDocument = (content, time, adminName) => {
  return {
    content: content,
    time: time,
    adminName: adminName
  };
}

updateScore = (id, newScore) => {
    Meteor.users.update({_id: id}, {$set:{
          'score' : newScore
    }});
}

Meteor.methods({
	submitContent: (content, time, id) => {
    // console.log('submitContent() called, content:', content);
    var user = Meteor.users.findOne({_id: id});

    if(!user.isAdmin) return 'Access Denied';

    Posts.insert(makeDocument(content, time, user.name));

    return 'Process Completed';
	},

  getPosts: (start, end) => {
    // console.log('getPosts() called');
    var t = end - start;
    if(t < 0) t = 10;
    if(start < 0) start = 0;
    return Posts.find({}, { limit: t, skip: start, sort: {time: -1} }).fetch();
  },
  
  updateScore: (score, Email) => {
    // console.log('updateScore() called', score, Email);
    if(!Email) return 'Invalid Email';
    if(isNaN(score) || !score) return 'Invalid Score';

    var user = Meteor.users.findOne({ 'services.google.email' : Email });

    if(!user) return 'User Not Found';
    else updateScore(user._id, parseFloat(user.score) + parseFloat(score));
    
    return 'Score successfully updated';
  }


});
