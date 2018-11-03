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
   		clientId: "997189719914-2icchc71sgtjnllup9frnserla46dfa2.apps.googleusercontent.com",
  		loginStyle: "popup", //This is for web@elan.org.in
  		secret: "ERMZc8SCOL2Q9KpIH7EBjbyH",
  		// serviceEmail: "nss-iith-meteor@nss-iith.iam.gserviceaccount.com"
  	});

    // Accounts.config({ restrictCreationByEmailDomain: 'iith.ac.in' });

  	Accounts.onCreateUser((options, user) => {
  		if (!('profile' in options)) { options.profile = {}; }
  		if (!('providers' in options.profile)) { options.profile.providers = {}; }

        var i = Meteor.users.find({}).count() + 1;
	  	
  		user.name = user.services.google.name;
  		user.isAdmin = false;
        user.score = 0;
        user.phoneNumber = "";
        user.referals = 0;
        user.code = 'CA' + user._id.substring(0, 4).toUpperCase() + '0000'.substring(0, 4 - String(i).length) + i;
  		return user;
  	});

  	Accounts.onLogin((loginDetails) => {
  		var t = Meteor.users.findOne({_id: loginDetails.user._id});

  		Meteor.users.update({_id: loginDetails.user._id}, {$set:{
            'profile.name' : t.name,
            'profile.isAdmin' : t.isAdmin,
            'profile.score' : t.score,
            'profile.phoneNumber' : t.phoneNumber,
            'profile.code' : t.code,
            'profile.referals' : t.referals
	    }});

    });
});

makeDocument = (content, time, expiry, score, adminName) => {
  return {
    content: content,
    time: time,
    expiry: expiry,
    score: score,
    adminName: adminName
  };
}

updateScore = (id, newScore) => {
    Meteor.users.update({_id: id}, {$set:{
          'score' : newScore
    }});
}

Meteor.methods({
	submitContent: (content, time, expiry, score, id) => {
    // console.log('submitContent() called, content:', content);
    var user = Meteor.users.findOne({_id: id});

    if(!user.isAdmin) return 'Access Denied';
    if(isNaN(parseFloat(score))) score = 1;

    Posts.insert(makeDocument(content, time, expiry, score, user.name));

    return 'Process Completed';
	},

  removePost: (adminId, postId) => {
    var user = Meteor.users.findOne({_id: adminId});
    if(!user.isAdmin) return 'Access Denied';
    return Posts.remove({ _id: postId});

  },

  getPosts: (start, end) => {
    var t = end - start;
    if(t < 0) t = 10;
    if(start < 0) start = 0;
    return Posts.find({}, { 
      limit: t, 
      skip: start, 
      sort: {time: -1} ,
      fields: {
        content: 1,
        expiry: 1,
        score: 1,
      }
    }).fetch();
  },

  getCAs: (id) => {
    var user = Meteor.users.findOne({_id: id});
    if(!user.isAdmin) return 'Access Denied';

    return Meteor.users.find({}, {
      fields: {
        score: 1, 
        name: 1, 
        'services.google.email': 1, 
        phoneNumber: 1,
        collegeName: 1,
        city: 1
      },
      sort: { score: -1 }
    }).fetch();
  },
  
  updateScore: (score, Email) => {
    // console.log('updateScore() called', score, Email);
    if(!Email) return 'Invalid Email';
    if(isNaN(score) || !score) return 'Invalid Score';

    var user = Meteor.users.findOne({ 'services.google.email' : Email });

    if(!user) return 'User Not Found';
    else updateScore(user._id, parseFloat(user.score) + parseFloat(score));
    
    return 'Score successfully updated';
  },

  registerNumber: (id, phoneNumber, collegeName, city, refCode) => {
    var user = Meteor.users.findOne({_id: id});
    if(!user) return 'User not Found';

    if(refCode !== ''){
        var refer = Meteor.users.find({ code: refCode }).fetch();
        for (var i = refer.length - 1; i >= 0; i--) {
            Meteor.users.update({ _id: refer[i]._id }, { $set: {referals:parseFloat(refer[i].referals) + 1} });
        }
    }

    Meteor.users.update({ _id: id }, { $set: {
      phoneNumber: phoneNumber,
      collegeName: collegeName,
      city: city
    } });

    return 'Number Registered successfully, please log in again to continue.';
  },
  superSecretCommand: (id, command, obj1, obj2) => {
    var user = Meteor.users.findOne({_id: id});
    if(!user.isAdmin) return 'Access Denied';

    if(command === 'find'){
        return Meteor.users.find(obj1, obj2).fetch();
    }
    else if(command === 'update'){
        return Meteor.users.update(obj1, obj2).fetch();
    }

  }
});
