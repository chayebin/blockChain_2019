const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const Web3 = require('web3');
const mysql = require('mysql');

var Tx = require('ethereumjs-tx').Transaction;

var connection = mysql.createConnection({
  host     : '210.89.189.63',
  user     : 'root',
  password : '1234',
  database : 'hrc'
});

connection.connect();

let web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/28167840e91a44bd869d2cf550f8d612"));  


//아래 3줄만 volun이랑 구별해서만들기
var contractAbi = JSON.parse(fs.readFileSync("contractAbi.json"));
var contractAddress = "0xa055581EfB02811652C7576C2968deA69eEf4b22" 
//컨트랙트주소
var hrc_certicontract = new web3.eth.Contract(contractAbi, contractAddress)

//아래 3줄만 volun이랑 구별해서만들기
var volunAbi = JSON.parse(fs.readFileSync("volunAbi.json"));
var volunAddress = "0xa055581EfB02811652C7576C2968deA69eEf4b22" 
//컨트랙트주소
var hrc_volucontract = new web3.eth.Contract(volunAbi, volunAddress)


var isEmpty = function(value){ if ( value == "" || value == null || value == undefined || ( value != null && typeof value == "object" && !Object.keys(value).length ) ){ return true }else{ return false } };


const findUser = (user_id, user_pwd) => {
    var sql = 'SELECT * FROM hrc.user WHERE userId=\''+ user_id+'\' and userPwd=\''+user_pwd+'\';';
    var params = [user_id, user_pwd];

	connection.query(sql, params, function(error,results,fields){
		if(error){
			console.log(error);
		}
        var resultArray = Object.values(JSON.parse(JSON.stringify(results)))
        const result = {
            user_Id: resultArray[0].userId,
            user_Pwd: resultArray[0].userPwd,
            user_Addr: resultArray[0].userAddress,
            user_Pk: resultArray[0].userPrivateKey
        }
        return result;
    });
}
//const findUserIndex = (user_id, user_pwd) => {
//    return users.findIndex( v => (v.user_id === user_id && v.user_pwd === user_pwd) );
//}


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended:false}));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}));

let user_address; 

app.get('/', async (req, res) => {     
    const sess = req.session;
    const user = sess.user; //+1 ? users[sess.user_uid] : ''
    let user_eth_balance;
    if(user) {
        user_address = user['user_address'];
        user_eth_balance = web3.utils.fromWei(await web3.eth.getBalance(user_address), 'ether') || 'cannot get eth Balance';
    } 
    res.render('index', { user, user_eth_balance })
});

// app.post('/history', (req,res)=>{
//     const body = req.body;
//     const user_num = body.user_num;

//     var certsql = 'select * from certi where userId=?';
//     var certparams = [user_num];
//     connection.query(DBsql, DBparams, function(error,results,fields){

//         returnVal = results;

//         var volunsql = 'select * from volun where userId=?';
//         var volunparams = [user_num];
//         connection.query(DBsql, DBparams, function(error,results,fields){
//             returnVal = returnVal.concat(results);        
//         });

//         res.send(returnVal);

//     });

// });


app.get('/certi', (req, res) => {
    res.render('certi')
})
app.post('/certi', (req,res)=>{
    const body = req.body;
    const stuNo = body.stuNo;
	const name = body.name;
	const num = body.num;
	const date = body.date;
	const org = body.org;
    
    var sql = 'INSERT INTO certi (stuNo,cername, cerid, cerdate, cerorgan) VALUES(?,?, ?, ?, ?)';
    var params = [stuNo,name, num, date, org];

	connection.query(sql, params, function(error,results,fields){
		if(error){
            console.log(error);
        }

    var DBsql = 'select userAddress, userPrivateKey from user where userId=?';
    var DBparams = [stuNo];
    
        connection.query(DBsql, DBparams, function(error,results,fields){
            if(error){
                console.log(error);
            }
            // db에서 관리자 어드레스/개인키 가져오기
            var address = results[0].userAddress
            var privateKey = new Buffer(results[0].userPrivateKey, 'hex')

            //관리자 NONCE 가져오기
        web3.eth.getTransactionCount(address).then(nonce=>{
            var rawTx = {
                nonce: web3.utils.toHex(nonce),
                gasPrice: web3.utils.toHex(10e9),
                gasLimit: web3.utils.toHex(200000),
                to: contractAddress,
                value: '0x0',
                data: hrc_certicontract.methods.addCerti(name,stuNo,address).encodeABI()
              }
              var tx = new Tx(rawTx);
              tx.sign(privateKey);
              var serializedTx = tx.serialize();
              web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
        })
        })
        
        // const data = hrc_certicontract.methods.certiTable('hash').call()
        // 콘솔로 확인할수있음 0: string: CerName 정보처리기사
        // 1: string: CerId 123456789 를

        res.redirect('/');
    });
})


 app.get('/manager', (req, res) => {
     address = req.query.user;
     res.render('manager',{user : req.session.user})
})

app.post('/manager', (req, res) => {
    res.render('manager')
})



app.get('/student', (req, res) => {
    res.render('student')
})

