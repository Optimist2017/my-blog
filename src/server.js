import express from 'express';
import bodyparser from 'body-parser';
import {MongoClient} from 'mongodb';
import path from 'path';

/*const articleInfo= {
    'learn-react':{
        'upvotes':0,
        'comments':[],
        
    },
    'learn-node':{
        'upvotes':0,
        'comments': [],
    },
    'my-thoughts-on-resumes':{
        'upvotes':0,
        'comments': [],
    },
}*/


const app = express();



app.use(bodyparser.json());

app.use(express.static(path.join(__dirname,'/build')));



/*app.get('/hello',(req,res) => res.send("Hello World!"));
app.get('/',(req,res)=>res.send("Great It worked"));

app.post('/hello',(req,res)=>res.send(`Hello ${req.body.name}`));

app.post('/api/article/:name/upvotes',(req,res) =>{
    
    const articleName = req.params.name;
    articleInfo[articleName].upvotes+=1;

    res.status(200).send(`${articleName} has ${articleInfo[articleName]
    .upvotes} upvotes~`);
});

app.post('/api/article/:name/add-comment',(req,res) =>{
    const {username,text} = req.body;
    const articleName= req.params.name;
    articleInfo[articleName].comments.push({username,text});
    res.status(200).send(articleInfo[articleName]);
})*/

//DB Connection function 

const WithDB =async(operations, res) => {
    try {
        
        const client = await MongoClient.connect('mongodb://localhost:27017');
        const db = client.db('my-blog');

        await operations(db);


        client.close()
    } catch (error) {
        res.status(200).json({message:"Error in DB connection",error});
    }
}


//creating routes to link with local mongodb

app.get('/api/article/:name', async(req,res)=>{

    WithDB( async(db)=>{

        const articleName = req.params.name;

        const articleInfo = await db.collection('articles')
            .findOne({ name: articleName });
        res.status(200).json(articleInfo);

    },res);
    
});

//creating route to increase upvotes

app.post('/api/article/:name/upvotes', async(req,res)=>{

    
    WithDB(async(db)=>{
        const articleName = req.params.name;

        const articleInfo = await db.collection('articles')
            .findOne({ name: articleName });
        await db.collection('articles').updateOne({ name: articleName },
            {
                '$set': {
                    upvotes: articleInfo.upvotes + 1,
                },
            });
        const updateArticleInfo = await db.collection('articles').findOne({ name: articleName });
        res.status(200).json(updateArticleInfo);

    },res)
        
        


})

//creating route to take push comment into local db

app.post('/api/article/:name/add-comment', async(req,res)=>{

   WithDB(async(db)=>{
       const articleName = req.params.name;
       const { username, text } = req.body;


       const articleInfo = await db.collection('articles').findOne({ name: articleName });


       await db.collection('articles').updateOne({ name: articleName }, {
           '$set': {
               comments: articleInfo.comments.concat({ username, text }),
           },
       });

       const updatedArticleInfo = await db.collection('articles').findOne({ name: articleName });
       res.status(200).json(updatedArticleInfo);
    
   })

        
})

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
})


app.listen(3001, ()=>console.log("Listening to port 3001"));
