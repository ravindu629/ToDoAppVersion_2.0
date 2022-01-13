//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");

//requuire mongoose
const mongoose = require("mongoose");

//require lodash
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connect locally

//create a new database inside mongoDB
//the thing that we are going to connect to is the URL where our mongoDB is hosted locally
//mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

//connect to our mondoDB cluster
mongoose.connect("mongodb+srv://admin-ravindu:IT19208022@cluster0.n8e35.mongodb.net/todolistDB?retryWrites=true&w=majority", {useNewUrlParser: true});


//create new schema
const itemsSchema = new mongoose.Schema(
  {
    name: String
  }
);

//craete new model
const Item = mongoose.model( "Item", itemsSchema );

//craete new document

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add new a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

//every new list that we create the list is going to have a name and it's going to have an array
//of item documents associated with it
const listSchema = {
  name: String,

  //name of the field is going to be items
  //and the value of the field is going to be an array of itemsSchema based items
  items: [itemsSchema]
}

//create List model from listSchema
const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  //when user accesses the root route whether if the items collection is empty
  //in which case we are going to add all of our default items and we redirect back to the root route
  //otherwise we are not going to add another set of default items

  //read data from the DB
  Item.find({/*specify condition if there any*/}, function(err, foundItems){
    //check the collection is empty
    if(foundItems.length === 0){
      //insertMany
      //inset data into the our DB
      Item.insertMany(defaultItems, function(err){
        if(err) {
          console.log(err);
        }
        else {
          console.log("successfully inserted default items to DB");
        }
      });
      //redirect back onto the root route
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });


});



app.get('/favicon.ico', (req, res) => res.status(204).end());



//express route paramters
app.get("/:customListName", function(req, res){

  //console.log(req.params.customListName);
  const customListName = _.capitalize(req.params.customListName);


  //find the document relevant to the name
  List.findOne({name: customListName}, function(err, foundList) {
    //chech any errors or not
    if(!err) {
      //in this case you had only one document in the foundList
      //check foundList exist or not
      if(!foundList) {
        //create new list document
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        // //save this list to our collection of lists in our Database
        // list.save();
        //
        // res.redirect("/" + customListName);

        list.save().then(function() {

          res.redirect("/" + customListName);

        });

      }
      else {
        //show an existing list
        res.render("list", {listTitle: foundList.name, newListItems:foundList.items })
      }
    }
  });


});


//route for adding new items
app.post("/", function(req, res){

  const itemName = req.body.newItem;

  //we can tap in to list name inside this post route
  //list is correspond to the name of the button in form that inside list.ejs
  //using this req.body.list we tap in to the value that is the name of relevant list
  const listName = req.body.list;


  //create new item document
  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    //this case we in default list
    //save this item to items collection in our Database
    item.save();

    //redirect to home route
    res.redirect("/");
  }
  //if the list was not "Today" our new item comes from a custom list
  //in that case we need to search for that list document in our list collection
  //in our database and we need to add the item and embed it into the existing array of items
  else {
    List.findOne({ name: listName }, function(err, foundList) {
      if(!err) {

        //push new item into array of items
        foundList.items.push(item);

        // //save our foundlist so that we update it with the new data
        // foundList.save();
        //
        // //redirect to the route where the user came from
        // res.redirect("/" + listName);

        foundList.save().then(function() {

            res.redirect("/" + listName);

        });

      }
    });
  }




});

//route for delete checked items
app.post("/delete", function(req, res){
  //console.log(req.body);
  //console.log(req.body.checkbox);
  const checkedItemId = req.body.checkbox;

  //check what is that value of the list name
  const listName = req.body.listName;

  //check if we want to delete item from our default list or custom list
  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("successfully deleted checked item from default list");

        //redirect to the home route
        res.redirect("/");
      }
    });
  }
  else {
    //first parameter specify which list do you want to find
    //second parameter what update do you want to make
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
      if(!err) {
        res.redirect("/" + listName);
      }
    })
  }





});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
