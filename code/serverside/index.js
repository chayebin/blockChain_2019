const express = require('express');
const app = express();
const session = require('express-session');
const bodyParser = require('body-parser');
const userDB = require('./DB/user.model')
const documentDB = require('./DB/document.model')
const fs = require('fs');
const { web3, Tx, contract, contractAddress } = require('./config/web3')
const mysql = require('mysql');

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '1234',
  database : 'hrc'
});
  
connection.connect();

let users;
let documents; 

users = userDB.user;
documents = documentDB.document;

const findUser = (user_id, user_pwd) => {
    return users.find( v => (v.user_id === user_id && v.user_pwd === user_pwd) );
}
const findUserIndex = (user_id, user_pwd) => {
    return users.findIndex( v => (v.user_id === user_id && v.user_pwd === user_pwd) );
}


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
    const user = sess.user_uid+1 ? users[sess.user_uid] : ''
    let user_eth_balance;
    if(user) {
        user_address = user['user_address'];
        user_eth_balance = web3.utils.fromWei(await web3.eth.getBalance(user_address), 'ether') || 'cannot get eth Balance';
    } 
    res.render('index', { user, user_eth_balance })
});

app.get('/certi', (req, res) => {
    console.log('버튼 클릭됨')
    res.render('certi')
})

app.get('/volun', (req, res) => {
    console.log('버튼 클릭됨')
    res.render('volun')
})





app.get('/login', (req, res) => {
    res.render('login')
})

app.post('/login', (req, res) => {
    const body = req.body;
    if ( findUser(body.user_id, body.user_pwd)) {
        req.session.user_uid = findUserIndex( body.user_id, body.user_pwd );
        res.redirect('/');
    } else {
        res.send('Invalid User')
    }
})

app.get('/logout', (req, res) => {
    delete req.session.user_uid;
    res.redirect('/');
})

app.get('/signup', (req, res) => {
    res.render('signup')
})

app.post('/signup', (req, res) => {
    const body = req.body;
    if (!findUser(body.user_id, body.user_pwd)){
      const account = web3.eth.accounts.create()
      
      const user_id = body.user_id;
      const user_pwd = body.user_pwd;
      const user_address = account.address;
      const user_privateKey = account.privateKey.slice(2);
      
      //var sql = 'INSERT INTO user (userId, userPwd, userAddress, userPrivateKey) VALUES(?, ?, ?, ?)';
      //var params = [user_id, user_pwd, user_address, user_privateKey];
      
      var sql = 'SELECT * FROM user'


      connection.query(sql, function (error, results, fields) {
          if (error) {
              console.log(error);
          }
          console.log(results);
      });
         
      res.redirect('/login')
    } else {
      res.send('Already Signup User')
    }
})

app.post('/sendether', async (req, res) => {
    const body = req.body;
    
    if (body.toAddress && body.amount) {
        const sess = req.session;
        console.log(user_address);

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
  console.log(body)
  console.log(body.fileHash)
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