
/*
 * GET home page.
 */
var crypto = require('crypto'),
    User = require('../models/user.js');
var fs = require('fs');

module.exports = function(app){
    app.get('/', function(req, res){
        if(!req.session.user){ 

            res.render('index', {  

                title:"知道", 

                name:"问答平台", 

                user:req.session.user, //这里可以用ejs摸版的locals.user 访问到

                error: req.flash('error').toString(),  //这里可以用ejs摸版的locals.error 访问到

                success: req.flash('success').toString()  //这里可以用ejs摸版的locals.success 访问到

            }); 

        }else{ 

            res.redirect('/show'); 

        } 


    });
    app.get('/logout',function(req, res){
         req.session.user = null; 

        req.flash('success','登出成功!'); 

        res.redirect('/'); 
    	
    });

    app.post('/login',function(req,res){ 

       //post过来的密码加密

        var md5 = crypto.createHash('md5'), 

          password = md5.update(req.body.password).digest('hex'); 

        var newUser = new User({ 

          name: req.body.name, 

          password: password 

        }); 

        //查找用户

        User.get(newUser.name, function(err, user){ 

            if(user){ 

                //如果存在，就返回用户的所有信息，取出password来和post过来的password比较

                if(user.password != password){ 

                    req.flash('error','密码不正确'); 

                    res.redirect('/'); 

                }else{ 

                    req.session.user = user; 

                    res.redirect('/show'); 

                } 

            }else{ 

                req.flash('error','用户不存在'); 

                res.redirect('/'); 

            } 

        }); 

    }); 

    app.post('/reg',function(req, res){
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['repassword'];
        if(password != password_re){
            req.flash('error', '两次输入的密码不一致');
            return res.redirect('/');
        }
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: req.body.name,
            password: password
        });
        User.get(newUser.name, function(err, user){
            if(user){
                err = '用户已存在！';
            }
            if(err){

              //如果报错，记录错误信息和页面跳转

              req.flash('error', err); 

              return res.redirect('/'); 

            } 

            //使用user.js的user.save() 保存信息函数

            newUser.save(function(err,user){ 

              if(err){ 

                req.flash('error',err); 

                return res.redirect('/'); 

              } 

              //成功后，将用户信息记录在页面间的会话req.session中，并且跳转到一个新页面，就是内容集中展示页面

              req.session.user = user; 

              req.flash('success','注册成功!'); 

              res.redirect('/show'); 

            }); 
        });
    });
    app.get('/show',function(req, res){
        User.getQuestion(function(data){
            if(data.length == 0){
                res.render('show', {
                    lists: data,
                    user: req.session.user
                });
                return;
            }
            for(var i= 0,l = data.length; i< l; i++){
                data[i].url = '/people/'+data[i].name;
                data[i].imgUrl = data[i].imgUrl.replace("./public/","");
            }
            res.render('show', {
                lists: data,
                user: req.session.user
            });
        });
    });
    app.get('/getQuestion',function(req,res){
        User.getQuestionPage(req.query.page,function(data){ 
           //对返回的数据做些处理
            for(var i=0,l=data.length;i<l;i++){
                data[i].imgUrl=data[i].imgUrl.replace("./public/","");
            }
            res.send(data) 
        });  
    });

    app.get('/people/:user',function(req,res){
        User.get(req.params.user, function(err, user){

            //处理图片

            user.imgUrl=user.imgUrl.replace("./public/","");

            //先查询到用户信息，然后查询用户的提问

            User.getQuestionUser(user.name,function(question){

                res.render('people',{

                    address: user.address,

                    company: user.company,

                    school : user.school,

                    info : user.info,

                    name:req.params.user,

                    user:req.session.user,

                    question:question,

                    imgUrl:user.imgUrl

                });

            });

        });
    });

    app.post('/people',function(req,res){
        //头像地址

        var tmp_path,target_path;

        if(req.files.thumbnail.size>0){ //表示有图片文件上传

            tmp_path = req.files.thumbnail.path;

            // 指定文件上传后的目录 - 示例为"images"目录。

            // 重命名图片名字

            var picType=req.files.thumbnail.name.split(".");

            picType=picType[1];

            target_path = './public/images/user/pic_' + req.session.user.name+"."+picType;

            // 移动文件

            fs.rename(tmp_path, target_path, function(err) {

                if (err) throw err;

                //程序执行到这里，user文件下面就会有一个你上传的图片

            });

        }

        var newUser = new User({

            name: req.session.user.name,

            address: req.body.address,

            company:req.body.company,

            school:req.body.school,

            info:req.body.info,

            imgUrl:target_path,

        });

        //更新

        newUser.updataEdit(function(err){

            if(err){

                req.flash('error',err);

                return res.redirect('/');

            }

            req.session.user = newUser;//用户信息存入session

            res.redirect('/people/'+newUser.name);

        });
    });

    app.get('/question/:id',function(req,res){
        User.findQuestion(req.params.id, function(err, items){
            res.render('question',{
                items:items[0],
                user:req.session.user,
                id:req.params.id
            });
        });
    });

    app.get('/error',function(req,res){

    });

    app.post('/ask',function(req,res){
        var ask = {};
        ask.title = req.body.title;
        ask.askText = req.body.askText;
        ask.answer = [];
        ask.name = req.session.user.name;
        User.ask(ask, function(err, doc){
            if(err){
                req.flash('error', err);
                return  res.redirect("/");
            }
            res.send({"status": 1});
        })
    });

    app.post('/answer',function(req,res){
        var answer={};
        answer.answer=req.body.answer;
        answer.user=req.session.user;
        questionId=req.body.questionId;
        User.answer(questionId,answer,function(info){
            res.redirect('/question/'+questionId);
        });
    });

    app.get('/baike',function(req,res){

    });

    app.get('/admin',function(req,res){

    });

    app.post('/adminLogin',function(req,res){  

    });

    app.get('/admincon',function(req,res){

    });

    app.post('/adminchange',function(req,res){

    });    
};
