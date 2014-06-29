var mongodb = require('./db');
function User(user){
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
	this.address = user.address;
	this.company = user.company;
	this.school = user.school;
	this.info = user.info;
	this.imgUrl = user.imgUrl;
};

module.exports = User;
User.prototype.save = function(callback){
	var user = {
		name : this.name,
		password : this.password,
		address: "暂无",
		company: "暂无",
		school: "暂无",
		info: "暂无",
		imgUrl: "./public/images/11.jpg"
	};
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		db.collection('user', function(err, collection){
			if(err){
				mongodb.close();
				callback(err);
			}
			collection.insert(user, {safe:true},function(err, result){
				mongodb.close();
				callback(err,user);
			});
		});
	});
};

User.prototype.updataEdit=function(callback){

    var user = {

        name: this.name,

        address:this.address,

        company:this.company,

        school:this.school,

        info:this.info,

        imgUrl:this.imgUrl

    };

    mongodb.open(function(err,db){

        if(err){

            return callback(err);

        }

        db.collection('user',function(err,collection){

            if(err){

                mongodb.close();

                return callback(err);

            }

            var upUser={};

            //下面判断信息是否需要更新

            if(user.address!=""){

                upUser.address=user.address;

            }

            if(user.company!=""){

                upUser.company=user.company;

            }

            if(user.school!=""){

                upUser.school=user.school;

            }

            if(user.info!=""){

                upUser.info=user.info;

            }

            if(!!user.imgUrl){

                upUser.imgUrl=user.imgUrl;

            }

            collection.update({'name':user.name},{$set:upUser},function(err,result){

                mongodb.close();

                callback(err, user);//成功！返回插入的用户信息

            });

        });

    });
};

User.get = function(name, callback){ 

  	mongodb.open(function(err, db){ 
    	if(err){ 
      		return callback(err); 
    	} 
	    //读取 users 集合 

    	db.collection('user', function(err, collection){ 

      		if(err){ 

   				mongodb.close(); 

        		return callback(err); 

      		} 

      		//查找用户名 name 值为 name文档 

	      	collection.findOne({name: name},function(err, doc){ 

    	    	mongodb.close(); 

        		if(doc){ 

          			var user = new User(doc); 

          			callback(err, user);//成功！返回查询的用户信息 

	        	} else { 

        	  		callback(err, null);//失败！返回null 

        		} 

      		}); 

    	}); 

  	}); 

};

User.ask = function(ask, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}
		var date = new Date();
		var time = {
			date : date,
			year : date.getFullYear(),
			month : date.getFullYear() + "-" + (date.getMonth() + 1),
			day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
			minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes()
		}
		ask.time = time;
		ask.hide = true;

		db.collection('question', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.find().sort({time: -1}).toArray(function(err, items){
				if(items.length == 0){
					ids = 0;
				}else{
					ids = items[0]._id;
					ids++;
				}
				ask._id = ids;
				collection.insert(ask, {safe: true}, function(err, result){
					mongodb.close();
					callback(err, ask);
				});
			});
		});
	});
};

User.getQuestion = function(callback){
	mongodb.open(function(err, db){
		if(err){
			callback(err);
		}
		db.collection('question', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.find({hide: {$ne: false}}).limit(5).sort({time: -1}).toArray(function(err, items){
				if(err) throw err;
				var open = 0;
				db.collection('user', function(err, collection){
					if(items.length != 0){
						for(var i= 0, l = items.length; i< l; i++){
							collection.findOne({name: items[i].name},function(err, doc){
								items[open].imgUrl = doc.imgUrl;
								open++;
								if(open == l){
									mongodb.close();
									return callback(items);
								}
							})
						}
					}else{
						mongodb.close();
						return callback(items);
					}
				});
			});
		});
	});
};

User.getQuestionPage=function(page,callback){

  //打开数据库

  var num=page*5;

  mongodb.open(function(err, db){

    if(err){

      return callback(err);

    }

    db.collection('question', function(err, collection){ 

      if(err){ 

        mongodb.close(); 

        return callback(err); 

      } 

      //查找用户名 name 值为 name文档 

      collection.find({hide:{$ne:false}}).skip(num).limit(5).sort({time:-1}).toArray(function(err,items){ 

        if(err) throw err; 

        //二次查询 

        var open=0 

        db.collection('user', function(err, collection){ 

          for(var i=0,l=items.length;i<l;i++){ 

            collection.findOne({name: items[i].name},function(err, doc){ 

              items[open].imgUrl=doc.imgUrl; 

              open++; 

              if(open==l){ 

                mongodb.close(); 

                return callback(items); 

              } 

            }); 

          } 

        }); 

      }); 

    });  

  }); 

};

User.findQuestion=function(id,callback){
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        db.collection('question', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.find({_id:Number(id)}).toArray(function(err,items){
                if(err) throw err;
                mongodb.close();
                return callback(err,items);
            });
        });
    });
};

User.answer=function(questionId,answer,callback){
    //打开数据库
    mongodb.open(function(err, db){
        if(err){
            return callback(err);
        }
        db.collection('question', function(err, collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            //这里可以暂停一下进度，阅读下mongodb的一些操作方法，本文的最下面有一个还不错的pdf讲解mongodb的增删改查的
            collection.update({_id:Number(questionId)},{$push:{answer:answer}},function(err,items){
                if(err) throw err;
                mongodb.close();
                return callback(items);
            });
        });
    });
};

User.getQuestionUser=function(user,callback){

    //打开数据库

    mongodb.open(function(err, db){

        if(err){

            return callback(err);

        }

        db.collection('question', function(err, collection){

            if(err){

                mongodb.close();

                return callback(err);

            }

            //查找用户名 name 值为 name文档

            collection.find({name:user}).sort({time:-1}).toArray(function(err,items){

                if(err) throw err;

                mongodb.close();

                //遍历数据

                return callback(items);

            });

        });

    });

};