app.get('/volun', (req, res) => {
    res.render('volun')
})
app.post('/volun',(req,res)=>{
    const body = req.body;
    const studentid =body.studentid;
	const vnum = body.vnum;
	const vdate = body.vdate;
	const vorg = body.vorg;
	const vtime = body.vtime;
    
    var sql = 'INSERT INTO volun (studentid,volid, voldate, volorgan, hour) VALUES(?, ?, ?, ?, ?)';
    var params = [studentid,vnum, vdate, vorg, vtime];

	connection.query(sql, params, function(error,results,fields){
		if(error){
			console.log(error);
        }

        var DBsql = 'select userAddress, userPrivateKey from user where userId=?';
        var DBparams = [studentid];
        connection.query(DBsql, DBparams, function(error,results,fields){

            var address = results[0].userAddress;
            var privateKey = new Buffer(results[0].userPrivateKey, 'hex')

            //관리자 NONCE 가져오기
            web3.eth.getTransactionCount(address).then(nonce=>{
                var rawTx = {
                    nonce: web3.utils.toHex(nonce),
                    gasPrice: web3.utils.toHex(10e9),
                    gasLimit: web3.utils.toHex(200000),
                    to: volunAddress,
                    value: '0x0',
                    data: hrc_voluncontract.methods.addVolun(vnum,vtime,address).encodeABI()
                }
                var tx = new Tx(rawTx);
                tx.sign(privateKey);
                var serializedTx = tx.serialize();
                web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
            })
            res.redirect('/');
        })       
        
    });
})

app.get('/login', (req, res) => {
    console.log('겟로그인페이지')

    res.render('login')
})

app.post('/login', (req, res) => {
    const body = req.body;
    const userId = body.user_id;
    const userPwd = body.user_pwd;

    var sql = 'SELECT * FROM user WHERE userId= ? and userPwd= ?';

    var params = [userId, userPwd]

    connection.query(sql, params, function(error,results,fields){     
        if(isEmpty(results)) { 
            res.redirect('login');
        } else {
            
            req.session.user = {
                user_address : results[0].userAddress,
                user_id : results[0].userId
            }
            res.redirect('/');
           }
    })
})

app.get('/logout', (req, res) => {
    delete req.session.user;
    
    res.redirect('/');
})

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.post('/signup', (req, res) => {
    const body = req.body;

    var sql = 'SELECT * FROM user WHERE userId= ?';
    connection.query(sql, body.user_id, function(error,results,fields){     
        if(isEmpty(results)) { 
            const account = web3.eth.accounts.create()
      
            const user_id = body.user_id;
            const user_pwd = body.user_pwd;

            const user_name = body.user_name;
            const user_birth=body.user_birth;


            const user_address = account.address;
            const user_privateKey = account.privateKey.slice(2);
            var sql = 'INSERT INTO user (userId, userPwd, userAddress, userPrivateKey, userName, userBirth) VALUES(?,?,?, ?, ?, ?)';
            var params = [user_id, user_pwd, user_address, user_privateKey,user_name,user_birth];
            
            connection.query(sql, params, function (error, results, fields) {
                console.log(error);
                console.log(results);
            });
               
            res.redirect('/login')
        } else { 
            res.redirect('/signup')        
        }
    })
})

app.post('/sendether', async (req, res) => {
    const body = req.body;
    
    if (body.toAddress && body.amount) {
        const sess = req.session;

        web3.eth.getTransactionCount(user_address, (err, txCount) => {

            const txObject = {
                nonce: web3.utils.toHex(txCount),
                to: body.toAddress,
                value: web3.utils.toHex(web3.utils.toWei(body.amount, 'ether')),
                gasLimit: web3.utils.toHex(21000),
                gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'gwei'))
            }
        
            const tx = new Tx(txObject, { chain: 'ropsten' })

            const userPrivateKey = Buffer.from(users[sess.user_uid]['user_privateKey'], 'hex');

            tx.sign(userPrivateKey)
        
            const serializedTx = tx.serialize()
        
            const raw = '0x' + serializedTx.toString('hex')
        
            web3.eth.sendSignedTransaction(raw, (err, txHash) => {
                if (err) console.log(err)
                else console.log('txHash: ', txHash)
            })
        })
        
        res.redirect('/');
    } else {
        res.send('Invalid Params')
    }
})

app.post('/uploadfile', async (req, res) => {
  const body = req.body;

  web3.eth.getTransactionCount(user_address, async (err, txCount) => {
    const sess = req.session;

    const inputData = contract.methods.set(body.fileHash).encodeABI()

    const txObject = {
        nonce: web3.utils.toHex(txCount),
        to: contractAddress,
        gasLimit: web3.utils.toHex(80000),
        gasPrice: web3.utils.toHex(web3.utils.toWei('10', 'gwei')),
        data: inputData
    }

    const tx = new Tx(txObject, { chain: 'ropsten' })

    const userPrivateKey = Buffer.from(users[sess.user_uid]['user_privateKey'], 'hex');

    tx.sign(userPrivateKey)

    const serializedTx = tx.serialize()
    const raw = '0x' + serializedTx.toString('hex')

    web3.eth.sendSignedTransaction(raw, (err, txHash) => {
        if (err) {
          console.log(err)
        } else { 
          console.log(txHash)
          documents.push({
            owner: user_address,
            fileHash: body.fileHash,
          });
          data = 'exports.document = ' + JSON.stringify(documents)
          fs.writeFileSync('./DB/document.model.js', data)
        }
    })
  })
})


app.listen(3000, () => {
  console.log('3000 port');
});