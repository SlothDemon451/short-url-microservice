require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const shortid = require('shortid');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true},
  short_url : {type: String, required: true, unique: true}
})

const Url = mongoose.model('Url', urlSchema);

app.post('/api/shorturl', async(req, res) => {
  const originalUrl = req.body.url;
  const urlRegex = /^(https?:\/\/)/;

  if (!urlRegex.test(originalUrl)) {
    return res.json({ error: 'Invalid URL' });
  }
  try{
    let foundUrl = await Url.findOne({original_url: originalUrl});
    if(foundUrl){
      return res.json({
        orignal_url: foundUrl.original_url,
        short_url: foundUrl.short_url
      })
    }else{
      const shortUrl = shortid.generate();
      const newUrl = new Url({
        original_url: originalUrl,
        short_url: shortUrl
      })
      await newUrl.save();
      return res.json({
        original_url: newUrl.original_url,
        short_url: newUrl.short_url
      })
    }
  
  } catch (err){
    console.error(err);
    res.status(500).json("Server error")
  }
});

app.get('/api/shorturl/:shortid', async(req, res) => {
  try{
    const url = await Url.findOne({short_url: req.params.shortid});
    if(url){
      return res.redirect(url.original_url);
    }else{
      return res.status(400).json("No URL found")
    }
  } catch(err){
    console.error(err);
    res.status(500).json('Server error');
  }
})



app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
