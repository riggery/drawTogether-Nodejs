//=======================================
//        current db : testDb
//
//        current collections:
//        userList(only one doc): [{nameList:['names']}]
//        userProfile: [{name:name1,psw:psw1},{name:name2,psw:psw2}]
//        songs: []

// database->collection->document->field


//=======================================

var mongo = require('mongodb');
var host = 'localhost';
var port = mongo.Connection.DEFAULT_PORT;

var optionsWithEnableWriteAccess = { w: 1 };
var dbName = 'drawguess';

var client = new mongo.Db(
    dbName,
    new mongo.Server(host, port),
    optionsWithEnableWriteAccess
);

// for 'arg' in openDb,
// if onOpen is "insert", arg is the document list
// if onOpen is "remove", arg is the query
// extraMsg is used for different use of "finddoc"
// sometimes we want a simple io.sockets.emit
// sometimes we want a check on the server 

function openDb(onOpen,collectionStr,arg,extraMsg){
	console.log(arg);
        return client.open(onDbReady);
     
	function onDbReady(error){
	    if (error)
		throw error;
	    return client.collection(collectionStr, onCollectionReady);
	    client.collection
	}
    
	function onCollectionReady(error, collection){
	    if (error)
		throw error;
    
	    return onOpen(collection,arg,extraMsg,onFinish);
    
	}
}

function closeDb(){
    client.close();
}

//======================================
//      inserting test documents
//======================================

function insertDocuments(collection, docs, extraMsg, done){
	//client.open();
    console.log(docs);
    if (docs.length === 0){
        done(null);
        return;
    }
    var docHead = docs.shift(); //shift removes first element from docs
    collection.insert(docHead, function onInserted(err){
        if (err){
            done(err);
            return;
        }
        insertDocuments(collection, docs, extraMsg, done);
    });
    console.log('inserted!');
}

//======================================
//      removing a document
//======================================

function removeDoc(collection,query, extraMsg,done){

    collection.remove(query, function logResult(error, numberDocsRemoved){
        if (error)
            throw error;
        console.log('removed:', numberDocsRemoved);
    });
    done();
}

function onFinish() {
	console.log('operation success!');
	closeDb();
}



exports.openDb=openDb;
exports.closeDb=closeDb;
//exports.findDoc=findDoc;
exports.removeDoc=removeDoc;
exports.insertDocuments=insertDocuments;