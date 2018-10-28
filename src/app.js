const express = require('express')
const serverless = require('serverless-http')
const bodyParser = require('body-parser')
const cors = require('cors')
const aws = require('aws-sdk')
aws.config.update({
  accessKeyId: 'SGUJMK7GBNHFDBGE5JGCQ',
  secretAccessKey: '1AS6DF165S1D6AS16F51S6A1F1',
  region: 'sa-east-1'
})

let app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/env', function (req, res) {
    res.send(process.env.message)
})

app.get('/', function (req, res) {
  res.sendFile(`${__dirname}/pages/download.html`)
})

app.get('/:canRead', function (req, res) {
  const docClient = new aws.DynamoDB.DocumentClient({
    endpoint: 'http://localhost:7000/',
    region: 'localhost'
  })
  docClient.get({
    TableName: 'messagesTable',
    Key: {
      canRead: req.params.canRead
    }
  }, function (err, data) {
    if (err) {
      return res.json(JSON.stringify({
        err: err
      }))
    }
    if (data.Item) {
      res.send(`
                <h2>Para: ${data.Item.canRead}</h2>
                <h3>${data.Item.title}</h3>
                <h4>Mensagem: ${data.Item.message}</h4>
            `)
    } else {
      res.send()
    }
  })
})

app.post('/dynamo', function (req, res) {
  const docClient = new aws.DynamoDB.DocumentClient({
    endpoint: 'http://localhost:7000/',
    region: 'localhost'
  })

  docClient.put({
    TableName: 'messagesTable',
    Item: req.body
  }, (err, data) => {
    if (err) {
      return res.json(JSON.stringify({
        err: err
      }))
    }
    res.json(data)
  })
})

module.exports.express = serverless(app)

module.exports.serverless = function (event, context, callback) {
  const body = JSON.parse(event.body)
  const s3 = new aws.S3({
    s3ForcePathStyle: true,
    endpoint: new aws.Endpoint('http://localhost:8000')
  })
  s3.putObject({
    Body: body.message,
    Bucket: 'local-bucket',
    Key: body.title
  }, (err, result) => {
    if (err) {
      return callback(null, {
        statusCode: 422,
        body: JSON.stringify(err)
      })
    }
    callback(null, {
      statusCode: 200,
      body: JSON.stringify(result)
    })
  })
}
