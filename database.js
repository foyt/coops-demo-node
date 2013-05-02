(function() {

  var mongoose = require('mongoose');
  mongoose.connect(process.env.COOPS_DEMO_MONGO_URI || process.env.MONGOLAB_URI || process.env.MONGOHQ_URL);
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  
  /* User */
  
  var UserSchema = mongoose.Schema({
    name: String,
    userId: String,
    accessToken: String,
    refreshToken: String,
    tokenExpires: Number
  });
  
  /* UserEmail */
  
  var UserEmailSchema = mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    email: String
  });

  /* UserIdentifier */
  
  var UserIdentifierSchema = mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    identifier: String
  });
  
  /* Setting */
  
  var SettingSchema = mongoose.Schema({
    key: String,
    value: String
  });

  module.exports = {
    model: {
      User: mongoose.model('User', UserSchema),
      UserEmail: mongoose.model('UserEmail', UserEmailSchema),
      UserIdentifier: mongoose.model('UserIdentifier', UserIdentifierSchema),
      Setting: mongoose.model('Setting', SettingSchema) 
    }
  };
  
}).call(this);