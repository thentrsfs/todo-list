//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");
const dotenv = require("dotenv").config();
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect({ useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err);
  });

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {

  Item.find({}).then((item) => {

    if (item.length === 0) {
      Item.insertMany(defaultItems).then((e) => {
        console.log("Items are inserted successfully!");
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: item });
    }


  });



});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({ name: itemName });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }


});


app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId).then((item) => {
      console.log("Successfully deleted item");
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } }).then((item) => {
      res.redirect("/" + listName);
    });
  }


});


app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  const list = new List({
    name: customListName,
    items: defaultItems
  });


  List.findOne({ name: customListName })
    .then((docs) => {
      if (docs) {
        res.render("list", { listTitle: docs.name, newListItems: docs.items });
      } else {
        console.log("Not Exists");
        list.save();
        res.redirect("/" + customListName);
      }
    }).catch((err) => {
      console.log("Error: " + err);
    })


});



app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port, function () {
  console.log("Listening on port $(port)")
});