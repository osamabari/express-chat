
module.exports = function(app, model) {
    
    var util = app.libs.util,
        mongoose = model.mongoose,
        ObjectId = mongoose.Schema.ObjectId,
        GridStore = require('mongodb').GridStore;
    
    var File = new mongoose.Schema({
          servername      : { type: String, index: { unique: true } }
        , uploaderip      : String
        , uploadername    : String
        , originalname    : String
        , status          : { type: String, enum: ['Uploading','Available','Stopped','Removed'], default: 'Uploading' }
        , size            : Number
        , uploaddate      : { type: Date, default: Date.now }
    });
    
    function generateUniqueId(callback, it) {
        var iter = it || 20;
        var randName = util.randomString(10);
        FileModel.find({servername: randName}, function(err, docs) {
          if(err || !docs || docs.length == 0) {
            callback(null, randName);
          } else {
            if(iter --> 0) {
              generateUniqueId(callback, iter);
            } else {
              callback(new Error("Failed generating unique file id"), null);
            }
          }
        });
    }

    File.pre('save', function(next) {
        var self = this;
        generateUniqueId(function(err, uniqueId) {
            if(err || uniqueId == null) next(err);
            else {
                self.servername = uniqueId;
                next();
            }
        }, 5);
    });

    File.pre('remove', function(next) {
        GridStore.unlink(model.mongodb, this.servername, next);
    });

    File.methods.remove = function(callback) {
        this.status = 'Removed';
        this.save(callback);
    };
    
    File.methods.publicFields = function() {
        return {
            id            : this.servername
          , originalname  : this.originalname
          , uploadername  : this.uploadername
          , status        : this.status
          , size          : this.size
        };
    };

    var FileModel = mongoose.model('File', File);
    return FileModel;

}
